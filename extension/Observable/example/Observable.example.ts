/**
 * 示例展示了一个基本用法
 * UserController中gold变化将会通知所有的观察者
 */

enum UserNotify {
    GOLD_CHANGED
}

class UserController extends Observable {
    public static getInstance(): UserController {
        return UserController._instance || (UserController._instance = new UserController());
    }

    public set gold(value: number) {
        if (this._gold === value) {
            return;
        }
        this._gold = value;
        this.notifyObservers({
            notify: UserNotify.GOLD_CHANGED,
            data: value
        });
    }

    public get gold(): number {
        return this._gold;
    }

    private constructor() {
        super();
    }

    private static _instance: UserController;

    private _gold: number = 0;
}

class UserGoldWwatcherA implements IObserver {
    public constructor() {
    }

    public update(o: UserController, arg: {
        notify: UserNotify,
        data: any
    }): void {
        switch(arg.notify) {
            case UserNotify.GOLD_CHANGED:
                console.log("UserGoldWwatcherA: On user gold changed: " + arg.data);
                break;
        }
    }

    public active(): void {
        UserController.getInstance().addObserver(this);
    }

    public deactive(): void {
        UserController.getInstance().removeObserver(this);
    }
}

class UserGoldWwatcherB implements IObserver {
    public constructor() {
    }

    public update(o: UserController, arg: {
        notify: UserNotify,
        data: any
    }): void {
        switch(arg.notify) {
            case UserNotify.GOLD_CHANGED:
                console.log("UserGoldWwatcherB: On user gold changed: " + arg.data);
                break;
        }
    }

    public active(): void {
        UserController.getInstance().addObserver(this);
    }

    public deactive(): void {
        UserController.getInstance().removeObserver(this);
    }
}