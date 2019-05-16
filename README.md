# - egret-plugin
白鹭第三方库和构建插件

白鹭自己提供了一些[第三方库](https://github.com/egret-labs/egret-game-library "第三方库")，但是不够用，所以有了这个仓库，另外增加了一些构建插件

# - 目录说明

## cmd
命令行工具

## libs
js库

## libs-ts
ts库

## scripts
构建脚本

# - 库

## 1. clipboard-polyfill
支持平台：web
复制字符串到剪贴板

## 2. [Decimal](https://github.com/MikeMcl/decimal.js "Decimal")
支持平台: ios、android、web

大数库

因为math库已经包含decimal代码，此处只有声明文件。有单独使用需求的可以去[这里](https://github.com/MikeMcl/decimal.js "这里")下载

## 3. [long](https://github.com/dcodeIO/long.js "long")
支持平台: ios、android、web

int64支持，主要用于protobuf

## 4. [math](https://github.com/josdejong/mathjs "math")
支持平台: ios、android、web

js数学库，我们用来进行大数计算

## 5. [pako](https://github.com/nodeca/pako "pako")
支持平台: ios、android、web

jszip压缩库，[UPNG](https://github.com/photopea/UPNG.js "UPNG")的依赖库

## 6. [protobuf](https://github.com/dcodeio/protobuf.js "protobuf")
支持平台: ios、android、web

protobuf js库

## 7. [UPNG](https://github.com/photopea/UPNG.js "UPNG")
支持平台: ios、android、web

PNG快速编解码库

我们项目需要实时生成二维码，做法是
1. 字符串转换为二维码点阵位图数据
2. 通过UPNG把位图转换为png格式二进制数据
3. 二进制数据转换为base64字符串
4. 通过egret.BitmapData.create接口生成bitmap交给egret渲染

## 8. uuid
支持平台: web

uuid库

## 9. [qrcodegen](https://github.com/nayuki/QR-Code-generator "qrcodegen")
支持平台: ios、android、web

二维码生成库

# - 构建插件

## 1. DirCopyPlugin
目录拷贝插件

## 2. FileCopyPlugin
文件拷贝插件（弃用）

## 3. PNGCompressPlugin
png压缩插件，基于[pngquant](https://github.com/kornelski/pngquant "pngquant")，目前全部压缩至256色(png8)

## 4. ProtoMergePlugin
proto文件合并插件，目前我们项目采用的是动态加载proto文件来解析proto，此插件用于合并多个proto文件成一个

## 5. ResDepotPlugin
我们合图用的是[ResDepot](https://egret.com/products/others.html#res-depot "ResDepot")，此插件用于自动合图

## 6. ResSplitPlugin
资源分包插件，将不同资源按照分包规则(ResSplitConfig.ts)，打成不同的zip包，并提供自动版本号管理功能

# - 用法

## TODO