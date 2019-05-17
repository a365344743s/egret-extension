class TouchScrollerPullRefresh extends eui.sys.TouchScroll {
    /**
     * @private
     * 记录的历史速度的权重列表。
     */
    static VELOCITY_WEIGHTS:number[] = [1, 1.33, 1.66, 2];
    /**
     * @private
     * 当前速度所占的权重。
     */
    static CURRENT_VELOCITY_WEIGHT = 2.33;
    /**
     * @private
     * 最小的改变速度，解决浮点数精度问题。
     */
    static MINIMUM_VELOCITY = 0.02;
    /**
     * @private
     * 当容器自动滚动时要应用的摩擦系数
     */
    static FRICTION = 0.998;
    /**
     * @private
     * 当容器自动滚动时并且滚动位置超出容器范围时要额外应用的摩擦系数
     */
    static EXTRA_FRICTION = 0.95;
    /**
     * @private
     * 摩擦系数的自然对数
     */
    static FRICTION_LOG = Math.log(TouchScrollerPullRefresh.FRICTION);

	public constructor(updateFunction: (scrollPos: number) => void, endFunction: () => void, target: egret.IEventDispatcher) {
		super(updateFunction, endFunction, target);
	}

	public set top(value: number) {
		this._top = value;
	}

	public set bottom(value: number) {
		this._bottom = value;
	}

	public set topEnabled(value: boolean) {
		this._topEnabled = value;
	}

	public update(touchPoint:number, maxScrollValue:number, scrollValue):void {
		// maxScrollValue = Math.max(maxScrollValue, 0);
		this['currentPosition'] = touchPoint;
		this['maxScrollPos'] = maxScrollValue;
		let disMove = this['offsetPoint'] - touchPoint;
		let scrollPos = disMove + scrollValue;
		this['offsetPoint'] = touchPoint;
		let scrollMin = this.getScrollMin(true);
		if (scrollPos < scrollMin) {
			if (!this.$bounces) {
				scrollPos = scrollMin;
			}
			else {
				scrollPos -= disMove * 0.5;
			}
		}
		let scrollMax = this.getScrollMax(maxScrollValue);
		if (scrollPos > scrollMax) {
			if (!this.$bounces) {
				scrollPos = scrollMax;
			}
			else {
				scrollPos -= disMove * 0.5;
			}
		}
		this['currentScrollPos'] = scrollPos;
		this['updateFunction'].call(this['target'], scrollPos);
	}

	public finish(currentScrollPos:number, maxScrollPos:number):void {
		egret.stopTick(this['onTick'], this);
		this['started'] = false;
		let sum = this['velocity'] * TouchScrollerPullRefresh.CURRENT_VELOCITY_WEIGHT;
		let previousVelocityX = this['previousVelocity'];
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
		let scrollMin = this.getScrollMin();
		let scrollMax = this.getScrollMax(maxScrollPos);
		if (absPixelsPerMS > TouchScrollerPullRefresh.MINIMUM_VELOCITY) {
			posTo = currentScrollPos + (pixelsPerMS - TouchScrollerPullRefresh.MINIMUM_VELOCITY) / TouchScrollerPullRefresh.FRICTION_LOG * 2 * this.$scrollFactor;
			if (posTo < scrollMin || posTo > scrollMax) {
				posTo = currentScrollPos;
				while (Math.abs(pixelsPerMS) > TouchScrollerPullRefresh.MINIMUM_VELOCITY) {
					posTo -= pixelsPerMS;
					if (posTo < scrollMin || posTo > scrollMax) {
						pixelsPerMS *= TouchScrollerPullRefresh.FRICTION * TouchScrollerPullRefresh.EXTRA_FRICTION;
					}
					else {
						pixelsPerMS *= TouchScrollerPullRefresh.FRICTION;
					}
					duration++;
				}
			}
			else {
				duration = Math.log(TouchScrollerPullRefresh.MINIMUM_VELOCITY / absPixelsPerMS) / TouchScrollerPullRefresh.FRICTION_LOG;
			}
		}
		else {
			posTo = currentScrollPos;
		}
		if (this['target']["$getThrowInfo"]) {
			let event:eui.ScrollerThrowEvent = this['target']["$getThrowInfo"](currentScrollPos, posTo);
			posTo = event.toPos;
		}
		if (duration > 0) {
			//如果取消了回弹,保证动画之后不会超出边界
			if (!this.$bounces) {
				if (posTo < scrollMin) {
					posTo = scrollMin;
				}
				else if (posTo > scrollMax) {
					posTo = scrollMax;
				}
			}
			this['throwTo'](posTo, duration);
		}
		else {
			this['finishScrolling']();
		}
	}

	private getScrollMin(force: boolean = false): number {
		return force || this._topEnabled ? -this._top : 0;
	}

	private getScrollMax(maxScrollPos: number): number {
		return Math.max(0, maxScrollPos + this._bottom);
	}

	private _top: number = 0;
	private _bottom: number = 0;
	private _topEnabled: boolean = false;
}

TouchScrollerPullRefresh.prototype['finishScrolling'] = function(animation?: eui.sys.Animation): void {
	let hsp = this.currentScrollPos;
	let maxHsp = this.maxScrollPos;
	let hspTo = hsp;
	let scrollMin = this.getScrollMin();
	if (hsp < scrollMin) {
		hspTo = scrollMin;
	}
	let scrollMax = this.getScrollMax(maxHsp);
	if (hsp > scrollMax) {
		hspTo = scrollMax;
	}
	this.throwTo(hspTo, 300);
}