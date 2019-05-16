/// 阅读 api.d.ts 查看文档
///<reference path="api.d.ts"/>
///<reference path="node.d.ts"/>

import * as path from 'path';
import { UglifyPlugin, CompilePlugin, ManifestPlugin, ExmlPlugin, EmitResConfigFilePlugin, TextureMergerPlugin, CleanPlugin } from 'built-in';
import * as defaultConfig from './config';
import { ResSplitPlugin } from './ResSplitPlugin';
import { ResDepotPlugin } from './ResDepotPlugin';
import { DirCopyPlugin } from './DirCopyPlugin';

const config: ResourceManagerConfig = {

    buildConfig: (params) => {
        const { target, command, projectName, version, projectRoot} = params;
        console.log(version);
        const outputDir = `bin-release/android/${version}`;
        if (command == 'build') {
            return {
                outputDir,
                commands: [
                    new CleanPlugin({ matchers: ["js", "resource"] }),
                    new CompilePlugin({ libraryType: "debug", defines: { DEBUG: true, RELEASE: false } }),
                    new ExmlPlugin('commonjs'), // 非 EUI 项目关闭此设置
                    new ManifestPlugin({ output: 'manifest.json' })
                ]
            }
        }
        else if (command == 'publish') {
            return {
                outputDir,
                commands: [
                    new DirCopyPlugin({
                        from: path.join(projectRoot, 'resource'),
                        to: path.join(projectRoot, 'resource_bak'),
                        before: true,
                        clean: true
                    }),
                    new ResDepotPlugin(),
                    new CleanPlugin({ matchers: ["js", "resource"] }),
                    new CompilePlugin({ libraryType: "release", defines: { DEBUG: false, RELEASE: true } }),
                    new ExmlPlugin('commonjs'), // 非 EUI 项目关闭此设置
                    new UglifyPlugin([{
                        sources: ["main.js"],
                        target: "main.min.js"
                    }
                    ]),
                    new ManifestPlugin({ output: 'manifest.json' }),
                    new ResSplitPlugin(),
                    new DirCopyPlugin({
                        from: path.join(projectRoot, 'resource_bak'),
                        to: path.join(projectRoot, 'resource'),
                        before: false,
                        clean: true
                    }),
                ]
            }
        }
        else {
            throw `unknown command : ${params.command}`;
        }
    },

    mergeSelector: defaultConfig.mergeSelector,

    typeSelector: defaultConfig.typeSelector
}



export = config;
