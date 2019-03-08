/// <amd-module name="BasicBoxGroup"/>

import {ContainCom} from "../../ContainCom";
import IComponentPara = G.IComponentPara;
import {BasicCheckBox} from "../checkbox/basicCheckBox";
import d = G.d;
import tools = G.tools;

export interface IBasicBoxGroupPara extends IComponentPara{
    onSet?: (checkedMsg: {isChecked: boolean, index: number, name: string}) => void;
    type?: CheckBoxStyle; // 默认default
    size?: CheckBoxSize; // 只有在type设置为button时有效，默认small
}

type CheckBoxStyle = 'button' | 'default' | 'tag';
type CheckBoxSize = 'small' | 'middle' | 'big' | 'super-big';

export abstract class BasicBoxGroup extends ContainCom{
    static BTN_CHECKBOX_CLASS = 'selected-btn-box-wrapper';
    static TAG_CHECKBOX_CLASS = 'selected-tag-wrapper';

    protected wrapperInit(para: IComponentPara): HTMLElement {
        return this._body = <div className="select-box-wrapper"/>;
    }

    onSet?: (checkedMsg: {isChecked: boolean, index: number, name: string}) => void;

    constructor(para: IBasicBoxGroupPara){
        super(para);
        this._selectBoxes = this.childs.filter((child) => child instanceof BasicCheckBox);
        this.init(para);
    }

    protected init(para: IBasicBoxGroupPara){
        this.onSet = para.onSet;
        this._selectBoxes.forEach((selectBox) => {
            selectBox.on(BasicCheckBox.EVT_CHECK_BOX_CHANGE, (ev) => {
                this.checkHandler(selectBox, ev);
            });
        });
        this.type = para.type;
        this.size = para.size;
    }

    protected checkHandler(target: BasicCheckBox, checked){
        tools.isFunction(this.onSet) && this.onSet({
            isChecked: checked,
            index: this._selectBoxes.indexOf(target),
            name: target.name
        });
    }

    protected _selectBoxes: BasicCheckBox[];
    get selectBoxes(){
        return [...this._selectBoxes];
    }

    protected _type: CheckBoxStyle;
    get type(){
        return this._type;
    }
    set type(type: CheckBoxStyle){
        this._type = tools.isEmpty(type) ? 'default' : type;
        this.wrapper.classList.remove(BasicBoxGroup.BTN_CHECKBOX_CLASS);
        switch (this._type){
            case 'button':
                this.wrapper.classList.add(BasicBoxGroup.BTN_CHECKBOX_CLASS);
                break;
            case 'tag':
                this.wrapper.classList.add(BasicBoxGroup.TAG_CHECKBOX_CLASS);
                break;
        }
    }

    protected set size(size: CheckBoxSize){
        size = tools.isEmpty(size) ? 'small' : size;
        this.wrapper.classList.add(size + '-select-box-wrapper');
    }

    get(){
        return this._selectBoxes.map((selectBox) => selectBox.checked);
    }

    set(index: number, checked: boolean){
        if(index in this._selectBoxes) {
            let selectBox = this._selectBoxes[index];
            selectBox && (selectBox.checked = checked);
        }
    }

    get value(){
        let result = [];
        this._selectBoxes.forEach((box) => {
            box.checked && result.push(box.value);
        });
        return result;
    }

    add(selectBox: BasicCheckBox){
        this._selectBoxes.push(selectBox);
        d.append(this.wrapper, selectBox.wrapper);
        selectBox.on(BasicCheckBox.EVT_CHECK_BOX_CHANGE, (ev) => {
            this.checkHandler(selectBox, ev);
        });
    }

    del(indexes: number | number[]){
        tools.toArray(indexes).sort((a, b) => {
            if(a > b){
                return -1;
            }else if(a < b){
                return 1;
            }else{
                return 0;
            }
        }).forEach((index) => {
            if(index in this._selectBoxes){
                let selectBox = this._selectBoxes.splice(index, 1)[0];
                selectBox.destroy();
            }
        })
    }

    destroy(){
        this._selectBoxes.forEach((selectBox) => selectBox.destroy());
        super.destroy();
    }
}

export interface IRadioBoxGroupPara extends IBasicBoxGroupPara{
    name?: string;
}

export class RadioBoxGroup extends BasicBoxGroup{
    constructor(para: IRadioBoxGroupPara){
        super(para);
        this.wrapper.classList.add('radio-box-wrapper');
        this.name = para.name;
    }

    protected init(para){
        this._selectBoxes[0] && (this._selectBoxes[0].checked = true);
        super.init(para);
    }

    protected checkHandler(target: BasicCheckBox, checked){
        if(checked){
            this._selectBoxes.forEach((box) => {
                if(box !== target){
                    box.checked = false;
                }
            });
            tools.isFunction(this.onSet) && this.onSet({
                isChecked:checked,
                index: this._selectBoxes.indexOf(target),
                name: target.name
            });
        }
    }

    set(index: number){
        super.set(index, true);
    }

    set name(name: string){
        if(tools.isNotEmpty(name)) {
            this._selectBoxes.forEach((selectBox) => selectBox.name = name);
        }
    }
}

export interface ICheckBoxGroupPara extends IBasicBoxGroupPara{}

export class CheckBoxGroup extends BasicBoxGroup{
    constructor(para: ICheckBoxGroupPara){
        super(para);
        this.wrapper.classList.add('check-box-wrapper');
    }

    set(indexes: number | number[], checked: boolean){
        tools.toArray(indexes).forEach((index) => {
            if(index in this._selectBoxes) {
                let selectBox = this._selectBoxes[index];
                selectBox && (selectBox.checked = checked);
            }
        })
    }

    setAll(checked: boolean){
        this._selectBoxes.forEach((selectBox) => selectBox.checked = checked);
    }
}