/// <amd-module name="CheckBox"/>
import tools = G.tools;
import {BasicCheckBox, IBasicBoxPara} from "./basicCheckBox";


export interface ICheckBoxPara extends IBasicBoxPara {
    status?: number; // 0未选中 1选中 2半选中
}

export class CheckBox extends BasicCheckBox {

    constructor(para: ICheckBoxPara) {
        super(Object.assign({}, para, {type: 'checkbox'}));
        this.status = para.status;
    }

    protected change(status?: number) {
        this._checked = status === 1;
        this._status = tools.isEmpty(status) ? 0 : status;
        this.input.value = this._checked ? 'true' : 'false';
        if (status === 2) {
            this.input.checked = false;
            this.checkSpan.classList.add('indeterminate');
        } else {
            this.input.checked = !!status;
            this.checkSpan.classList.remove('indeterminate');
        }
        let events = this.eventHandlers[BasicCheckBox.EVT_CHECK_BOX_CHANGE];
        tools.isNotEmpty(events) && events.forEach((handler) => {
            handler && handler(this._checked);
        });
    }

    protected _checked: boolean = false;
    get checked() {
        return this._checked;
    }

    set checked(checked: boolean) {
        this.change(checked ? 1 : 0);
        if (typeof this.onSet === 'function') {
            this.onSet(checked);
        }
    }

    protected _status: number = 0;
    set status(status: number) {
        if (this._status !== status) {
            this.change(status);
        }
    }

    get status() {
        return this._status;
    }

}

