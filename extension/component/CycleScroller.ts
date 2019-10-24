enum CycleScrollerDirection {
	HORIZONTAL,
	VERTICAL
}

interface ICycleScrollerItem extends IFreeze {
	sourceIndex: number;			//未归一化的数据源索引
	sourceIndexNormalize: number;	//归一化数据源索引
	data: any;						//数据源中对应的数据
	clear(): void;
	readonly isValid: boolean;
}

interface ICycleIndicator {
	indexNormalize: number;	//归一化数据源索引
}

class CycleScroller extends eui.Scroller implements IClear {
	public constructor() {
		super();
		this.initializeClearValues();
		let that = this;
		let start = function(touchPoint:number):void {
            this.started = true;
			this.startSourceIndex = ((that.viewport as eui.Group).getElementAt(that.getCurrentItemIndex()) as any as ICycleScrollerItem).sourceIndex;
            this.velocity = 0;
            this.previousVelocity.length = 0;
            this.previousTime = egret.getTimer();
            this.previousPosition = this.currentPosition = touchPoint;
            this.offsetPoint = touchPoint;
            egret.startTick(this.onTick, this);
        };
		let finish = function(currentScrollPos:number, maxScrollPos:number): void {
			egret.stopTick(this.onTick, this);
            this.started = false;
			//计算拖动速度
			let sum = this.velocity * TouchScrollerPullRefresh.CURRENT_VELOCITY_WEIGHT;
            let previousVelocityX = this.previousVelocity;
            let length = previousVelocityX.length;
            let totalWeight = TouchScrollerPullRefresh.CURRENT_VELOCITY_WEIGHT;
            for (let i = 0; i < length; i++) {
                let weight = TouchScrollerPullRefresh.VELOCITY_WEIGHTS[i];
                sum += previousVelocityX[0] * weight;
                totalWeight += weight;
            }
            let pixelsPerMS = sum / totalWeight;
            let absPixelsPerMS = Math.abs(pixelsPerMS);
            let duration = 0;
            let posTo = 0;
			//计算当前位置index
			let idx = that.getCurrentItemIndex();
			//如果拖动没有造成页面切换并且拖动速度大于阈值，使用惯性移动，否则使用就近移动
            if (this.startSourceIndex === ((that.viewport as eui.Group).getElementAt(idx) as any as ICycleScrollerItem).sourceIndex && absPixelsPerMS > TouchScrollerPullRefresh.MINIMUM_VELOCITY) {
				if (pixelsPerMS < 0) {
					if (idx > this.startIndex) {
						this.scrollToItemIndex(idx);
					} else {
						this.scrollToItemIndex(idx + 1);
					}
				} else {
					if (idx < this.startIndex) {
						this.scrollToItemIndex(idx);
					} else {
						this.scrollToItemIndex(idx - 1);
					}
				}
			} else {
				this.scrollToItemIndex(idx);
			}
		};
		let scrollToItemIndex = function(index: number): void {
			this.throwTo(that.getScrollPositionByIndex(index), 300);
		};
		let throwTo = function(hspTo:number, duration:number = 500):void {
            let hsp = this.currentScrollPos;
            if (hsp == hspTo) {
                this.endFunction.call(this.target);
                return;
            }
			let animation = this.animation;
			if (duration <= 0) {
				animation.currentValue = hspTo;
				this.onScrollingUpdate(animation);
				this.endFunction.call(this.target);
			} else {
				animation.duration = duration;
				animation.from = hsp;
				animation.to = hspTo;
				animation.play();
			}
        };
		let finishScrolling = function(animation?:eui.sys.Animation):void {
			this.endFunction.call(this.target);
        };
		let touchScrollH = this.$Scroller[ScrollerPullRefresh.Keys.touchScrollH];
		touchScrollH["start"] = start;
		touchScrollH["finish"] = finish;
		touchScrollH["scrollToItemIndex"] = scrollToItemIndex;
		touchScrollH["throwTo"] = throwTo;
		touchScrollH["finishScrolling"] = finishScrolling;
		touchScrollH.animation.endFunction = finishScrolling;
		let touchScrollV = this.$Scroller[ScrollerPullRefresh.Keys.touchScrollV];
		touchScrollV["start"] = start;
		touchScrollV["finish"] = finish;
		touchScrollV["scrollToItemIndex"] = scrollToItemIndex;
		touchScrollV["throwTo"] = throwTo;
		touchScrollV["finishScrolling"] = finishScrolling;
		touchScrollV.animation.endFunction = finishScrolling;
	}
	
	private initializeClearValues(): void {
		this._valid = true;
	}

	public clear(): void {
		this.stopAutoScroll();
		this.clearItems();
		if (!this._valid) {
			throw new Error("Call clear on an invalid object!");
		}
		this._valid = false;
	}

	private clearItems(): void {
		let grp = this.viewport as eui.Group;
		for(let i = 0, len = grp.numChildren;i < len;i++) {
			(grp.getChildAt(i) as any as ICycleScrollerItem).clear();
		}
		grp.removeChildren();
		this._itemPool.forEach(element => {
			element.clear();
		});
		this._itemPool.length = 0;
	}

	public get isValid(): boolean {
		return this._valid;
	}

	private _valid: boolean;

	/**
	 * @param {any} value.template 继承自eui.Component并实现ICycleScrollerItem的class
	 * @param {Object} value.itemSize 每一个条目的尺寸
	 * @param {number} value.gap 条目间距
	 * @param {any[]} value.source 数据源
	 * @param {CycleScrollerDirection} value.direction 滚动方向
	 * @param {number} value.autoScrollTime 自动切换间隔时间
	 * @param {ICycleIndicator} value.indicator 当前条目索引指示器
	 * @param {Function} itemTapCallback 条目点击回调
	 */
	public set params(value: {
		template: any,
		itemSize: {
			width: number,
			height: number
		},
		gap: number,
		source: any[],
		direction: CycleScrollerDirection,
		autoScrollTime: number,
		indicator?: ICycleIndicator,
		itemTapCallback?: (index: number) => void
	}) {
		this.clearItems();
		this._params = value;
		switch(value.direction) {
			case CycleScrollerDirection.HORIZONTAL:
				this.scrollPolicyH = eui.ScrollPolicy.ON;
				this.scrollPolicyV = eui.ScrollPolicy.OFF;
				break;
			case CycleScrollerDirection.VERTICAL:
				this.scrollPolicyH = eui.ScrollPolicy.OFF;
				this.scrollPolicyV = eui.ScrollPolicy.ON;
				break;
			default:
				egret.error("Wrong CycleScrollerDirection: " + value.direction);
				break;
		}
		this.updateShowNum();
		this.initItems();
		if (value.autoScrollTime > 0 && this.$stage) {
			this.startAutoScroll();
		}
	}

	$onAddToStage(stage: egret.Stage, nestLevel: number): void {
		super.$onAddToStage(stage, nestLevel);
		if (this._params && this._params.autoScrollTime > 0) {
			this.startAutoScroll();
		}
	}

	$onRemoveFromStage(): void {
		this.stopAutoScroll();
		super.$onRemoveFromStage();
	}

	/** 开始自动切换 */
	private startAutoScroll(): void {
		this.stopAutoScroll();
		let params = this._params;
		let scroll: eui.sys.TouchScroll;
		switch(params.direction) {
			case CycleScrollerDirection.HORIZONTAL:
				scroll = this.$Scroller[ScrollerPullRefresh.Keys.touchScrollH];
				break;
			case CycleScrollerDirection.VERTICAL:
				scroll = this.$Scroller[ScrollerPullRefresh.Keys.touchScrollV];
				break;
			default:
				egret.error("Wrong CycleScrollerDirection: " + params.direction);
				break;
		}
		this._timerAutoScroll = egret.setInterval(() => {
			scroll["scrollToItemIndex"](this.getCurrentItemIndex() + 1);
		}, this, this._params.autoScrollTime);
	}

	/** 关闭自动切换 */
	private stopAutoScroll(): void {
		if (this._timerAutoScroll != null) {
			egret.clearInterval(this._timerAutoScroll);
			this._timerAutoScroll = null;
		}
	}

	/** 计算可是区域最大可容纳条目数量 **/
	private updateShowNum(): void {
		let params = this._params;
		let step: number;
		let gap: number = params.gap;
		let max: number;
		switch(params.direction) {
			case CycleScrollerDirection.HORIZONTAL:
				step = params.itemSize.width;
				max = this.width;
				break;
			case CycleScrollerDirection.VERTICAL:
				step = params.itemSize.height;
				max = this.height;
				break;
			default:
				egret.error("Wrong CycleScrollerDirection: " + params.direction);
				break;
		}
		let showNum = 1;
		while(step * showNum + gap * (showNum - 1) < max) {
			showNum += 2;
		}
		this._showNum = showNum;
	}

	/** 创建初始条目 */
	private initItems():void {
		let grp = this.viewport as eui.Group;
		let params = this._params;
		let layout: eui.LinearLayoutBase;
		let step: number;
		let max: number;
		switch(params.direction) {
			case CycleScrollerDirection.HORIZONTAL:
				layout = new eui.HorizontalLayout();
				layout.gap = params.gap;
				step = params.itemSize.width;
				max = this.width;
				break;
			case CycleScrollerDirection.VERTICAL:
				layout = new eui.VerticalLayout();
				layout.gap = params.gap;
				step = params.itemSize.height;
				max = this.height;
				break;
			default:
				egret.error("Wrong CycleScrollerDirection: " + params.direction);
				break;
		}
		grp.layout = layout;
		let maxIndex = (this._showNum + 1) / 2;
		for(let i = -maxIndex;i <= maxIndex;i++) {
			this.pushItem(i);
		}
		let position = (((this._showNum + 2) * step + (this._showNum + 1) * params.gap)- max) / 2;
		this._posInit = position;
		let scroll: eui.sys.TouchScroll;
		switch(params.direction) {
			case CycleScrollerDirection.HORIZONTAL:
				scroll = this.$Scroller[ScrollerPullRefresh.Keys.touchScrollH];
				break;
			case CycleScrollerDirection.VERTICAL:
				scroll = this.$Scroller[ScrollerPullRefresh.Keys.touchScrollV];
				break;
			default:
				egret.error("Wrong CycleScrollerDirection: " + params.direction);
				break;
		}
		scroll["throwTo"](position, 0);
	}

	/** 获取当前条目的索引 */
	private getCurrentItemIndex(): number {
		let params = this._params;
		let grp = this.viewport as eui.Group;
		let idx = 0;
		let step: number;
		let max: number;
		let current: number;
		switch(params.direction) {
			case CycleScrollerDirection.HORIZONTAL:
				step = params.itemSize.width;
				max = this.width;
				current = grp.scrollH;
				break;
			case CycleScrollerDirection.VERTICAL:
				step = params.itemSize.height;
				max = this.height;
				current = grp.scrollV;
				break;
			default:
				egret.error("Wrong CycleScrollerDirection: " + params.direction);
				break;
		}
		while(current + max / 2 > step + params.gap / 2 + (params.gap + step) * idx) {
			idx++;
		}
		return idx;
	}

	/** 获取指定索引条目的滚动位置 */
	private getScrollPositionByIndex(index: number): number {
		let params = this._params;
		let grp = this.viewport as eui.Group;
		let idx = 0;
		let step: number;
		let max: number;
		switch(params.direction) {
			case CycleScrollerDirection.HORIZONTAL:
				step = params.itemSize.width;
				max = this.width;
				break;
			case CycleScrollerDirection.VERTICAL:
				step = params.itemSize.height;
				max = this.height;
				break;
			default:
				egret.error("Wrong CycleScrollerDirection: " + params.direction);
				break;
		}
		return ((step + params.gap) * index + step / 2) - max / 2;
	}

	/** 计算归一化的数据源索引值 */
	private getNormalizeIndex(sourceIndex): number {
		let normalizeIndex: number;
		let params = this._params;
		let len = params.source.length;
		if (len === 0) {
			normalizeIndex = -1;
		} else {
			if (sourceIndex < 0) {
				normalizeIndex = (len - (-sourceIndex) % len) % len;
			} else {
				normalizeIndex = sourceIndex % len;
			}
		}
		return normalizeIndex;
	}

	/** 在最后插入一条item */
	private pushItem(sourceIndex: number): void {
		let item = this.createItem(sourceIndex);
		let grp = this.viewport as eui.Group;
		grp.addChild(item as any);
	}

	/** 弹出最后一条item */
	private popItem(): void {
		let grp = this.viewport as eui.Group;
		let item = grp.removeChildAt(grp.numElements - 1);
		this.releaseItem(item as any);
	}

	/** 在最前插入一条item */
	private unshiftItem(sourceIndex: number): void {
		let item = this.createItem(sourceIndex);
		let grp = this.viewport as eui.Group;
		grp.addChildAt(item as any, 0);
	}
	
	/** 删除最前一条item */
	private shiftItem(): void {
		let grp = this.viewport as eui.Group;
		let item = grp.removeChildAt(0);
		this.releaseItem(item as any);
	}

	/** 创建一条item */
	private createItem(sourceIndex: number): ICycleScrollerItem {
		let it: ICycleScrollerItem;
		if (this._itemPool.length > 0) {
			it = this._itemPool.shift();
			it.unfreeze();
		} else {
			it = new this._params.template();
		}
		it.sourceIndex = sourceIndex;
		it.sourceIndexNormalize = this.getNormalizeIndex(sourceIndex);
		it.data = this._params.source[it.sourceIndexNormalize];
		((it as any) as egret.IEventDispatcher).addEventListener(egret.TouchEvent.TOUCH_TAP, this.onItemTapped, this);
		return it;
	}

	/** 释放一条item */
	private releaseItem(value: ICycleScrollerItem): void {
		value.freeze();
		this._itemPool.push(value);
	}

	private onItemTapped(evt: egret.TouchEvent): void {
		let it = evt.currentTarget as ICycleScrollerItem;
		if (this._params.itemTapCallback) {
			this._params.itemTapCallback(it.sourceIndexNormalize);
		}
	}

	private _params: {
		template: any,
		itemSize: {
			width: number,
			height: number
		},
		gap: number,
		source: any[],
		direction: CycleScrollerDirection,
		autoScrollTime: number,
		indicator?: ICycleIndicator
		itemTapCallback?: (index: number) => void
	};
	private _showNum: number;
	private _posInit: number;
	private _timerAutoScroll: number;
	private _itemPool: ICycleScrollerItem[] = [];
}

CycleScroller.prototype['horizontalUpdateHandler'] = function(scrollPos: number): void {
	let params = this._params;
	const viewport = this.$Scroller[ScrollerPullRefresh.Keys.viewport] as eui.Group;
	let num = scrollPos > this._posInit ? Math.floor((scrollPos - this._posInit) / (params.itemSize.width + params.gap)) : Math.ceil((scrollPos - this._posInit) / (params.itemSize.width + params.gap));
	let numAbs = Math.abs(num);
	if (numAbs > 0) {
		let touchScrollH = this.$Scroller[ScrollerPullRefresh.Keys.touchScrollH];
		if (scrollPos > this._posInit) {	//左移
			for(let i = 0;i < numAbs;i++) {
				this.shiftItem();
				this.pushItem((viewport.getElementAt(viewport.numElements - 1) as any as ICycleScrollerItem).sourceIndex + 1);
			}
		} else {
			for(let i = 0;i < numAbs;i++) {	//右移
				this.popItem();
				this.unshiftItem((viewport.getElementAt(0) as any as ICycleScrollerItem).sourceIndex - 1);
			}
		}
		let delta = num * (params.itemSize.width + params.gap);
		scrollPos -= delta;
		touchScrollH.animation.currentValue = scrollPos;
		touchScrollH.currentScrollPos = scrollPos;
		viewport.scrollH = scrollPos;
		touchScrollH.animation.from -= delta;
		touchScrollH.animation.to -= delta;
	} else {
		if (viewport) {
			viewport.scrollH = scrollPos;
		}
		this.dispatchEventWith(egret.Event.CHANGE);
	}
}

CycleScroller.prototype['verticalUpdateHandler'] = function(scrollPos: number): void {
	let params = this._params;
	const viewport = this.$Scroller[ScrollerPullRefresh.Keys.viewport] as eui.Group;
	let num = scrollPos > this._posInit ? Math.floor((scrollPos - this._posInit) / (params.itemSize.height + params.gap)) : Math.ceil((scrollPos - this._posInit) / (params.itemSize.height + params.gap));
	let numAbs = Math.abs(num);
	if (numAbs > 0) {
		let touchScrollV = this.$Scroller[ScrollerPullRefresh.Keys.touchScrollV];
		if (scrollPos > this._posInit) {	//上移
			for(let i = 0;i < numAbs;i++) {
				this.shiftItem();
				this.pushItem((viewport.getElementAt(viewport.numElements - 1) as any as ICycleScrollerItem).sourceIndex + 1);
			}
		} else {
			for(let i = 0;i < numAbs;i++) {	//下移
				this.popItem();
				this.unshiftItem((viewport.getElementAt(0) as any as ICycleScrollerItem).sourceIndex - 1);
			}
		}
		let delta = num * (params.itemSize.height + params.gap);
		scrollPos -= delta;
		touchScrollV.animation.currentValue = scrollPos;
		touchScrollV.currentScrollPos = scrollPos;
		viewport.scrollV = scrollPos;
		touchScrollV.animation.from -= delta;
		touchScrollV.animation.to -= delta;
	} else {
		if (viewport) {
			viewport.scrollV = scrollPos;
		}
		this.dispatchEventWith(egret.Event.CHANGE);
	}
}

CycleScroller.prototype["onTouchBegin"] = function(event:egret.TouchEvent):void {
	if (event.isDefaultPrevented()) {
		return;
	}
	if (!this.checkScrollPolicy()) {
		return;
	}
	this.downTarget = event.target;
	let values = this.$Scroller;
	this.stopAnimation();
	this.stopAutoScroll();
	values[ScrollerPullRefresh.Keys.touchStartX] = event.$stageX;
	values[ScrollerPullRefresh.Keys.touchStartY] = event.$stageY;

	if (values[ScrollerPullRefresh.Keys.horizontalCanScroll]) {
		values[ScrollerPullRefresh.Keys.touchScrollH].start(event.$stageX);
	}
	if (values[ScrollerPullRefresh.Keys.verticalCanScroll]) {
		values[ScrollerPullRefresh.Keys.touchScrollV].start(event.$stageY);
	}
	let stage = this.$stage;
	this.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.onTouchMove, this);
	stage.addEventListener(egret.TouchEvent.TOUCH_END, this.onTouchEnd, this, true);
	this.addEventListener(egret.TouchEvent.TOUCH_CANCEL, this.onTouchCancel, this);
	this.addEventListener(egret.Event.REMOVED_FROM_STAGE, this.onRemoveListeners, this);
	this.tempStage = stage;
}

CycleScroller.prototype["onTouchCancel"] = function(event:egret.TouchEvent):void {
	if (!this.$Scroller[ScrollerPullRefresh.Keys.touchMoved]) {
		this.onRemoveListeners();
		let params = this._params;
		if (params && params.autoScrollTime > 0) {
			this.startAutoScroll();
		}
	}
}

CycleScroller.prototype["onTouchEnd"] = function(event:egret.Event):void {
	let values = this.$Scroller;
	values[ScrollerPullRefresh.Keys.touchMoved] = false;

	this.onRemoveListeners();

	let viewport: eui.IViewport = values[ScrollerPullRefresh.Keys.viewport];
	let uiValues = viewport.$UIComponent;
	if (values[ScrollerPullRefresh.Keys.touchScrollH].isStarted()) {
		values[ScrollerPullRefresh.Keys.touchScrollH].finish(viewport.scrollH, viewport.contentWidth - uiValues[eui.sys.UIKeys.width]);
	}
	if (values[ScrollerPullRefresh.Keys.touchScrollV].isStarted()) {
		values[ScrollerPullRefresh.Keys.touchScrollV].finish(viewport.scrollV, viewport.contentHeight - uiValues[eui.sys.UIKeys.height]);
	}
	if (this._params && this._params.autoScrollTime > 0) {
		this.startAutoScroll();
	}
}

CycleScroller.prototype["onChangeEnd"] = function():void {
	let values = this.$Scroller;
	let horizontalBar = this.horizontalScrollBar;
	let verticalBar = this.verticalScrollBar;
	if (horizontalBar && horizontalBar.visible || verticalBar && verticalBar.visible) {
		if (!values[ScrollerPullRefresh.Keys.autoHideTimer]) {
			values[ScrollerPullRefresh.Keys.autoHideTimer] = new egret.Timer(200, 1);
			values[ScrollerPullRefresh.Keys.autoHideTimer].addEventListener(egret.TimerEvent.TIMER_COMPLETE, this.onAutoHideTimer, this);
		}
		values[ScrollerPullRefresh.Keys.autoHideTimer].reset();
		values[ScrollerPullRefresh.Keys.autoHideTimer].start();
	}
	let params = this._params;
	if (params && params.indicator) {
		params.indicator.indexNormalize = this.viewport.getChildAt(this.getCurrentItemIndex()).sourceIndexNormalize;
	}
	eui.UIEvent.dispatchUIEvent(this, eui.UIEvent.CHANGE_END);
}
