import { PluginContext } from "./tools/tasks/index";
import utils = require('./tools/lib/utils');
import fileUtil = require('./tools/lib/FileUtil');
import path = require("path");

export class PNGCompressPlugin implements plugins.Command {
	public constructor(paths: string[]) {
		this._compressPaths = paths;
	}

	onStart(pluginContext: PluginContext) {
		let pngFiles: string[] = [];
		this._compressPaths.forEach(element => {
			pngFiles = pngFiles.concat(fileUtil.getDirectoryAllListing(element).filter((value: string, index: number, array: string[]) => {
				return path.extname(value) === '.png';
			}));
		});
		let pngQuantPath = path.join(pluginContext.projectRoot, "cmd", "pngquant", getPNGQuant());
		try {
			utils.shell2Sync(pngQuantPath, ["--force", "--skip-if-larger", "--ext=.png", "--strip", "256"].concat(pngFiles));
		} catch(e) {
			if (e.status !== 98 && e.status !== 99) {
				console.error(e);
				console.error("PNG compress faild!Code: " + e.status);
			}
		}
	}

	async onFile(file: plugins.File) {
		return file;
	}

	async onFinish(pluginContext?: plugins.CommandContext) {
	}

	private _compressPaths: string[];
}

function getPNGQuant() {
    switch (process.platform) {
        case 'darwin':
            return "pngquant";
        case 'win32':
            return "pngquant.exe";
    }
    throw utils.tr(1428);
}