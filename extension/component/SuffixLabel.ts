class SuffixLabel extends eui.Component {
	public constructor() {
		super();
	}

	public set size(value: number) {
		this._size = value;
		if (this.labContent) {
			this.labContent.size = value;
			this.labContent.height = value;
		}
		if (this.labSuffix) {
			this.labSuffix.size = value;
		}
		this.invalidateSuffix();
	}

	public set suffix(value: string) {
		this._suffix = value;
		if (this.labSuffix) {
			this.labSuffix.text = value;
		}
		this.invalidateSuffix();
	}

	public set text(value: string) {
		this._text = value;
		if (this.labContent) {
			this.labContent.text = value;
		}
		this.invalidateSuffix();
	}

	public set textColor(value: number) {
		this._textColor = value;
		if (this.labContent) {
			this.labContent.textColor = value;
		}
		if (this.labSuffix) {
			this.labSuffix.textColor = value;
		}
	}

	public set stroke(value: number) {
		this._stroke = value;
		if (this.labContent) {
			this.labContent.stroke = value;
		}
		if (this.labSuffix) {
			this.labSuffix.stroke = value;
		}
	}

	public set strokeColor(value: number) {
		this._strokeColor = value;
		if (this.labContent) {
			this.labContent.strokeColor = value;
		}
		if (this.labSuffix) {
			this.labSuffix.strokeColor = value;
		}
	}

	$setWidth(value: number): void {
		super.$setWidth(value);
		this.invalidateSuffix();
	}

	public set maxWidth(value: number) {
		egret.superSetter(SuffixLabel, this, 'maxWidth', value);
		this.invalidateSuffix();
	}

	protected partAdded(partName: string, instance: any): void {
		if (instance === this.labContent) {
			this.labContent.size = this._size;
			this.labContent.height = this._size;
			this.labContent.textColor = this._textColor;
			this.labContent.text = this._text;
			this.labContent.stroke = this._stroke;
			this.labContent.strokeColor = this._strokeColor;
			this.invalidateSuffix();
		} else if (instance === this.labSuffix) {
			this.labSuffix.size = this._size;
			this.labSuffix.textColor = this._textColor;
			this.labSuffix.text = this._suffix;
			this.labSuffix.stroke = this._stroke;
			this.labSuffix.strokeColor = this._strokeColor;
			this.invalidateSuffix();
		}
		super.partAdded(partName, instance);
	}

	protected commitProperties(): void {
		if (this._invalidateSuffix) {
			if (this.labContent && this.labSuffix) {
				this.labContent.maxWidth = 100000;
				(this.parent as eui.Component).validateNow();
				if (this.labContent.textWidth > this.width) {
					this.labSuffix.width = NaN;
					this.labContent.maxWidth = this.width - this.labSuffix.width;
					this.labSuffix.x = this.labContent.width;
					this.labSuffix.visible = true;
				} else {
					this.labSuffix.x = 0;
					this.labSuffix.width = 0;
					this.labSuffix.visible = false;
				}
			}
			this._invalidateSuffix = false;
		}
		super.commitProperties();
	}

	private invalidateSuffix(): void {
		this._invalidateSuffix = true;
		this.invalidateProperties();
	}

	private labContent: eui.Label;
	private labSuffix: eui.Label;

	private _size: number = 10;
	private _textColor: number = 0x989797;
	private _stroke: number = 0;
	private _strokeColor: number = 0x000000;
	private _suffix: string = '...';
	private _text: string = '';
	private _invalidateSuffix: boolean = true;
}