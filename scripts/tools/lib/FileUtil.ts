import FS = require("fs");
import Path = require("path");

var charset = "utf-8";

/**
 * 保存数据到指定文件
 * @param path 文件完整路径名
 * @param data 要保存的数据
 */
export function save(path: string, data: any): void {
    if (exists(path)) {
        remove(path);
    }
    path = escapePath(path);
    createDirectory(Path.dirname(path));
    FS.writeFileSync(path, data, { encoding: "utf-8" });
}
/**
 * 创建文件夹
 */
export function createDirectory(path: string, mode?: any): void {
    path = escapePath(path);
    if (mode === undefined) {
        mode = 511 & (~process.umask());
    }

    if (typeof mode === 'string')
        mode = parseInt(mode, 8);
    path = Path.resolve(path);

    try {
        FS.mkdirSync(path, mode);
    }
    catch (err0) {
        switch (err0.code) {
            case 'ENOENT':
                createDirectory(Path.dirname(path), mode);
                createDirectory(path, mode);
                break;

            default:
                var stat;
                try {
                    stat = FS.statSync(path);
                }
                catch (err1) {
                    throw err0;
                }
                if (!stat.isDirectory()) throw err0;
                break;
        }
    }
}

var textTemp = {};
/**
 * 读取文本文件,返回打开文本的字符串内容，若失败，返回"".
 * @param path 要打开的文件路径
 */
export function read(path: string, ignoreCache = false): string {
    path = escapePath(path);
    var text = textTemp[path];
    if (text && !ignoreCache) {
        return text;
    }
    try {
        text = FS.readFileSync(path, charset);
        text = text.replace(/^\uFEFF/, '');
    }
    catch (err0) {
        return "";
    }
    if (text) {
        var ext = getExtension(path).toLowerCase();
        if (ext == "ts" || ext == "exml") {
            textTemp[path] = text;
        }
    }
    return text;
}

/**
 * 读取字节流文件,返回字节流，若失败，返回null.
 * @param path 要打开的文件路径
 */
export function readBinary(path: string): any {
    path = escapePath(path);
    try {
        var binary = FS.readFileSync(path);
    }
    catch (e) {
        return null;
    }
    return binary;
}

export function copy(source: string, dest: string): void {
    source = escapePath(source);
    dest = escapePath(dest);
    var stat = FS.lstatSync(source);
    if (stat.isDirectory()) {
        _copy_dir(source, dest);
    }
    else {
        _copy_file(source, dest);
    }
}

export function isDirectory(path: string): boolean {
    path = escapePath(path);
    try {
        var stat = FS.statSync(path);
    }
    catch (e) {
        return false;
    }
    return stat.isDirectory();
}

/**
 * 删除文件或目录
 * @param path 要删除的文件源路径
 */
export function remove(path: string): void {
    path = escapePath(path);
    try {
        FS.lstatSync(path).isDirectory()
            ? rmdir(path)
            : FS.unlinkSync(path);

        getDirectoryListing(path);
    }
    catch (e) {
    }
}

export function move(oldPath: string, newPath: string) {
    copy(oldPath, newPath);
    remove(oldPath);
}

/**
 * 指定路径的文件或文件夹是否存在
 */
export function exists(path: string): boolean {
    path = escapePath(path);
    return FS.existsSync(path);
}

/**
 * 转换本机路径为Unix风格路径。
 */
export function escapePath(path: string): string {
    if (!path)
        return "";
    return path.split("\\").join("/");
}

export function existsSync(path: string): boolean {
    return FS.existsSync(path);
}

/**
 * 获取路径的文件名(不含扩展名)或文件夹名
 */
export function getFileName(path: string): string {
    if (!path)
        return "";
    path = escapePath(path);
    var startIndex = path.lastIndexOf("/");
    var endIndex;
    if (startIndex > 0 && startIndex == path.length - 1) {
        path = path.substring(0, path.length - 1);
        startIndex = path.lastIndexOf("/");
        endIndex = path.length;
        return path.substring(startIndex + 1, endIndex);
    }
    endIndex = path.lastIndexOf(".");
    if (endIndex == -1 || isDirectory(path))
        endIndex = path.length;
    return path.substring(startIndex + 1, endIndex);
}

/**
 * 获取指定文件夹下的文件或文件夹列表，不包含子文件夹内的文件。
 * @param path 要搜索的文件夹
 * @param relative 是否返回相对路径，若不传入或传入false，都返回绝对路径。
 */
export function getDirectoryListing(path: string, relative: boolean = false): string[] {
    path = escapePath(path);
    try {
        var list = readdirSync(path);
    }
    catch (e) {
        return [];
    }
    var length = list.length;
    if (!relative) {
        for (var i = length - 1; i >= 0; i--) {
            if (list[i].charAt(0) == ".") {
                list.splice(i, 1);
            }
            else {
                list[i] = joinPath(path, list[i]);
            }
        }
    }
    else {
        for (i = length - 1; i >= 0; i--) {
            if (list[i].charAt(0) == ".") {
                list.splice(i, 1);
            }
        }
    }
    return list;
}

/**
 * 获取指定文件夹下全部的文件列表，包括子文件夹
 * @param path
 * @returns {any}
 */
export function getDirectoryAllListing(path: string): string[] {
    var list = [];
    if (isDirectory(path)) {
        var fileList = getDirectoryListing(path);
        for (var key in fileList) {
            list = list.concat(getDirectoryAllListing(fileList[key]));
        }

        return list;
    }

    return [path];
}

/**
 * 连接路径,支持传入多于两个的参数。也支持"../"相对路径解析。返回的分隔符为Unix风格。
 */
export function joinPath(dir: string, ...filename: string[]): string {
    var path = Path.join.apply(null, arguments);
    path = escapePath(path);
    return path;
}

function readdirSync(filePath: string) {
    var files = FS.readdirSync(filePath);
    files.sort();
    return files;
}

function rmdir(path) {
    var files = [];
    if (FS.existsSync(path)) {
        files = readdirSync(path);
        files.forEach(function (file) {
            var curPath = path + "/" + file;
            if (FS.statSync(curPath).isDirectory()) {
                rmdir(curPath);
            }
            else {
                FS.unlinkSync(curPath);
            }
        });
        FS.rmdirSync(path);
    }
}

/**
 * 获得路径的扩展名,不包含点字符。
 */
export function getExtension(path: string): string {
    path = escapePath(path);
    var index = path.lastIndexOf(".");
    if (index == -1)
        return "";
    var i = path.lastIndexOf("/");
    if (i > index)
        return "";
    return path.substring(index + 1);
}

function _copy_file(source_file, output_file) {
    createDirectory(Path.dirname(output_file))
    var byteArray = FS.readFileSync(source_file);
    FS.writeFileSync(output_file, byteArray);
}

function _copy_dir(sourceDir, outputDir) {
    createDirectory(outputDir);
    var list = readdirSync(sourceDir);
    list.forEach(function (fileName) {
        copy(Path.join(sourceDir, fileName), Path.join(outputDir, fileName));
    });
}