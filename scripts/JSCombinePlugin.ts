import UglifyJS = require('./tools/lib/uglify-js/uglifyjs');

export class JSCombinePlugin implements plugins.Command {

    private codes: { [source: string]: string } = {};
    private matchers: { sources: string[], target: string };
	
    constructor(param: {
		sources: string[],
		target: string
    }) {
		this.matchers = param;
    }

    async onFile(file: plugins.File) {
        if (file.extname != ".js") {
            return file;
        }
		const filename = file.origin;
		if (this.matchers.sources.indexOf(filename) >= 0) {
			this.codes[filename] = file.contents.toString();
			return null;
		}
        return file;
    }

    async onFinish(commandContext: plugins.CommandContext) {
		const jscode = UglifyJS.minify(this.matchers.sources.map(s => {
			const code = this.codes[s];
			if (!code) {
				throw `missing source file ${s}`
			}
			return code;
		}), {
			compress: false,
		 	fromString: true,
			output: {
				beautify: false
			}
		}).code;
		commandContext.createFile(this.matchers.target, new Buffer(jscode));
    }
}
