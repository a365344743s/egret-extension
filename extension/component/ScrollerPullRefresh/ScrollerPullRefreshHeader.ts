class ScrollerPullRefreshHeader extends ComponentBase {
	public constructor() {
		super();
		this.touchEnabled = false;
		this.touchChildren = false;
	}

	public set state(value: ScrollerPullRefresh.HeaderState) {
		if (this._state !== value) {
			this._state = value;
			this.invalidateState();
		}
	}

	public onScrollChanged(): void {
	}

	protected getCurrentState(): string {
		switch(this._state) {
			case ScrollerPullRefresh.HeaderState.IDLE:
				return 'idle';
			case ScrollerPullRefresh.HeaderState.READY:
				return 'ready';
			case ScrollerPullRefresh.HeaderState.WORKING:
				return 'working';
			case ScrollerPullRefresh.HeaderState.SUCCESS:
				return 'success';
			case ScrollerPullRefresh.HeaderState.FAILED:
				return 'failed';
			default:
				throw new Error('Wrong ScrollerPullRefresh.HeaderState:' + this._state);
		}
	}

	private _state: ScrollerPullRefresh.HeaderState = ScrollerPullRefresh.HeaderState.IDLE;
}