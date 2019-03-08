/// <amd-module name="Picker"/>

import d = G.d;
import tools = G.tools;
import {ContainCom} from "../../ContainCom";
import {Mask} from "../mask/mask";
import {Button} from "../../general/button/Button";
import {ListData} from "../dropdown/dropdown";
import IComponentPara = G.IComponentPara;
import Component = G.Component;

export interface IPickerListPara extends IComponentPara {
    onSet?: (val, objOfVal) => void;
    onChange?: (obj: { currentIndex: number, currentData: any }) => void;
    isBackground?: boolean; //是否有背景层，默认是
    isOnceDestroy?: boolean;    //是否创建完后立即销毁，默认是
    isShow?: boolean; // 创建时是否显示，默认是;
    className?: string;
    isWatchMsg?: boolean;
}

export class PickerList extends ContainCom {
    static PICKER_LIST_ACTIVE = 'picker-active';
    static BODY_DTPICKER = 'dtpicker-active-for-page';

    static PICKER_LISTS: PickerList[] = [];

    wrapperInit() {
        return <div className="picker-list-wrapper hide">
            <div className="picker-list-header"/>
            {this._body = <div className="picker-list-body"/>}
        </div>;
    }

    protected header: HTMLElement;
    protected msgEl: HTMLElement;
    protected isOnceDestroy: boolean;
    public pickers: objOf<Picker> = {};

    constructor(para: IPickerListPara) {
        super(para);
        PickerList.PICKER_LISTS.push(this);

        this.init(para);
        this.event.on();
        para.className && this.wrapper.classList.add(para.className);
    }

    protected init(para) {
        this.onSet = para.onSet;
        this.onChange = para.onChange;
        this.isOnceDestroy = tools.isEmpty(para.isOnceDestroy) ? true : para.isOnceDestroy;
        this.isBackground = tools.isEmpty(para.isBackground) ? true : para.isBackground;

        this.header = d.query('.picker-list-header', this.wrapper);
        this.initHeader();

        let length = this.childs.filter(child => child instanceof Picker).length;
        if (length > 0) {
            let width = 100 / length;
            this.childs.forEach((child, index) => {
                if (child instanceof Picker) {
                    this.pickers[child.name] = child;
                    child.wrapper.style.width = width + '%';
                    child.on(Picker.EVT_PICK_CHANGE, (val) => {
                        this.isWatchMsg && this.changeMsg();
                        this.onChange && this.onChange({
                            currentIndex: index,
                            currentData: val,
                        });
                    });
                }
            });
        }
        this.isWatchMsg = para.isWatchMsg;

        let isShow = tools.isEmpty(para.isShow) ? true : para.isShow;
        isShow && setTimeout(() => this.show(), 100);
    }

    protected changeMsg() {
        if (this.msgEl) {
            let str = '';
            this.childs.forEach((child) => {
                if (child instanceof Picker) {
                    let value = child.value;
                    value = typeof value === 'object' ? (value as ListItem).text : value;
                    str += value + child.title + ' ';
                }
            });
            this.msgEl.innerText = str;
        }
    }

    protected initHeader() {
        new Button({
            container: this.header,
            content: '取消',
            onClick: () => {
                this.hide();
            }
        });
        new Button({
            container: this.header,
            content: '完成',
            type: 'primary',
            // className: 'pull-right',
            onClick: () => {
                let values = [],
                    objOfValue = {};
                this.childs.forEach((picker, index) => {
                    if (picker instanceof Picker) {
                        values[index] = picker.value;
                        objOfValue[picker.name] = picker.value;
                    }
                });
                this.onSet && this.onSet(values, objOfValue);
                this.hide();
            }
        })
    }

    protected event = (() => {
        let handler;
        return {
            on: () => d.on(this.wrapper, 'touchmove', handler = (ev) => ev.preventDefault()),
            off: () => d.off(this.wrapper, 'touchmove', handler)
        }
    })();

    protected _isWatchMsg: boolean;
    get isWatchMsg() {
        return this._isWatchMsg;
    }

    set isWatchMsg(isWatchMsg: boolean) {
        this._isWatchMsg = isWatchMsg || false;
        if (this._isWatchMsg) {
            this.msgEl = <div className="picker-list-msg"/>;
            this.changeMsg();
            d.after(this.header, this.msgEl);
        } else {
            this.msgEl && d.remove(this.msgEl);
            this.msgEl = null;
        }
    }

    protected mask: Mask;
    protected _isBackground: boolean;
    set isBackground(isBackground: boolean) {
        if (this._isBackground !== isBackground) {
            this._isBackground = isBackground;
            this.mask = Mask.getInstance();
            this.mask.background = isBackground;
            this.mask.addClick(this, () => {
                this.hide();
            });
        }
    }

    get isBackground() {
        return this._isBackground;
    }

    show() {
        PickerList.PICKER_LISTS.forEach((pickList) => pickList !== this && pickList.hide());
        this.mask && (this.mask.wrapper.style.zIndex = '1005');
        this.mask && this.mask.show(this);
        this.wrapper.classList.remove('hide');
        this.wrapper.classList.add(PickerList.PICKER_LIST_ACTIVE);
    }

    hide(isDestroy = false) {
        this.mask && this.mask.hide();
        this.mask && this.mask.wrapper.style.removeProperty('z-index');
        this.wrapper.classList.remove(PickerList.PICKER_LIST_ACTIVE);
        setTimeout(() => {
            this.wrapper.classList.add('hide');
            (this.isOnceDestroy || isDestroy) && this.destroy();
        }, 350);
    }

    protected _onSet: (val, objOfVal) => void;
    set onSet(handler: (val, objOfVal) => void) {
        this._onSet = handler;
    }

    get onSet() {
        return this._onSet;
    }

    protected _onChange: (obj: { currentIndex: number, currentData: any }) => void;
    set onChange(handler: (obj: { currentIndex: number, currentData: any }) => void) {
        if (typeof handler === 'function') {
            this._onChange = tools.pattern.debounce(handler, 200);
        }
    }

    get onChange() {
        return this._onChange;
    }

    destroy() {
        let index = PickerList.PICKER_LISTS.indexOf(this);
        index > -1 && PickerList.PICKER_LISTS.splice(index, 1);
        this.childs.forEach((child: Picker) => {
            if (child instanceof Picker) {
                child.destroy()
            }
        });
        this.event.off();
        super.destroy();
    }
}

export interface IPickerPara extends IComponentPara {
    optionData: ListData; // picker中可选的数据内容
    title?: string; // picker中可选数据对应的小标题
    default?: number; // 默认初始位置，默认0;
    isMulti?: boolean; // 是否可以多选，默认为false
    onChange?: (value) => void;   // 选中数据发生改变时触发
    className?: string;
    onSet?: (val) => void;
    name?: string;
}


export class Picker extends Component {
    // 选中值发生改变是触发的事件
    static EVT_PICK_CHANGE = 'EVENT_PICKER_ITEM_SELECTED';

    // 选中样式
    static PICK_SELECTED = 'picker-selected';
    static PICK_MULTI_SELECTED = 'picker-multi-selected';

    wrapperInit() {
        return <div className="picker-wrapper"/>;
    }

    protected listWrapper: HTMLUListElement;
    protected titleWrapper: HTMLElement;
    protected pickBody: HTMLElement;

    constructor(para: IPickerPara) {
        super(para);
        // 初始化属性
        this.listWrapper = <ul className="picker-list pick-rule"/>;
        this._name = para.name || tools.getGuid();
        this.onChange = para.onChange;
        this.onSet = para.onSet;
        this.title = para.title;
        this.optionData = para.optionData;

        this.pickBody = <div className="pick-body">
            <div className="pick-selected pick-rule"/>
            {this.listWrapper}
        </div>;
        d.append(this.wrapper, this.pickBody);

        this.isMulti = para.isMulti;

        // 添加class样式
        if (tools.isNotEmpty(para.className)) {
            let classList = para.className.split(/\s+/);
            classList.forEach((className) => {
                this.wrapper.classList.add(className);
            });
        }

        let platform = navigator.platform.toLowerCase();
        let userAgent = navigator.userAgent.toLowerCase();
        let isIos = (userAgent.indexOf('iphone') > -1 ||
            userAgent.indexOf('ipad') > -1 ||
            userAgent.indexOf('ipod') > -1) &&
            (platform.indexOf('iphone') > -1 ||
                platform.indexOf('ipad') > -1 ||
                platform.indexOf('ipod') > -1);
        if (isIos) {
            this.listWrapper.style.webkitTransformOrigin = 'center center 89.5px';
            this.listWrapper.style.transformOrigin = 'center center 89.5px';
        }

        // 定位到指定位置
        this.current = typeof para.default === 'number' ? para.default : 0;
        if (this.isMulti) {
            this.options[this.current].classList.add(Picker.PICK_MULTI_SELECTED);
        }

        // 开启事件
        this.event.on();
    }

    protected _name: string;
    get name() {
        return this._name;
    }

    // picker中的可选数据
    protected _optionData: ListData = [];
    set optionData(optionData: ListData) {
        if (optionData !== this._optionData) {
            this._optionData = optionData;
            this.initOption(optionData);
            this.current = this.current === -1 ? 0 : this.current;
        }
    }
    get optionData(){
        return tools.isNotEmpty(this._optionData) ? [...this._optionData] : [];
    }

    // 可选项的dom 数组
    protected _options: HTMLElement[] = [];
    get options() {
        return [...this._options];
    }

    // 设置标题名称
    protected _title = '';
    set title(title: string) {
        title = tools.str.removeHtmlTags(title);
        this._title = title || '';
        if (title) {
            this.titleWrapper = <div className="picker-title"/>;
            this.titleWrapper.innerText = title || '';
            d.prepend(this.wrapper, this.titleWrapper);
        } else {
            this.titleWrapper && d.remove(this.titleWrapper);
            this.titleWrapper = null;
        }
    }

    get title() {
        return this._title;
    }

    // 数据发生改变时触发的事件
    protected _onChange: (value) => void;
    set onChange(onChange: (value) => void) {
        if (typeof onChange === 'function') {
            this._onChange = tools.pattern.debounce(onChange, 200);
        }
    }

    get onChange() {
        return this._onChange;
    }

    // 选中数据发生改变时触发，在非多选情况下与onChange事件一样
    protected _onSet: (value) => void;
    set onSet(onSet: (value) => void) {
        if (typeof onSet === 'function') {
            this._onSet = tools.pattern.debounce(onSet, 200);
        }
    }

    get onSet() {
        return this._onSet;
    }

    // 初始化可选项dom
    protected initOption(options: ListData) {
        let frag = document.createDocumentFragment(),
            deg = 20;
        this._options = [];
        options && options.forEach((itemData, index) => {
            let styles: obj = {
                // webkitTransformOrigin: 'center center -90px',
                // transformOrigin: 'center center -90px',
                webkitTransform: 'translateZ(90px) rotateX(' + -index * deg + 'deg)',
                transform: 'translateZ(90px) rotateX(' + -index * deg + 'deg)',
            };
            styles = {
                webkitTransformOrigin: 'center center',
                transformOrigin: 'center center',
                webkitTransform: 'translateY(' + index * 36 + 'px)',
                transform: 'translateY(' + index * 36 + 'px)',
            };
            let li = <li className="picker-item" data-index={index}>
                {(typeof itemData === 'string' || typeof itemData === 'number') ? itemData : itemData.text}
            </li>;
            for(let key in styles){
                li.style[key] = styles[key];
            }
            this._options.push(li);
            d.append(frag, li);
        });
        this.listWrapper.innerHTML = '';
        d.append(this.listWrapper, frag);
    }

    protected selects: number[] = [];
    protected _isMulti: boolean; // 是否多选
    set isMulti(isMulti) {
        this._isMulti = tools.isEmpty(isMulti) ? false : isMulti;
        if (this._isMulti) {
            this.multiEvent.on();
        } else {
            this.multiEvent.off();
        }
    }

    get isMulti() {
        return this._isMulti;
    }

    protected multiEvent = (() => {
        let handler = () => {
            let selectedEl = this.options[this.current],
                index = parseInt(selectedEl.dataset['index']),
                isSelected = selectedEl.classList.contains(Picker.PICK_MULTI_SELECTED);
            if (isSelected) {
                this.selects.splice(this.selects.indexOf(index), 1);
            } else {
                this.selects.push(index);
            }
            selectedEl.classList.toggle(Picker.PICK_MULTI_SELECTED, !isSelected);

            this.onSet && this.onSet(this.value);
        };
        return {
            on: () => d.on(d.query('.pick-selected', this.pickBody), 'click', handler),
            off: () => d.off(d.query('.pick-selected', this.pickBody), 'click'),
        }
    })();

    protected oldCurrent: number = -1;
    // 当前选中的位置
    protected _current: number = -1;
    set current(current: number) {
        if (typeof current === 'number') {
            this.changePickItem(current);
            this.animator.change(current * 20);
        }
    }

    get current() {
        return this._current;
    }

    setCurrentByValue(value: any) {
        for (let i = 0, len = this.optionData.length; i < len; i++) {
            let itemData = this.optionData[i];
            let val = (typeof itemData === 'string' || typeof itemData === 'number') ? itemData : itemData.value;
            if (value === val) {
                this.current = i;
                break;
            }
        }
    }

    // 获取选中的值
    get value(): ListItem | string | number | ListData {
        let result;
        if (Array.isArray(this._optionData)) {
            if (this.isMulti) {
                result = [];
                this.selects.forEach((index) => {
                    if (index in this._optionData) {
                        let data = this._optionData[index];
                        result.push(data);
                    }
                });
            } else {
                if (this._current in this._optionData) {
                    result = this._optionData[this._current];
                }
            }
        }
        return result || '';
    }

    // current改变时，可视区范围进行改变
    protected changePickItem(change: number) {
        let step = 5,
            length = this._options.length,
            current = this._current;

        change = Math.max(0, change);
        change = Math.min(this._options.length - 1, change);

        for (let i = 0; i < length; i++) {
            this._options[i].classList.remove('visible');
        }

        this.options[current] && this.options[current].classList.remove(Picker.PICK_SELECTED);
        this.options[change] && this.options[change].classList.add(Picker.PICK_SELECTED);


        this._current = change;
        let start = Math.max(0, change - step),
            end = Math.min(length, change + step);
        for (let i = start; i < end; i++) {
            this._options[i].classList.add('visible');
        }

        // 触发事件
        if (this.oldCurrent !== this.current) {
            !this.isMulti && this.onSet && this.onSet(this.value);
            this.onChange && this.onChange(this.value);
            let events = this.eventHandlers[Picker.EVT_PICK_CHANGE];
            tools.isNotEmpty(events) && events.forEach((handler) => {
                handler(this.value, this);
            });
        }
    }

    // 动画管理
    protected animator = (() => {
        return {
            change: (angle: number) => {
                angle = Math.max(-30, angle);
                angle = Math.min(this._options.length * 20 + 10, angle);

                // this.listWrapper.style.webkitTransform = 'perspective(1000px) rotateY(0) rotateX(' + (angle) + 'deg) translateZ(0)';
                // this.listWrapper.style.transform = 'perspective(1000px) rotateY(0) rotateX(' + (angle) + 'deg) translateZ(0)';
                this.listWrapper.style.webkitTransform = `perspective(1000px) translateY(${-angle / 20 * 36}px)`;
                this.listWrapper.style.transform = `perspective(1000px) translateY(${-angle / 20 * 36}px)`;
            },
            ending: (change: number) => {
                let time = 100,
                    length = this.options.length,
                    position = Math.round(change / 20);
                if (change < 0 || change > (length - 1) * 20) {
                    time = 150;
                }
                position = Math.max(0, position);
                position = Math.min(length - 1, position);

                this.listWrapper.style.webkitTransition = time + 'ms ease-out';
                this.listWrapper.style.transition = time + 'ms ease-out';
                this.current = position;
            }
        }
    })();

    // 事件管理
    protected event = (() => {
        let begin = 0;
        let handler = (ev: TouchEvent) => {
            begin = -this._current * 20;
            this.oldCurrent = this.current;
            this.listWrapper.style.removeProperty('transition');
            this.listWrapper.style.removeProperty('-webkit-transition');
            let disY = ev.targetTouches[0].clientY;
            let moveHandler, endHandler;
            d.on(this.pickBody, 'touchmove', moveHandler = (ev) => {
                let deltaY = ev.changedTouches[0].clientY - disY;
                disY = ev.changedTouches[0].clientY;
                begin += deltaY;
                this.changePickItem(Math.round(-begin / 20));
                this.animator.change(-begin);
                return false;
            });
            d.on(this.pickBody, 'touchend', endHandler = () => {
                this.animator.ending(-begin);
                begin = -this._current * 20;

                d.off(this.pickBody, 'touchmove', moveHandler);
                d.off(this.pickBody, 'touchend', endHandler);
            });
        };
        return {
            on: () => {
                d.on(this.pickBody, 'touchstart', handler);
            },
            off: () => {
                d.off(this.pickBody, 'touchstart', handler);
            }
        }
    })();

    destroy() {
        this.event.off();
        this.listWrapper = null;
        this.titleWrapper = null;
        this.pickBody = null;
        super.destroy();
    }
}