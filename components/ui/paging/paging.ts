/// <amd-module name="paging"/>
import tools = G.tools;
import d = G.d;
interface PG_Config {
    el: HTMLElement,           // 附属容器
    class?: string,               // 样式
    time?: number,             // 耗时
    offset?: number,           // 脚标
    recordTotal?: number,      // 总记录数属性 (非0代表完整型，为0代表简洁型)
    last?: boolean,            // 当recordTotal=0的时候，是否是最后一页
    pageSize?: number,         // 单页条数
    pageOption?: number[],       // 单页条数可选项
    change?: (state : PG_State) => void     // 翻页触发回调
    scroll?: PG_Scroll
}

interface PG_Scroll{
    Container?: HTMLElement,   // 触底滚动条外框
    auto?: boolean,      // 触底加载方式 (true: 自动触底加载，false: 手动点击加载)
    content?: string,     // 触底加载显示提示
    nomore?: string
}
interface PG_State{
    offset : number;
    count : number;
    current : number;
    size : number;
}

export interface PG_Reset {
    offset?: number,           // 脚标
    recordTotal?: number,      // 总记录数属性 (非0代表完整型，为0代表简洁型)
    time?: number,             // 耗时
    last?: boolean,            // 当recordTotal=0的时候，是否是最后一页
    change?: (offset:number, pageSize:number, changePara: any) => void     // 翻页触发回调
}

interface PG_ChangeConfig{
    size: number,       // 每页条数
    current : number,   // 当前页数
    count : number,     // 总页数
    offset : number,    // 当前页数据指针
    last: boolean
}

export class Paging{
    protected pagingConf : PG_Config;
    //protected scrollTime   : number;    // 触底加载辅助计算点击滑动延迟
    protected pageCount    : number;	// 总页数
    protected pageCurrent  : number;    // 当前页数
    protected pageTimeShow : boolean = true;   // 耗时是否显示
    protected draging: boolean= false;  // 拖拽中
    protected pagingWrapper: HTMLDivElement; // 分页控件总dom
    protected pagingContainer: HTMLDivElement; // 分页控件页面区
    protected pagingScroll: HTMLDivElement; // 触底内容区
    protected pagingBottom: HTMLDivElement; // 触底loading
    protected pagingBottomContainer   : HTMLDivElement; // 触底loading内框
    protected pagingContainerHeight: number;  //触底内容可视区高
    protected pagingLoading: HTMLDivElement;  // loading动画
    protected pagingPullCaption: HTMLDivElement;  // 触底加载内容区
    protected pagingPullBtn: HTMLElement; // 手动加载按钮
    protected pagingStatus: boolean= true;   // 触底加载状态，true：未加载，false：加载中


    protected eventClickName: string; // 点击事件名称
    protected pageHTML = {
        wrapper     : '<div class="pagingWrapper mini"></div>',
        totalText   : `共{{totalText}}条`,
        recordTotal : `<span class="pagingTotal">{{recordTotal}}</span>`,
        option      : `<span class="pagingOption">{{option}}</span>`,
        container   : `<span class="pagingContainer"></span>`,
        prev        : '<a class="pagingPrev{disabled}" href="#" title="上一页" data-index="prev">&lt;</a>',
        pageTpl     : '<a class="pagingNumber{disabled}" href="#" title="{title}" data-index="{page}">{page}</a>',
        prev5       : `<a class="pagingNumber pagingPrev5" title="向前5页" data-index="prev5"><em class="dot">...</em><em class="arrow">&lt;&lt;</em></a>`,
        next5       : `<a class="pagingNumber pagingNext5" title="向后5页" data-index="next5"><em class="dot">...</em><em class="arrow">&gt;&gt;</em></a>`,
        next        : '<a class="pagingNext{disabled}" title="下一页" href="#" data-index="next">&gt;</a>',
        elevator    : '<span class="pagingElevator">跳至<input name="pagingElevator" />页</span>',
        timestamp   : '<span class="pagingTime">{{time}}</span>',
        content     : '正在加载',
        nomore      : '没有更多数据了',
        pullLoading : `<div class="pagingBottom">
                           <div class="pagingBottomContainer">
                               <div class="pagingLoading"></div>
                               <div class="pagingPullCaption">{{content}}</div>
                           </div>
                       </div>`,
        pullBtn     : `<div class="pagingBottom">
                           <div class="pagingBottomContainer">
                               <div class="pagingPullCaption"><a href="#" class="pagingPullBtn" title="加载更多">↓ 加载更多</a></div>
                           </div>
                       </div>`
    };
    protected disabled:string = '{disabled}';
    protected disabledClass:string = ' pagingDisabled';
    protected currentClass:string = ' pagingCurrent';
    protected option = {};

    constructor(config: PG_Config) {
        let defaultConf : PG_Config  = {
            el          : null,         // 分页条附属对象
            class       : '',           // 样式
            time        : 0,            // 耗时
            offset      : 0,            // 脚标
            last        : false,        // 是否最后一页
            recordTotal : 0,            // 总记录数属性 (>0代表完整型，为0代表简洁型)
            pageSize 	: 20,			// 单页条数 (默认设置为pageOption第一项)
            pageOption 	: [20, 50, 100],// 单页条数可选项
            scroll      : null,
            change 		: (state : PG_State)=>{} 		// 翻页触发回调
        };


        this.pagingConf = <PG_Config>Object.assign(defaultConf, this.checkConfig(config));

        if(this.pagingConf.scroll) {
            let {content, nomore} = this.pageHTML;
            this.pagingConf.scroll = <PG_Scroll>tools.obj.merge({content, nomore}, this.pagingConf.scroll);
        }

        if(!this.pagingConf.el && this.pagingConf.el.nodeType !== 1) {
            console.error('el is undefined');
            return;
        }

        // this.eventClickName = 'ontouchstart' in document ? 'touchstart': 'click';
        this.eventClickName = 'click';


        this.create();
    }

    private checkConfig(config) {
        if(typeof config.time === 'undefined') {
            this.pageTimeShow = false;
        }
        else {
            this.pageTimeShow = true;
        }
        return config;
    }

    private setDefine(data, key, callback) {
        let self = this;
        self.option[key] = data[key];
        Object.defineProperty(data, key, {
            get() {
                return self.option[key];
            },
            set(newVal) {
                if(self.option[key] !== newVal) {
                    self.option[key] = newVal;
                    callback(newVal, key);
                }
            }
        });
    }


    private init() {
        let conf = this.pagingConf;
        this.pageCount = Math.ceil(conf.recordTotal/conf.pageSize) || 1;
        this.pageCurrent = Math.floor(conf.offset/conf.pageSize)+1;
        /*if(conf.recordTotal === 0 || conf.recordTotal % conf.pageSize != 0) {
            this.pageCount++;
        }*/
    }

    private liteInit() {
        let conf = this.pagingConf;

        this.pageCount = Math.ceil(conf.recordTotal/conf.pageSize) || 1;
        this.pageCurrent = Math.floor(conf.offset/conf.pageSize)+1;
        this.pageCount = Math.max(this.pageCurrent, this.pageCount);
    }
    private scrollInit() {
        let conf = this.pagingConf;

        this.pageCount = Math.ceil(conf.recordTotal/conf.pageSize) || 1;
        this.pageCurrent = Math.floor(conf.offset/conf.pageSize)+1;
    }

    private create() {
        // 初始化参数
        if(this.pagingConf.scroll) {
            this.scrollInit();
            // 触底加载型
            this.createScroll();
            if(!this.pagingConf.scroll.auto) {
                this.createBtnScroll();
            }
        }
        else {
            if(this.pagingConf.recordTotal === 0) {
                // 简洁型
                this.liteInit();
                this.createLite();
            }
            else {
                // 完整型
                this.init();
                this.createFull();
            }
        }
        this.addEvent();
    }

    /**
     * 触底加载
     */
    private createScroll() {
        let conf = this.pagingConf,
            pullLoading= tools.str.parseTpl(this.pageHTML.pullLoading, {content: conf.scroll.content}, false);

        if(conf.scroll.Container) {
            let height;
            height = conf.scroll.Container.offsetHeight;
            this.pagingContainerHeight = height;
            conf.el.style.height = height+'px';
        }
        this.getPagingScroll();
        conf.el.classList.add('pagingBottomWrapper');

        this.pagingBottom          = <HTMLDivElement>d.create(pullLoading);
        this.pagingBottomContainer = <HTMLDivElement>this.pagingBottom.querySelector('.pagingBottomContainer');
        this.pagingLoading         = <HTMLDivElement>this.pagingBottom.querySelector('.pagingLoading');
        this.pagingPullCaption     = <HTMLDivElement>this.pagingBottom.querySelector('.pagingPullCaption');
        conf.el.appendChild(this.pagingBottom);

    }

    // 判断容器内有唯一的dom
    private getPagingScroll() {
        let child = this.pagingConf.el.childNodes,
            len = 0, pagingScroll;
        for(let i=0; i<child.length; i++) {
            if(child[i].nodeType === 1) {
                len++;
                pagingScroll = child[i];
            }
        }
        if(len === 1) {
            pagingScroll.classList.add('pagingScroll');
            this.pagingScroll = pagingScroll;
        }
        else {
            // 容器没有主容器，创建顶层容器pagingScroll
            let item;
            this.pagingScroll = <HTMLDivElement>d.create('<div class="pagingScroll"></div>');
            while(item = this.pagingConf.el.firstChild) {
                this.pagingScroll.appendChild(item);
            }
            this.pagingConf.el.appendChild(this.pagingScroll);
        }
    }
    /**
     * 触底按钮加载
     */
    private createBtnScroll() {
        this.pagingPullBtn = <HTMLDivElement>d.create(this.pageHTML.pullBtn);
        this.pagingPullBtn.style.display = 'block';
        this.pagingPullBtn.style.visibility = 'visible';
        this.pagingBottom.style.display = 'none';
        this.pagingBottom.style.visibility = 'visible';
        this.pagingConf.el.appendChild(this.pagingPullBtn);
    }

    // 触底手动加载事件
    private scrollBtnEvent() {
        let self = this,
            conf = self.pagingConf,
            pagingPullBtn = self.pagingPullBtn,
            pagingBottom = self.pagingBottom;

        // 是否加载中
        self.setDefine(self, 'pagingStatus', (val)=>{
            let loading = self.pagingLoading.style.display,
                caption = self.pagingPullCaption.innerHTML.trim();
            loading !== 'inline-block' && (self.pagingLoading.style.display = 'inline-block');

            console.log('pagingStatus', val);

            if(val === false) {
                caption !== conf.scroll.content && (self.pagingPullCaption.innerHTML = conf.scroll.content);
                pagingBottom.style.display = 'block';
                pagingPullBtn.style.display = 'none';
            }
            else {
                pagingBottom.style.display = 'none';
                pagingPullBtn.style.display = 'block';
            }
        });
        // 是否最后一页
        self.setDefine(conf, 'last', (val)=>{
            let loading = self.pagingLoading.style.display;

            if(val === false) {
                self.pagingPullCaption.innerHTML = conf.scroll.content;
                pagingBottom.style.display = 'none';
                pagingBottom.style.visibility = 'hidden';
                pagingPullBtn.style.display = 'block';
            }
            else {
                loading!=='none' && (self.pagingLoading.style.display = 'none');
                self.pagingPullCaption.innerHTML = conf.scroll.nomore;
                pagingBottom.style.display = 'block';
                pagingBottom.style.visibility = 'visible';
                pagingPullBtn.style.display = 'none';
            }
        });

        // 按钮点击加载
        d.on(pagingPullBtn, this.eventClickName, 'a.pagingPullBtn', (event) => {
            event.preventDefault();
            if(!self.pagingStatus || conf.last) {
                return;
            }
            self.scrollGo();
        });
    }

    // 触底自动加载事件
    private scrollAutoEvent() {
        let self = this,
            conf = self.pagingConf,
            pagingBottom = self.pagingBottom;

        // 是否加载中
        self.setDefine(self, 'pagingStatus', (val)=>{
            let loading = self.pagingLoading.style.display,
                caption = self.pagingPullCaption.innerHTML.trim();
            loading !== 'inline-block' && (self.pagingLoading.style.display = 'inline-block');
            if(val === false) {
                caption !== conf.scroll.content && (self.pagingPullCaption.innerHTML = conf.scroll.content);
                pagingBottom.style.visibility = 'visible';
            }
            else {
                pagingBottom.style.visibility = 'hidden';
            }
        });

        // 是否最后一页
        self.setDefine(conf, 'last', (val)=>{
            let loading = self.pagingLoading.style.display;
            if(val === false) {
                self.pagingPullCaption.innerHTML = conf.scroll.content;
            }
            else {
                loading!=='none' && (self.pagingLoading.style.display = 'none');
                self.pagingPullCaption.innerHTML = conf.scroll.nomore;
                pagingBottom.style.visibility = 'visible';
            }
        });

        //console.log(123);
        if(conf.scroll.Container) {
            d.on(conf.el, 'scroll', self.scrollAutoHandle());
        }
        else {
            d.on(window, 'scroll', self.scrollAutoHandle());
        }

        //d.on(window, 'scroll', self.scrollAutoHandle());
    }


    private scrollAutoHandle() {
        let self = this,
            conf = self.pagingConf;
        return function(event) {
            let scrollTop = document.body.scrollTop | document.documentElement.scrollTop,
                scrollHeight = document.body.scrollHeight | document.documentElement.scrollHeight,
                availHeight = window.screen.availHeight;

            if(!self.pagingStatus || self.pageCurrent>=self.pageCount) {
                return;
            }
            if(conf.scroll.Container) {
                let pagingScrollHeight = self.pagingScroll.offsetHeight;
                if(conf.el.scrollTop > pagingScrollHeight-self.pagingContainerHeight) {
                    self.scrollGo();
                }
            }
            else {
                if(scrollTop+availHeight>scrollHeight-20) {
                    self.scrollGo();
                }
            }

        }
    }

    protected scrollGo() {
        this.pagingStatus = false;
        //this.pagingConf.offset = this.getOffset(this.pageCurrent + 1);
        this.pagingConf.offset += this.pagingConf.pageSize;
        this.scrollInit();
        this.scrollChange();

        /*this.pagingBottom.style.visibility = 'visible';

        this.change(()=>{
            this.pagingStatus = true;
            this.pagingBottom.style.visibility = 'hidden';
        });*/
    }



    /**
     * 分页完整型
     */
    private createFull() {

        this.pagingConf.el.innerHTML = '';
        // wrapper
        this.createPaging.wrapper();
        // 总条数
        this.createPaging.total();
        // 单页条数可选项
        this.createPaging.option();
        // 页码区
        this.createPaging.container();
        // 上一页
        this.createPaging.prev();
        // 下一页
        this.createPaging.next();
        // 页码
        this.createPaging.page();
        // 电梯框
        this.createPaging.elevator();
        // 耗时
        this.createPaging.timestamp();
    }

    /**
     * 分页简洁型
     */
    private createLite() {
        // wrapper
        this.createPaging.wrapper();
        // 页码区
        this.createPaging.container();
        // 上一页
        this.createPaging.prev();
        // 下一页
        this.createPaging.next();
        // 耗时
        this.createPaging.timestamp();
    }

    private createPaging = (function(self) {
        function wrapper() {
            self.pagingWrapper = <HTMLDivElement>d.create(self.pageHTML.wrapper);
            self.pagingConf.el.appendChild(self.pagingWrapper);
            self.pagingConf.class && self.pagingWrapper.classList.add(self.pagingConf.class);
        }
        function total() {
            let totalText = tools.str.parseTpl(self.pageHTML.totalText, {totalText: self.pagingConf.recordTotal.toString()}, false),
                newDom  = tools.str.parseTpl(self.pageHTML.recordTotal, {recordTotal: totalText}, false);
            _append(newDom);
        }
        function option() {
            if(self.pagingConf.pageOption && self.pagingConf.pageOption.length > 0) {
                let newDom:any = ['<select>'];
                for(let item of self.pagingConf.pageOption){
                    newDom.push(`<option value="${item}">${item} 条/页</option>`);
                }
                newDom.push('</select>');
                newDom = tools.str.parseTpl(self.pageHTML.option, {option: newDom.join('')}, false);
                newDom = _append(newDom);
                tools.selVal(newDom.querySelector('select'), self.pagingConf.pageSize);
            }
        }
        function container() {
            self.pagingContainer  = <HTMLDivElement>d.create(self.pageHTML.container);
            self.pagingWrapper.appendChild(self.pagingContainer);
        }
        function prev() {
            let prev = self.pageHTML.prev.replace(self.disabled, self.pageCurrent === 1 ? self.disabledClass: '');
            _appendContainer(prev);
        }
        function next() {
            let next = self.pageHTML.next,
                newDom;
            if(
                (self.pagingConf.recordTotal >0 && self.pageCurrent >= self.pageCount) ||
                (self.pagingConf.recordTotal === 0 && self.pagingConf.last)
            ) {
                next = next.replace(self.disabled, self.disabledClass);
            }
            else {
                next = next.replace(self.disabled, '');
            }
            _appendContainer(next);
        }
        function _append(domStr: string) {
            let newDom  = <HTMLDivElement>d.create(domStr);
            self.pagingWrapper.appendChild(newDom);
            return newDom;
        }
        function _appendContainer(domStr: string) {
            let newDom  = <HTMLDivElement>d.create(domStr);
            self.pagingContainer.appendChild(newDom);
            return newDom;
        }

        function _insertContainer(domStr:string) {
            domStr = domStr.replace(new RegExp(self.disabled, 'g'), '');
            let toInsert = self.pagingContainer.querySelector('.pagingNumber') || self.pagingContainer.lastChild,
                newDom  = <HTMLDivElement>d.create(domStr);
            self.pagingContainer.insertBefore(newDom, toInsert);
        }
        /** 创建页码
         */
        function _appendPage(pages, selected?) {
            if(typeof pages === 'string') {
                _insertContainer(pages);
            }
            else if(pages.length === 1) {
                let DOM = self.pageHTML.pageTpl.replace(/\{page\}/g, pages[0].toString());
                DOM = DOM.replace(/\{title\}/g, pages[0].toString());
                _insertContainer(DOM);
            }
            else if(pages.length === 2) {
                for(let i=pages[1]; i>=pages[0]; i--){
                    let DOM = self.pageHTML.pageTpl.replace(/\{page\}/g, i.toString());
                    DOM = DOM.replace(/\{title\}/g, i.toString());
                    if(i === selected) {
                        DOM = DOM.replace(self.disabled, self.currentClass);
                    }
                    else {
                        DOM = DOM.replace(self.disabled, '');
                    }
                    _insertContainer(DOM);
                }
            }
        }
        // 清除页码
        function cleanPage() {
            if(self.pagingContainer) {
                let pages = self.pagingContainer.querySelectorAll('.pagingNumber');
                Array.prototype.forEach.call(pages, (item, i)=> {
                    self.remove(item);
                });
            }
        }

        function page() {
            let st = 1, ed = self.pageCount, prev5=false, next5=false, endBtn = null, startBtn = null, newDom;

            if(self.pageCount> 10) {
                if(self.pageCurrent<self.pageCount-3){
                    endBtn = self.pageCount;
                    next5 = true;
                }
                if(self.pageCurrent>3){
                    startBtn = 1;
                    if(self.pageCurrent>4) {
                        prev5 = true;
                    }
                }
            }

            if(self.pageCount> 10){
                if(self.pageCurrent<4){
                    st = 1;
                    ed = 5;
                }
                else if(self.pageCurrent>=4 && self.pageCurrent<=(self.pageCount-4)){
                    st = self.pageCurrent-2;
                    ed = self.pageCurrent+2;
                }
                else{
                    st = self.pageCount-4;
                    ed = self.pageCount;
                }
            }

            // 最后一页
            endBtn && _appendPage([endBtn]);
            // 向后5页
            next5 && _appendPage(self.pageHTML.next5);
            // 页码
            _appendPage([st, ed], self.pageCurrent);
            // 向前5页
            prev5 && _appendPage(self.pageHTML.prev5);
            // 第一页
            startBtn && _appendPage([startBtn]);
        }
        function elevator() {
            _append(self.pageHTML.elevator);
        }
        function timestamp() {
            let timeText = self.pagingConf.time.toString() + ' ms';
            _append(tools.str.parseTpl(self.pageHTML.timestamp, {time: timeText }, false));
            if(!self.pageTimeShow) {
                let pagingTime = <HTMLElement>self.pagingWrapper.querySelector('.pagingTime');
                pagingTime.style.display = 'none';
            }
        }
        function checkDisabled() {
            if(!self.pagingConf.scroll) {
                let prevDisabled = self.pageCurrent === 1,
                    nextDisabled = false,
                    pagingPrev = <HTMLElement>self.pagingWrapper.querySelector('.pagingPrev'),
                    pagingNext = <HTMLElement>self.pagingWrapper.querySelector('.pagingNext'),
                    pagingTime = <HTMLElement>self.pagingWrapper.querySelector('.pagingTime'),
                    disabledClass = self.disabledClass.substr(1);
                if ((self.pagingConf.recordTotal > 0 && self.pageCurrent >= self.pageCount) ||
                    (self.pagingConf.recordTotal === 0 && self.pagingConf.last)) {
                    nextDisabled = true;
                }

                if(prevDisabled) {
                    pagingPrev.classList.add(disabledClass);
                }
                else {
                    pagingPrev.classList.remove(disabledClass);
                }
                if(nextDisabled) {
                    pagingNext.classList.add(disabledClass);
                }
                else {
                    pagingNext.classList.remove(disabledClass);
                }

                // 耗时
                if(self.pageTimeShow) {
                    pagingTime.style.display = 'block';
                }
                else {
                    pagingTime.style.display = 'none';
                }
            }
        }
        return { wrapper, total, option, prev, next, container, page, cleanPage, elevator, timestamp, checkDisabled };
    })(this);


    private getOffset(page : number) {
        let offset = (page - 1) * this.pagingConf.pageSize;
        offset < 0 && (offset = 0);

        if(this.pagingConf.recordTotal !== 0 && offset > this.pagingConf.recordTotal) {
            offset = this.pagingConf.recordTotal - this.pagingConf.recordTotal % this.pagingConf.pageSize;
        }
        return offset;
    }

    private addEvent() {
        if(this.pagingConf.scroll) {
            // 触底加载型
            if(this.pagingConf.scroll.auto) {
                // 自动触底加载
                this.scrollAutoEvent();
            }
            else {
                // 手动点击加载
                this.scrollBtnEvent();
            }
        }
        else {
            this.pageEvent.init();
        }
    }

    private pageEvent = (function (self) {
        let timeout;

        function clickHandle(event) {
            event.preventDefault();
            let target = event.target,
                index;

            target = d.closest(target, 'a');

            index = target.dataset.index;
            if( !index || target.classList.contains('pagingCurrent') || target.classList.contains('pagingDisabled') ) {
                return;
            }

            let currentPage : number;
            switch(index) {
                case 'home':
                    currentPage = 1;
                    break;
                case 'prev':
                    currentPage = self.pageCurrent - 1;
                    break;
                case 'next':
                    currentPage = self.pageCurrent + 1;
                    break;
                case 'prev5':
                    currentPage =self.pageCurrent - 5;
                    break;
                case 'next5':
                    currentPage = self.pageCurrent + 5;
                    break;
                case 'last':
                    currentPage = self.pageCount;
                    break;
                default:
                    currentPage = parseInt(index);
            }
            self.pagingConf.offset = self.getOffset(currentPage);
        }

        function selectHandle(event) {
            self.pagingConf.pageSize = parseInt(event.target.value);
            offsetReset();
        }
        function changeHandle(event) {
            let value = event.target.value;
            if(/\d+/.test(value)) {
                value = parseInt(value);
                self.pagingConf.offset = self.getOffset(value);
            }
            else {
                event.target.value = '';
            }
        }

        // 耗时更新
        function timeChange(val) {
            self.pagingWrapper.querySelector('.pagingTime').innerHTML = val.toString() + ' ms';
        }

        function offsetReset() {
            self.pagingConf.offset = 0;
        }

        function recordTotalChange(val) {
            let totalText = tools.str.parseTpl(self.pageHTML.totalText, {totalText: val.toString()}),
                pagingTotal = self.pagingWrapper.querySelector('.pagingTotal');
            pagingTotal && (pagingTotal.innerHTML = totalText);

        }

        // 页码更新
        function pageChange() {
            timeout && clearTimeout(timeout);
            timeout = setTimeout(()=>{
                self.pageReflash();
                self.change();
            }, 10);
        }

        // 添加事件
        function addEvent() {
            if(self.pagingConf.recordTotal !== 0) {
                // 完整型
                d.on(self.pagingWrapper, 'change', 'input', changeHandle);
                if(self.pagingConf.pageOption && self.pagingConf.pageOption.length>0 ) {
                    d.on(self.pagingWrapper, 'change', 'select', selectHandle);
                }
            }
            d.on(self.pagingWrapper, self.eventClickName, 'a', clickHandle);
        }

        function init() {
            addEvent();

            self.setDefine(self.pagingConf, 'time', timeChange);
            self.setDefine(self.pagingConf, 'offset', pageChange);
            self.setDefine(self.pagingConf, 'last', pageChange);
            self.setDefine(self.pagingConf, 'pageSize', (val, key)=>{
                offsetReset();
                pageChange();
            });

            self.setDefine(self.pagingConf, 'recordTotal', (val, key)=>{
                recordTotalChange(val);
                offsetReset();
                pageChange();
            });
        }


        return {
            init,
            addEvent,
            timeChange,
            offsetReset,
            recordTotalChange
        };

    })(this);

    private pageReflash() {
        let self = this;
        if(self.pagingConf.recordTotal === 0) {
            // 简洁型
            self.liteInit();
            self.createPaging.checkDisabled();
        }
        else {
            // 完整型
            self.init();
            self.createFull();
            self.createPaging.cleanPage();
            self.createPaging.page();
            self.createPaging.checkDisabled();
            if(!this.pagingConf.scroll) {
                this.pageEvent.addEvent();
            }
        }
    }

    private change() {
        this.pagingConf.change(<PG_ChangeConfig>{
            size: this.pagingConf.pageSize,
            current : this.pageCurrent,
            count : this.pageCount,
            offset : this.pagingConf.offset,
            last: this.pageCurrent>=this.pageCount? true: false
        });
        // this.pagingConf.change({
        //     pageSize: this.pagingConf.pageSize,
        //     pageCurrent : this.pageCurrent,
        //     pageCount : this.pageCount
        // }, this.changePara);this
    }
    private scrollChange() {
        this.change();
        //
        // this.pagingConf.change(this.pagingConf.offset, this.pagingConf.pageSize, this.changePara, (status=false)=>{
        //     this.pagingStatus = true;
        //     this.pagingConf.last = status;
        // });
    }


    /**
     * 重新设置分页条状态
     * @param {PG_Reset} option
     */
    public reset(option: PG_Reset) {
        this.pagingStatus = true;

        if(option) {
            option = this.checkConfig(option);
            if(this.pagingConf.scroll) {
                for(let i of ['offset', 'recordTotal', 'time', 'last', 'change']) {
                    typeof option[i]!='undefined' && (this.pagingConf[i] = option[i]);
                }
                this.scrollInit();
            }
            else {
                for(let i of ['offset', 'recordTotal', 'time', 'last', 'change']) {
                    if(typeof option[i]!='undefined') {
                        this.option[i] = option[i];
                        switch(i) {
                            case 'time':
                                this.pageEvent.timeChange(this.option[i]);
                                break;
                            case 'pageSize':
                                this.pageEvent.offsetReset();
                                break;
                            case 'recordTotal':
                                this.pageEvent.recordTotalChange(this.option[i]);
                                //this.option['offset'] = 0;
                                break;
                        }
                    }
                }
                this.pageReflash();
            }
        }

        if(this.pageCurrent>=this.pageCount) {
            this.pagingConf.last = true;
        }
        else {
            this.pagingConf.last = false;
        }
    }

    private remove(dom) {
        if(dom) {
            d.remove(dom);
        }
    }

    /**
     * 销毁分页条
     */
    protected destroy() {
        if(this.pagingWrapper) {
            this.remove(this.pagingWrapper);
            this.pagingWrapper = null;
        }
        if(this.pagingConf.scroll && this.pagingConf.scroll.auto) {
            d.off(this.pagingConf.el, 'scroll', this.scrollAutoHandle);
            //this.pagingConf.el.removeEventListener('scroll', this.scrollAutoHandle);
        }
    }

    /**
     * 翻页方法
     * @param {number} page
     */
    public go(page: number){
        this.pagingConf.offset = this.getOffset(page);
        //this.change();
    }

}


