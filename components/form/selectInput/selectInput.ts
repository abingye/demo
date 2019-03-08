/// <amd-module name="SelectInput"/>
import tools = G.tools;
import d = G.d;
import {TextInput, ITextInputBasicPara, ITextInputPara} from "../text/text";
import {DropDown, DropDownPara, ListData, SelectDataPara} from "../../ui/dropdown/dropdown";

export interface ISelectInputPara extends ITextInputBasicPara {
    onSet?(item: ListItem, index?: number): void;
    data?: ListData,
    ajax?: {
        fun?(url, value: string, callback: (data: ListData) => void),
        url?: string;
    };
    useInputVal?: boolean; // get值时是否用input的值
    clickType?: number; // 点击出现下拉框的位置, 0: 整个输入框, 1:下拉图标, 默认下拉图标
    isAdapt?:boolean;
    multi?:boolean;
    multiSplit?:string;
    dropClassName?: string;
    arrowIcon?:string;
    arrowIconPre?:string;
}

export class SelectInput extends TextInput {
    onSet: (item: ListItem, index?: number) => {};

    private defaultVal: any;
    protected para: ISelectInputPara;
    protected dropdown: DropDown;
    private isAdapt:boolean;

    private toggle() {
        this.dropdown.toggle(this.wrapper);
    }

    constructor(para: ISelectInputPara) {

        super(<ITextInputPara>tools.obj.merge(para, {
            icons: tools.isNotEmpty(para.arrowIcon) ? [(tools.isNotEmpty(para.arrowIconPre) ? para.arrowIconPre : 'iconfont') +  ' ' + para.arrowIcon]:['iconfont icon-arrow-down'],
            iconHandle: para.clickType !== 0 ? () => {
                this.toggle();
            } : null
        }));
        this.isAdapt=para.isAdapt?para.isAdapt:false;
        this.tabIndex = para.tabIndex;
        this.ajaxFun(para);
        this.para = para;
        // clickType为0时
        if (para.clickType === 0) {
            this.input.style.cursor = 'pointer';

            d.on(this.wrapper, 'click', (e: Event) => {
                e.stopPropagation();
                this.toggle();
            })
        }
        let dropPara: DropDownPara = {
            el: document.body,
            data: para.data,
            ajax: para.ajax,
            multi: para.multi,
            className: para.dropClassName,
            isAdapt:this.isAdapt

        };
        this.para.multi ? (dropPara['onMultiSelect'] = (selected, index) => {

            let splitCode = this.para.multiSplit ? this.para.multiSplit : ',';
            let innerVal = '';
            if(Array.isArray(selected) && selected[0]){
                innerVal += selected[0].text;
                for(let i = 1;i < selected.length; i++) {
                    innerVal += `${splitCode}${selected[i].text}`;
                }
                this.input.value = innerVal;
            }else{
                this.input.value = '';
                this.defaultVal = '';
            }
            this.onSet && this.onSet(selected, index);

        }): (dropPara['onSelect'] =(item, index) => {
            this.input.value = this.para.useInputVal ? item.value.toString() : item.text;
            this.onSet && this.onSet(item, index);
        });

        this.dropdown = new DropDown(dropPara);
    }

    protected keyHandle = (e: KeyboardEvent) => {

        let data = this.getData();
        if( Array.isArray(data) ){
            let index = this.dropdown.selectedIndex,
                length = this.getData().length;

            if(e.keyCode === 38) {
                index --;
            }else if(e.keyCode === 40) {
                index ++;
            }

            if(index < 0){
                index = 0;
            }
            if(index >= length - 1){
                index = length - 1;
            }
            this.set((<any>data[index]).value)
        }

    };


    private ajaxFun(para: SelectDataPara) {
        if (para.ajax) {
            let fun = para.ajax.fun;
            para.ajax.fun = (url, value, callback) => {
                fun(url, value === '' ? super.get() : value, callback)
            }
        }
    }

    getData() : ListData{
        return this.para.data;
    }

    set(value) {
        this.value = value;
        // super.set(value);
    }
    get() {
        return this.value;
    }
    set value(data) {
        if(data !== null && typeof data === 'object'){
            let {value, text} = data;
            if (!this.dropdown.select(value)) {
                this.defaultVal = value;
                super.set(text);
                typeof this.onSet === 'function' && this.onSet(value);
            }
        }else{
            if (!this.dropdown.select(data)) {
                this.defaultVal = data;
                super.set(data);

                typeof this.onSet === 'function' && this.onSet(data);
            }
        }

        // super.set(value);
    }
    get value() {
        if(!this.para){
            return null;
        }
        if(this.para.multi){
            // let seleArr = this.dropdown.get();
            // let cacheData = this.data;
            // let result = '';
            // if(seleArr.length > 1){
            //     result = cacheData[seleArr[0]]['value'];
            //     for(let j = 1,len = seleArr.length;j < len;j++){
            //         result += ','+cacheData[seleArr[j]]['value'];
            //     }
            // }
            // return result;
            let result = this.dropdown.get();
            if (this.para.useInputVal) {
                return super.get();
            } else {
                let value = tools.isEmpty(result) ? this.defaultVal : result.map((d) => d.value).join(',');
                return value;
            }
        }
        else{
            let selected = this.dropdown.get();
            if (this.para.useInputVal) {
                return super.get();
            } else {
                return selected === null ? this.defaultVal : selected.value;
            }
        }
    }
    getText() {
        return this.input.value;
    }

    showItems(indexes: number[]) {
        this.dropdown.showItems(indexes);
    }

    setPara(para: SelectDataPara) {
        this.ajaxFun(para);
        this.dropdown.setPara(para);
    }

    destroy() {
        super.destroy();
        this.dropdown.destroy();
    }
}