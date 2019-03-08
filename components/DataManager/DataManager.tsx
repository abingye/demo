/// <amd-module name="DataManager"/>
import {Pagination} from "../navigation/pagination/pagination";
import {ILoadingPara, Loading} from "../ui/loading/loading";
import tools = G.tools;
export type SortType = 'ASC' | 'DESC' | 'NO';

export interface IDataManagerPara {
    loading?: ILoadingPara;  // 加载效果配置
    ajax?: IDataManagerAjax; // ajax配置
    data?: obj[];            //
    page?: IDataManagerPageConf;
    render(start: number, length: number, isRefresh?: boolean); // 渲染函数
    isMb?: boolean;
}
export interface IDataManagerAjax {
    fun(status: IDataManagerAjaxStatus): Promise<{ data: obj[]; total: number; }>; // ajax函数
    auto?: boolean; // 是否初始化时触发ajax
    once?: boolean; // 是否只执行一次ajax
    ajaxData?: obj;
    resetCurrent?: boolean;
    timeout?:number;
}

export interface IDataManagerAjaxStatus {
    current: number;
    pageSize: number;
    isRefresh: boolean;
    sort: [[string, SortType]] // true升序, false降序
    custom: obj;
    timeout?:number;
}
export interface IDataManagerPageConf{
    size: number;
    options?: number[];
    container?: HTMLElement; // pc, 容器， mb: 容器，监听滚动的元素
    isPulldownRefresh?: boolean;
}


export class DataManager {

    private ajax: IDataManagerAjax;

    private pageConf: IDataManagerPageConf;
    protected isMb: boolean;

    private render: (start: number, length: number, isRefresh?: boolean) => void;

    private _serverMode: boolean;
    get serverMode(): boolean {
        return this._serverMode && this.total > this.pageSize;
    }

    constructor(para: IDataManagerPara) {
        // debugger;
        this.isMb = tools.isEmpty(para.isMb) ? tools.isMb : para.isMb;
        this.init(para);
        this.ajax = para.ajax;
        this._ajaxData = para.ajax ? para.ajax.ajaxData : null;
        // this.ftable = para.ftable;
        this.loadingConf = para.loading;
        this.pageConf = para.page;
        this.render = (start, length, isRefresh) => {
            tools.isFunction(para.render) && para.render(start, length, isRefresh);
        };

        this._serverMode = para.ajax && !para.ajax.once;

        if(Array.isArray(para.data)) {
            this.data = para.data;
        }

        // 没有ajax 或者 有ajax并且自动加载时
        if(!this.ajax || this.ajax.auto) {
            this.pageConf ?
                this.pagination.next() :
                this.dataFetch(true).then(() => {
                    this.render(0, this.data.length);
                })
        }
    }

    sortState: [[string, SortType]] = null;

    protected init(para: IDataManagerPara) {

    }
    // 数据获取方法
    private dataFetch(isRefresh = false): Promise<number> {
        let current = this.current,
            ajax = this.ajax,
            once = ajax && ajax.once,
            fun = ajax && ajax.fun,
            pageSize = once ? -1 : this.pageSize,
            timeout = tools.isNotEmpty(ajax && ajax.timeout) ? (ajax.timeout > 0 ? ajax.timeout * 1000 : 30000) : 30000,
            isSetData = isRefresh || this._serverMode && !this.isMb; // 是否重新设置本地数据

        let promise: Promise<number>;
        if(tools.isNotEmpty(ajax) && (isRefresh || (!once || tools.isEmpty(this.data)))) {
            // pc端和刷新时, 开启加载框, 或者没有分页时
            // let hasLoading = tools.isNotEmpty(this.loadingConf) && (!this.isMb || isRefresh || !this.pagination);
            // let loading = hasLoading ? new Loading(this.loadingConf) : null;
            this.loadingShow(isRefresh);
            let sort = this._serverMode ? this.sortState : null,
                custom = this.ajaxData;

            promise = new Promise((resolve, reject) => {
                fun({current, pageSize, isRefresh, sort, custom,timeout})
                    .then(({data, total}) => {
                        if (isSetData) {
                            this.data = data;
                        } else {
                            this.dataAdd(data);
                        }
                        this._total = total;
                        resolve(total);
                    })
                    .catch(() => {
                        reject();
                    })
                    .finally(() => {
                        this.loadingHide();
                        // loading && loading.destroy();
                        // loading = null;
                    })
            })
        }else {
            promise = Promise.resolve(this.data.length)
        }
        return promise;
    }

    onError: () => void;

    private loadingConf: ILoadingPara;
    private _loading: Loading = null;
    loadingShow(isRefresh: boolean) {
        if(tools.isNotEmpty(this.loadingConf) && (!this.isMb || isRefresh || !this.pagination)){
            if(this._loading === null){
                this._loading = new Loading(this.loadingConf);
            }
            this._loading.show();
        }
    }

    loadingHide(){
        this._loading && this._loading.destroy();
        this._loading = null;
    }

    protected _pagination: Pagination = null;
    protected get pagination() {
        if(this.pageConf && !this._pagination){
            let mainWrapper = this.pageConf.container,
                isPulldownRefresh = this.pageConf.isPulldownRefresh || false;
            mainWrapper.classList.add('paging-content');

            this._pagination = new Pagination({
                container: mainWrapper,
                pageSize: this.pageSize,
                pageOptions: this.pageConf.options,
                scroll: this.isMb ? {
                    scrollEl: mainWrapper,
                    isPulldownRefresh: isPulldownRefresh,
                    auto: true,
                    // loadingText?: string,
                    nomoreText: '没有更多数据了',
                } : null,
                onChange: ({current, pageSize, isRefresh}) => {
                    return this.dataFetch(isRefresh)
                        .then((total) => {
                            // console.log({current, pageSize, isRefresh, total});
                            let dataArr = this.data;
                            // 是否创建分页
                            if (this.isMb || this._serverMode) { // 移动端或者服务端模式, 都是全部渲染
                                this.pagination.total = total;
                                this.render(0, (current + 1) * pageSize, isRefresh);
                            } else {
                                isRefresh && (this.pagination.total = total);
                                this.render(current * pageSize, pageSize, isRefresh);
                            }
                            // console.log(this.data);
                        }).catch((e) => {
                            console.log(e);
                            typeof this.onError === 'function' && this.onError();
                        })
                }
            });
        }
        return this._pagination;
    }

    get disabled() {
        return this.pagination && this.pagination.disabled;
    }
    set disabled(frag) {
        this.pagination && (this.pagination.disabled = frag);
    }

    protected _total = -1;
    set total(num: number){
        this.pagination && (this.pagination.total = num);
    }
    get total(){
        return this._total;
    }

    protected _ajaxData:obj = {};
    get ajaxData() {
        return this._ajaxData || {};
    }
    refresh(ajaxData?: obj): Promise<void> {
        this._ajaxData = ajaxData || this._ajaxData;
        return this.pagination ?
            this.pagination.refresh(this.ajax.resetCurrent) :
            this.dataFetch(true).then(() => {
                this.render(0, this.pageSize === -1 ? this.data.length : this.pageSize);
            }).catch(() => {
                typeof this.onError === 'function' && this.onError();
            });
    }

    get current() {
        return this._pagination ? this.pagination.current : 0
    }

    get pageSize() {
        return this._pagination ? this.pagination.pageSize : this.pageConf && this.pageConf.size || -1;
    }

    private _data: obj[] = [];
    protected dataAdd(dataArr: obj[]) {
        if(!Array.isArray(dataArr)) {
            return
        }
        this._data = this._data || [];
        this._data = this._data.concat(dataArr);
    }

    set data(dataArr: obj[]){
        if(!Array.isArray(dataArr)) {
            return
        }
        this._data = dataArr;
    }

    get data() {
        return [...this._data];
    }

    destroy(){
        this._data = [];
        this.render = null;
        this.loadingConf = null;
        this._pagination.destroy();
        this._ajaxData = null;
        this._pagination = null;
    }
}