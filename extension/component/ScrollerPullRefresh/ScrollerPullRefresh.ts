namespace ScrollerPullRefresh {
	export const enum Keys {
		scrollPolicyV,
		scrollPolicyH,
		autoHideTimer,
		touchStartX,
		touchStartY,
		touchMoved,
		horizontalCanScroll,
		verticalCanScroll,
		touchScrollH,
		touchScrollV,
		viewport,
		viewprotRemovedEvent, //表示是被移除触发的viewport设空
		touchCancle,
		touchBegin,
		footerEmpty
	}

	export const enum HeaderState {
		IDLE,
		READY,
		WORKING,
		SUCCESS,
		FAILED
	}

	export const enum FooterState {
		IDLE,
		READY,
		WORKING,
		SUCCESS,
		FAILED,
		EMPTY
	}
}

class ScrollerPullRefresh extends eui.Scroller {
	public constructor() {
		super();
		let values = this.$Scroller;
		values[ScrollerPullRefresh.Keys.touchBegin] = false;
		values[ScrollerPullRefresh.Keys.footerEmpty] = false;
		values[ScrollerPullRefresh.Keys.touchScrollV] = new TouchScrollerPullRefresh(this['verticalUpdateHandler'], this['verticalEndHanlder'], this);;
		this.addEventListener(egret.Event.CHANGE, this.onScrollChanged, this);
		this._mskHeader = new eui.Rect();
		this._mskFooter = new eui.Rect();
		this.addChild(this._mskHeader);
		this.addChild(this._mskFooter);
		this._machine = new StateMachine(this);
	}

	public init(object: {
		header: ScrollerPullRefreshHeader,
		footer: ScrollerPullRefreshFooter,
		headerHandler: (object: {
			succ: (data: any[], empty: boolean) => void,
			failed: () => void
		}) => void, 
		footerHandler: (object: {
			succ: (data: any[], empty: boolean) => void,
			failed: () => void
		}) => void
	}): void {
		this.header = object.header;
		this.footer = object.footer;
		this.setWorkHandler(object.headerHandler, object.footerHandler);
		this.startWork();
	}

	public setData(value: any[]): void {
		(this.viewport as eui.DataGroup).dataProvider = new eui.ArrayCollection(value);
		this.validateNow();
		let viewport = this.viewport;
		let uiValues = viewport.$UIComponent;
		this.$footer.y = Math.min(viewport.contentHeight - viewport.scrollV, uiValues[eui.sys.UIKeys.height]);
	}

	public setDelayTime(headerDelayTime: number, footerDelayTime: number): void {
		this.$headerDelayTime = headerDelayTime;
		this.$footerDelayTime = footerDelayTime;
	}

	public reset(): void {
		this.setData(null);
		let values = this.$Scroller;
		let scroller = values[ScrollerPullRefresh.Keys.touchScrollV];
		values[ScrollerPullRefresh.Keys.footerEmpty] = false;
		this._machine.changeState(new ScrollerPullRefreshStateIDLE());
		this.stopAnimation();
		this.viewport.scrollV = 0;
	}

	protected updateDisplayList(unscaledWidth:number, unscaledHeight:number):void {
		super.updateDisplayList(unscaledWidth, unscaledHeight);
		this._mskHeader.width = unscaledWidth;
		this._mskFooter.width = unscaledWidth;
		this._mskHeader.height = unscaledHeight;
		this._mskFooter.height = unscaledHeight;
	}

	private set header(value: ScrollerPullRefreshHeader) {
		this.$header = value;
		this.$Scroller[ScrollerPullRefresh.Keys.touchScrollV].top = this.$header.height;
		this.$header.y = -this.$header.height;
		this.$header.mask = this._mskHeader;
		this.addChild(this.$header);
	}

	private set footer(value: ScrollerPullRefreshFooter) {
		this.$footer = value;
		this.$Scroller[ScrollerPullRefresh.Keys.touchScrollV].bottom = this.$footer.height;
		this.$footer.y = this.height;
		this.$footer.mask = this._mskFooter;
		this.addChild(this.$footer);
	}

	private setWorkHandler(headerHandler: (object: {
		succ: (data: any[], empty: boolean) => void,
		failed: () => void
	}) => void, footerHandler: (object: {
		succ: (data: any[], empty: boolean) => void,
		failed: () => void
	}) => void) {
		this.$headerWorkHandler = headerHandler;
		this.$footerWorkHandler = footerHandler;
	}

	private startWork(): void {
		this._machine.changeState(new ScrollerPullRefreshStateIDLE());
	}

	private onScrollChanged(evt: egret.Event): void {
		(this._machine.getCurrentState() as ScrollerPullRefreshStateBase).onScrollChanged(evt);
	}

	public $header: ScrollerPullRefreshHeader;
	public $footer: ScrollerPullRefreshFooter;
	public $headerWorkHandler: (object: {
		succ: (data: any[], empty: boolean) => void,
		failed: () => void
	}) => void;
	public $footerWorkHandler: (object: {
		succ: (data: any[], empty: boolean) => void,
		failed: () => void
	}) => void;
	public $headerDelayTime: number = 1000;
	public $footerDelayTime: number = 0;

	private _mskHeader: eui.Rect;
	private _mskFooter: eui.Rect;
	private _machine: StateMachine;
}

ScrollerPullRefresh.prototype['onTouchBegin'] = function(event: egret.TouchEvent): void {
	if (event.isDefaultPrevented()) {
		return;
	}
	if (!this.checkScrollPolicy()) {
		return;
	}
	let values = this.$Scroller;
	values[ScrollerPullRefresh.Keys.touchBegin] = true;
	eui.Scroller.prototype['onTouchBegin'].call(this, event);
}

ScrollerPullRefresh.prototype['onTouchEnd'] = function(event: egret.Event): void {
	let values = this.$Scroller;
	values[ScrollerPullRefresh.Keys.touchBegin] = false;
	(this._machine.getCurrentState() as ScrollerPullRefreshStateBase).onTouchEnd(event);
	eui.Scroller.prototype['onTouchEnd'].call(this, event);
}

class ScrollerPullRefreshStateBase extends StateBase {
	public onScrollChanged(evt: egret.Event): void {
		let target = this.target;
		let viewport: eui.IViewport = target.viewport;
		let uiValues = viewport.$UIComponent;
		target.$header.y = Math.max(-(target.$header.height + viewport.scrollV), -target.$header.height);
		target.$footer.y = Math.min(viewport.contentHeight - viewport.scrollV, uiValues[eui.sys.UIKeys.height]);
		target.$header.onScrollChanged();
		target.$footer.onScrollChanged();
	}

	public onTouchEnd(evt: egret.Event): void {
	}

	public get target(): ScrollerPullRefresh {
		return this.machine.target;
	}
}

class ScrollerPullRefreshStateIDLE extends ScrollerPullRefreshStateBase {
	public onStateEnter(last: StateBase): void {
		super.onStateEnter(last);
		let target = this.target;
		let values = target.$Scroller;
		values[ScrollerPullRefresh.Keys.touchScrollV].topEnabled = false;
		target.$header.state = ScrollerPullRefresh.HeaderState.IDLE;
		if (values[ScrollerPullRefresh.Keys.footerEmpty]) {
			target.$footer.state = ScrollerPullRefresh.FooterState.EMPTY;
		} else {
			target.$footer.state = ScrollerPullRefresh.FooterState.IDLE;
		}
	}

	public onScrollChanged(evt: egret.Event): void {
		super.onScrollChanged(evt);
		let target = this.target;
		let values = target.$Scroller;
		let viewport: eui.IViewport = target.viewport;
		let uiValues = viewport.$UIComponent;
		if (viewport.scrollV < -target.$header.height) {
			this.machine.changeState(new ScrollerPullRefreshStateHeaderReady());
		}
		if (!values[ScrollerPullRefresh.Keys.footerEmpty] && viewport.scrollV > Math.max(0, viewport.contentHeight - uiValues[eui.sys.UIKeys.height] + target.$footer.height)) {
			this.machine.changeState(new ScrollerPullRefreshStateFooterReady());
		}
	}
}

class ScrollerPullRefreshStateHeaderReady extends ScrollerPullRefreshStateBase {
	public onStateEnter(last: StateBase): void {
		super.onStateEnter(last);
		let target = this.target;
		target.$Scroller[ScrollerPullRefresh.Keys.touchScrollV].topEnabled = true;
		target.$header.state = ScrollerPullRefresh.HeaderState.READY;
	}

	public onScrollChanged(evt: egret.Event): void {
		super.onScrollChanged(evt);
		let target = this.target;
		let viewport: eui.IViewport = target.viewport;
		if (viewport.scrollV >= -target.$header.height) {
			this.machine.changeState(new ScrollerPullRefreshStateIDLE());
		}
	}

	public onTouchEnd(evt: egret.Event): void {
		this.machine.changeState(new ScrollerPullRefreshStateHeaderWorking());
		super.onTouchEnd(evt);
	}
}

class ScrollerPullRefreshStateFooterReady extends ScrollerPullRefreshStateBase {
	public onStateEnter(last: StateBase): void {
		super.onStateEnter(last);
		let target = this.target;
		target.$footer.state = ScrollerPullRefresh.FooterState.READY;
	}

	public onScrollChanged(evt: egret.Event): void {
		super.onScrollChanged(evt);
		let target = this.target;
		let viewport: eui.IViewport = target.viewport;
		let uiValues = viewport.$UIComponent;
		if (viewport.scrollV <= Math.max(0, viewport.contentHeight - uiValues[eui.sys.UIKeys.height] + target.$footer.height)) {
			this.machine.changeState(new ScrollerPullRefreshStateIDLE());
		}
	}

	public onTouchEnd(evt: egret.Event): void {
		this.machine.changeState(new ScrollerPullRefreshStateFooterWorking());
		super.onTouchEnd(evt);
	}
}

class ScrollerPullRefreshStateHeaderWorking extends ScrollerPullRefreshStateBase {
	public onStateEnter(last: StateBase): void {
		super.onStateEnter(last);
		let target = this.target;
		target.$Scroller[ScrollerPullRefresh.Keys.touchScrollV].topEnabled = true;
		target.$header.state = ScrollerPullRefresh.HeaderState.WORKING;
		target.$headerWorkHandler({
			succ: (data: any[], empty: boolean) => {
				if (this.machine.getCurrentState() === this) {
					let values = target.$Scroller;
					let viewport = target.viewport;
					let scroller = values[ScrollerPullRefresh.Keys.touchScrollV];
					let uiValues = viewport.$UIComponent;
					values[ScrollerPullRefresh.Keys.footerEmpty] = empty;
					if (empty) {
						target.$footer.state = ScrollerPullRefresh.FooterState.EMPTY;
					} else {
						target.$footer.state = ScrollerPullRefresh.FooterState.IDLE;
					}
					((viewport as eui.DataGroup).dataProvider as eui.ArrayCollection).replaceAll(data);
					this.machine.changeState(new ScrollerPullRefreshStateHeaderWorkSucc());
					target.validateNow();
					target.$footer.y = Math.min(viewport.contentHeight - viewport.scrollV, uiValues[eui.sys.UIKeys.height]);
					if (!scroller.isPlaying()) {
						let maxV = Math.max(0, viewport.contentHeight - uiValues[eui.sys.UIKeys.height] + target.$footer.height);
						if (viewport.scrollV > maxV) {
							scroller.throwTo(maxV);
						}
					}
				}
			},
			failed: () => {
				if (this.machine.getCurrentState() === this) {
					this.machine.changeState(new ScrollerPullRefreshStateHeaderWorkFailed());
				}
			}
		});
	}
}

class ScrollerPullRefreshStateHeaderWorkSucc extends ScrollerPullRefreshStateBase {
	public onStateEnter(last: StateBase): void {
		super.onStateEnter(last);
		let target = this.target;
		let values = target.$Scroller;
		let scroller = values[ScrollerPullRefresh.Keys.touchScrollV];
		target.$header.state = ScrollerPullRefresh.HeaderState.SUCCESS;
		scroller.topEnabled = true;
		this._timer = egret.setTimeout(() => {
			this._timer = null;
			if (values[ScrollerPullRefresh.Keys.touchBegin]) {
				let viewport: eui.IViewport = target.viewport;
				let uiValues = viewport.$UIComponent;
				if (viewport.scrollV < -target.$header.height) {
					this.machine.changeState(new ScrollerPullRefreshStateHeaderReady());
				} else {
					if (!values[ScrollerPullRefresh.Keys.footerEmpty] && viewport.scrollV > Math.max(0, viewport.contentHeight - uiValues[eui.sys.UIKeys.height] + target.$footer.height)) {
						this.machine.changeState(new ScrollerPullRefreshStateFooterReady());
					} else {
						this.machine.changeState(new ScrollerPullRefreshStateIDLE());
					}
				}
			} else {
				this.machine.changeState(new ScrollerPullRefreshStateIDLE());
			}
			if (!values[ScrollerPullRefresh.Keys.touchBegin] && !scroller.isPlaying()) {
				scroller.finishScrolling();
			}
		}, this, target.$headerDelayTime);
	}

	public onStateExit(next: StateBase): void {
		super.onStateExit(next);
		this.clearTimer();
	}

	private clearTimer(): void {
		if (this._timer != null) {
			egret.clearTimeout(this._timer);
		}
	}

	private _timer: number;
}

class ScrollerPullRefreshStateHeaderWorkFailed extends ScrollerPullRefreshStateBase {
	public onStateEnter(last: StateBase): void {
		super.onStateEnter(last);
		let target = this.target;
		let values = target.$Scroller;
		let scroller = values[ScrollerPullRefresh.Keys.touchScrollV];
		scroller.topEnabled = true;
		target.$header.state = ScrollerPullRefresh.HeaderState.FAILED;
		scroller.topEnabled = true;
		this._timer = egret.setTimeout(() => {
			this._timer = null;
			if (values[ScrollerPullRefresh.Keys.touchBegin]) {
				let viewport: eui.IViewport = target.viewport;
				let uiValues = viewport.$UIComponent;
				if (viewport.scrollV < -target.$header.height) {
					this.machine.changeState(new ScrollerPullRefreshStateHeaderReady());
				} else {
					if (!values[ScrollerPullRefresh.Keys.footerEmpty] && viewport.scrollV > Math.max(0, viewport.contentHeight - uiValues[eui.sys.UIKeys.height] + target.$footer.height)) {
						this.machine.changeState(new ScrollerPullRefreshStateFooterReady());
					} else {
						this.machine.changeState(new ScrollerPullRefreshStateIDLE());
					}
				}
			} else {
				this.machine.changeState(new ScrollerPullRefreshStateIDLE());
			}
			if (!values[ScrollerPullRefresh.Keys.touchBegin] && !scroller.isPlaying()) {
				scroller.finishScrolling();
			}
		}, this, target.$headerDelayTime);
	}

	public onStateExit(next: StateBase): void {
		super.onStateExit(next);
		this.clearTimer();
	}

	private clearTimer(): void {
		if (this._timer != null) {
			egret.clearTimeout(this._timer);
		}
	}

	private _timer: number;
}

class ScrollerPullRefreshStateFooterWorking extends ScrollerPullRefreshStateBase {
	public onStateEnter(last: StateBase): void {
		super.onStateEnter(last);
		let target = this.target;
		target.$footer.state = ScrollerPullRefresh.FooterState.WORKING;
		target.$footerWorkHandler({
			succ: (data: any[], empty: boolean) => {
				if (this.machine.getCurrentState() === this) {
					let values = target.$Scroller;
					values[ScrollerPullRefresh.Keys.footerEmpty] = empty;
					let viewport = target.viewport;
					let collection = ((viewport as eui.DataGroup).dataProvider as eui.ArrayCollection);
					for(let i = 0, len = data.length;i < len;i++) {
						collection.addItem(data[i]);
					}
					this.machine.changeState(new ScrollerPullRefreshStateFooterWorkSucc());
					let scroller = values[ScrollerPullRefresh.Keys.touchScrollV];
					let uiValues = viewport.$UIComponent;
					target.validateNow();
					target.$footer.y = Math.min(viewport.contentHeight - viewport.scrollV, uiValues[eui.sys.UIKeys.height]);
				}
			},
			failed: () => {
				if (this.machine.getCurrentState() === this) {
					this.machine.changeState(new ScrollerPullRefreshStateFooterWorkFailed());
				}
			}
		});
	}
}

class ScrollerPullRefreshStateFooterWorkSucc extends ScrollerPullRefreshStateBase {
	public onStateEnter(last: StateBase): void {
		super.onStateEnter(last);
		let target = this.target;
		target.$footer.state = ScrollerPullRefresh.FooterState.SUCCESS;
		this._timer = egret.setTimeout(() => {
			this._timer = null;
			let values = target.$Scroller;
			if (values[ScrollerPullRefresh.Keys.touchBegin]) {
				let viewport: eui.IViewport = target.viewport;
				let uiValues = viewport.$UIComponent;
				if (viewport.scrollV < -target.$header.height) {
					this.machine.changeState(new ScrollerPullRefreshStateHeaderReady());
				} else {
					if (!values[ScrollerPullRefresh.Keys.footerEmpty] && viewport.scrollV > Math.max(0, viewport.contentHeight - uiValues[eui.sys.UIKeys.height] + target.$footer.height)) {
						this.machine.changeState(new ScrollerPullRefreshStateFooterReady());
					} else {
						this.machine.changeState(new ScrollerPullRefreshStateIDLE());
					}
				}
			} else {
				this.machine.changeState(new ScrollerPullRefreshStateIDLE());
			}
		}, this, target.$footerDelayTime);
	}

	public onStateExit(next: StateBase): void {
		super.onStateExit(next);
		this.clearTimer();
	}

	private clearTimer(): void {
		if (this._timer != null) {
			egret.clearTimeout(this._timer);
		}
	}

	private _timer: number;
}

class ScrollerPullRefreshStateFooterWorkFailed extends ScrollerPullRefreshStateBase {
	public onStateEnter(last: StateBase): void {
		super.onStateEnter(last);
		let target = this.target;
		target.$footer.state = ScrollerPullRefresh.FooterState.FAILED;
		this._timer = egret.setTimeout(() => {
			this._timer = null;
			let values = target.$Scroller;
			if (values[ScrollerPullRefresh.Keys.touchBegin]) {
				let viewport: eui.IViewport = target.viewport;
				let uiValues = viewport.$UIComponent;
				if (viewport.scrollV < -target.$header.height) {
					this.machine.changeState(new ScrollerPullRefreshStateHeaderReady());
				} else {
					if (!values[ScrollerPullRefresh.Keys.footerEmpty] && viewport.scrollV > Math.max(0, viewport.contentHeight - uiValues[eui.sys.UIKeys.height] + target.$footer.height)) {
						this.machine.changeState(new ScrollerPullRefreshStateFooterReady());
					} else {
						this.machine.changeState(new ScrollerPullRefreshStateIDLE());
					}
				}
			} else {
				this.machine.changeState(new ScrollerPullRefreshStateIDLE());
			}
		}, this, target.$footerDelayTime);
	}

	public onStateExit(next: StateBase): void {
		super.onStateExit(next);
		this.clearTimer();
	}

	private clearTimer(): void {
		if (this._timer != null) {
			egret.clearTimeout(this._timer);
		}
	}

	private _timer: number;
}