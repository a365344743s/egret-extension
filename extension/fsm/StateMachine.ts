class StateMachine {
	public constructor(target: any) {
		this._target = target;
	}

	public changeState(state: StateBase): void{
		let last = this._currentState
		let newer = state;
		if (last) {
			last.onStateExit(newer);
		}
		this._currentState = newer;
		if (newer) {
			newer.machine = this;
			newer.onStateEnter(last);
		}
	}

	public getCurrentState(): StateBase {
		return this._currentState;
	}

	public get target(): any {
		return this._target;
	}

	private _currentState: StateBase;
	private _target: any;
}