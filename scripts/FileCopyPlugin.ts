import * as FileUtil from './tools/lib/FileUtil';
import * as path from 'path';

export class FileCopyPlugin implements plugins.Command {
	public constructor(files: {
		fromRelative: string,
		toRelative: string
	}[]) {
		this._files = files;
	}

	async onFile(file: plugins.File) {
		return file;
	}

	async onFinish(commandContext: plugins.CommandContext) {
		this.done(commandContext.projectRoot);
	}

	public done(rootPath: string) {
		for(let i = 0, len = this._files.length;i < len;i++) {
			let file = this._files[i];
			let fromPath = path.join(rootPath, file.fromRelative);
			let toPath = path.join(rootPath, file.toRelative);
			FileUtil.createDirectory(path.dirname(toPath));
			FileUtil.copy(fromPath, toPath);
		}
	}

	private _files: {
		fromRelative: string,
		toRelative: string
	}[];
}