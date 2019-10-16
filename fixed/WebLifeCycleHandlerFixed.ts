/**
 * fixed 在ios12.2及以上浏览器中 点击软键盘的done/完成 按钮 会引发window发送blur事件，造成引擎暂停
 */
if (egret.Capabilities.runtimeType === egret.RuntimeType.WEB && egret.Capabilities.os === "iOS") {

	let WebLifeCycleHandlerFixed: egret.lifecycle.LifecyclePlugin = (context) => {


		let handleVisibilityChange = function () {
			if (!document[hidden]) {
				context.resume();
			}
			else {
				context.pause();
			}
		};

		let hidden, visibilityChange;
		if (typeof document.hidden !== "undefined") {
			hidden = "hidden";
			visibilityChange = "visibilitychange";
		} else if (typeof document["mozHidden"] !== "undefined") {
			hidden = "mozHidden";
			visibilityChange = "mozvisibilitychange";
		} else if (typeof document["msHidden"] !== "undefined") {
			hidden = "msHidden";
			visibilityChange = "msvisibilitychange";
		} else if (typeof document["webkitHidden"] !== "undefined") {
			hidden = "webkitHidden";
			visibilityChange = "webkitvisibilitychange";
		} else if (typeof document["oHidden"] !== "undefined") {
			hidden = "oHidden";
			visibilityChange = "ovisibilitychange";
		}
		if ("onpageshow" in window && "onpagehide" in window) {
			window.addEventListener("pageshow", context.resume, false);
			window.addEventListener("pagehide", context.pause, false);
		}
		if (hidden && visibilityChange) {
			document.addEventListener(visibilityChange, handleVisibilityChange, false);
		}
		if (egret.Capabilities.runtimeType === egret.RuntimeType.NATIVE || egret.Capabilities.runtimeType === egret.RuntimeType.RUNTIME2) {
			//原生应用需要由window的focus/blur事件触发egret的暂停和恢复生命周期回调
			window.addEventListener("focus", context.resume, false);
			window.addEventListener("blur", context.pause, false);
		} else {
			//网页/小游戏只有当没有hidden或没有visibilityChange时，才由window监听focus/blur事件触发egret的暂停和恢复生命周期回调
			if (!hidden || !visibilityChange) {
				window.addEventListener("focus", context.resume, false);
				window.addEventListener("blur", context.pause, false);
			}
		}

		let ua = navigator.userAgent;
		let isWX = /micromessenger/gi.test(ua);
		let isQQBrowser = /mqq/ig.test(ua);
		let isQQ = /mobile.*qq/gi.test(ua);

		if (isQQ || isWX) {
			isQQBrowser = false;
		}
		if (isQQBrowser) {
			let browser = window["browser"] || {};
			browser.execWebFn = browser.execWebFn || {};
			browser.execWebFn.postX5GamePlayerMessage = function (event) {
				let eventType = event.type;
				if (eventType == "app_enter_background") {
					context.pause();
				}
				else if (eventType == "app_enter_foreground") {
					context.resume();
				}
			};
			window["browser"] = browser;
		}
	}

	egret.web.WebPlayer.prototype['init'] = function(container: HTMLDivElement, options: egret.runEgretOptions): void {
		let option = this.readOption(container, options);
		let stage = new egret.Stage();
		stage.$screen = this;
		stage.$scaleMode = option.scaleMode;
		stage.$orientation = option.orientation;
		stage.$maxTouches = option.maxTouches;
		stage.frameRate = option.frameRate;
		stage.textureScaleFactor = option.textureScaleFactor;

		let buffer = new egret.sys.RenderBuffer(undefined, undefined, true);
		let canvas = <HTMLCanvasElement>buffer.surface;
		this.attachCanvas(container, canvas);

		let webTouch = new egret.web.WebTouchHandler(stage, canvas);
		let player = new egret.sys.Player(buffer, stage, option.entryClassName);

		egret.lifecycle.stage = stage;
		egret.lifecycle.addLifecycleListener(WebLifeCycleHandlerFixed);

		let webInput = new egret.web.HTMLInput();

		if (option.showFPS || option.showLog) {
			if (!egret.nativeRender) {
				player.displayFPS(option.showFPS, option.showLog, option.logFilter, option.fpsStyles);
			}
		}
		this.playerOption = option;
		this.container = container;
		this.canvas = canvas;
		this.stage = stage;
		this.player = player;
		this.webTouchHandler = webTouch;
		this.webInput = webInput;

		egret.web.$cacheTextAdapter(webInput, stage, container, canvas);

		this.updateScreenSize();
		this.updateMaxTouches();
		player.start();
	}
}