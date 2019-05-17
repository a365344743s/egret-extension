class RichText extends eui.Component {
	constructor() {
		super();
		this._templete = new egret.TextField();
	}

	/**
	 * 不支持underline, href, target
	 */
	public set data(value: Array<egret.ITextElement | egret.DisplayObject>) {
		if (this._data !== value) {
			this._data = value;
			this.invalidateRichText();
		}
	}

	public set size(value: number) {
		if (this._size !== value) {
			this._size = value;
			this.invalidateRichText();
		}
	}

	public get size(): number {
		return this._size;
	}

	public set textColor(value: number) {
		if (this._textColor !== value) {
			this._textColor = value;
			this._textFields.forEach((textField) => {
				textField.textColor = value;
			});
		}
	}

	public get textColor(): number {
		return this._textColor;
	}

	public set strokeColor(value: number) {
		if (this._strokeColor !== value) {
			this._strokeColor = value;
			this._textFields.forEach((textField) => {
				textField.strokeColor = value;
			});
		}
	}

	public get strokeColor(): number {
		return this._strokeColor;
	}

	public set stroke(value: number) {
		if (this._stroke !== value) {
			this._stroke = value;
			this._textFields.forEach((textField) => {
				textField.stroke = value;
			});
		}
	}

	public get stroke(): number {
		return this._stroke;
	}

	public set bold(value: boolean) {
		if (this._bold !== value) {
			this._bold = value;
			this.invalidateRichText();
		}
	}

	public get bold(): boolean {
		return this._bold;
	}

	public set italic(value: boolean) {
		if (this._italic !== value) {
			this._italic = value;
			this.invalidateRichText();
		}
	}

	public get italic(): boolean {
		return this._italic;
	}

	public set font(value: string) {
		if (this._fontFamily !== value) {
			this._fontFamily = value;
			this.invalidateRichText();
		}
	}

	public get font(): string {
		return this._fontFamily;
	}

	public set textVerticalAlign(value: string) {
		if (this._textVerticalAlign !== value) {
			this._textVerticalAlign = value;
			this.invalidateRichText();
		}
	}

	public get textVerticalAlign(): string {
		return this._textVerticalAlign;
	}

	public set displayObjectVerticalAlign(value: string) {
		if (this._displayObjectVerticalAlign !== value) {
			this._displayObjectVerticalAlign = value;
			this.invalidateRichText();
		}
	}

	public get displayObjectVerticalAlign(): string {
		return this._displayObjectVerticalAlign;
	}

	public set lineSpacing(value: number) {
		if (this._lineSpacing !== value) {
			this._lineSpacing = value;
			this.invalidateRichText();
		}
	}

	public get lineSpacing(): number {
		return this._lineSpacing;
	}

	public set mark(value: string) {
		if (this._mark !== value) {
			this._mark = value;
			this.invalidateRichText();
		}
	}

	public get mark(): string {
		return this._mark;
	}

	$setWidth(value: number): void {
		super.$setWidth(value);
		value = +value;
		let values = this.$UIComponent;
		if (value < 0 || values[eui.sys.UIKeys.width] === value && values[eui.sys.UIKeys.explicitWidth] === value)
			return;
		this.invalidateRichText();
	}

	public set maxWidth(value: number) {
		egret.superSetter(RichText, this, 'maxWidth', value);
		value = +value || 0;
		let values = this.$UIComponent;
		if (value < 0 || values[eui.sys.UIKeys.maxWidth] === value) {
			return;
		}
		this.invalidateRichText();
	}

	protected commitProperties(): void {
		super.commitProperties();
		this.validateRichText();
	}

	protected measure(): void {
		this.validateRichText();
		let measureHeight = 0;
		this._lineHeightArray.forEach((value) => {
			measureHeight += value;
		});
		this.setMeasuredSize(this._templete.textWidth, measureHeight);
	}

	private invalidateRichText(e?: egret.Event): void {
		if (this._invalidateRichText) {
			return;
		}
		this._invalidateRichText = true;
		this.invalidateProperties();
		this.invalidateSize();
	}

	private validateRichText(): void {
		if (this._invalidateRichText) {
			let templete = this._templete;
			templete.width = NaN;
			templete.textFlow = null;
			this._lineHeightArray.length = 0;
			this._textFields.length = 0;
			this._displayObjects.length = 0;
			this.removeChildren();
			let data = this._data;
			if (data && data.length > 0) {
				let textFlow: egret.ITextElement[] = [];
				data.forEach((value) => {
					if (egret.is(value, 'egret.DisplayObject')) {
						this.addChild(value as egret.DisplayObject);
						this._displayObjects.push(value as egret.DisplayObject);
						textFlow.push({
							text: this._mark,
							style: {
								size: (value as egret.DisplayObject).width
							}
						});
					} else {
						textFlow.push(value as egret.ITextElement);
					}
				});
				templete.size = this.size;
				templete.lineSpacing = 0;
				let availableWidth = NaN;
				let values = this.$UIComponent;
				if (!isNaN(values[eui.sys.UIKeys.explicitWidth])) {
					availableWidth = values[eui.sys.UIKeys.explicitWidth];
				}
				else if (values[eui.sys.UIKeys.maxWidth] != 100000) {
					availableWidth = values[eui.sys.UIKeys.maxWidth];
				}
				templete.width = availableWidth;
				templete.textFlow = textFlow;
				let measureIndex = 0; //测量高度的组件序号
				let layoutIndex = 0; //布局的组件序号
				let lineArr:Array<egret.ILineElement> = templete.$getLinesArr2();
				let tY = 0;
				lineArr.forEach((line) => {
					let maxheight = this.size;
					line.elements.forEach((element) => {
						if (element.text === this._mark) {
							maxheight = Math.max(maxheight, this._displayObjects[measureIndex].height);
							measureIndex++;
						} else {
							if (element.style && element.style.size) {
								maxheight = Math.max(maxheight, element.style.size);
							}
						}
					});
					this._lineHeightArray.push(this._lineSpacing + maxheight);
					//开始布局
					let tX = 0;
					line.elements.forEach(element => {
						let component: egret.DisplayObject;
						if (element.text !== this._mark) {
							let textField = new egret.TextField();
							let style = element.style || <egret.ITextStyle>{};
							textField.x = tX;
							textField.y = tY;
							textField.text = element.text;
							textField.width = element.width;
							textField.height = maxheight;
							textField.verticalAlign = this.textVerticalAlign;
							textField.textColor = style.textColor == null ? this._textColor : style.textColor;
							textField.strokeColor = style.strokeColor == null ? this._strokeColor : style.strokeColor;
							textField.size = style.size == null ? this._size : style.size;
							textField.stroke = style.stroke == null ? this._stroke : style.stroke;
							textField.bold = style.bold == null ? this._bold : style.bold;
							textField.italic = style.italic == null ? this._italic : style.italic;
							textField.fontFamily = style.fontFamily || this._fontFamily || egret.TextField.default_fontFamily;
							this._textFields.push(textField);
							component = textField;
							this.addChild(component);
						} else {
							component = this._displayObjects[layoutIndex++];
							component.x = tX;
							switch(this._displayObjectVerticalAlign) {
								case egret.VerticalAlign.TOP:
									component.y = tY;
									break;
								case egret.VerticalAlign.MIDDLE:
									component.y = tY + (maxheight - component.height) / 2;
									break;
								case egret.VerticalAlign.BOTTOM:
									component.y = tY + maxheight - component.height;
									break;
								default:
									egret.error('Unsupport align: ', this._displayObjectVerticalAlign);
									break;
							}
						}
						tX += component.width;
					});
					tY += maxheight + this._lineSpacing;
				});
			}
			this._invalidateRichText = false;
		}
	}

	private _templete: egret.TextField;
	private _data: Array<egret.ITextElement | egret.DisplayObject>;
	private _size: number = 36;
	private _textColor: number = 0xFFFFFF;
	private _strokeColor: number = 0x000000;
	private _stroke: number = 0;
	private _bold: boolean = false;
	private _italic: boolean = false;
	private _fontFamily: string = egret.TextField.default_fontFamily;
	private _lineSpacing: number = 0;
	private _textVerticalAlign: string = egret.VerticalAlign.MIDDLE;
	private _displayObjectVerticalAlign: string = egret.VerticalAlign.MIDDLE;
	private _mark: string = '樂';
	private _lineHeightArray: Array<number> = [];
	private _textFields: egret.TextField[] = [];
	private _displayObjects: egret.DisplayObject[] = [];
	private _invalidateRichText: boolean = false;
}