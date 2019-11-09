import { PluginContext } from "./tools/tasks/index";
import path = require("path");
import * as os from 'os';
import fileUtil = require('./tools/lib/FileUtil');
const UPNG = require("../libs/UPNG/UPNG.js");
import FS = require("fs");
import utils = require('./tools/lib/utils');

export enum KTXMODE {
	IOS,
	ANDROID,
}

export class KTXPlugin implements plugins.Command {
	private _mode: KTXMODE;

	public constructor(mode: KTXMODE) {
		this._mode = mode;
	}

	onStart(pluginContext: PluginContext) {
		let rootPath = pluginContext.projectRoot;
		let resourcePath = path.join(rootPath, "resource");
		let resConfigPath = path.join(resourcePath, "default.res.json");
		let resConfig: {
			groups: {
				keys: string,
				name: string
			}[],
			resources: {
				name: string,
				type: string,
				url: string
				subkeys?: string,
			}[]
		} = JSON.parse(fileUtil.read(resConfigPath, true));
		//筛选并规格化（正方形，边长2次幂，边长>=8）需要压缩的图片
		const tempDir = path.join(os.tmpdir(), "egret_temp_" + new Date().getTime() + "KTXPlugin_0");
		let compressedFiles: {
			[name: string]: {
				url: string
			}
		}[] = [];	//使用压缩纹理的图片
		resConfig.resources.forEach(value => {
			switch(value.type) {
				case 'sheet':
					{
						let sheetPath = path.join(resourcePath, value.url);
						let sheet: {
							file: string,
							frames: {
								[name: string]: {
									x: number,
									y: number,
									w: number,
									h: number,
									offX: number,
									offY: number,
									sourceW: number,
									sourceH: number
								}
							}
						} = JSON.parse(fileUtil.read(sheetPath, true));
						let imgPath = path.join(path.dirname(sheetPath), sheet.file);
						let tmpPath = path.join(tempDir, path.relative(rootPath, imgPath));
						fileUtil.move(imgPath, tmpPath);
						this.squareImage(tmpPath);
						compressedFiles[path.basename(imgPath, ".png") + "_png"] = {
							url: path.relative(resourcePath, imgPath)
						};
					}
					break;
				case 'json':
					{
						let jsonPath = path.join(resourcePath, value.url);
						let tmp = JSON.parse(fileUtil.read(jsonPath, true));
						if (tmp.file) {	//序列帧
							let imgPath = path.join(path.dirname(jsonPath), tmp.file);
							let tmpPath = path.join(tempDir, path.relative(rootPath, imgPath));
							fileUtil.move(imgPath, tmpPath);
							this.squareImage(tmpPath);
							compressedFiles[path.basename(imgPath, ".png") + "_png"] = {
								url: path.relative(resourcePath, imgPath)
							};
						} else if (tmp.imagePath) {	//龙骨
							let imgPath = path.join(path.dirname(jsonPath), tmp.imagePath);
							let tmpPath = path.join(tempDir, path.relative(rootPath, imgPath));
							fileUtil.move(imgPath, tmpPath);
							let ret = this.squareImage(tmpPath);
							compressedFiles[path.basename(imgPath, ".png") + "_png"] = {
								url: path.relative(resourcePath, imgPath)
							};
							if (ret.changed) {
								tmp.width = ret.fitSize;
								tmp.height = ret.fitSize;
								fileUtil.save(jsonPath, JSON.stringify(tmp));
							}
						}
					}
					break;
				case 'font':
					{
						let fontPath = path.join(resourcePath, value.url);
						let font: {
							file: string,
							frames: {
								[char: string]: {
									x: number,
									y: number,
									w: number,
									h: number,
									offX: number,
									offY: number,
									sourceW: number,
									sourceH: number
								}
							}
						} = JSON.parse(fileUtil.read(fontPath, true));
						let imgPath = path.join(path.dirname(fontPath), font.file);
						let tmpPath = path.join(tempDir, path.relative(rootPath, imgPath));
						fileUtil.move(imgPath, tmpPath);
						this.squareImage(tmpPath);
						compressedFiles[path.basename(imgPath, ".png") + "_png"] = {
							url: path.relative(resourcePath, imgPath)
						};
					}
					break;
			}
		});
		//压缩纹理
		let old = process.cwd();
		let ktxToolPath = path.join(rootPath, "cmd", "egret-texture-generator");
        process.chdir(ktxToolPath);
		utils.shell2Sync("npx", ["egret-texture-generator", "--t", tempDir, "--pf", "canvasalpha", "--pbpp", "4"]);
        process.chdir(old);
		//筛选 ios、android 压缩纹理
		const tempIOSDir = path.join(os.tmpdir(), "egret_temp_" + new Date().getTime() + "KTXPlugin_1");
		const tempAndroidDir = path.join(os.tmpdir(), "egret_temp_" + new Date().getTime() + "KTXPlugin_2");
		let assets = fileUtil.getDirectoryAllListing(tempDir);
		let iosSuffix = ".pvr.ktx";
		assets.forEach(value => {
			let basename = path.basename(value);
			if (basename.lastIndexOf(iosSuffix) === basename.length - iosSuffix.length) {
				//ios 压缩纹理
				fileUtil.copy(value, path.join(tempIOSDir, path.relative(tempDir, value)));
			} else if (path.extname(value) === '.ktx') {
				//android 压缩纹理
				fileUtil.copy(value, path.join(tempAndroidDir, path.relative(tempDir, value)));
			}
		});
		switch(this._mode) {
			case KTXMODE.IOS:
				fileUtil.copy(tempIOSDir, rootPath);
				break;
			case KTXMODE.ANDROID:
				fileUtil.copy(tempAndroidDir, rootPath);
				break;
			default:
				throw new Error('Unsupport KTXMODE: ' + this._mode);
		}
		//修改压缩文件代码
		let processorPath = path.join(rootPath, 'src', 'CompressTextureProcessor');
		let processorSource = fileUtil.read(processorPath, true);
		processorSource = processorSource.substr(processorSource.indexOf('\n') + 1);	//删除第一行
		processorSource += 'const compressTextures = ' + JSON.stringify(compressedFiles, null, "\t") + ';\n';
		fileUtil.save(processorPath, processorSource);
	}

	async onFile(file: plugins.File) {
		return file;
	}

	async onFinish(pluginContext?: plugins.CommandContext) {
	}

	/**
	 * 转换图片1.宽高相等 2.宽高均为2的次幂 3.宽高>=8
	 */
	private squareImage(src: string): {
		changed: boolean,
		fitSize: number
	 } {
		let buf: Buffer = fileUtil.readBinary(src);
		let fixedBuf = Buffer.alloc(buf.length, buf);
		let img = UPNG.decode(fixedBuf.buffer);
		let tmp:ArrayBuffer = UPNG.toRGBA8(img)[0];
		let rgba8 = new Uint8Array(tmp, 0, tmp.byteLength);
		let size = Math.max(img.width, img.height);
		let fitSize: number;
		for (let i = 3;true;i++) {
			let tmp = Math.pow(2, i);
			if (tmp >= size) {
				fitSize = tmp;
				break;
			}
		}
		let changed: boolean;
		if (img.width === img.height && img.width === fitSize) {
			changed = false;
		} else {
			changed = true;
			let bmpBuffer = new Uint8Array(fitSize * fitSize * 4);
			for (let y = 0; y < fitSize; y++) {
				for (let x = 0; x < fitSize; x++) {
					let idx = (y * fitSize + x) * 4;
					if (x < img.width && y < img.height) {
						let srcIdx = (img.width * y + x) * 4;
						bmpBuffer[idx] = rgba8[srcIdx];
						bmpBuffer[idx + 1] = rgba8[srcIdx + 1];
						bmpBuffer[idx + 2] = rgba8[srcIdx + 2];
						bmpBuffer[idx + 3] = rgba8[srcIdx + 3];
					} else {
						bmpBuffer[idx] = 0;
						bmpBuffer[idx + 1] = 0;
						bmpBuffer[idx + 2] = 0;
						bmpBuffer[idx + 3] = 0;
					}
				}
			}
			let pngBuffer = UPNG.encode([bmpBuffer.buffer], fitSize, fitSize, 0);
			FS.writeFileSync(src, Buffer.from(pngBuffer));
		}
		return {
			changed,
			fitSize
		};
	}
}