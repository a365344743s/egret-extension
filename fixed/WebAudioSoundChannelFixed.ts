/**
 * bug fixed 在safari（其他浏览器未测试）中，接到电话后，没有触发pause，造成SoundController没有调用暂停声音，
 * 此时不挂断电话，使用任务管理器进入safari，会触发pause/resume，
 * 在pause时，SoundController调用暂停声音获取了SoundChannel的position，但是因为来电时没有暂停声音，此时获取的position是从第一次播放开始时的持续时间，可能已经超过了声音的总时长
 * 在resume时，SoundController调用恢复声音，传递了position，此时如果position > 声音时长，在safari中将会抛出InvalidStateError: The object is in an invalid state.错误
 * see https://stackoverflow.com/questions/55729381/audiobuffersourcenode-start-fails-on-safari-only-when-started-with-an-offs
 */
if (egret.Capabilities.runtimeType === egret.RuntimeType.WEB) {
	let WebAudioSoundChannel = egret.web["WebAudioSoundChannel"];
	Object.defineProperty(WebAudioSoundChannel.prototype, "position", {
		/**
		 * @private
		 * @inheritDoc
		 */
		get: function () {
			if (this.bufferSource) {
				var pos = (Date.now() - this._startTime) / 1000 + this.$startTime;
				if (pos < this.bufferSource.buffer.duration) {
					return pos;
				}
			}
			return 0;
		},
		enumerable: true,
		configurable: true
	});
}