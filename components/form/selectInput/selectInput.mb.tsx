/// <amd-module name="SelectInputMb"/>
import {TextInput, ITextInputBasicPara, ITextInputPara} from "../text/text";
import tools = G.tools;
import {ISelectInputPara} from "./selectInput";
import d = G.d;
import {ListData, SelectDataPara} from "../../ui/dropdown/dropdown";
import {Spinner} from "../../ui/spinner/spinner";
import {Picker, PickerList} from "../../ui/picker/picker";

export class SelectInputMb extends TextInput{
    onSet: (val) => void;
    data : ListItem[] = [];

    protected pickList: PickerList;
    protected pickers: Picker[] = [];
    constructor(protected para: ISelectInputPara){
        super(Object.assign({}, para, {
            icons : ['iconfont icon-arrow-down'],
            iconHandle : para.clickType !== 0 ? () => {this.showList()} : null,
            className: 'select-input-mb'
        }));

        this.pickList = <PickerList isBackground={false} isShow={false} isOnceDestroy={false}
            container={document.body} onSet={(val) => {
            let value = val[0];
            value = typeof value === 'string' || typeof value === 'number' ? value : value.value;
            this.set(value);
        }}>
            <Picker optionData={para.data} isMulti={para.multi}/>
        </PickerList>;
        this.pickers = this.pickList.childs;

        this.ajaxFun(para);
        this.initData(para.data);
        // clickType为0时
        if(para.clickType === 0){
           d.on(this.wrapper, 'click', () => {
                this.showList();
                let data = this.pickers[0].optionData;
                // if(this.hasSelectItem && this.hasSelectItem.length > 0){
                //     for(let i = 0,l = this.hasSelectItem.length;i < l;i++){
                //         for(let j = 0,len = child.length;j < len;j++){
                //             let li = child[j];
                //             if(li.innerText === this.hasSelectItem[i]['text']){
                //                 let e = {
                //                     target : li
                //                 };
                //             }
                //         }
                //     }
                // }
            })
        }

    }

    protected initData(data: ListData){
        if(Array.isArray(data)){
            this.data = data.map((data) => {
                return typeof data === 'string' || typeof data === 'number'
                    ? {text: data + '', value: data} : data;
            });
            this.pickers[0] && (this.pickers[0].optionData = this.data);
        }
    }
    private ajaxFun(para : SelectDataPara){
        if(para.ajax){
            let fun = para.ajax.fun;
            this.para.ajax.fun = (url, value, callback) => {
                fun(url, value === '' ? super.get() : value, callback )
            }
        }
    }

    showList(){
        let ajax = this.para.ajax,
            data = this.para.data;

        this.pickList.show();
        let showData = (data : ListData) => {
            this.data = data.map((d) => typeof d === 'object'
                ? d as ListItem : {text: d + '', value: d} as ListItem );
            let showData = this.getShowData();
            this.initData(showData);
        };

        if (ajax && ajax.fun) {
            let spinner = new Spinner({
                el: this.iconGroup,
                type: Spinner.SHOW_TYPE.replace
            });
            spinner.show();
            // debugger;
            // 用ajax获取数据
            ajax.fun(ajax.url, super.get(), d => {
                console.log(d);
                if (Array.isArray(d)) {
                    showData(d);
                }
                spinner.hide();
            });
        } else if(Array.isArray(data)){
            showData(data);
        }
    }

    setPara(para: SelectDataPara){
        let data = para.data,
            ajax = para.ajax;

        if( data && data[0] ){

            this.para.data = data;

            this.initData(data);

            this.para.ajax = null;

        }else if (ajax){

            this.para.ajax = tools.obj.merge(this.para.ajax, ajax);

            this.para.data = null;

        }
    }
    private getShowData(){
        let showData : ListItem[] = [];
        if(this.showIndexes[0]){
            this.showIndexes.forEach(i => {
                let d = this.data[i];
                if(d){
                    showData.push(d)
                }
            });
        }else {
            showData = this.data;
        }

        return showData;
    }

    protected showIndexes = [];
    showItems(indexes :number[]) {
        this.showIndexes = Array.isArray(indexes) ? indexes : [];
    }

    get(){
        let data = this.pickers[0].value as ListData;
        let result = "";
        if(this.para && this.para.multi && Array.isArray(data)) {
            if(data && data.length > 0){
                result += (typeof data[0] === 'string' || typeof data[0] === 'number')
                    ? data[0] : (data[0] as ListItem).value;
                for(let i = 1,l = data.length;i < l;i++){
                    result += `,${data[i]['value']}`;
                }
            }
        }
        else{
            let opt = data;
            // return this.para.useInputVal ? super.get() : selected.value;
            result = (this.para && this.para.useInputVal) ?  super.get() : opt ? (opt as ListItem).value : '';
        }
        return result;
    }
    getText(){
        return this.input.value;
    }

    protected _index = -1;
    set(data){
        let value = data, text = data;
        if(data !== null && typeof data === 'object'){
            text = data.text;
            value = data.value
        }

        for (let d:ListItem = null, i = 0; d = this.data[i]; i++){
            if (d.value === value){
                if(this.pickers[0]){
                    this.pickers[0].current = i;
                    this._index = i;
                    this.para.onSet && this.para.onSet(d, this._index);
                }
            }
        }
        this.input.value = tools.str.toEmpty(this._index === -1 ? text : this.data[this._index][this.para.useInputVal ? 'value' : 'text']);
    }

    set value(value){
        this.set(value);
    }
    get value(){
        return this.get();
    }

    destroy(){
        this.pickList && this.pickList.hide(true);
        super.destroy();
    }

}
//
// export class SelectInputMb extends TextInput{
//     onSet: (val) => void;
//
//     data : ListItem[];
//     private selectedIndex: number;
//     private showIndexes : number[];
//     private hasSelectItem : obj[] = [];
//
//     protected para : ISelectInputPara;
//     constructor(p : ISelectInputPara){
//
//         super(Object.assign(p, {
//             icons : ['iconfont icon-arrow-down'],
//             iconHandle : p.clickType !== 0 ? () => {this.showList()} : null
//         }));
//
//         Picker.init();
//
//         this.ajaxFun(p);
//         this.initData(p.data);
//         // clickType为0时
//         if(p.clickType === 0){
//             d.on(this.wrapper, 'click', () => {
//                 this.showList();
//                 if(this.hasSelectItem && this.hasSelectItem.length > 0){
//                     let child = Picker.ulGet().childNodes;
//                     for(let i = 0,l = this.hasSelectItem.length;i < l;i++){
//                         for(let j = 0,len = child.length;j < len;j++){
//                             let li = <HTMLLIElement>child[j];
//                             if(li.innerText === this.hasSelectItem[i]['text']){
//                                 let e = {
//                                     target : li
//                                 };
//                                 Picker.multiHandle(e);
//                             }
//                         }
//                     }
//                 }
//             })
//         }
//
//         this.para = p;
//         this.selectedIndex = -1;
//         this.showIndexes = [];
//
//         Picker.init();
//
//     }
//
//     private getShowData(){
//         let showData : ListItem[] = [];
//         if(this.showIndexes[0]){
//             this.showIndexes.forEach(i => {
//                 let d = this.data[i];
//                 if(d){
//                     showData.push(d)
//                 }
//             });
//         }else {
//             showData = this.data;
//         }
//
//         return showData;
//     }
//
//     /**
//      * 显示指定下标的item，每次重新显示，不与上次操作重叠，传入 空数组，或者null则完全隐藏
//      * @param {number[]} indexes
//      */
//     public showItems(indexes :number[]) {
//
//         this.showIndexes = Array.isArray(indexes) ? indexes : [];
//
//     }
//
//     /**
//      * 初始化数据
//      * @param {ListData} data
//      */
//     private initData(data : ListData) {
//         if (Array.isArray(data)) {
//             let options : ListItem[];
//             if(typeof data[0] === 'string' || typeof data[0] === 'number'){
//                 options =  data.map((d : string) => {
//                     return {
//                         text : d,
//                         value : d
//                     }
//                 });
//             }else{
//                 options = <ListItem[]>data;
//             }
//
//             this.data = options;
//
//             Picker.set(options);
//         }else{
//             this.data = [];
//         }
//     }
//
//     private ajaxFun(para : SelectDataPara){
//         if(para.ajax){
//             let fun = para.ajax.fun;
//             para.ajax.fun = (url, value, callback) => {
//                 fun(url, value === '' ? super.get() : value, callback )
//             }
//         }
//     }
//
//     public setPara(para : SelectDataPara){
//
//         let data = para.data,
//             ajax = para.ajax;
//
//         if( data && data[0] ){
//
//             this.para.data = data;
//
//             this.initData(data);
//
//             this.para.ajax = null;
//
//         }else if (ajax){
//
//             this.para.ajax = tools.obj.merge(this.para.ajax, ajax);
//
//             this.para.data = null;
//
//         }
//     }
//
//     private showList(){
//         let data = this.para.data,
//             ajax = this.para.ajax;
//
//         let showData = (data : ListData) => {
//             this.initData(data);
//
//             let showData = this.getShowData();
//
//             Picker.show(showData,  (option) => {
//                 this.hasSelectItem = Picker.get();
//                 let index: number = -1;
//                 for (let d:ListItem = null, i = 0; d = this.data[i]; i++){
//                     if (d.value === option[0].value){
//                         this.selectedIndex = index = i;
//                         break;
//                     }
//                 }
//                 super.set(this.para.useInputVal ? option[0].value.toString() : option[0].text);
//                 this.para.onSet && this.para.onSet(option[0], index);
//
//                 if(this.para.multi){
//                     let innerText = '';
//                     let splitCode = this.para.multiSplit ? this.para.multiSplit : ',';
//                     if(this.hasSelectItem && this.hasSelectItem.length > 0){
//                         innerText += this.hasSelectItem[0].value;
//                         for(let i = 1,l = this.hasSelectItem.length;i < l;i++){
//                             innerText += `${splitCode}${this.hasSelectItem[i]['value']}`;
//                         }
//                         this.input.value = innerText;
//                     }
//                 }
//             }, this.get());
//             this.getShowData();
//         };
//
//         if (ajax && ajax.fun) {
//             let spinner = new Spinner({
//                 el: <HTMLElement>this.iconGroup,
//                 type: Spinner.SHOW_TYPE.replace
//             });
//             spinner.show();
//             // debugger;
//             // 用ajax获取数据
//             ajax.fun(ajax.url, super.get(), d => {
//                 if (Array.isArray(d)) {
//                     showData(d);
//                 }
//                 spinner.hide();
//             });
//         } else if(Array.isArray(data)){
//             showData(data);
//         }
//
//     }
//
//     set (value){
//
//         let index : number = -1;
//         for (let d:ListItem = null, i = 0; d = this.data[i]; i++){
//             if (d.value === value){
//                 index = this.selectedIndex = i;
//                 this.para.onSet && this.para.onSet(d, index);
//                 break;
//             }
//         }
//         super.set(index === -1 ? value : this.data[index][this.para.useInputVal ? 'value' : 'text']);
//     }
//
//     getText(){
//         return this.input.value;
//     }
//     get (){
//         if(this.para && this.para.multi) {
//             let result = "";
//             if(this.hasSelectItem && this.hasSelectItem.length > 0){
//                 result += this.hasSelectItem[0].value;
//                 for(let i = 1,l = this.hasSelectItem.length;i < l;i++){
//                     result += `,${this.hasSelectItem[i]['value']}`;
//                 }
//                 return result;
//             }
//         }
//         else{
//             let opt = this.data[this.selectedIndex];
//             // return this.para.useInputVal ? super.get() : selected.value;
//             return (this.para && this.para.useInputVal) ?  super.get() : opt ? opt.value : '';
//         }
//     }
// }