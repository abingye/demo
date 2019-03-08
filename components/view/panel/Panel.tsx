/// <amd-module name="Panel"/>

import IComponentPara = G.IComponentPara; import Component = G.Component;
import {IButton, Button} from "../../general/button/Button";
import d = G.d;
import tools = G.tools;

export interface IPanelPara extends IComponentPara {
    panelItems: IPanelItemPara[];
    isOpenFirst?: boolean;
    onChange?: (para: {index: number, isSelected: boolean, item: PanelItem}) => void;
}

export interface IPanelItemPara {
    title: string,
    content?: HTMLElement;
    icon?: string,
    disabled?: boolean;
    btn?: IButton[];
}

export class Panel extends Component {
    protected _panelItems: PanelItem[] = [];
    get panelItems(){
        return [...this._panelItems];
    }
    protected selectedIndexes: number[] = [];

    protected wrapperInit(para) {
        return <ul className="panel-wrapper"></ul>;
    }

    constructor(para: IPanelPara) {
        super(para);
        this.onChange = para.onChange;
        this.initPanelItems(para);
        this.event.on();
    }

    protected initPanelItems(para: IPanelPara) {
        para.panelItems.forEach((itemPara, index) => {
            let panelItem = new PanelItem(itemPara);
            this._panelItems.push(panelItem);
            d.append(this.wrapper, panelItem.wrapper);

            panelItem.wrapper.dataset['index'] = index;
            panelItem.onChange = (item) => {
                this.onChange && this.onChange({index, isSelected: item.selected, item});
            };
        });
        let isOpenFirst = tools.isEmpty(para.isOpenFirst) ? true : para.isOpenFirst;
        if(isOpenFirst && this._panelItems[0]){
            this._panelItems[0].selected = true;
            this.selectedIndexes.push(0);
        }
    }

    toggle(flag: boolean){
        this.selectedIndexes.forEach((i) => {
            this._panelItems[i].selected = flag;
        });
    }
    toggleAll(flag: boolean){
        this._panelItems.forEach((item) => {
            item.selected = flag;
        });
    }

    protected event = (() => {
        let clickHandler = (ev) => {
            let li = d.closest(ev.target, '.panel-item-wrapper');
            if(li){
                let index = parseInt(li.dataset['index']);
                let panelItem = this._panelItems[index];
                panelItem.toggle();

                if(panelItem.selected){
                    if(this.selectedIndexes.indexOf(index) === -1){
                        this.selectedIndexes.push(index);
                    }
                }
            }
        };
        let selector = '.panel-item-wrapper:not(.disabled)>.panel-item-title';
        return {
            on: () => {
                d.on(this.wrapper, 'click', selector, clickHandler);
            },
            off: () => {
                d.off(this.wrapper, 'click', selector, clickHandler);
            }
        }
    })();

    protected _onChange: (para: { index: number, isSelected: boolean, item: PanelItem }) => void;
    get onChange() {
        return this._onChange;
    }

    set onChange(handler: (para: { index: number, isSelected: boolean, item: PanelItem }) => void) {
        this._onChange = handler;
    }

    destroy() {
        this.event.off();
        this._panelItems.forEach((item) => {
            item.destroy();
        });
        this._panelItems = null;
        super.destroy();
    }
}

class PanelItem {
    protected _contentEl: HTMLElement;
    get contentEl(){
        return this._contentEl;
    }
    protected titleEl: HTMLElement;
    protected btnGroupEl: HTMLElement;

    protected _wrapper = null;
    get wrapper() {
        if (this._wrapper === null) {
            this._wrapper = <li className="panel-item-wrapper"></li>;
        }
        return this._wrapper;
    }

    constructor(para: IPanelItemPara) {
        this.titleEl = <a href="#" className="panel-item-title"><span>{tools.isNotEmpty(para.title) ? para.title : ''}</span></a>;
        this._contentEl = <div className="panel-item-content"></div>;
        this.btnGroupEl = <div className="panel-item-btn-group"></div>;

        this.content = para.content;
        this.icon = para.icon;
        this.disabled = para.disabled;
        this.initBtnGroup(para.btn);

        d.append(this.wrapper, this.titleEl);
        d.append(this.wrapper, this.btnGroupEl);
        d.append(this.wrapper, this.contentEl);
    }

    protected initBtnGroup(btns: IButton[]){
        btns && btns.forEach((btn) => {
            btn.container = this.btnGroupEl;
            this._btnGroup.push(new Button(btn));
        });
    }

    protected _btnGroup: Button[] = [];
    get btnGroup(){
        return [...this._btnGroup];
    }

    protected iconEl: HTMLElement = null;
    protected set icon(icon) {
        if (tools.isNotEmpty(icon)) {
            this.iconEl && d.remove(this.iconEl);
            this.iconEl = <i className={'iconfont ' + 'icon-' + icon}></i>;
            d.prepend(this.titleEl, this.iconEl);
        }
    }

    protected _content: HTMLElement;
    get content() {
        return this._content;
    }

    set content(content: HTMLElement) {
        if (tools.isNotEmpty(content)) {
            this._content = content;
            d.append(this.contentEl, content);
        }
    }

    protected _disabled: boolean = false;
    get disabled() {
        return this._disabled;
    }
    set disabled(disabled: boolean) {
        if(tools.isNotEmpty(disabled) && !this.selected){
            this._disabled = disabled;
            this.wrapper.classList.toggle('disabled', disabled);
        }

    }

    toggle(){
        this.selected = !this._selected;
    }

    protected _selected: boolean = false;
    get selected() {
        return this._selected;
    }

    set selected(selected: boolean) {
        if(tools.isNotEmpty(selected) && selected !== this._selected && !this.disabled){
            this._selected = selected;
            this.wrapper.classList.toggle('selected', selected);
            this.onChange && this.onChange(this);
        }
    }

    protected _onChange: (item: PanelItem) => void;
    get onChange(){
        return this._onChange;
    }
    set onChange(handler: (item: PanelItem) => void){
        this._onChange = handler;
    }

    destroy(){
        d.remove(this.iconEl);
        d.remove(this.contentEl);
        d.remove(this.titleEl);
        d.remove(this.btnGroupEl);
        d.remove(this.wrapper);

        this._contentEl = null;
        this.titleEl = null;
        this.iconEl = null;
        this.btnGroupEl = null;
        this._wrapper = null;
    }
}