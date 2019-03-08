/// <amd-module name="NewTagsInput"/>

import {FormCom, IFormComPara} from "../basic";
import tools = G.tools;
import d = G.d;
import {Modal} from "../../feedback/modal/Modal";

export interface INewTagsInputPara extends IFormComPara{
    itemValue?: string; // 默认：value
    itemText?: string;  // 默认：text
    confirmKeys?: (string | number)[]; // 自定义确认键，44，即","
    separator?: string; //自定义分隔符，默认:','
    maxTags?: number; // 最大标记数量，默认无
    maxChars?: number; // 标记中字符最大长度，默认无
    allowDuplicates?: boolean; // 是否可以有重复标记，默认false；
}

export class NewTagsInput extends FormCom{
    protected input: HTMLInputElement;

    protected wrapperInit(para: G.IComponentPara): HTMLElement {
        return <div className="tags-input-wrapper">
            <div className="tag-wrapper tag-input-wrapper">
                {this.input = <input className="tag-input" type="text" size="1"/>}
            </div>
        </div>;
    }

    constructor(para: INewTagsInputPara){
        super(para);

        this._separator = para.separator || ',';
        this._itemText = para.itemText || 'text';
        this._itemValue = para.itemValue || 'value';
        this._confirmKeys = tools.isEmpty(para.confirmKeys) ? [13, 188] : para.confirmKeys;
        this._maxTags = tools.isEmpty(para.maxTags) ? -1 : para.maxTags;
        this._maxChars = tools.isEmpty(para.maxChars) ? -1 : para.maxChars;
        this._allowDuplicates = para.allowDuplicates || false;

        this.keyEvent.on();
        this.focusEvent.on();
        this.delEvent.on();
    }

    protected focusEvent = (() => {
        let handler = null;
        return {
            on: () => {
                d.on(this.wrapper, 'click', handler = () => {
                    this.input.focus();
                });
            },
            off: () => {
                d.off(this.wrapper, 'click', handler);
            }
        }
    })();

    protected delEvent = (() => {
        let self = this,
            handler;

        return {
            on: () => {
                d.on(this.wrapper, 'click', '.tag-wrapper .remove', handler = function(e) {
                    e.preventDefault();
                    let label = d.closest(e.target as HTMLElement, '.tag-wrapper'),
                        data = d.data(label);

                    if(data){
                        let index = self.items.indexOf(data);
                        if(index > -1){
                            self.delItem(index);
                        }
                    }
                });
            },
            off: () => {
                d.on(this.wrapper, 'click', '.tag-wrapper .remove', handler);
            }
        }
    })();

    protected keyEvent = (() => {
        let isCreate = false,
            result,
            keyUpHandler, keyDownHandler;
        return {
            on: () => {
                d.on(this.input, 'keydown', keyDownHandler = (e) => {
                    isCreate = false;
                    if(e.keyCode === 8 && this.input.value === ''){
                        e.preventDefault();
                        this.items.length > 0 && this.delItem(this.items.length - 1);
                        return false;
                    }

                    this.input.size = this.input.value.length + 1;
                    if(this.confirmKeys.indexOf(e.key) > -1 || this.confirmKeys.indexOf(e.keyCode) > -1){
                        isCreate = true;
                        e.preventDefault();

                        // if(this.addItem(result)){
                        //     this.input.value = '';
                        //     this.input.size = 1;
                        //     isCreate = true;
                        // }else{
                        //     Modal.toast('长度超过限制，或已存在该标记！');
                        //     this.input.focus();
                        // }
                    }
                });
                d.on(this.input, 'keyup', keyUpHandler = (e) => {
                    // console.log(this.input.value);
                    if(isCreate){
                        let value = this.input.value.replace(/,/g, ''),
                            result = {
                                [this.itemText]: value,
                                [this.itemValue]: value,
                            };
                        if(value === ''){
                            this.input.value = '';
                            this.input.size = 1;
                        }else if(this.addItem(result)){
                            this.input.value = '';
                            this.input.size = 1;
                        }else{
                            let tip = (this.maxChars === -1 ? '' : '标签最大长度' + this.maxChars + '；') +
                                (this.maxTags === -1 ? '' : '最多拥有' + this.maxTags + '个标签；');
                            Modal.toast(tip);
                            this.input.focus();
                        }
                    }
                })
            },
            off: () => {
                d.off(this.input, 'keydown', keyDownHandler);
                d.off(this.input, 'keyup', keyUpHandler);
            }
        }
    })();

    protected _itemValue: string;
    get itemValue(){
        return this._itemValue;
    }

    protected _itemText: string;
    get itemText(){
        return this._itemText;
    }

    protected _confirmKeys: (string | number)[];
    get confirmKeys(){
        return this._confirmKeys;
    }

    protected _separator: string;
    get separator(){
        return this._separator;
    }

    protected _maxTags: number;
    get maxTags(){
        return this._maxTags;
    }

    protected _maxChars: number;
    get maxChars(){
        return this._maxChars;
    }

    protected _allowDuplicates: boolean;
    get allowDuplicates(){
        return this._allowDuplicates;
    }

    protected items: Array<obj> = [];
    protected labels: Array<HTMLElement> = [];

    addItem(obj: obj){
        if(this.maxTags !== -1 && this.items.length >= this.maxTags){
            return false;
        }
        if(this.maxChars !== -1 && obj[this.itemText] && obj[this.itemText].length > this.maxChars){
            return false;
        }
        if(!this.allowDuplicates){
            let index = -1,
                isRepeat = this.items.some((item, i) => {
                    let flag = item[this.itemText] === obj[this.itemText];
                    flag && (index = i);
                    return flag;
                });
            if(isRepeat){
                this.labels[index].style.opacity = "0";
                setTimeout(() => {
                    this.labels[index].style.opacity = "1";
                }, 300);
                return true;
            }
        }

        this.items.push(obj);
        let label = NewTagsInput.initTagLabel(obj[this.itemText]);
        d.data(label, obj);
        d.before(this.input.parentElement, label);
        this.labels.push(label);
        return true;
    }

    delItem(index: number){
        this.items.splice(index, 1);
        let label = this.labels.splice(index, 1)[0];
        d.remove(label);
    }

    get(): string {
        return this.value;
    }

    set(str: string) {
        this.value = str;
    }

    get value() {
        return this.items
            ? this.items.map((item) => item[this.itemValue]).join(this.separator)
            : '';
    }
    set value(str) {
        while(this.labels[0]){
            this.delItem(0);
        }

        let items = str.split(this.separator).filter((item) => {
            if(this.maxChars === -1){
                return true;
            }else{
                return item.length <= this.maxChars;
            }
        }).map((item) => {
            return {
                [this.itemValue]: item,
                [this.itemText]: item,
            }
        });

        items.forEach((item) => {
            this.addItem(item);
        });
    }

    protected static initTagLabel(text){
        return <div className="tag-wrapper tag-label-wrapper">
            <span className="tag-text">{text}</span>
            <a className="remove">
                <i className="sec seclesson-guanbi"/>
            </a>
        </div>
    }

    destroy(){
        this.keyEvent.off();
        this.focusEvent.off();
        this.delEvent.off();
        d.remove(this.input);

        this.labels.forEach((label) => {
            d.remove(label);
        });
        this.input = null;
        this.items = null;
        this.labels = null;
        super.destroy();
    }
}