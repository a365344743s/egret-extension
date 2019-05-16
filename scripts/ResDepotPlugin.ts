import { PluginContext } from "./tools/tasks/index";
import { launcher } from "./tools/project/ProjectData";
import utils = require('./tools/lib/utils');
import fileUtil = require('./tools/lib/FileUtil');
import path = require("path");


let resGroupConfig: {
	[key: string]: string[]
} = {
	common: ["hallRes"],
	float: ["hallRes"],
	game_baccarat: ["baccarat"],
	game_bairenNiuniu: ["bairenNiuniu"],
	game_cs: ["cs"],
	game_dragonTiger: ["dragonTiger"],
	game_erbagang: ["ebg"],
	game_fish: ["fish"],
	game_jh: ["jh"],
	game_landLord: ["landLord"],
	game_nn: ["nn", "qznn"],
	game_pdk: ["pdk"],
	game_sangong: ["sg"],
	game_sgj: ["sgj"],
	game_toubao: ["touBao"],
	loading: ["loadRes"],
	lobby: ["hallRes"],
	login: ["hallRes"],
	lottery: ["hallRes"],
	prestrain: ["hallRes"],
};

export class ResDepotPlugin implements plugins.Command {
	public constructor() {
	}

	onStart(pluginContext: PluginContext) {
		let resDepotPath = getResDepotPath();
		let packConfigPath = path.join(pluginContext.projectRoot, "TextureMerge.json");
		let rootDirectory = path.join(pluginContext.projectRoot, "resource");
		let resourcePath = path.join(rootDirectory, "default.res.json");
		let outDir = path.join(pluginContext.projectRoot, "resource_Publish");
		let outResourcePath = path.join(outDir, "default.res.json");
		let outPacksDir = path.join(outDir, "packs");
		//修改TextureMerge.json的publishPath和sourcePath为本机绝对路径
		let packConfig: {
			addCrc: boolean,
			cleanPublishPath: boolean,
			packGroups: {
				gap: number,
				name: string,
				res: {
					compress: boolean,
					key: string
				}[],
				sort: number
			}[],
			publishCopyAll: boolean,
			publishPath: string,
			sourcePath: string,
			unPackGroup: {
				compress: boolean,
				key: string
			}[]
		} = JSON.parse(fileUtil.read(packConfigPath, true));
		packConfig.sourcePath = fileUtil.escapePath(rootDirectory) + "/";
		packConfig.publishPath = fileUtil.escapePath(outDir) + "/";
		fileUtil.save(packConfigPath, JSON.stringify(packConfig, null, "\t"));
		//调用ResDepot打包图集
		utils.shell2Sync(resDepotPath, ["-pack", resourcePath, packConfigPath, rootDirectory]);
		//将打包后的图集移动到原路径下，并更新default.res.json
		let res: {
			groups: [{
				keys: string,
				name: string
			}],
			resources: [{
				name: string,
				type: string,
				url: string
				subkeys?: string
			}]
		} = JSON.parse(fileUtil.read(outResourcePath, true));
		fileUtil.getDirectoryListing(outPacksDir).forEach(element => {
			let fileName = path.basename(element);
			let idxScope = fileName.indexOf("_");
			let pkg = fileName.substring(0, idxScope);
			let targetPath: string;
			if (pkg === "game") {
				let game = fileName.substring(idxScope + 1, fileName.indexOf("_", idxScope + 1));
				pkg += "_" + game;
				targetPath = path.join(outDir, "assets/game", game, fileName);
			} else {
				targetPath = path.join(outDir, "assets", pkg, fileName);
			}
			fileUtil.move(element, targetPath);
			for(let i = 0, len = res.resources.length;i < len;i++) {
				let it = res.resources[i];
				if (element.indexOf(it.url) === (element.length - it.url.length)) {
					//修正路径
					it.url = fileUtil.escapePath(targetPath.substr(outDir.length + 1));
					//加入资源组
					resGroupConfig[pkg].forEach(grp => {
						for(let i = 0, len = res.groups.length;i < len;i++) {
							let tmp = res.groups[i];
							if (tmp.name === grp) {
								tmp.keys += "," + it.name;
								break;
							}
						}
					});
					break;
				}
			}
		});
		fileUtil.remove(outPacksDir);
		fileUtil.save(outResourcePath, JSON.stringify(res, null, "\t"));
		//使用打包后的资源替换原资源
		fileUtil.remove(rootDirectory);
		fileUtil.move(outDir, rootDirectory);
	}

	async onFile(file: plugins.File) {
		return file;
	}

	async onFinish(pluginContext?: plugins.CommandContext) {
	}
}

function getResDepotPath() {
    const toolsList = launcher.getLauncherLibrary().getInstalledTools();
    const tm = toolsList.filter(m => {
        return m.name == "Res Depot";
    })[0];
    if (!tm) {
        throw utils.tr(1426);
    }
    const isUpperVersion = globals.compressVersion(tm.version, "1.4.3");
    if (isUpperVersion < 0) {
        throw utils.tr(1427);
    }
    switch (process.platform) {
        case 'darwin':
            return tm.path + "/Contents/MacOS/ResDepot";
        case 'win32':
            return "\"" + tm.path + "/ResDepot" + "\"";
    }
    throw utils.tr(1428);
}