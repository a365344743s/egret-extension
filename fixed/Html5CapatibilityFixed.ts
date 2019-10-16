/**
 * fixed 在safari浏览器中，前后台切换有几率造成webkitAudioContext状态切换为interrupted，之后音频播放无效
 */
if (egret.Capabilities.runtimeType === egret.RuntimeType.WEB && egret.Capabilities.os === "iOS") {
	let Html5Capatibility = egret.web['Html5Capatibility'];
	Html5Capatibility.$init = function() {
		var ua = navigator.userAgent.toLowerCase();
		Html5Capatibility.ua = ua;
		Html5Capatibility._canUseBlob = false;
		var canUseWebAudio = window["AudioContext"] || window["webkitAudioContext"] || window["mozAudioContext"];
		if (canUseWebAudio) {
			try {
				//防止某些chrome版本创建异常问题
				egret.web['WebAudioDecode'].ctx = new (window["AudioContext"] || window["webkitAudioContext"] || window["mozAudioContext"])();
				let ctx = egret.web['WebAudioDecode'].ctx;
				let unlock = () => {
					ctx.resume();    
				};
				ctx.onstatechange = function() {
					if (ctx.state === "running") {
						egret.lifecycle.stage.removeEventListener(egret.TouchEvent.TOUCH_BEGIN, unlock, this);
						egret.lifecycle.stage.removeEventListener(egret.TouchEvent.TOUCH_END, unlock, this);
					} else {
						egret.lifecycle.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, unlock, this);
						egret.lifecycle.stage.addEventListener(egret.TouchEvent.TOUCH_END, unlock, this);
					}
				}
			}
			catch (e) {
				canUseWebAudio = false;
			}
		}
		let AudioType = egret.web['AudioType'];
		var audioType = Html5Capatibility._audioType;
		var checkAudioType;
		if ((audioType == AudioType.WEB_AUDIO && canUseWebAudio) || audioType == AudioType.HTML5_AUDIO) {
			checkAudioType = false;
			Html5Capatibility.setAudioType(audioType);
		}
		else {
			checkAudioType = true;
			Html5Capatibility.setAudioType(AudioType.HTML5_AUDIO);
		}
		if (ua.indexOf("android") >= 0) {
			if (checkAudioType && canUseWebAudio) {
				Html5Capatibility.setAudioType(AudioType.WEB_AUDIO);
			}
		}
		else if (ua.indexOf("iphone") >= 0 || ua.indexOf("ipad") >= 0 || ua.indexOf("ipod") >= 0) {
			if (Html5Capatibility.getIOSVersion() >= 7) {
				Html5Capatibility._canUseBlob = true;
				if (checkAudioType && canUseWebAudio) {
					Html5Capatibility.setAudioType(AudioType.WEB_AUDIO);
				}
			}
		}
		var winURL = window["URL"] || window["webkitURL"];
		if (!winURL) {
			Html5Capatibility._canUseBlob = false;
		}
		if (ua.indexOf("egretnative") >= 0) {
			Html5Capatibility.setAudioType(AudioType.HTML5_AUDIO);
			Html5Capatibility._canUseBlob = true;
		}
		egret.Sound = Html5Capatibility._AudioClass;
	};
}