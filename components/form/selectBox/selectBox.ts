/// <amd-module name="SelectBox"/>

import tools = G.tools;
import {CheckBox} from "../checkbox/checkBox";
import d = G.d;
import {FormCom, IFormComPara} from "../basic";
import {RadioBox} from "../radiobox/radioBox";
import {BasicCheckBox} from "../checkbox/basicCheckBox";

interface ISelectBoxPara extends IFormComPara{
    select: {
        multi: boolean,
        callback?(index: number,item?:HTMLElement),
        isRadioNotchecked ?: boolean //单选框是否允许多次选中，默认状态：不可多次选中
        isStopPropatation ? :boolean //选项框是否取消冒泡：默认状态：不取消
    }
    // container: HTMLElement;
    data?: ListItem[];
    noteDataByTitle?:boolean;//临时用于权限模块，是否通过选项框的title值来记录数据
}

export class SelectBox extends FormCom{
    onSet: (val) => void;
    private selectArr: number[];
    private type: string;
    private guidName: string;
    private lastRadioBox : HTMLInputElement;

    constructor(private para: ISelectBoxPara) {

        super(para);
        // this._wrapper = para.container;
        this.selectArr = [];
        this.guidName = tools.getGuid();
        this.type = this.para.select && this.para.select.multi ? 'checkbox' : 'radio';
        if (Array.isArray(para.data)) {
            this.addByList();
        }
        // this.tabIndex = para.tabIndex;

        this.initEvent();
    }


    getChecked(){
        let inputs = d.queryAll('input', this.wrapper),
            arr = [];
        Array.isArray(inputs) && inputs.forEach((input : HTMLInputElement) => {
            if(input.checked){
                arr.push(parseInt(input.parentElement.dataset.index));
            }
        });
        return arr;
    }

    protected keyHandle = (e : KeyboardEvent) => {
        let index = this.getChecked()[0],
            keyCode = e.keyCode || e.which || e.charCode,
            num = index === 0 ? 1 : 0,
            key = this.para.tabIndexKey || 13;
        if(keyCode === key){
            this.set([num]);
            this.para.select.callback && this.para.select.callback(num);
        }
    };

    //显示选项框
    public show() {
        this.para.container.style.display = 'inline-block';
    }
    //隐藏选项框
    public hide() {
        this.para.container.style.display = 'none';
    }
    private initEvent() {
        //添加事件
        let self = this;
        self.lastRadioBox = null;
        //如果单选框不允许多次选中，默认第一个单选框为选中状态，则lastRadioBox为第一个单选框
        if (!self.para.select.isRadioNotchecked && self.type === 'radio') {
            let radioInput = <HTMLInputElement> self.para.container.querySelector('input');
            if (radioInput) {
                self.lastRadioBox = radioInput;
            }
        }
        // d.on(this.para.container, 'click', '.check-span', function (e: Event) {
        //     if(self.para.select && self.para.select.isStopPropatation) {
        //         e.stopPropagation();
        //     }
        //     self.checked((<HTMLElement>this).parentElement.querySelector('input'));
        //     if (self.para.select && self.para.select.callback) {
        //         ////临时用于权限模块，通过选项框的title值来记录数据
        //         if(self.para.noteDataByTitle) {
        //             if(self.para.data[this.parentElement.dataset.index]) {
        //                 this.parentElement.title = self.para.data[this.parentElement.dataset.index].value;
        //             }
        //         }
        //         self.para.select.callback(parseInt(this.parentElement.dataset.index),this.parentElement);
        //     }
        // })
    }
    protected clickHandler(input: HTMLInputElement | BasicCheckBox){
        this.checked(input);
        if(input instanceof BasicCheckBox){
            input = input.wrapper.querySelector('input');
        }
        if (this.para.select && this.para.select.callback) {
            ////临时用于权限模块，通过选项框的title值来记录数据
            if(this.para.noteDataByTitle) {
                if(this.para.data[input.parentElement.dataset.index]) {
                    input.parentElement.title = this.para.data[input.parentElement.dataset.index].value;
                }
            }
            this.para.select.callback(parseInt(input.parentElement.dataset.index),input.parentElement);
        }
    }

    private checked(input: HTMLInputElement | BasicCheckBox) {
        let self = this;
        if(input instanceof BasicCheckBox){
            let inputEl = input.wrapper.querySelector('input');
            let index = parseInt(inputEl.parentElement.dataset.index);
            if(input.type === 'checkbox'){
                if(input.checked){
                    self.selectArr.push(index);
                }else{
                    let i = self.selectArr.indexOf(index);
                    if (i > -1) {
                        self.selectArr.splice(i, 1);
                    }
                }
            }else{
                if (self.lastRadioBox !== inputEl) {
                    self.selectArr[0] = index;
                    inputEl.value = 'true';
                    inputEl.checked = true;
                }else{
                    if (self.para.select.isRadioNotchecked) {
                        if (input.checked) {
                            self.selectArr[0] = index;
                        } else {
                            self.selectArr = [];
                        }
                    } else {
                        self.selectArr = [];
                        return;
                    }
                }
                self.lastRadioBox = inputEl;
            }
        }else {
            let index = parseInt(input.parentElement.dataset.index);
            //多选框两种情况
            if (input.type === 'checkbox') {
                if (input.value === 'true') {
                    input.checked = false;
                    input.value = 'false';
                    let i = self.selectArr.indexOf(index);
                    if (i > -1) {
                        self.selectArr.splice(i, 1);
                    }
                } else {
                    self.selectArr.push(index);
                    input.checked = true;
                    input.value = 'true';
                }
            }
            //单选框的两种情况,this.value记录每次是否点击,value === false 这次没有点击
            else {
                if (self.lastRadioBox !== input) {
                    self.selectArr[0] = index;
                    // if (self.para.select.isRadioNotchecked) {
                    input.value = 'true';
                    input.checked = true;
                    // }
                } else {
                    if (self.para.select.isRadioNotchecked) {
                        if (!(input.value === 'true')) {
                            self.selectArr[0] = index;
                            input.value = 'true';
                            input.checked = true;
                        } else {
                            self.selectArr = [];
                            input.value = 'false';
                            input.checked = false;
                        }
                    } else {
                        input.checked = true;
                        self.selectArr = [];
                        return;
                    }
                }
                self.lastRadioBox = input;
            }
        }
        //
        // if (self.para.select && self.para.select.callback) {
        //     self.para.select.callback(index);
        // }
    }

    /*
     * 为data[](ListItem)中的每个元素创建对应的selectBox.
     * */

    private addByList() {
        Array.isArray(this.para.data) && this.para.data.forEach((obj, i) => {
            let self = this;
            let Construct = this.type === 'radio' ? RadioBox : CheckBox,
                checkBox = new Construct({
                    text: obj.text ? obj.text : '',
                    name: this.guidName,
                    onSet: (e) => {
                        this.clickHandler(checkBox);
                    }
                }),
                selectBox = checkBox.wrapper,
                // selectBox = CheckBox.initCom(this.guidName, obj.text ? obj.text : '', this.type),
                input = selectBox.querySelector('input'),
                span = selectBox.querySelector('span');

            //如果单选框不允许多次选中，则默认第一个单选框为选中状态
            if (!this.para.select.isRadioNotchecked && i === 0 && this.type === 'radio') {
                this.selectArr[0] = i;
                input.checked = true;
            }

            selectBox.dataset.index = i.toString();
            input.value = obj.value ? obj.value.toString() : '';
            this.para.container.appendChild(selectBox);
        })
    }

    /*
     * 为单个dom对象添加selectBox
     * */

    addByItem(el: HTMLElement) {
        let checkBox = new CheckBox({
            name: this.guidName,
            onSet: (e) => {
                this.clickHandler(checkBox);
            }
        }),
            selectBox = checkBox.wrapper;
        selectBox.dataset.index = el.dataset.index;
        el.appendChild(selectBox);
    }

    /*
     * 设置selectBox为禁用状态
     * 传入参数:要被禁用的selectbox的下标数组
     * */
    setDisabled(indexs: number[]) {
        Array.isArray(indexs) && indexs.forEach((i) => {
            let selectBox = <HTMLElement> this.para.container.childNodes[i];
            selectBox.classList.add('disabled');
        })
    }

    /*
     * 取消selectBox为禁用状态
     * */
    unsetDisabled(indexs: number[]) {
        Array.isArray(indexs) && indexs.forEach((i) => {
            let selectBox = <HTMLElement> this.para.container.childNodes[i];
            selectBox.classList.remove('disabled');
        })
    }

    /*
     * 获取当前选中的selectBox
     * */
    get(): any {
        return this.selectArr;
    }

    getSelect() : ListItem[] {
        let selected : ListItem[] = [];
        this.get().forEach( n => {
            this.para.data.forEach((d, i) => {
                if(i === n){
                    selected.push(d);
                }
            });
        });

        return selected;
    }

    //不保留状态，空数组默认全清
    set(index : Array<number>) : void{
        this.unsetSelectedAll();
        this.selected(index, true);
    }

    //全选
    setAll(){
        this.selectAll(true);

    }

    //添加选中状态
    addSelected(index : Array<number>){
        this.selected(index, true);
    }

    // 取消选中
    unSet(index : Array<number>) {
        this.selected(index);
    }

    /**
     * 勾选
     * @param index 只能传下标
     * @param set true为set，false为unset
     */
    private selected(index : Array<number>, set? : boolean) {
        let self = this,
            spans = d.queryAll( 'span.check-span',self.para.container),
            isSelected = false,
            selectNum = self.get();

        index.forEach(function (i) {
            selectNum.forEach((n) => {
                if (i === n) {
                    isSelected = true;
                }
            });
            if (set) {
                if (!isSelected) {
                    self.checked(<HTMLInputElement>d.query( 'input', spans[i].parentElement))
                }
            } else {
                if (isSelected) {
                    self.checked(<HTMLInputElement>d.query( 'input', spans[i].parentElement))
                }
            }

            isSelected = false;
        });
    }


    //全清
    private unsetSelectedAll() {
        this.selectAll()
    }

    private selectAll(set?: boolean) {
        let data = d.queryAll( 'span.check-span',this.para.container),
            nums = [];
        data && data.forEach((n, i) => {
            nums.push(i);
        });

        this.selected(nums, set);
    }

    get value(){
        return this.selectArr;
    }
    set value(index: number[]){
        this.unsetSelectedAll();
        this.selected(index, true);
    }

    protected wrapperInit(para: ISelectBoxPara): HTMLElement {
        return para.container || undefined;
    }
}
