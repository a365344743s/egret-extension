class ScrollerPullRefreshTest extends LayerBase {
    public constructor() {
        super();
        this.skinName = "resource/eui_skins/test/ScrollerPullRefreshTestSkin.exml";
        this.sphTest = new ScrollerPullRefreshHeader();
        this.sphTest.skinName = 'resource/eui_skins/test/ScrollerPullRefreshHeaderTestSkin.exml';
        this.spfTest = new ScrollerPullRefreshFooter();
        this.spfTest.skinName = 'resource/eui_skins/test/ScrollerPullRefreshFooterTestSkin.exml';
    }

    public reset(): void {
        this.spdTest.reset();
    }

    protected childrenCreated(): void {
        this.spdTest.init({
            header: this.sphTest,
            footer: this.spfTest,
            headerHandler: (object: {
                succ: (data: any[], empty: boolean) => void,
                failed: () => void
            }) => {
                egret.setTimeout(() => {
                    this._page = 0;
                    let data: any[] = [];
                    for(let i = 0;i < this._size;i++) {
                        data.push({
                            text: 'text' + i
                        });
                    }
                    object.succ(data, false);
                }, this, 3000);
            },
            footerHandler: (object: {
                succ: (data: any[], empty: boolean) => void,
                failed: () => void
            }) => {
                egret.setTimeout(() => {
                    this._page++;
                    let data: any[] = [];
                    for(let i = 0;i < this._size;i++) {
                        data.push({
                            text: 'text' + i
                        });
                    }
                    if (this._page === 4) {
                        object.succ(data, true);
                    } else {
                        object.succ(data, false);
                    }
                }, this, 3000);
            }
        });
        super.childrenCreated();
    }

    protected onAddToStage(evt: egret.Event): void {
        egret.setTimeout(() => {
            this._page = 0;
            let data: any[] = [];
            for(let i = 0;i < this._size;i++) {
                data.push({
                    text: 'text' + i
                });
            }
            this.spdTest.setData(data);
        }, this, 3000);
        super.onAddToStage(evt);
    }

    protected onRemoveFromStage(evt: egret.Event): void {
        this.reset();
        super.onRemoveFromStage(evt);
    }

    private spdTest: ScrollerPullRefresh;
    private sphTest: ScrollerPullRefreshHeader;
    private spfTest: ScrollerPullRefreshFooter;
    private lstTest: eui.List;

    private _page: number = -1;
    // private _size: number = 10;
    private _size: number = 2;
}

class ScrollerPullRefreshTestItem extends ItemRenderBase {
    public constructor() {
        super();
        this.skinName = 'resource/eui_skins/test/ScrollerPullRefreshTestItemSkin.exml';
    }

    protected dataChanged(): void {
        this.labTest.text = this.data.text;
    }

    private labTest: eui.Label;
}