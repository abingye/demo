/// <amd-module name="Pagination"/>
import IComponentPara = G.IComponentPara;
import Component = G.Component;
import {Spinner} from "../../ui/spinner/spinner";
import {Button} from "../../general/button/Button";
import d = G.d;
import tools = G.tools;

interface IPaginationPara extends IComponentPara {
    // current?: number,           // 当前页
    total?: number,             // 总记录数属性  TODO 暂时不支持初始化设置
    pageSize?: number,          // 单页条数
    pageOptions?: number[],      // 单页条数可选项
    onChange: (state: IPaginationState) => Promise<any>;
    scroll?: IPaginationScroll;
}

interface IPaginationScroll {
    scrollEl: HTMLElement,   // 滚动的元素
    isPulldownRefresh?: boolean; // true
    auto?: boolean,          // 触底加载方式 (true: 自动触底加载，false: 手动点击加载)
    loadingText?: string,    // 触底加载显示提示, '点击继续加载...'
    nomoreText?: string,      // 翻页结束文字
    // pageHeight: number; // 每页的长度
}

interface IPagingState {
    current: number;
    pageSize: number;
}

interface IPaginationState extends IPagingState {
    // offset : number;
    // count : number;
    isRefresh: boolean;
}

export class Pagination extends Component {
    protected paginationScrollSpinner: PaginationScrollSpinner;
    protected pageHeight: number;
    protected totalHeight: number;
    protected spinner: Spinner = null;
    protected textEl: HTMLElement;
    protected paging: Paging = null;

    protected wrapperInit(para: IPaginationPara) {
        return tools.isEmpty(para.scroll) ? null : para.scroll.scrollEl;
    };

    constructor(protected para: IPaginationPara) {
        super(tools.isEmpty(para.scroll) ? para : tools.obj.merge(para, {container: para.scroll.scrollEl}));
        // let frag = document.createDocumentFragment();
        // while(this.scrollEl.firstChild){
        //     if(this.scrollEl.firstChild === this.wrapper){
        //         break;
        //     }
        //     frag.appendChild(this.scrollEl.firstChild);
        // }
        // this.wrapper.appendChild(frag);

        this._total = typeof para.total === 'number' ? para.total : -1;
        this._pageSize = para.pageSize || 20;

        this.onChange = para.onChange;

        if (tools.isNotEmpty(para.scroll)) {
            this.wrapper.classList.add('pagination-wrapper');

            this.wrapper.appendChild(this.textEl =
                <p className="pagination-nomore hide">{this.para.scroll.nomoreText || '已无更多'}</p>);

            if (tools.isEmpty(para.scroll.isPulldownRefresh) ? true : para.scroll.isPulldownRefresh) {
                this.paginationScrollSpinner = new PaginationScrollSpinner({
                    scrollEl: this.wrapper,
                    container: this.wrapper,
                    onChange: () => {
                        this.refresh();
                    }
                });
            }

            this.initSpinner();
        } else {
            this.paging = new Paging({
                container: para.container,
                total: para.total,
                pageOption: para.pageOptions,
                pagination: this,
            });
            this._pageSize = this.paging.pageSize;
        }

        this.events.on();

    }

    protected initSpinner() {
        this.spinner && this.spinner.hide();
        this.spinner = new Spinner({
            el: this.wrapper.lastChild as HTMLElement,
            type: 0,
            className: 'pagination-spinner'
        });
        this._isEnd = false;
        this.textEl && this.textEl.classList.add('hide');
    }

    get maxScrollTop(): number {
        let extent = (this.wrapper.firstElementChild as HTMLElement).offsetHeight - this.wrapper.clientHeight - 10;
        extent = isNaN(extent) ? Infinity : extent;
        return extent;
    }

    protected events = ((self) => {
        let autoLoading: boolean,
            loadingBtn: Button,
            isPulldownRefresh: boolean;

        let scrollHandle = function () {
            let scroll = this.scrollTop;
            if (isPulldownRefresh) {
                if (scroll <= 0) {
                    self.paginationScrollSpinner.open();
                } else {
                    self.paginationScrollSpinner.close();
                }
            }
            if (Math.ceil(scroll) >= self.maxScrollTop) {
                if (self.current + 1 < Math.ceil(self.total / self.pageSize)) {
                    if (tools.isNotEmpty(self.spinner) && !self.spinner.isVisible()) {
                        if (autoLoading) {
                            self.next();
                        } else {
                            loadingBtn.isShow = true;
                        }
                    }
                } else {
                    !self.isEnd && (self.isEnd = true);
                }
            }
        };

        return {
            on() {
                if (tools.isNotEmpty(self.para.scroll)) {
                    autoLoading = tools.isEmpty(self.para.scroll.auto) ? true : self.para.scroll.auto;
                    isPulldownRefresh = tools.isEmpty(self.para.scroll.isPulldownRefresh) ?
                        true : self.para.scroll.isPulldownRefresh;
                    if (!autoLoading) {
                        let btnWrapper = <div className="btn-wrapper"/>,
                            loadingText = tools.isEmpty(this.para.scroll.loadingText)
                                ? '点击加载' : this.para.scroll.loadingText;

                        loadingBtn = new Button({
                            container: btnWrapper,
                            content: loadingText,
                            type: 'default',
                            isShow: false,
                            className: 'pagination-btn',
                            onClick: () => {
                                loadingBtn.isShow = false;
                                self.next();
                            }
                        });
                        self.wrapper.appendChild(btnWrapper);
                    }
                }
                if (tools.isEmpty(self.paging)) {
                    if (isPulldownRefresh) {
                        self.paginationScrollSpinner && self.paginationScrollSpinner.open();
                    }
                    d.on(self.wrapper, 'touchmove', scrollHandle);
                }
            },
            off() {
                if (tools.isEmpty(self.paging)) {
                    self.paginationScrollSpinner && self.paginationScrollSpinner.close();
                    d.off(self.wrapper, 'touchmove', scrollHandle);
                }
            }
        }
    })(this);

    private _onChange: (state: IPaginationState) => Promise<any>;

    get onChange() {
        return this._onChange;
    }

    set onChange(e: (state: IPaginationState) => Promise<any>) {
        this._onChange = e;
    }

    private _current: number = -1;

    get current() {
        return this._current;
    }

    set current(num: number) {
        if (tools.isNotEmpty(num)) {
            this._current = num;
            this.changedPage();
        }
    }

    private changedPage(ifRefresh = false) {
        this.paging && this.paging.initItem(this._current);
        return this.onChange({
            current: this._current,
            pageSize: this.pageSize,
            isRefresh: ifRefresh
        }).then((isEnd = false) => {
            if (tools.isEmpty(this.paging)) {
                if (ifRefresh) {
                    this.initSpinner();
                    this.paginationScrollSpinner && this.paginationScrollSpinner.cancel();
                }
                if (isEnd) {
                    this.isEnd = isEnd;
                }
                this.spinner && this.spinner.hide();
                this.totalHeight = this.wrapper.offsetHeight;
            } else {
            }

        }).finally(() => {
        })
    }

    private _pageSize: number = 20;
    get pageSize() {
        return this._pageSize;
    }

    set pageSize(num: number) {
        if (this._pageSize !== num && num > 0) {
            this._pageSize = num;
            this.refresh();
        }
    }

    protected _disabled: boolean = false;
    get disabled() {
        return this._disabled;
    }

    set disabled(frag: boolean) {
        frag = !!frag;
        if (frag !== this._disabled) {
            this._disabled = frag;
            if (this.para) {
                if (tools.isEmpty(this.para.scroll)) {
                    this.paging && (this.paging.disabled = frag);
                } else {
                    frag ? this.events.off() : this.events.on();
                }
            }
        }
    }

    private _isEnd: boolean = false;

    get isEnd() {
        return this._isEnd;
    }

    set isEnd(flag: boolean) {
        this._isEnd = flag;
        if (this._isEnd) {
            this.spinner && this.spinner.hide();
            this.textEl && this.textEl.classList.remove('hide');
            this.spinner = null;
        }
    }

    private _total: number = -1;

    get total() {
        return this._total;
    }

    set total(num: number) {
        this._total = tools.isEmpty(num) ? this._total : num;
        this.paging && (this.paging.total = this._total);
        tools.isEmpty(this.paging) && this.spinner === null && this.initSpinner();
    }

    refresh(reset = true) {
        (reset || this._current === -1) && (this._current = 0);
        return this.changedPage(true);
    }

    next() {
        this.spinner && this.spinner.hide();
        this.spinner && this.spinner.show();
        this._current += 1;
        // if(this._current === 0) {
        //     this.paging && this.paging.refresh();
        // }else{
        //     this.paging && (this.paging.current = this.current);
        // }
        return this.changedPage(this._current === 0);
    }

    destroy() {
        this.events.off();
        if (tools.isEmpty(this.paging)) {
            d.remove(this.textEl);
            this.spinner && this.spinner.hide();
            this.paginationScrollSpinner && this.paginationScrollSpinner.destroy();
            this.wrapper.classList.remove('pagination-wrapper');
            this.paginationScrollSpinner = null;
            this.spinner = null;
        } else {
            this.paging.destroy();
        }
    }

    // prev(){
    //     if(this.current > 0){
    //         this.current -= 1;
    //         return true;
    //     }else{
    //         return false;
    //     }
    // }

}

interface IPageScrollSpinner {
    scrollEl?: HTMLElement;
    color?: string;
    onChange?: () => void;
    container?: HTMLElement;
}

class PaginationScrollSpinner {
    events = (function (self) {
        let isMove = false,
            handler = null;
        let panstart = () => {
                if (isMove) {
                    isMove = false;
                    window.cancelAnimationFrame(self.animated.config.id);
                    window.cancelAnimationFrame(self.animated.config.id2);
                    self.animated.config.translate = 0;
                    self.animated.config.endOnce = true;
                    self.animated.config.isMove = false;
                    self.wrapper.style.display = 'none';
                }
            },
            panmove = (ev: IDefinedEvent) => {
                self.animated.move(ev.deltaY);
                isMove = true;
            },
            panend = () => {
                if (isMove) {
                    let duration = self.animated.config.translate / 4;
                    if (self.animated.config.isMove && self.animated.config.translate === 120) {
                        self.animated.endAnimated(0, duration, true);
                    } else if (self.animated.config.isMove) {
                        self.animated.endAnimated(0, duration);
                    }
                }
            };
        let pan = (ev) => {
            ev.srcEvent.preventDefault();
            if(!self.isAnimated){
                if (ev.isFirst) {
                    panstart();
                } else if (ev.isFinal) {
                    panend();
                } else {
                    panmove(ev);
                }
            }
        };
        let isAndroid4 = false;
        if(/(Android)/i.test(navigator.userAgent)){
            let andrVersionArr = navigator.userAgent.match(/Android\s*(\d+)/);
            //去除匹配的第一个下标的元素
            let version = andrVersionArr && andrVersionArr[1] ? parseInt(andrVersionArr[1]) : 5;
            isAndroid4 = version <= 4
        }
        return {
            on() {
                d.on(self.scrollEl, 'pandown panstart panend', pan);

                if(!isAndroid4){
                    // d.on(document.body, 'touchmove', handler = (e) => {
                    //     e.preventDefault();
                    // });
                }
            },
            off() {
                d.off(self.scrollEl, 'pandown panstart panend', pan);

                if(!isAndroid4) {
                    // d.off(document.body, 'touchmove', handler);
                }
            }
        }
    })(this);
    protected wrapper: HTMLElement;
    protected canvas: HTMLCanvasElement;
    protected scrollEl: HTMLElement;
    protected isAnimated: boolean = false;
    protected animated = (function (self) {
        let config = {
            translate: 0,
            id: 0,
            id2: 0,
            endOnce: true,
            isMove: false
        };

        function linear(t, b, c, d) {
            return c * t / d + b;
        }

        return {
            config,
            draw(len, isArrow = true, deg = len * 2 / 180 * Math.PI) {
                let cg = self.canvas.getContext('2d');
                let scale = len / 120;
                scale = scale > 3 / 4 ? 3 / 4 : scale;
                cg.clearRect(0, 0, 100, 100);
                cg.save();
                cg.beginPath();
                cg.translate(19, 19);
                cg.rotate(deg);
                cg.strokeStyle = self.color;
                cg.lineWidth = 4;
                cg.moveTo(15, 0);
                for (let i = 0; i < 360 * scale; i++) {
                    cg.lineTo(Math.cos(i / 180 * Math.PI) * 15, Math.sin(i / 180 * Math.PI) * 15);
                }
                cg.stroke();
                if (Math.floor(360 * scale) > 0 && isArrow) {
                    this.createArrow(Math.floor(360 * scale));
                }
                // cg.arc(0, 0, 15, 0, Math.PI * 2 * scale);
                cg.restore();
            },
            createArrow(deg) {
                let cg = self.canvas.getContext('2d');
                cg.beginPath();
                cg.fillStyle = self.color;
                cg.lineWidth = 1;
                cg.moveTo(Math.cos(deg / 180 * Math.PI) * 15, Math.sin(deg / 180 * Math.PI) * 15);
                cg.lineTo(Math.cos(deg / 180 * Math.PI) * 20, Math.sin(deg / 180 * Math.PI) * 20);
                cg.lineTo(Math.cos((deg + 30) / 180 * Math.PI) * 15, Math.sin((deg + 30) / 180 * Math.PI) * 15);
                cg.lineTo(Math.cos(deg / 180 * Math.PI) * 10, Math.sin(deg / 180 * Math.PI) * 10);
                cg.closePath();
                cg.fill()
            },
            move(speed) {
                config.isMove = true;
                self.wrapper.style.display = 'block';
                config.translate += speed;
                config.translate = config.translate >= 120 ? 120 : config.translate;
                config.translate = config.translate < 0 ? 0 : config.translate;
                self.wrapper.style.transform = 'translate3d(0px, ' + config.translate * .9 + 'px, 0px)';
                self.wrapper.style.webkitTransform = 'translate3d(0px, ' + config.translate * .9 + 'px, 0px)';
                self.animated.draw(config.translate);
            },
            endAnimated(t, duration, isRefresh = false) {
                self.isAnimated = true;
                t++;
                let current = linear(t, config.translate, 0 - config.translate, duration);
                self.wrapper.style.transform = 'translate3d(0px, ' + current + 'px, 0px)';
                self.animated.draw(current, false);
                config.id = window.requestAnimationFrame(() => {
                    self.animated.endAnimated(t, duration, isRefresh);
                });
                if ((current <= 80) && config.endOnce && isRefresh) {
                    config.endOnce = false;
                    window.cancelAnimationFrame(config.id);
                    let len = 80, decoration = 1, t2 = 0, deg = len * 2;
                    (function a() {
                        t2++;
                        deg += 6;
                        if (len >= 80) {
                            decoration *= -1;
                        } else if (len <= 30) {
                            decoration *= -1;
                        }
                        len += decoration;
                        self.animated.draw(len, false, deg / 180 * Math.PI);
                        config.id2 = window.requestAnimationFrame(a);
                        if (self._cancel) {
                            self._cancel = false;
                            window.cancelAnimationFrame(config.id2);
                            self.animated.endAnimated(t, duration);
                        }
                    })();
                    self.onChange && self.onChange();
                }
                if (t >= duration) {
                    self.wrapper.style.transform = 'translate3d(0px, 0px, 0px)';
                    window.cancelAnimationFrame(config.id);
                    setTimeout(() => {
                        self.isAnimated = false;
                        self.wrapper.style.display = 'none';
                        config.translate = 0;
                        config.endOnce = true;
                        config.isMove = false;
                    }, 100);
                }
            }
        }
    })(this);
    // }
    protected _cancel = false;

    // protected _scrollEl: HTMLElement;
    // set scrollEl(el: HTMLElement){
    //     if (tools.isEmpty(el)){
    //         this._scrollEl = document.body
    //     }else{
    //         this._scrollEl = el;
    //     }
    // }
    // get scrollEl(){
    //     return this._scrollEl;

    constructor(para: IPageScrollSpinner) {
        this.wrapper = <div className="ball-wapper"></div>;
        this.canvas = <canvas width="50" height="50"></canvas>;
        this.wrapper.appendChild(this.canvas);
        let container = tools.isEmpty(para.container) ? document.body : para.container;
        container.appendChild(this.wrapper);

        if (tools.isEmpty(para.scrollEl)) {
            this.scrollEl = document.body
        } else {
            this.scrollEl = para.scrollEl;
        }
        this.onChange = para.onChange;
        this.color = para.color;

    }

    protected _onOff = false;

    open() {
        if (!this._onOff) {
            this.events.on();
            this._onOff = true;
        }
    }

    close() {
        if (this._onOff) {
            this.wrapper.style.display = 'none';
            this.events.off();
            this._onOff = false;
        }
    }

    protected _disabled: boolean = false;
    get disabled() {
        return this._disabled
    }

    set disable(frag: boolean) {
        if (frag !== this._disabled) {
            this._disabled = frag;
            frag ? this.events.off() : this.events.on();
        }
    }

    protected _onChange: () => void;

    get onChange() {
        return this._onChange;
    }

    set onChange(cb: () => void) {
        this._onChange = cb;
    }

    protected _color: string;

    get color() {
        return this._color;
    }

    set color(val: string) {
        if (tools.isNotEmpty(val)) {
            this._color = val;
        } else {
            this._color = '#007aff';
        }
    }

    cancel() {
        this.isAnimated && (this._cancel = true);
    }

    destroy() {
        this.events.off();
        d.remove(this.wrapper);
    }
}

interface IPagingPara extends IComponentPara {
    pageOption?: number[],       // 单页条数可选项 //单页条数默认为单页条数可选项第一项
    total?: number,      // 总记录数
    mini?: boolean;     // mini 样式
    offset?: number     // 最多显示的按钮数
    pagination: Pagination;
}

export class Paging extends Component {
    protected pagination: Pagination;
    protected items: HTMLElement[] = [];
    protected itemWrapper: HTMLElement; // 上下页按钮及其中间按钮的父级元素
    protected totalEl: HTMLElement; // 显示数据条数的元素
    protected selectEl: HTMLSelectElement; // 选择每页页数的选择框
    protected inputEl: HTMLInputElement; //输入第几页的输入框
    protected prevEl: HTMLElement; // 上一页按钮
    protected nextEl: HTMLElement; // 下一页按钮

    protected wrapperInit(para) {
        return <div className="paging-wrapper"></div>;
    }

    // 创建带页码的点击按钮
    static createItem(index): HTMLElement {
        return <a className="paging-number" title={index} data-index={index}>{index}</a>
    }

    static readonly __DISABLED_CLASS__ = 'paging-disabled'; // 禁用样式class
    static readonly __SELECTED_CLASS__ = 'paging-current';  // 当前页样式class

    static readonly EVT_INDEX_CHANGED = '__EVENT_INDEX_CHANGED__'; // 改变页码时触发的事件名称
    static readonly EVT_PAGE_SIZE_CHANGED = '__EVENT_PAGE_SIZE_CHANGED__'; //改边每一页的页数时触发的事件名称

    constructor(para: IPagingPara) {
        super(para);
        this.pagination = para.pagination;

        this.itemWrapper = <span className="paging-container"></span>;
        this.totalEl = <span className="paging-total">总共0条</span>;
        this.selectEl = <select></select>;
        this.inputEl = <input type="text" name="paging-elevator"/>;
        this.prevEl = <a className="paging-prev paging-disabled" title="上一页" data-index="prev">&lt;</a>;
        this.nextEl = <a className="paging-next" title="下一页" data-index="next">&gt;</a>;

        this.offset = para.offset || 5;
        this.total = para.total;
        this.pageOption = para.pageOption || [100, 200, 500];

        this.wrapper.classList.toggle('mini', tools.isEmpty(para.mini) ? true : para.mini);
        this.init();

        this.event.on();
    }

    // 渲染整个paging控件
    protected init() {
        const selectWrapper = <span className="paging-option"></span>,
            inputWrapper = <span className="paging-elevator">跳至<span
                className="paging-elevator-wrapper"></span>页</span>;

        d.prepend(this.itemWrapper, this.prevEl);
        d.append(this.itemWrapper, this.nextEl);
        this.initItem(0);

        d.append(selectWrapper, this.selectEl);
        d.append(d.query('.paging-elevator-wrapper', inputWrapper), this.inputEl);

        const frag = document.createDocumentFragment();
        d.append(frag, this.totalEl);
        d.append(frag, this.itemWrapper);
        d.append(frag, inputWrapper);
        d.append(frag, selectWrapper);
        d.append(this.wrapper, frag);
    }

    // 渲染页码按钮
    initItem(index: number) {
        let totalPage = Math.ceil(this.total / this.pageSize),
            offset = Math.min(this.offset, totalPage);
        index = Math.min(totalPage - 1, index);
        index = Math.max(0, index);

        for (let item of this.items) {
            tools.isNotEmpty(item) && item.classList.add('hide');
        }

        let center = Math.floor(offset / 2),
            itemIndex = index - center - Math.max(0, index + 1 - (totalPage - center));
        itemIndex = Math.max(0, itemIndex);

        for (let i = 0, len = this.items.length; i < Math.max(offset, len); i++) {
            let item = this.items[i];
            if (i >= totalPage) {
                item && d.remove(item);
                delete this.items[i];
            } else {
                if (item) {
                    item.innerText = itemIndex + i + 1 + '';
                    item.title = itemIndex + i + 1 + '';
                    item.dataset.index = itemIndex + i + 1 + '';
                    item.classList.remove(Paging.__DISABLED_CLASS__)
                } else {
                    let numPag = Paging.createItem(itemIndex + i + 1);
                    this.items[i] = numPag;
                    d.before(this.itemWrapper.lastChild, numPag);
                }
            }
        }
        let selectItem = d.query('.' + Paging.__SELECTED_CLASS__, this.itemWrapper);
        selectItem && selectItem.classList.remove(Paging.__SELECTED_CLASS__);
        this.prevEl.classList.remove(Paging.__DISABLED_CLASS__);
        this.nextEl.classList.remove(Paging.__DISABLED_CLASS__);
        this.inputEl.removeAttribute('disabled');

        if (center === 0) {
            this.items[0] && this.items[0].classList.add(Paging.__SELECTED_CLASS__);
            this.prevEl.classList.add(Paging.__DISABLED_CLASS__);
            this.nextEl.classList.add(Paging.__DISABLED_CLASS__);
            this.inputEl.setAttribute('disabled', 'disabled');
        } else {
            let endIndex = totalPage - 1 - index;
            if (index < center) {
                this.items[index] && this.items[index].classList.add(Paging.__SELECTED_CLASS__);
                index === 0 && this.prevEl.classList.add(Paging.__DISABLED_CLASS__);
            } else if (endIndex < center) {
                let i = offset - endIndex - 1;
                this.items[i] && this.items[i].classList.add(Paging.__SELECTED_CLASS__);
                index + 1 === totalPage && this.nextEl.classList.add(Paging.__DISABLED_CLASS__);
            } else {
                this.items[center] && this.items[center].classList.add(Paging.__SELECTED_CLASS__);
            }
        }

        for (let item of this.items) {
            tools.isNotEmpty(item) && item.classList.remove('hide');
        }
    }

    trigger(type) {
        super.trigger(type, {
            current: this.pagination.current,
            pageSize: this.pageSize,
        });
    }

    protected setCurrent(index) {
        let totalPage = Math.ceil(this.total / this.pageSize);
        index = Math.min(totalPage - 1, index);
        index = Math.max(0, index);
        this.pagination && (this.pagination.current = index);
    }

    // 控制事件
    protected event = ((self) => {
        let enter, blur;

        // 点击按钮时触发的事件
        function itemClick(e: Event) {
            e.preventDefault();
            let index = this.dataset.index;
            if (isNaN(index)) {
                if (index === 'prev') {
                    self.pagination && self.setCurrent(self.pagination.current - 1);
                } else if (index === 'next') {
                    self.pagination && self.setCurrent(self.pagination.current + 1);
                }
            } else {
                self.setCurrent(parseInt(index) - 1);
            }
            self.trigger(Paging.EVT_INDEX_CHANGED);
        }

        // 选择框事件
        function change() {
            let val = parseInt(this.value);
            if (self.pageSize !== val) {
                self.pageSize = val;
            }
        }

        return {
            on() {
                d.on(self.itemWrapper, 'click', 'a:not(.' + Paging.__DISABLED_CLASS__ + '):not(.' + Paging.__SELECTED_CLASS__ + ')', itemClick);
                d.on(self.selectEl, 'change', change);
                d.on(self.inputEl, 'blur', blur = function () {
                    let val = this.value;
                    if (tools.isNotEmpty(val) && !isNaN(val)) {
                        self.setCurrent(parseInt(val) - 1);
                        self.trigger(Paging.EVT_INDEX_CHANGED);
                    }
                    self.inputEl.value = '';
                });
                d.on(self.inputEl, 'keyup', enter = function (ev) {
                    if (ev.keyCode === 13) {
                        self.inputEl.blur();
                    }
                });
            },
            off() {
                d.off(self.itemWrapper, 'click', 'a:not(.' + Paging.__DISABLED_CLASS__ + ')', itemClick);
                d.off(self.selectEl, 'change', change);
                d.off(self.inputEl, 'blur', blur);
                d.off(self.inputEl, 'keyup', enter);
            }
        }
    })(this);

    // 最多显示出来的页码按钮数
    protected offset = 5;

    // 单页条数
    protected _pageSize: number = 50;
    set pageSize(num: number) {
        if (typeof num === 'number' && this._pageSize !== num) {
            this._pageSize = num;
            this.pagination.pageSize = num;

            const handlers = this.eventHandlers[Paging.EVT_PAGE_SIZE_CHANGED];
            handlers && handlers.forEach((item: (state: IPagingState) => void) => {
                typeof item === 'function' && item({
                    current: this.pagination.current,
                    pageSize: this.pageSize,
                });
            });
        }
    }

    get pageSize() {
        return this._pageSize;
    }

    // 总条数
    protected _total: number = 0;
    get total() {
        return this._total;
    }

    set total(total: number) {
        if (total > 0 && this._total !== total) {
            this.totalEl.innerText = '总共' + total + '条';
            this._total = total;
            const selectEl = d.query('.' + Paging.__SELECTED_CLASS__, this.itemWrapper);
            if (selectEl) {
                this.initItem(0);
            } else {
                this.initItem(0);
            }
        }
    }

    // 选择框的单页条数可选项
    protected _pageOption: number[] = null;
    get pageOption() {
        return this._pageOption;
    }

    set pageOption(pageOption: number[]) {
        if (Array.isArray(pageOption) && this._pageOption !== pageOption && pageOption.length > 0) {
            this._pageOption = pageOption;
            const frag = document.createDocumentFragment();
            for (let index of pageOption) {
                frag.appendChild(<option value={index}>{index} 条/页</option>);
            }
            d.setHTML(this.selectEl, '');
            d.append(this.selectEl, frag);
            this._pageSize = pageOption[0];
        }
    }

    get disabled() {
        return this._disabled
    }

    set disabled(frag: boolean) {
        // if(this._disabled !== frag){
        this.selectEl && (this.selectEl.disabled = frag);
        if (frag) {
            this.inputEl && this.inputEl.setAttribute('disabled', 'disabled');
            this.prevEl && this.prevEl.classList.add(Paging.__DISABLED_CLASS__);
            this.nextEl && this.nextEl.classList.add(Paging.__DISABLED_CLASS__);
            this.items && this.items.forEach((item, index) => {
                if (index !== this.pagination.current) {
                    item.classList.add(Paging.__DISABLED_CLASS__);
                }
            });
        } else {
            this.pagination && this.initItem(this.pagination.current);
        }
        // }
    }

    destroy() {
        super.destroy();
        this.event.off();
        this.pagination = null;
        this.items = null;
        this.itemWrapper = null;
        this.totalEl = null;
        this.selectEl = null;
        this.inputEl = null;
        this.prevEl = null;
        this.nextEl = null;
        this._pageOption = null;
    }
}