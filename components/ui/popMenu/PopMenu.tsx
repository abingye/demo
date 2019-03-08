/// <amd-module name="PopMenu"/>
import d = G.d;
import IComponentPara = G.IComponentPara; import Component = G.Component;
import tools = G.tools;

interface PopMenuPara {
    arr: string[];

    callback(target: HTMLElement, custom);
}

interface IPopMenuItem {
    text: string;
    icon?: string;

    onClick?();

    children?: IPopMenuItem[];
}

export interface INewPopMenuItem extends IComponentPara{
    title?: string;
    icon?: string;
    content?: obj;
    onClick? (...any):void;
    children?: INewPopMenuItem[];
}

export interface INewPopMenu {
    items?: INewPopMenuItem[];
    container?: HTMLElement;
}

export class NewPopMenuItem extends Component {

    public content: any;

    constructor(para: INewPopMenuItem) {
        super(para);
        this.text = tools.isEmpty(para.title) ? '' : para.title;
        this.icon = tools.isEmpty(para.icon) ? '' : para.icon;
        this.content = tools.obj.merge(para.content, {
            click: tools.isEmpty(para.onClick) ? function () {
            } : para.onClick,
            children: tools.isEmpty(para.children) ? [] : para.children
        })
    }

    // 容器
    protected wrapperInit(para: IComponentPara): HTMLElement {
        return <div className="pop-mbmenu-item fmbitem">
            <div className="pop-mbmenu-textwrapper"></div></div>;
    }

    // 是否可用
    set disabled(disabled: boolean) {
        this._disabled = !!disabled;
        this.wrapper.classList.toggle('nouse', this._disabled);
    }

    get disabled() {
        return this._disabled;
    }

    private _selected: boolean;
    set selected(selected: boolean) {
        if (selected === this._selected) {
            return;
        }
        this._selected = !!selected;
        this.wrapper.classList.toggle('selected', this._selected);
    }

    get selected() {
        return this._selected;
    }

    // 文本
    private _text: string;
    set text(text: string) {
        this._text = text;
        this.textEl && (this.textEl.innerText = text)
    }

    get text() {
        return this._text;
    }

    private _textEl: HTMLElement;
    private get textEl() {
        if (!this._textEl) {
            this._textEl = d.query('.pop-mbmenu-textwrapper', this.wrapper);
        }
        return this._textEl;
    }

    // 图标
    private _icon: string;
    set icon(icon: string) {
        if (icon) {
            if (typeof icon === 'string') {
                this.iconEl.classList.add(...icon.split(' '));
                this._icon = icon;
            }
        } else {
            this._icon && this.iconEl.classList.remove(...this._icon.split(' '));
        }
    }

    get icon() {
        return this._icon;
    }

    private _iconEl?: HTMLElement;
    private get iconEl() {
        if (!this._iconEl) {
            this._iconEl = <i className="pop-mbmenu-icon" data-role="icon"></i>;
            d.before(this.textEl, this._iconEl);
        }
        return this._iconEl;
    }

    destory() {
        d.remove(this.wrapper);
        this._textEl = null;
        this._iconEl = null;
    }
}

export class NewPopMenu extends NewPopMenuItem {
    private _contextMenu: NewPopMenu;
    set contextMenu(menu: NewPopMenu) {
        this._contextMenu = menu;
    }

    get contextMenu() {
        return this._contextMenu;
    }

    private originChildren: INewPopMenuItem[];

    constructor(para: INewPopMenu) {
        super({
            title: '', icon: '', content: {}
        });
        this.container = para.container;
        this.contextMenu = this;
        this.originChildren = para.items;
        this.splitItems(para.items);
        this.setChildren();
        this.show = false;

        d.on(this.wrapper, 'click', '.next-item', (event) => {
            event.stopPropagation();
            let itemWrappers = d.queryAll('.pop-mbmenu-item', this.wrapper),
                index = parseInt(this.wrapper.dataset.index),
                nextIndex = index + 1 >= this.wrapperItemsArr.length ? this.wrapperItemsArr.length - 1 : index + 1;
            if (index !== this.wrapperItemsArr.length - 1) {
                this.wrapper.dataset['index'] = nextIndex + '';
                this.setChildren(nextIndex);
            }
        });
        d.on(this.wrapper, 'click', '.prev-item', (e) => {
            e.stopPropagation();
            let itemWrappers = d.queryAll('.pop-mbmenu-item', this.wrapper),
                index = parseInt(this.wrapper.dataset.index),
                prevIndex = index - 1 < 0 ? 0 : index - 1;
            this.wrapper.dataset['index'] = prevIndex + '';
            this.setChildren(prevIndex);
        });

        d.on(this.wrapper, 'click', '.fmbitem', (event) => {
            event.stopPropagation();
            let fmbitem = d.closest(event.target as HTMLElement, '.fmbitem'),
                index = parseInt(fmbitem.dataset.index),
                item = this.children[index];
            item.selected = true;
            this.onOpen && this.onOpen(item);
        });
    }

    protected wrapperInit() {
        return <div className="pop-mbmenu-wrapper" data-index="0"></div>;
    }

    setChildren(index = 0) {
        this.wrapper.innerHTML = '';
        let items = this.wrapperItemsArr[index];
        if (this.wrapperItemsArr.length === 1) {
            items.forEach((item, i) => {
                i === 0 && item.wrapper.classList.add('leftBorderRadius');
                i === items.length - 1 && item.wrapper.classList.add('rightBorderRadius');
                this.wrapper.appendChild(item.wrapper);
            });
        } else {
            if (index !== 0) {
                let firstPrevBtn = this.prevBtn;
                this.wrapper.appendChild(this.prevBtn);
            }
            items.forEach((item, i) => {
                (index === 0 && i === 0) && item.wrapper.classList.add('leftBorderRadius');
                this.wrapper.appendChild(item.wrapper);
            });
            let lastNextBtn = this.nextBtn;
            if (index === this.wrapperItemsArr.length - 1) {
                lastNextBtn.classList.add('nouse');
            }
            this.wrapper.appendChild(lastNextBtn);
        }
        this.wrapper.appendChild(<div className="arrow"></div>);
        this.setArrowPostiton(this.x);
    }

    private _children: NewPopMenuItem[];
    set children(items: NewPopMenuItem[]) {
        this._children = items;
    }

    get children() {
        if (!this._children) {
            this._children = [];
        }
        return this._children;
    }

    private _show: boolean;
    set show(isShow: boolean) {
        this._show = isShow;
        if (isShow === true) {
            this.splitItems(this.originChildren);
            this.wrapper.dataset['index'] = '0';
            this.setChildren();
            this.wrapper.style.opacity = '1';
            this.wrapper.style.display = 'flex';
            this.wrapper.style.display = '-webkit-flex';
            this.wrapper.style.display = '-webkit-box';
        } else {
            this.wrapper.style.opacity = '0';
            this.wrapper.style.display = 'none';
        }
    }

    get show() {
        return this._show;
    }

    private x: number;

    setPosition(x: number, y: number) {
        this.x = x;
        this.wrapper.style.top = (y - 45) + 'px';
        let x1 = x, width = parseInt(window.getComputedStyle(this.wrapper).width);
        this.wrapperItemsArr.length === 1 ? x1 -= width / 2 : x1 -= 120;
        if (x + 120 > window.innerWidth) {
            x1 = window.innerWidth - width;
            d.query('.arrow', this.wrapper).style.left = (x - x1 - 5) + 'px';
        } else if (x1 < 0) {
            x1 = 0;
            d.query('.arrow', this.wrapper).style.left = (x - 5) + 'px';
        } else {
            d.query('.arrow', this.wrapper).style.left = 'calc(50% - 5px)';
        }
        this.wrapper.style.left = x1 + 'px';
    }

    private setArrowPostiton(x) {
        let x1 = x;
        this.wrapperItemsArr.length === 1 ? x1 -= 50 : x1 -= 120;
        if (x + 120 > window.innerWidth) {
            x1 = window.innerWidth - 240;
            d.query('.arrow', this.wrapper).style.left = (x - x1 - 5) + 'px';
        }
        if (x1 < 0) {
            x1 = 0;
            d.query('.arrow', this.wrapper).style.left = (x - 5) + 'px';
        }
    }

    private _prevBtn: HTMLElement;
    get prevBtn() {
        this._prevBtn = <div className="pop-mbmenu-item prev-item">&lt;</div>;
        return this._prevBtn;
    }

    private _nextBtn: HTMLElement;
    get nextBtn() {
        this._nextBtn = <div className="pop-mbmenu-item next-item">&gt;</div>;
        return this._nextBtn;
    }

    private _wrapperItemsArr: NewPopMenuItem[][];
    get wrapperItemsArr() {
        if (!this._wrapperItemsArr) {
            this._wrapperItemsArr = [];
        }
        return this._wrapperItemsArr;
    }

    set wrapperItemsArr(itemArr: NewPopMenuItem[][]) {
        this._wrapperItemsArr = itemArr;
    }

    splitItems(items) {
        this.children = [];
        this.wrapperItemsArr = [];
        items.forEach((item, index) => {
            item.container = this.wrapper;
            let mbItem = new NewPopMenuItem(item);
            mbItem.wrapper.dataset['index'] = index + '';
            this.children.push(mbItem);
        });
        if (this.children.length <= 3) {
            this.wrapperItemsArr.push(this.children);
        } else {
            this.wrapper.style.width = '240px';
            let arr = this.children.slice(3),
                frontArr = this.children.slice(0, 3),
                len = Math.ceil(arr.length / 3) + 1;
            this.wrapperItemsArr.push(frontArr);
            for (let i = 0; i < len - 1; i++) {
                let itemArr = arr.slice(i * 3, (i + 1) * 3);
                this.wrapperItemsArr.push(itemArr);
            }
        }
    }

    private _onOpen: (node: NewPopMenuItem) => void;
    set onOpen(cb: (node: NewPopMenuItem) => void) {
        this._onOpen = cb;
    }

    get onOpen(): (node: NewPopMenuItem) => void {
        return this._onOpen;
    }

    destory() {
        d.off(this.wrapper);
        d.remove(this.wrapper);
    }
}


export class PopMenu {
    private menuDom: HTMLElement = null;
    private customData: any;

    constructor(para: PopMenuPara) {
        //添加遮罩层
        let cover = <div className="showMenu-cover hide"></div>;

        d.on(cover, 'click', (e) => {
            this.destroy();
            e.stopPropagation();
        });

        //遍历菜单栏
        let div = <div className="showMenu">
            <div className="menus"></div>
            <div className="triangle-down"></div>
        </div>;

        d.append(cover, div);

        document.body.appendChild(cover);
        this.menuDom = cover;

        let ulid = d.query('.menus', div);

        para.arr.forEach(a => {
            let cdiv = document.createElement("div");
            cdiv.innerHTML = a;
            ulid.appendChild(cdiv);
        });

        d.on(ulid, 'click', 'div', (e) => {
            para.callback(e.target as HTMLElement, this.customData);
        })
    }

    /**
     * 显示菜单
     * @param {number} top
     * @param {number} left
     * @param [custom]
     */
    public show(top: number, left: number, custom?) {
        // let odiv = dom;
        this.menuDom.classList.remove('hide');
        this.customData = custom;

        let ulid = d.query('.menus', this.menuDom);

        //跟随元素的中间位置
        let tran = d.query('.triangle-down', this.menuDom),
            menuWidth = ulid.offsetWidth,
            // position = odiv.getBoundingClientRect(),
            // x1 = odiv.offsetWidth / 2,  写在外面
            // x2 = position.left,
            // y1 = position.top,
            // y1 = top,
            // x = left,
            x3 = window.screen.width,
            t = x3 - left;
        //防止元素超出左右边界
        if (t <= menuWidth / 2) {
            ulid.style.left = (x3 - menuWidth) + 'px';
        } else {
            if (left <= menuWidth / 2) {
                ulid.style.left = 0 + 'px';
            }
            else {
                ulid.style.left = (left - menuWidth / 2) + 'px';
            }
        }
        ulid.style.top = (top - 42) + 'px';
        tran.style.left = (left - 8) + 'px';
        tran.style.top = (top - 8) + 'px';

    }

    public hide() {
        this.menuDom.classList.add('hide')
    }

    public destroy() {
        d.remove(this.menuDom);
    }
}