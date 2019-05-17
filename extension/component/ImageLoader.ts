enum ImageLoaderMode {
	SHOW_ALL,
	NO_BORDER
}

class ImageLoader extends eui.Component {
	public constructor() {
		super();
		this.skinName = "resource/eui_skins/core/component/ImageLoaderSkin.exml";
	}

	public set mode(value: ImageLoaderMode) {
		this._mode = value;
		this.checkUpdateImage();
	}

	public set data(value: {
		def: string,
		url?: string,
		stencil?: string
	}) {
		this._data = value;
		this.imgMask.source = null;
		this.imgAvatar.source = null;
		this.imgAvatar.scaleX = 1;
		this.imgAvatar.scaleY = 1;
		this._texDefault = null;
		this._texUrl = null;
		this._texStencil = null;
		if (value) {
			if (value.stencil) {
				let stencil = value.stencil;
				eui.getAssets(stencil, (tex: any) => {
					if (!this._data || stencil !== this._data.stencil) {
						return;
					}
					if (!egret.is(tex, "egret.Texture")) {
						return;
					}
					this.setTextureStencil(tex);
				}, this);
			}
			let def = value.def;
			eui.getAssets(def, (tex: any) => {
				if (!this._data || def !== this._data.def) {
					return;
				}
				if (!egret.is(tex, "egret.Texture")) {
					return;
				}
				this.setTextureDefault(tex);
				if (!this._data.stencil) {
					this.setTextureStencil(tex);
				}
			}, this);
			if (value.url) {
				let url = value.url;
				if (CommonUtil.isLegalHttpUrl(url)) {
					let loader:egret.ImageLoader = new egret.ImageLoader();
					loader.crossOrigin = 'anonymous';
					loader.once(egret.Event.COMPLETE, (evt: egret.Event) => {
						if (!this._data || url !== this._data.url) {
							return;
						}
						let tex = new egret.Texture();
						tex.bitmapData = loader.data;
						this.setTextureUrl(tex)
					}, this);
					loader.load(url);
				} else {
					eui.getAssets(url, (tex: any) => {
						if (!this._data || url !== this._data.url) {
							return;
						}
						if (!egret.is(tex, "egret.Texture")) {
							return;
						}
						this.setTextureUrl(tex);
					}, this);
				}
			}
		}
	}

	protected childrenCreated(): void {
		this.imgAvatar.mask = this.imgMask;
		super.childrenCreated();
	}

	private setTextureStencil(tex: egret.Texture): void {
		this._texStencil = tex;
		this.checkUpdateImage();
	}

	private setTextureDefault(tex: egret.Texture): void {
		this._texDefault = tex;
		this.checkUpdateImage();
	}

	private setTextureUrl(tex: egret.Texture): void {
		this._texUrl = tex;
		this.checkUpdateImage();
	}

	private checkUpdateImage(): void {
		if (this._texStencil) {
			if (this._texUrl) {
				this.updateImage(this._texUrl);
			} else {
				if (this._texDefault){
					this.updateImage(this._texDefault);
				}
			}
		}
	}

	private updateImage(res: egret.Texture): void {
		let resStencil: egret.Texture = this._texStencil;
		this.imgMask.source = resStencil;
		let scale: number;
		switch(this._mode) {
			case ImageLoaderMode.SHOW_ALL:
				if (resStencil.textureWidth / resStencil.textureHeight > res.textureWidth / res.textureHeight) {
					scale = resStencil.textureHeight / res.textureHeight;
				} else {
					scale = resStencil.textureWidth / res.textureWidth;
				}
				break;
			case ImageLoaderMode.NO_BORDER:
				if (resStencil.textureWidth / resStencil.textureHeight > res.textureWidth / res.textureHeight) {
					scale = resStencil.textureWidth / res.textureWidth;
				} else {
					scale = resStencil.textureHeight / res.textureHeight;
				}
				break;
			default:
				egret.error("Wrong ImageLoaderMode: " + this._mode);
				break;
		}
		this.imgAvatar.source = res;
		this.imgAvatar.scaleX = scale;
		this.imgAvatar.scaleY = scale;
	}

	private imgAvatar: eui.Image;
	private imgMask: eui.Image;

	private _mode: ImageLoaderMode = ImageLoaderMode.SHOW_ALL;
	private _data: {
		def: string,
		url?: string,
		stencil?: string
	};
	private _texDefault: egret.Texture;
	private _texUrl: egret.Texture;
	private _texStencil: egret.Texture;
}