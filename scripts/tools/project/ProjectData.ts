import file = require('../lib/FileUtil');
import _path = require("path");

type LauncherAPI = {


    getAllEngineVersions(): any

    getInstalledTools(): { name: string, version: string, path: string }[];

    getTarget(targetName: string): string

    getUserID(): string;

    sign(templatePath: string, uid: string): void;


}

type LauncherAPI_MinVersion = {[P in keyof LauncherAPI]: string }

class EgretLauncherProxy {

    getMinVersion(): LauncherAPI_MinVersion {

        return {
            getAllEngineVersions: '1.0.24',
            getInstalledTools: '1.0.24',
            getTarget: "1.0.45",
            getUserID: "1.0.46",
            sign: "1.0.46"
        }
    }

    private proxy: LauncherAPI;

    getEgretToolsInstalledByVersion(checkVersion: string) {
        if (process.platform === 'linux') {
            return _path.resolve(__dirname, '../../');
        }
        const egretjs = this.getLauncherLibrary();
        const data = egretjs.getAllEngineVersions() as any[];
        const versions: { version: string, path: string }[] = [];
        for (let key in data) {
            const item = data[key];
            versions.push({ version: item.version, path: item.root })
        }
        for (let versionInfo of versions) {
            if (versionInfo.version == checkVersion) {
                return versionInfo.path;
            }
        }
        throw `找不到指定的 egret 版本: ${checkVersion}`;
    }

    getLauncherLibrary(): LauncherAPI {
        const egretjspath = file.joinPath(getEgretLauncherPath(), "egret.js");
        const minVersions = this.getMinVersion();
        const m = require(egretjspath);
        const selector: LauncherAPI = m.selector;
        if (!this.proxy) {
            this.proxy = new Proxy(selector, {
                get: (target, p, receiver) => {
                    const result = target[p];
                    if (!result) {
                        const minVersion = minVersions[p];
                        throw `找不到 LauncherAPI:${p},请安装最新的白鹭引擎启动器客户端解决此问题,最低版本要求:${minVersion},下载地址:https://egret.com/products/engine.html`//i18n
                    }
                    return result.bind(target)
                }
            });
        }
        return this.proxy;
    }
}

function getAppDataPath() {
    var result: string;
    switch (process.platform) {
        case 'darwin':
            var home = process.env.HOME || ("/Users/" + (process.env.NAME || process.env.LOGNAME));
            if (!home)
                return null;
            result = `${home}/Library/Application Support/`;//Egret/engine/`;
            break;
        case 'win32':
            var appdata = process.env.AppData || `${process.env.USERPROFILE}/AppData/Roaming/`;
            result = file.escapePath(appdata);
            break;
        default:
            ;
    }

    if (!file.exists(result)) {
        throw 'missing appdata path'
    }
    return result;
}


function getAppDataEnginesRootPath() {
    const result = file.joinPath(getAppDataPath(), "Egret/engine/");
    if (!file.exists(result)) {
        throw `找不到 ${result}，请在 Egret Launcher 中执行修复引擎`;//todo i18n
    }
    return result;
}

function getEgretLauncherPath() {
    let npmEgretPath;
    if (process.platform === 'darwin') {
        let basicPath = '/usr/local';
        if (!file.existsSync(basicPath)) {//some mac doesn't have path '/usr/local'
            basicPath = '/usr';
        }
        npmEgretPath = file.joinPath(basicPath, 'lib/node_modules/egret/EgretEngine');
    }
    else {
        npmEgretPath = file.joinPath(getAppDataPath(), 'npm/node_modules/egret/EgretEngine');

    }
    if (!file.exists(npmEgretPath)) {
        throw `找不到  ${npmEgretPath}，请在 Egret Launcher 中执行修复引擎`;//todo i18n
    }
    const launcherPath = file.joinPath(file.read(npmEgretPath), "../");
    return launcherPath;

}

export var launcher = new EgretLauncherProxy();