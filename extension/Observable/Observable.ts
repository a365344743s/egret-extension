interface IObserver {
	update(o: IObservable, arg: any): void;
}

interface IObservable {
	containObserver(value: IObserver): boolean;
	addObserver(value: IObserver): void;
	removeObserver(value: IObserver): void;
	removeObservers(): void;
	countObservers(): number;
	notifyObservers(arg: any): void;
}

class Observable implements IObservable {
	public constructor() {
		this._observers = [];
	}

	public containObserver(value: IObserver): boolean {
		for(let i = 0, len = this._observers.length;i < len;i++) {
			if (this._observers[i] === value) {
				return true;
			}
		}
		return false;
	}

	public addObserver(value: IObserver): void {
		if (!this.containObserver(value)) {
			this._observers.push(value);
		}
	}
	

	public removeObserver(value: IObserver): void {
		for(let i = 0, len = this._observers.length;i < len;i++) {
			if (this._observers[i] === value) {
				this._observers.splice(i, 1);
				break;
			}
		}
	}

	public removeObservers(): void {
        this._observers.length = 0;
    }

	public countObservers(): number {
		return this._observers.length;
    }

	public notifyObservers(arg: any): void {
		let copy = this._observers.concat();
		for(let i = 0, len = copy.length;i < len;i++) {
			copy[i].update(this, arg);
		}
	}

	protected _observers: IObserver[];
}