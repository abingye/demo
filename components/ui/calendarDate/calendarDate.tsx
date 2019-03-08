///<amd-module name=""CalendarDate"/>

import {ContainCom} from "../../ContainCom";
import IComponentPara = G.IComponentPara;
import {Datetime} from "../../form/datetime/datetime";
import tools = G.tools;

export interface ICalendarDate extends IComponentPara{
    onSet?: (val) => void;
}

// 用于创建多个时间选择器
export class CalendarDate extends ContainCom {
    protected wrapperInit(para: G.IComponentPara): HTMLElement {
        return this._body = <div class="calendar-date-wrapper"/>;
    }

    onSet: (val) => void;
    protected datetime: Datetime[];
    constructor(para: ICalendarDate){
        super(para);
        this.datetime = this.childs.filter((child) => child instanceof Datetime);
        this.onSet = para.onSet;
        this.datetime.forEach((date) => {
            date.onSet = () => {
                typeof this.onSet === 'function' && this.onSet(this.value);
            }
        })
    }

    protected _format: string;
    set format(format: string){
        if(tools.isNotEmpty(format)){
            this._format = format;
            this.datetime.forEach((datetime) => {
                datetime.format(format)
            });
        }
    }
    get format() {
        return this._format;
    }

    get(){
        return this.value;
    }
    set(val, index){
        let datetime = this.datetime && this.datetime[index];
        if(tools.isNotEmpty(datetime)){
            datetime.set(val);
        }
    }

    get value(){
        let result = [];
        this.datetime.forEach((datetime) => {
            result.push(datetime.value || null);
        });
        return result;
    }
}