import * as config from './ResSplitConfig';
import * as fs from 'fs';
import * as utils from './tools/lib/utils';
import * as path from 'path';
import * as os from 'os';
import * as FileUtil from './tools/lib/FileUtil';
import * as crypto from 'crypto';
/**
 * 按模块分割资源
 */
export class ResSplitPlugin implements plugins.Command {

    private moduleFiles: any = {};
    private jsFiles: plugins.File[] = [];

    constructor() {
    }

    async onFile(file: plugins.File) {
        if (file.extname === '.js') {
            this.jsFiles.push(file);
            return null;
        } else {
            let moduleName = this.findModule(file);
            let len = moduleName.length;
            if (len > 0) {
                let originRelative = file.relative;
                file.path = file.base + '/module/' + moduleName + '/' + file.relative;
                for(let i = 0;i < len;i++) {
                    let name = moduleName[i];
                    if (!this.moduleFiles[name]) {
                        this.moduleFiles[name] = [];
                    }
                    this.moduleFiles[name].push({
                        path: originRelative.replace(/\\/g, '/'),
                        md5: this.md5Budffer(file.contents)
                    });
                }
                return null;
            } else {
                return file;
            }
        }
    }

    async onFinish(commandContext: plugins.CommandContext) {
        //初始化文件名&路径
        let codeFileName = 'game_code_' + commandContext.buildConfig.version + '.zip';
        let codeVersionFileName = 'tt.version';
        let gameListFileName = 'gameList.json';
        let packageVersonFilePath = commandContext.projectRoot + '/version/' + config.channel + "/" + commandContext.buildConfig.version + '/version.json';
        //初始化配置文件
        let gameListObj: any[] = [];
        let codeVersionObj: any = {};
        codeVersionObj.update_url = config.rootPath;
        //处理js文件
        const jsBuffer = await this.zipJs(this.jsFiles);
        commandContext.createFile(codeFileName, jsBuffer);
        let jsMd5 = this.md5Budffer(jsBuffer);
        codeVersionObj.code_url = config.rootPath + codeFileName;
        codeVersionObj.code_md5 = jsMd5;
        //处理module文件
        let lastPath = this.findLastPath(commandContext.projectRoot + '/version/' + config.channel + "/");
        let lastVersionRecord = lastPath ? JSON.parse(fs.readFileSync(lastPath + '/version.json', "utf-8")) : null;
        let packageVersonObject: any = {};
        packageVersonObject.modules = {};
        for (let moduleName in config.assets) {
            let asset = config.assets[moduleName];
            let files: {
                path: string,
                md5: string
            }[] = this.moduleFiles[moduleName];
            if (!files) {
                throw new Error('module not found: ' + moduleName);
            }
            //更新版本号
            let lastModuleFiles;
            let lastModuleVersion = config.versionBegin - 1;
            if (lastVersionRecord && lastVersionRecord.modules[moduleName]) {
                lastModuleFiles = lastVersionRecord.modules[moduleName].files;
                lastModuleVersion = lastVersionRecord.modules[moduleName].version;
            }
            let assetVersion = this.checkVersion(files, lastModuleFiles, lastModuleVersion);
            packageVersonObject.modules[moduleName] = {
                files,
                version: assetVersion
            };
            //压缩文件
            let paths: string[] = [];
            for (let i = 0, len = files.length;i < len;i++) {
                paths.push(files[i].path);
            }
            const buffer = await this.zipResource(paths);
            let moduleFileName = moduleName + '_' + assetVersion + '.zip';
            commandContext.createFile(moduleFileName, buffer);
            let md5 = this.md5Budffer(buffer);
            //更新配置文件
            if (asset.type) {
                //type 存在说明是游戏包
                if (asset.enabled) {
                    gameListObj.push({
                        type: asset.type,
                        assetsUrl: config.rootPath + moduleFileName,
                        md5
                    });
                }
            } else {
                //type 不存在说明是common包
                codeVersionObj.common_url = config.rootPath + moduleFileName;
                codeVersionObj.common_md5 = md5;
            }
        }
        //创建代码版本和module版本配置文件
        commandContext.createFile(codeVersionFileName, new Buffer(JSON.stringify(codeVersionObj)));
        commandContext.createFile(gameListFileName, new Buffer(JSON.stringify(gameListObj)));
        //保存打包版本文件
        FileUtil.save(packageVersonFilePath, JSON.stringify(packageVersonObject));
    }

    //找出文件所属的模块名
    private findModule(file: plugins.File): string[] {
        let ret: string[] = [];
        for (let moduleName in config.assets) {
            let asset = config.assets[moduleName];
            let found = false;
            for (let i = 0, len = asset.matchPath.length;i < len;i++) {
                let path = file.relative.replace(/\\/g, '/');
                if (path.indexOf(asset.matchPath[i]) > -1) {
                    found = true;
                    break;
                }
            }
            if (found) {
                ret.push(moduleName);
            }
        }
        return ret;
    }

    //查找上一次打包备份路径(通过时间戳比较)
    private findLastPath(versionPath: string): string {
        let lastPath: string;
        let lastDirName: string;
        if (fs.existsSync(versionPath)) {
            fs.readdirSync(versionPath).forEach(function(file: string) {
                let curPath = versionPath + "/" + file;
                if(fs.statSync(curPath).isDirectory()) {
                    if (lastPath == null || Number(file) > Number(lastDirName)) {
                        lastPath = curPath;
                        lastDirName = file;
                    }
                }
            });
        }
        return lastPath;
    }
    
    //生成版本号(通过文件数量、文件名和文件md5对比)
    private checkVersion(moduleFiles: {
        path: string,
        md5: string
    }[], lastModuleFiles: {
        path: string,
        md5: string
    }[], lastModuleVersion: number): number {
        let same = true;
        if (lastModuleFiles) {
            if (moduleFiles.length === lastModuleFiles.length) {
                for (let i = 0, len = moduleFiles.length;i < len;i++) {
                    let found = false;
                    for (let j = 0, leng = lastModuleFiles.length;j < leng;j++) {
                        if (moduleFiles[i].path === lastModuleFiles[j].path) {
                            found = true;
                            if (moduleFiles[i].md5 !== lastModuleFiles[j].md5) {
                                same = false;
                            }
                            break;
                        }
                    }
                    if (!found) {
                        same = false;
                        break;
                    }
                }
            } else {
                same = false;
            }
        } else {
            same = false;
        }
        if (same) {
            return lastModuleVersion;
        } else {
            return lastModuleVersion + 1;
        }
    }

    //根据路径压缩文件
    private async zipResource(sourceFiles: string[]): Promise<Buffer> {
        const tempSourceDir = path.join(os.tmpdir(), "egret_temp_" + new Date().getTime() + '1');
        FileUtil.createDirectory(tempSourceDir);
        const tempDir2 = path.join(os.tmpdir(), "egret_temp_" + new Date().getTime() + '2');
        FileUtil.createDirectory(tempDir2);
        for (let source of sourceFiles) {
            const output = path.join(tempSourceDir, source);
            FileUtil.copy(source, output);
        }
        let pathZip: string;
        switch (process.platform) {
            case 'darwin':
                pathZip = path.join(tempSourceDir, "resource");
                break;
            case 'win32':
                pathZip = tempSourceDir;
                break;
        }
        const outputPath = path.join(tempDir2, 'output.zip');
        await utils.shell2("cross-zip", [
            pathZip,
            outputPath
        ]);
        const contentBuffer = fs.readFileSync(outputPath);
        FileUtil.remove(tempSourceDir);
        FileUtil.remove(tempDir2);
        return contentBuffer;
    }

    //根据Buffer压缩文件
    private async zipJs(sourceFiles: plugins.File[]): Promise<Buffer> {
        const tempSourceDir = path.join(os.tmpdir(), "egret_temp_" + new Date().getTime() + '3');
        FileUtil.createDirectory(tempSourceDir);
        const tempDir2 = path.join(os.tmpdir(), "egret_temp_" + new Date().getTime() + '4');
        FileUtil.createDirectory(tempDir2);
        for (let i = 0, len = sourceFiles.length;i < len;i++) {
            let file = sourceFiles[i];
            FileUtil.save(path.join(tempSourceDir, file.relative), file.contents);
        }
        let pathZip: string;
        const outputPath = path.join(tempDir2, 'output.zip');
        switch (process.platform) {
            case 'darwin':
                pathZip = path.join(tempSourceDir, "js");
                break;
            case 'win32':
                pathZip = tempSourceDir;
                break;
        }
        await utils.shell2("cross-zip", [
            pathZip,
            outputPath
        ]);
        const contentBuffer = fs.readFileSync(outputPath);
        FileUtil.remove(tempSourceDir);
        FileUtil.remove(tempDir2);
        return contentBuffer;
    }

    //计算Buffer的md5
    private md5Budffer(buffer: Buffer): string {
        let md5sum = crypto.createHash('md5');
        md5sum.update(buffer);
        return md5sum.digest('hex');
    }
}