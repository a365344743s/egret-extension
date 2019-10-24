interface IClear {
	clear(): void;
	readonly isValid: boolean;
}

class ClearBase implements IClear {
	public constructor() {
		this.initializeClearValues();
	}

	private initializeClearValues(): void {
		this._valid = true;
	}

	public clear(): void {
		if (!this._valid) {
			throw new Error("Call clear on an invalid object!");
		}
		this._valid = false;
	}

	public get isValid(): boolean {
		return this._valid;
	}

	private _valid: boolean;
}