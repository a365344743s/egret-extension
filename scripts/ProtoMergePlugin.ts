import { PluginContext } from "./tools/tasks/index";
import path = require("path");
import fileUtil = require('./tools/lib/FileUtil');

export class ProtoMergePlugin implements plugins.Command {
	public constructor() {
	}

	onStart(pluginContext: PluginContext) {
		//merge proto
		let protoPath = path.join(pluginContext.projectRoot, "resource/assets/prestrain/proto");
		let protoMergePath = path.join(protoPath, "merge.proto");
		let protoMergeKey = fileUtil.getFileName(protoMergePath) + "_proto";
		//common.proto中包含proto版本，必须放在最前面
		let firstMergeProtoPath = path.join(protoPath, "common.proto");
		let protoKeys: string[] = [];
		let proto = fileUtil.read(firstMergeProtoPath);
		fileUtil.getDirectoryListing(protoPath).forEach(element => {
			if (element !== firstMergeProtoPath) {
				proto += fileUtil.read(element);
			}
			fileUtil.remove(element);
			protoKeys.push(fileUtil.getFileName(element) + "_proto");
		});
		fileUtil.save(protoMergePath, proto);
		//change default.res.json
		let rootDirectory = path.join(pluginContext.projectRoot, "resource");
		let resourcePath = path.join(rootDirectory, "default.res.json");
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
		} = JSON.parse(fileUtil.read(resourcePath, true));
		let grpProto: {
			[key: string]: boolean
		} = {};
		protoKeys.forEach(key => {
			res.groups.forEach(group => {
				let grpKeys = group.keys.split(",");
				for(let i = 0, len = grpKeys.length;i < len;i++) {
					if (grpKeys[i] === key) {
						grpKeys.splice(i, 1);
						group.keys = grpKeys.join(",");
						grpProto[group.name] = true;
						break;
					}
				}
			});
			for(let i = 0, len = res.resources.length;i < len;i++) {
				if (res.resources[i].name === key) {
					res.resources.splice(i, 1);
					break;
				}
			}
		});
		for(let name in grpProto) {
			for(let i = 0, len = res.groups.length;i < len;i++) {
				if(res.groups[i].name === name) {
					res.groups[i].keys = res.groups[i].keys + "," + protoMergeKey;
					break;
				}
			}
		}
		
		res.resources.push({
			name: protoMergeKey,
			type: "text",
			url: protoMergePath.substr(rootDirectory.length + 1)
		});
		fileUtil.save(resourcePath, JSON.stringify(res, null, "\t"));
	}

	async onFile(file: plugins.File) {
		return file;
	}

	async onFinish(pluginContext?: plugins.CommandContext) {
	}
}