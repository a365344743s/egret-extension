class CustomMovieClip extends egret.DisplayObjectContainer {
	public constructor() {
		super();
		this.bmpDisplay = new egret.Bitmap();
		this.addChild(this.bmpDisplay);
		this.frameRate = 30;
	}

	public set sources(value: Array<string>) {
		this._sources = value;
		this.currentFrameIndex = 0;
		if (this._running && this._sources && this._sources.length > 0 && this.$stage) {
			this.setIsStopped(false);
		}
	}

	public set frameRate(value: number) {
		this._frameRate = value;
		this._frameTime = 1000 / this._frameRate;
	}

	public stop(): void {
		this._running = false;
		this.currentFrameIndex = -1;
		this._startTime = -1;
		this._spendTime = 0;
		this.setIsStopped(true);
		if (this._running) {
			this.removeEventListener(egret.Event.ENTER_FRAME, this.onEnterFrame, this);
			this._running = false;
		}
	}

	public start(): void {
		this._running = true;
		this._startTime = Date.now();
		if (this._sources && this._sources.length > 0 && this.$stage) {
			this.setIsStopped(false);
		}
	}

	$onAddToStage(stage: egret.Stage, nestLevel: number): void {
		super.$onAddToStage(stage, nestLevel);
		if (this._running && this._sources && this._sources.length > 0) {
			this.setIsStopped(false);
		}
	}

	$onRemoveFromStage(): void {
		super.$onRemoveFromStage();
		this.setIsStopped(true);
	}

	private setIsStopped(value: boolean) {
		if (this._isStopped === value) {
			return;
		}
		this._isStopped = value;
		if (value) {
			this.removeEventListener(egret.Event.ENTER_FRAME, this.onEnterFrame, this);
		} else {
			this.addEventListener(egret.Event.ENTER_FRAME, this.onEnterFrame, this);
		}
	}

	private onEnterFrame(evt: egret.Event): void {
		this._spendTime = Date.now() - this._startTime;
		this.currentFrameIndex = Math.floor(this._spendTime / this._frameTime) % this._sources.length;
	}

	private set currentFrameIndex(index: number) {
		if (this._currentFrameIndex === index) {
			return;
		}
		this._currentFrameIndex = index;
		if (index >= 0 && this._sources && index < this._sources.length) {
			RES.getResAsync(this._sources[index], (value?: any, key?: string) => {
				if (value && index === this._currentFrameIndex && this._sources && key === this._sources[index]) {
					this.bmpDisplay.texture = value;
					this.width = this.bmpDisplay.width;
					this.height = this.bmpDisplay.height;
				}
			}, this);
		} else {
			this.bmpDisplay.texture = null;
			this.width = 0;
			this.height = 0;
		}
	}

	private bmpDisplay: egret.Bitmap;

	private _running: boolean = false;
	private _isStopped: boolean = true;
	private _currentFrameIndex: number = -1;
	private _startTime: number = -1;
	private _spendTime: number = 0;
	private _frameRate: number;
	private _frameTime: number;
	private _sources: Array<string>;
}