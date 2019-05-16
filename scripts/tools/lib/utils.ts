import cp = require('child_process');


//第三方调用时，可能不支持颜色显示，可通过添加 -nocoloroutput 移除颜色信息
var ColorOutputReplacements = {
    "{color_green}": "\\033[1;32;1m",
    "{color_red}": "\\033[0;31m",
    "{color_normal}": "\\033[0m",
    "{color_gray}": "\\033[0;37m",
    "{color_underline}": "\\033[4;36;1m"
};

var NoColorOutputReplacements = {
    "{color_green}": "",
    "{color_red}": "",
    "{color_normal}": "",
    "{color_gray}": "",
    "{color_underline}": "",
    "\n": "\\n",
    "\r": ""
};
function formatStdoutString(message) {
    var replacements = ColorOutputReplacements;
    for (var raw in replacements) {
        let replace = (egret.args && egret.args.ide) ? "" : replacements[raw];
        message = message.split(raw).join(replace);
    }
    return message;
}

global["$locale_strings"] = global["$locale_strings"] || {};
var $locale_strings = global["$locale_strings"];
/**
    * 全局多语言翻译函数
    * @param code 要查询的字符串代码
    * @param args 替换字符串中{0}标志的参数列表
    * @returns 返回拼接后的字符串
    */
export function tr(code: number, ...args): string {
    var text = $locale_strings[code];
    if (!text) {
        return "{" + code + "}";
    }
    text = format.apply(this, [text].concat(args));
    return text;
}

export function format(text: string, ...args): string {
    var length = args.length;
    for (var i = 0; i < length || i < 5; i++) {
        text = text.replace(new RegExp("\\{" + i + "\\}", "ig"), args[i] || "");
    }

    text = formatStdoutString(text);

    return text;
}

export function shell2(command: string, args: string[]) {
    const cmd = command + " " + args.join(" ");
    return new Promise((resolve, reject) => {
        var shell = cp.exec(cmd, (error, stdout, stderr) => {
            if (!error) {
                resolve();
            }
            else {
                console.log(stderr);
                reject();
            }
        });
    })

}

export function shell2Sync(command: string, args: string[]) {
    const cmd = command + " " + args.join(" ");
    return cp.execSync(cmd);
}

export function shell(path: string, args: string[], opt?: cp.ExecOptions, verbase?: boolean) {
    let stdout = "";
    let stderr = "";

    var cmd = `${path} ${args.join(" ")}`;
    if (verbase) {
        console.log(cmd);
    }
    let printStdoutBufferMessage = (message) => {
        var str = message.toString();
        stdout += str;
        if (verbase) {
            console.log(str);
        }
    };
    let printStderrBufferMessage = (message) => {
        var str = message.toString();
        stderr += str;
        if (verbase) {
            console.log(str);
        }
    };

    type Result = { code: number, stdout: string, stderr: string, path: string, args: any[] };

    return new Promise<Result>((resolve, reject) => {
        // path = "\"" + path + "\"";
        // var shell = cp.spawn(path + " " + args.join(" "));
        var shell = cp.spawn(path, args);
        shell.on("error", (message) => { console.log(message); });
        shell.stderr.on("data", printStderrBufferMessage);
        shell.stderr.on("error", printStderrBufferMessage);
        shell.stdout.on("data", printStdoutBufferMessage);
        shell.stdout.on("error", printStdoutBufferMessage);
        shell.on('exit', function (code) {
            if (code != 0) {
                if (verbase) {
                    console.log('Failed: ' + code);
                }
                reject({ code, stdout, stderr, path, args });
            }
            else {
                resolve({ code, stdout, stderr, path, args });
            }
        });
    });
};

export function shellSync(path: string, args: string[]) {
    return cp.spawnSync(path, args);
}