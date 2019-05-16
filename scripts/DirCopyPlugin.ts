import * as FileUtil from './tools/lib/FileUtil';
import { PluginContext } from "./tools/tasks/index";

export class DirCopyPlugin implements plugins.Command {
	public constructor(config: {
		from: string,
		to: string,
		before?: boolean,
		clean?: boolean
	}) {
		this._from = config.from;
		this._to = config.to;
		this._before = !!config.before;
		this._clean = !!config.clean;
	}

	onStart(pluginContext: PluginContext) {
		if (this._before) {
			if (this._clean) {
				FileUtil.remove(this._to);
			}
			FileUtil.copy(this._from, this._to);
		}
	}

	async onFile(file: plugins.File) {
		return file;
	}

	async onFinish(commandContext: plugins.CommandContext) {
		if (!this._before) {
			if (this._clean) {
				FileUtil.remove(this._to);
			}
			FileUtil.copy(this._from, this._to);
		}
	}

	private _from: string;
	private _to: string;
	private _before: boolean;
	private _clean: boolean;
}