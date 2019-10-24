class ScrollerPullRefreshFooter extends ComponentBase {
	public constructor() {
		super();
		this.touchEnabled = false;
		this.touchChildren = false;
	}

	public set state(value: ScrollerPullRefresh.FooterState) {
		if (this._state !== value) {
			this._state = value;
			this.invalidateState();
		}
	}

	public onScrollChanged(): void {
	}

	protected getCurrentState(): string {
		switch(this._state) {
			case ScrollerPullRefresh.FooterState.IDLE:
				return 'idle';
			case ScrollerPullRefresh.FooterState.READY:
				return 'ready';
			case ScrollerPullRefresh.FooterState.WORKING:
				return 'working';
			case ScrollerPullRefresh.FooterState.SUCCESS:
				return 'success';
			case ScrollerPullRefresh.FooterState.FAILED:
				return 'failed';
			case ScrollerPullRefresh.FooterState.EMPTY:
				return 'empty';
			default:
				throw new Error('Wrong ScrollerPullRefresh.FooterState:' + this._state);
		}
	}

	private _state: ScrollerPullRefresh.FooterState = ScrollerPullRefresh.FooterState.IDLE;
}