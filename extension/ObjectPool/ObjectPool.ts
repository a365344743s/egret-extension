class ObjectPool {

	public getObject(clazz: any, ...data: any[]): IFreeze {
		let result: any;
        let key:string = egret.getQualifiedClassName(clazz);
        let arr:Array<IFreeze> = this._pool[key] ? this._pool[key].objs : null;
        if (arr != null && arr.length) {
            result = arr.shift();
			result.unfreeze();
        }
        else {
            //result = new clazz(data);
			let applyArgs = ([{}]).concat(data || []);
			let f = Function.prototype.bind.apply(clazz, applyArgs);
			result = new f();
        }
        return result;
	}

	public putObject(obj: IFreeze): void {
		let key: string = egret.getQualifiedClassName(obj);
		let pool: {
			maxSize: number,
			objs: IFreeze[]
		} = this._pool[key];
        if (pool == null) {
			pool = {
				maxSize: -1,
				objs: []
			};
			this._pool[key] = pool;
        }
		if (pool.maxSize !== -1) {
			while(pool.objs.length >= pool.maxSize) {
				pool.objs.shift();
			}
		}
		pool.objs.push(obj);
		obj.freeze();
	}

	public clearPool(clazz?: any): void {
		if (clazz) {
			let key: string = egret.getQualifiedClassName(clazz);
			if (this._pool[key]) {
				delete this._pool[key];
			}
		} else {
			this._pool = {};
		}
	}

	public getSize(clazz?: any): number {
		if (clazz) {
			let key: string = egret.getQualifiedClassName(clazz);
			if (this._pool[key]) {
				return this._pool[key].objs.length;
			} else {
				return 0;
			}
		} else {
			let count = 0;
			for (let key in this._pool) {
				count += this._pool[key].objs.length;
			}
		}
	}

	public setMaxSize(size: number, clazz: any): void {
		let key: string = egret.getQualifiedClassName(clazz);
		let pool: {
			maxSize: number,
			objs: IFreeze[]
		} = this._pool[key];
		if (pool == null) {
			pool = {
				maxSize: size,
				objs: []
			}
			this._pool[key] = pool;
		} else {
			pool.maxSize = size;
		}
		if (size !== -1) {
			while(pool.objs.length > pool.maxSize) {
				pool.objs.shift();
			}
		}
	}

	public getMaxSize(clazz: any): number {
		let key: string = egret.getQualifiedClassName(clazz);
		if (this._pool[key]) {
			return this._pool[key].maxSize;
		}
		return -1;
	}

	private constructor() {
	}

	public static getInstance(): ObjectPool {
		if (ObjectPool._instance === null) {
			ObjectPool._instance = new ObjectPool();
		}
		return ObjectPool._instance;
	}

	private static _instance: ObjectPool = null;

	private _pool: any = {};
}