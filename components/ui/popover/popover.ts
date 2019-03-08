/// <amd-module name="Popover"/>
import d = G.d;
import IComponentPara = G.IComponentPara;
import Component = G.Component;
import tools = G.tools;
import {Mask} from "../mask/mask";

export interface IPopoverPara extends IComponentPara {
    items: IPopoverItemPara[];
    onClick?: (index: string, content: any) => void; //popover点击事件
    target: HTMLElement; // 点击该元素显示popover
    show?: boolean; //设置默认显示popover与否，默认否   可主动设置show控制popover显示隐藏
    position?: 'auto' | 'up' | 'down' | 'right' | 'left'; // popover方向设置，默认auto  可主动设置方向
    isBackground?: boolean; //遮罩层是否不全透明，默认是
    onClose?: () => void; //popover关闭时触发
    animated?: boolean;//是否出现淡入淡出效果，默认是
    isWatch?: boolean;//是否实时动态改变位置，默认否
}

export interface IPopoverItemPara extends IComponentPara {
    name?: string;
    title: string;//item的内容
    onClick?: Function;//item的点击事件
    disabled?: boolean;//设置item是否不可点击，默认否
    icon?: string;
    index?: string;//设置索引，无需手动设置，设置了也无效
    show?: boolean;
    content?: any;
}

export class Popover extends Component {

    protected target: HTMLElement;
    protected isBackground: boolean;
    protected mask: Mask;
    protected animated: boolean;

    constructor(para: IPopoverPara) {
        super(para);
        this.init(para);
    }

    protected wrapperInit(): HTMLElement {
        //创建popover框
        return d.create(`<div class="popover-wrapper"><div class="arrow"></div><ul class="popover-list"></ul></div>`);
    }

    //初始化popover
    init(para) {
        // this.container = para.container;
        this.onClick = para.onClick;
        this.onClose = para.onClose;
        this.target = para.target;
        this.isWatch = para.isWatch;
        this.animated = tools.isEmpty(para.animated) ? true : para.animated;
        //创建popover框
        // this._wrapper = d.create(`<div class="popover-wrapper"></div>`);
        // let arrow = d.create('<div class="arrow"></div>');
        // let list = d.create('<ul class="popover-list"></ul>');
        // this._wrapper.appendChild(arrow);
        // this._wrapper.appendChild(list);
        this.items = para.items;
        // this.container.appendChild(this._wrapper);
        this.isBackground = para.isBackground;

        this.position = para.position;
        this.events.on();
        this.show = para.show;
        this.wrapper.style.display = 'none';

        if (Popover.popView === null) {
            d.on(document, 'click', (ev) => {
                Popover.popView && (Popover.popView.show = false);
            });
        }
    }

    static popView: Popover = null;
    protected events = ((self) => {
        let click1, click2;
        return {
            on() {
                //点击show
                d.on(self.target, 'click', click1 = (e) => {
                    e.stopPropagation();
                    if (Popover.popView !== self) {
                        Popover.popView && (Popover.popView.show = false);
                    }
                    Popover.popView = self;
                    // e.stopPropagation();
                    // d.off(document, 'click', click);
                    self.show = !self.show;
                    if (self.isWatch && self.show) {
                        self.calcPosition();
                    }
                });
                //点击设置的点击事件
                d.on(self.wrapper, 'click', '.popover-item', click2 = function (e) {
                    // e.stopPropagation();
                    let index: string = d.closest((<HTMLElement>e.target), '[data-index]').dataset.index;
                    typeof self.onClick === 'function' && self.onClick.call(this, index,
                        self.popoverItems[index] ? self.popoverItems[index].content : null);
                });
            },
            off() {
                d.off(self.target, 'click', click1);
                d.off(self.wrapper, 'click', '.popover-item', click2);
            }
        }
    })(this);
    // //绑定事件
    // private clickEventInit() {
    //     let self = this;
    //     //点击show
    //     d.on(self.target, 'click', (e) => {
    //         e.stopPropagation();
    //         self.show = !self.show;
    //         if(self.isWatch && self.show){
    //             self.calcPosition();
    //         }
    //     });
    //     //点击设置的点击事件
    //     d.on(self.wrapper, 'click', '.popover-item',(e) => {
    //         e.stopPropagation();
    //         let index: string = d.closest((<HTMLElement>e.target), '[data-index]').dataset.index;
    //         typeof self.onClick === 'function' && self.onClick(index);
    //     });
    // }

    //popover方向设置
    protected calcPosition() {
        let self = this, target = self.target;
        if (tools.isEmpty(target)) {
            return;
        }
        let width = target.offsetWidth;
        let height = target.offsetHeight;
        let left = target.offsetLeft;
        let top = target.offsetTop;
        if (target.offsetParent) {
            let parent = <HTMLElement>target.offsetParent;

            while (parent) {
                left += parent.offsetLeft;
                top += parent.offsetTop;
                parent = <HTMLElement>parent.offsetParent
            }
        }

        let currentWidth = self.wrapper.offsetWidth;
        let currentHeight = self.wrapper.offsetHeight;
        let arrow: HTMLElement = self.wrapper.querySelector('.arrow');
        let arrowWidth = arrow.offsetWidth;
        let arrowHeight = arrow.offsetHeight;
        let hypotenuse = Math.sqrt(arrowWidth * arrowWidth + arrowHeight * arrowHeight) / 2 - 3;
        let docHeight = document.documentElement.offsetHeight;
        let docWidth = document.documentElement.offsetWidth;
        setPosition(self.position);

        function setPosition(position) {
            arrow.removeAttribute('style');
            arrow.classList.remove('arrow-bottom');
            arrow.classList.remove('arrow-right');
            arrow.classList.remove('arrow-top');
            arrow.classList.remove('arrow-left');
            switch (position) {
                case 'auto':
                    setPosition('down');
                    let b = self.wrapper.offsetTop - (docHeight - currentHeight);
                    if (b > 0) {
                        setPosition('up');
                        let t = self.wrapper.offsetTop;
                        if (t < 0 && Math.abs(t) > b) {
                            setPosition('down');
                        }
                    }
                    if (self.wrapper.offsetLeft > (docWidth - currentWidth)) {
                        let diffVal = self.wrapper.offsetLeft - (docWidth - currentWidth) + 5;
                        self.wrapper.style.left = left + (width / 2) - (currentWidth / 2) - diffVal + 'px';
                        let arrowLeft = currentWidth / 2 - arrowWidth / 2 + diffVal;
                        arrow.style.left = arrowLeft + 'px';
                        if (arrowLeft > (currentWidth - 7 - arrowWidth)) {
                            setPosition('left');
                        }
                    } else if (self.wrapper.offsetLeft < 0) {
                        let diffVal = 0 - self.wrapper.offsetLeft + 5;
                        self.wrapper.style.left = left + (width / 2) - (currentWidth / 2) + diffVal + 'px';
                        let arrowLeft = currentWidth / 2 - arrowWidth / 2 - diffVal;
                        arrow.style.left = arrowLeft + 'px';
                        if (arrowLeft < 7) {
                            setPosition('right');
                        }
                    }
                    break;
                case 'left':
                    self.wrapper.style.top = top + height / 2 - currentHeight / 2 + 'px';
                    self.wrapper.style.left = left - currentWidth - hypotenuse + 'px';
                    arrow.style.top = currentHeight / 2 - arrowHeight / 2 + 'px';
                    arrow.classList.add('arrow-left');
                    break;
                case 'right':
                    self.wrapper.style.top = top + height / 2 - currentHeight / 2 + 'px';
                    self.wrapper.style.left = left + width + hypotenuse + 'px';
                    arrow.style.top = currentHeight / 2 - arrowHeight / 2 + 'px';
                    arrow.classList.add('arrow-right');
                    break;
                case 'up':
                    self.wrapper.style.top = top - currentHeight - hypotenuse + 'px';
                    self.wrapper.style.left = left + (width / 2) - (currentWidth / 2) + 'px';
                    arrow.style.left = currentWidth / 2 - arrowWidth / 2 + 'px';
                    arrow.classList.add('arrow-top');
                    break;
                case 'down':
                    self.wrapper.style.top = top + height + hypotenuse + 'px';
                    self.wrapper.style.left = left + (width / 2) - (currentWidth / 2) + 'px';
                    arrow.style.left = currentWidth / 2 - arrowWidth / 2 + 'px';
                    arrow.classList.add('arrow-bottom');
                    break;
            }
        }
    }

    //添加遮罩层
    protected addBackground() {
        let self = this;
        this.mask = Mask.getInstance();
        this.mask.background = this.isBackground;
        this.mask.addClick(this, () => {
            self.show = false;
        });
        this.mask.show(this);
    }

    //隐藏遮罩层
    protected removeBackground() {
        this.mask.hide();
        typeof this.onClose === 'function' && this.onClose();
    }

    protected _isWatch: boolean = false;
    get isWatch() {
        return this._isWatch;
    }

    set isWatch(isWatch: boolean) {
        if (tools.isNotEmpty(isWatch)) {
            this._isWatch = isWatch;
        }
    }

    protected _onClick: (index: string) => void;
    set onClick(e: (index: string) => void) {
        this._onClick = e;
    }

    get onClick() {
        return this._onClick;
    }

    protected _onClose: () => void;
    set onClose(e: () => void) {
        this._onClose = e;
    }

    get onClose() {
        return this._onClose;
    }

    protected _popoverItems: PopoverItem[] = [];
    get popoverItems() {
        return this._popoverItems;
    }

    protected _items: IPopoverItemPara[] = null;
    get items() {
        return this._items;
    }

    //生成popover每项item
    set items(e: IPopoverItemPara[]) {
        this._items = e;
        let list: HTMLElement = this.wrapper.querySelector('.popover-list');
        this._popoverItems = [];
        for (let i = 0, len = e.length; i < len; i++) {
            let item = e[i];
            item.index = i + '';
            let popoverItem = new PopoverItem({
                title: item.title,
                container: list,
                disabled: item.disabled,
                name: item.name,
                onClick: item.onClick,
                index: item.index,
                icon: item.icon,
                show: item.show
            });
            this._popoverItems.push(popoverItem);
        }
    }

    //添加一项popover的item
    addItem(e: IPopoverItemPara): void {
        let item = e;
        let list: HTMLElement = this.wrapper.querySelector('.popover-list');
        let index = this.items.length;
        item.index = index + '';
        this._items.push({
            title: item.title,
            container: list,
            disabled: item.disabled,
            name: item.name,
            onClick: item.onClick,
            index: item.index,
            icon: item.icon
        });
        let popoverItem = new PopoverItem(this._items[this._items.length - 1]);
        this._popoverItems.push(popoverItem);
        this.calcPosition();
    }

    //删除一项popover的item
    itemRemove(index: number): boolean {
        delete this.items[index];
        let del: boolean = false;
        if (!tools.isEmpty(this._popoverItems[index])) {
            this._popoverItems[index].destroy();
            this.calcPosition();
            del = true;
        }
        delete this._popoverItems[index];
        return del;
    }

    protected _show: boolean;
    get show() {
        return this._show;
    }

    set show(e: boolean) {
        if (!(this._show === e)) {
            this._show = tools.isEmpty(e) ? false : e;
            if (this._show) {
                // this.addBackground();
                this.wrapper.style.display = 'block';
                if (this.animated) {
                    this.wrapper.classList.remove('to-lucency');
                    this.wrapper.classList.add('to-opacity');
                } else {
                    this.wrapper.style.opacity = '1';
                }
            } else {
                // this.removeBackground();
                if (this.animated) {
                    this.wrapper.classList.remove('to-opacity');
                    this.wrapper.classList.add('to-lucency');
                    let timer = setTimeout(() => {
                        this.wrapper.style.display = 'none';
                        clearTimeout(timer);
                    }, 300)
                } else {
                    this.wrapper.style.opacity = '0';
                    this.wrapper.style.display = 'none';
                }
            }
        }
    }

    protected _position: 'auto' | 'up' | 'down' | 'right' | 'left';
    get position() {
        return this._position;
    }

    set position(position: 'auto' | 'up' | 'down' | 'right' | 'left') {
        this._position = tools.isEmpty(position) ? 'auto' : position;
        this.calcPosition();
    }

    // protected triangle = (() => {
    //     let el ;
    //
    //     let setPos = (x, y) => {};
    //
    //     return {setPos};
    //
    // })();
    //
    // protected getTpl(){
    //
    // }
    //销毁popover
    destroy() {
        super.destroy();
        this.events.off();
        this._popoverItems.forEach((item) => {
            if (!tools.isEmpty(item)) {
                item.destroy();
            }
        });
    }
}

//生成popover每项item的类
class PopoverItem extends Component {

    public name: string;
    content: any;

    constructor(protected para: IPopoverItemPara) {
        super(para);
        this.content = para.content;
        this.wrapper.dataset.index = this.para.index;
        this.init();
        this.show = para.show;
    }

    protected wrapperInit(): HTMLElement {
        return d.create(`<li class="popover-item"></li>`, 'ul');
    }

    protected init() {
        let para = this.para;
        // this.container = para.container;
        // this.container.appendChild(this.wrapper);
        this.title = para.title;
        this.name = para.name;
        this.icon = para.icon;
        this.disabled = para.disabled;
        this.onClick = para.onClick;
        d.on(this.wrapper, 'click', tools.pattern.throttling((e) => {
            typeof this.onClick === 'function' && this.onClick(e, this.content);
        }, 1000));
    }

    protected _title: string;
    set title(e: string) {
        this._title = e;
        this.wrapper.innerHTML = this._title;
    }

    get title() {
        return this._title;
    }

    protected _onClick: Function = null;
    set onClick(e) {
        this._onClick = e;
    }

    get onClick() {
        return this._onClick;
    }

    protected _icon: string;
    set icon(e: string) {
        if (tools.isEmpty(this.icon) && !tools.isEmpty(e)) {
            let icon = d.create('<span class="popover-icon ' + e + '"></span>');
            d.prepend(this.wrapper, icon);
        } else if (!tools.isEmpty(e)) {
            let icon = d.create('<span class="popover-icon ' + e + '"></span>');
            d.replace(icon, this.wrapper.firstElementChild);
        }
        this._icon = e;
    }

    get icon() {
        return this._icon;
    }

    protected _disabled: boolean;
    set disabled(e: boolean) {
        this._disabled = tools.isEmpty(e) ? false : e;
        if (this._disabled) {
            this.wrapper.classList.add('disabled');
        } else {
            this.wrapper.classList.remove('disabled');
        }
    }

    get disabled() {
        return this._disabled;
    }

    protected _show: boolean = true;
    get show() {
        return this._show;
    }

    set show(isShow: boolean) {
        if (tools.isNotEmpty(isShow)) {
            this._show = isShow;
            this.wrapper.classList.toggle('hide', !isShow);
        }
    }

}