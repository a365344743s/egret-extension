enum ImageLoaderMode {
	SHOW_ALL,
	NO_BORDER
}

class ImageLoaderCache {
	public static getInstance(): ImageLoaderCache {
		return ImageLoaderCache._instance || (ImageLoaderCache._instance = new ImageLoaderCache());
	}

	public getItem(url: string): egret.BitmapData {
		let item = this._cache[url];
		if (item) {
			return item.data;
		} else {
			return null;
		}
	}

	public setItem(url: string, data: egret.BitmapData): void {
		let size = data.width * data.height * 4;
		let item = {
			url,
			data,
			size
		};
		let old = this._cache[url];
		this._items.push(item);
		this._cache[url] = item;
		this._currentSize += size;
		if (old) {
			for(let i = 0, len = this._items.length;i < len;i++) {
				if (this._items[i] === old) {
					this._items.splice(i, 1);
					break;
				}
			}
			this._currentSize -= old.size;
		}
		while(this._currentSize > this._maxSize) {
			let tmp = this._items.shift();
			delete this._cache[tmp.url];
			this._currentSize -= tmp.size;
		}
	}

	public clearCache(): void {
		this._cache = {};
		this._items.length = 0;
		this._currentSize = 0;
	}

	private constructor() {
	}

	private static _instance: ImageLoaderCache;

	private _cache: {
		[url: string]: {
			url: string,
			data: egret.BitmapData,
			size: number
		}
	} = {};
	private _items: {
		url: string,
		data: egret.BitmapData,
		size: number
	}[] = [];

	private _maxSize = 20 * 1024 * 1024;	//最大缓存容量
	private _currentSize = 0;				//当前缓存容量
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
			this._texDefault = RES.getRes(value.def);
			if (value.stencil) {
				this._texStencil = RES.getRes(value.stencil);
			} else {
				this._texStencil = this._texDefault;
			}
			if (value.url) {
				let url = value.url;
				if (CommonUtil.isLegalHttpUrl(url)) {
					let data = ImageLoaderCache.getInstance().getItem(url);
					if (data) {
						let tex = new egret.Texture();
						tex.bitmapData = data;
						this._texUrl = tex;
					} else {
						let loader:egret.ImageLoader = new egret.ImageLoader();
						loader.crossOrigin = 'anonymous';
						loader.once(egret.Event.COMPLETE, (evt: egret.Event) => {
							ImageLoaderCache.getInstance().setItem(url, loader.data);
							if (!this._data || url !== this._data.url) {
								return;
							}
							let tex = new egret.Texture();
							tex.bitmapData = loader.data;
							this._texUrl = tex;
							this.checkUpdateImage();
						}, this);
						loader.load(url);
					}
				} else {
					this._texUrl = RES.getRes(url);
				}
			}
			this.checkUpdateImage();
		}
	}

	protected childrenCreated(): void {
		this.imgAvatar.mask = this.imgMask;
		super.childrenCreated();
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