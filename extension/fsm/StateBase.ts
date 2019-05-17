class StateBase {
	public constructor() {
	}

	public onStateEnter(last: StateBase): void {
	}

	public onStateExit(next: StateBase): void {
	}

	public machine: StateMachine;
}