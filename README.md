# - egret-extension
白鹭扩展库，包含第三方库、构建插件、扩展

白鹭自己提供了一些[第三方库](https://github.com/egret-labs/egret-game-library "第三方库")，这里是一些补充，另外增加了一些构建插件和扩展

# - 目录说明

## cmd
命令行工具

## libs
js库

## libs-ts
ts库

## scripts
构建脚本

## extension
扩展

## fixed
引擎bug修复

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

# - 扩展组件

## 1. ScrollPullRefresh
下拉刷新，上拉加载组件

## 2. CustomMovieClip
帧动画组件

egret.MovieClip接受的是一个图集，但是图集在不同的硬件上支持的最大尺寸不一样，这样当图集尺寸超过设备支持的最大尺寸后会出现异常，CustomMovieClip接受一组图片，每帧对应一张图

## 3. CycleScroller
循环滚动翻页组件，通常用于广告位展示

## 4. ImageLoader
支持裁剪的图片加载组件，通常用于玩家头像，活动图片等需要从网络下载图片显示的地方

## 5. RichText
富文本组件

## 6. SuffixLabel
限定长度文本裁剪组件，通常用于昵称、介绍等显示不完文本需要在最后加...显示的地方

## 7. fsm
有限状态机

## 8. ObjectPool
对象池

## 9. Observable
通用观察者模式

# - 引擎bug修复
## 1. WebLifeCycleHandlerFixed.ts
fixed 在ios12.2 safari中 点击软键盘的done/完成 按钮 会引发window发送blur事件，造成引擎暂停
(ios 13.1.3中 safari中 点击软键盘的done/完成 按钮 已经不会再引发window发送blur事件，所以这应该是safari的bug)

## 2. Html5CapatibilityFixed.ts
fixed 在iOS safari浏览器中，前后台切换有几率造成webkitAudioContext状态切换为interrupted，之后音频播放无效
接听来电也会导致webkitAudioContext状态切换为interrupted，然后在挂断电话后却没有恢复为running状态，导致音频无法播放

## 3. JsonProcessorFixed.ts
json解析失败需要抛出RES.ResourceManagerError,否则在ResourceLoader.prototype.loadSingleResource
if (!error.__resource_manager_error__) {
		throw error;
}
会被直接抛出不被资源管理器正确捕获并处理

## 4. RadioButtonGroupFixed.ts
修正 RadioButtonGroup.selectedValue = 0 无法正确选中 RadioButton 的 bug

## 5. WebAudioSoundChannelFixed.ts
修复safari中，接听来电时在不挂断电话情况下切回游戏，恢复背景音乐时，导致InvalidStateError错误

# - 用法

## TODO