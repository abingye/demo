/// <amd-module name="RadioBox"/>

import {BasicCheckBox, IBasicBoxPara} from "../checkbox/basicCheckBox";

export interface IRadioBoxPara extends IBasicBoxPara {}

export class RadioBox extends BasicCheckBox{
    constructor(para: IRadioBoxPara){
        super(Object.assign({}, para, {type: 'radio'}));
    }
}
