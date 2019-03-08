/// <amd-module name="Datetime"/>
import tools = G.tools;
import {TextInput, ITextInputPara} from "../text/text";

// import 'flatpickr';

export interface IDatetimePara extends ITextInputPara {
    format?: string;
    defaultHour?: number;
    defaultMinute?: number;
    defaultSeconds?: number;
    isRange?: boolean;
    onClose?: () => void;
    maxDate?: Date;
    isClean?: boolean;
    cleanIcon?: string;
    minDate?:Date;
}

export type dateType = 'date'| 'time'| 'datetime';

declare const flatpickr: Function;

export class Datetime extends TextInput {
    com: any;
    protected para: IDatetimePara;

    constructor(p: IDatetimePara) {
        let icons = p.isClean ? ['iconfont icon-calendar', p.cleanIcon] : ['iconfont icon-calendar'];
        let timePara: IDatetimePara = <ITextInputPara> tools.obj.merge(p, {
            icons: icons,
            iconHandle: (index) => {
                if (index === 0) {
                    this.com && this.com.toggle();
                } else if (index === 1) {
                    this.input.value = '';
                }
            },
            placeholder: p.placeholder || '请选择有效时间'
        });

        super(timePara);

        this.para = timePara;

        require(['flatpickr'], () => {
            this.initDatetime();
        });
    }

    public format(str: string) {
        if (!this.com) {
            return
        }
        let conf = Datetime.format2Conf(str);
        for (let option in conf) {
            this.com.set(option, conf[option])
        }
    }

    private initDatetime() {
        // this.iconGroup.firstElementChild.setAttribute('data-toggle', '');
        this.input.dataset.input = '';
        // this.para.format.replace()

        /*判断日期类型*/
        // let type = getDateTypeByFormat(this.para.format),
        //      hasTime = false,
        //      hasData = false;
        // if(type === 'datetime'||type === 'time') hasTime = true;
        // if(type === 'time') hasData = true;
        let mode = this.para.isRange === true ? 'range' : 'single';
        this.com = flatpickr(
            this.wrapper,
            Object.assign(Datetime.format2Conf(this.para.format), {
                wrap: true,
                time_24hr: true,
                locale: Datetime.getLocal(),
                clickOpens: false,
                defaultHour: this.para.defaultHour ? this.para.defaultHour : 0,
                defaultMinute: this.para.defaultMinute ? this.para.defaultMinute : 0,
                defaultSeconds: this.para.defaultSeconds ? this.para.defaultSeconds : 0,
                mode: mode,
                onClose: this.para.onClose,
                maxDate: this.para.maxDate,
                minDate:this.para.minDate
            })
        );
        this.set(this._value);
    }

    private static format2Conf(format: string) {
        let type = getDateTypeByFormat(format);

        function displayFormatGet(format: string) {
            return format.replace(/y+/, 'Y')
                .replace(/m+/, 'i')
                .replace(/M+/, 'm')
                .replace(/d+/, 'd')
                .replace(/H+/, 'H')
                .replace(/s+/, 'S');
        }
        let enableTime = type === 'datetime' || type === 'time';
        return {
            dateFormat: format ? displayFormatGet(format) : null,
            enableTime: enableTime,
            enableSeconds: enableTime,
            noCalendar: type === 'time',
        }
    }

    static getLocal() {
        return {
            weekdays: {
                shorthand: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
                longhand: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"]
            },

            months: {
                shorthand: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
                longhand: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]
            },

            rangeSeparator: " 至 ",
            weekAbbreviation: "周",
            scrollTitle: "滚动切换",
            toggleTitle: "点击切换 12/24 小时时制"
        }
    }

    public set(str: string) {
        this.com && this.com.setDate(str || '');
        this._value = str || '';
        typeof this.onSet === 'function' && this.onSet(str);
    }

    destroy(){
        super.destroy();
        this.com && this.com.destroy();
        this.com = null;
    }
}

/**
 * 通过 displayFormat 得出日期选择控件的类型
 * @param displayFormat
 * @return {string} - 'date', 'time', 'datetime'
 */
export function getDateTypeByFormat(displayFormat):dateType {
    let i, dfLen,
        hasDate = '',
        hasTime = '';

    if (!displayFormat) {
        return 'datetime';
    }

    // 判断pick控件的显示类型
    for (i = 0, dfLen = displayFormat.length; i < dfLen; i++) {

        // 如果包含Y M d 则说明需要日期
        if (hasDate === '' && ['y', 'M', 'd'].indexOf(displayFormat[i]) !== -1) {
            hasDate = 'date';
        }

        // 如果包含H m s则说明需要时间
        if (hasTime === '' && ['H', 'm', 's'].indexOf(displayFormat[i]) !== -1) {
            hasTime = 'time';
        }

        //若日期和时间都已包含，则不需要再判断
        if (hasDate !== '' && hasTime !== '') {
            break;
        }
    }

    return hasDate + hasTime as dateType;
}