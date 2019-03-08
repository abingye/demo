/// <amd-module name="DatetimeMb"/>
import {TextInput, ITextInputPara} from "../text/text";
import {Datetime, IDatetimePara, getDateTypeByFormat, dateType} from "./datetime";
import tools = G.tools;
import {Picker, PickerList} from "../../ui/picker/picker";
import {ListData} from "../../ui/dropdown/dropdown";

export class DatetimeMb extends TextInput{

    protected _format: string;
    protected pickerList: PickerList;
    protected type: dateType;
    constructor(p: IDatetimePara) {
        let timePara: IDatetimePara = Object.assign({}, p, {
            icons: ['iconfont icon-calendar'],
            iconHandle: () => {
                this.initPicker();
                this.setSelectedValue(this.input.value);
            },
        }) as ITextInputPara;
        super(timePara);

        this._format = p.format;
    }

    static datetimeData = (() => {
        let two = (num: number) => {
            return num < 10 ? '0' + num : num + '';
        };

        let getData = (start, end): ListData => {
            let data = [];
            for(let i = start; i < end; i ++){
                data.push({text: two(i), value: i});
            }
            return data;
        };
        return {
            getYearData: (startYear: number = 1970) => {
                return getData(startYear, tools.date.today().getFullYear() + 5);
            },
            getMouthData: () => {
                return getData(1, 13);
            },
            getDayData: (mouth: number, year: number) => {
                let start = 1,
                    end = 30,
                    bigMouth = [1, 3, 5, 7, 8, 10, 12],
                    isLeapYear = (year % 4 === 0 && year % 100 !== 0 ) || year % 400 === 0;// 是否是闰年
                if(mouth === 2){
                    // 2月份
                    end = isLeapYear ? 29 : 28;
                }else if(bigMouth.indexOf(mouth) > -1){
                    // 大月
                    end = 31;
                }
                return getData(start, end + 1);
            },
            getHourData: () => {
                return getData(0, 24);
            },
            getMinuteData: () => {
                return getData(0, 60);
            },
            getSecondData: () => {
                return getData(0, 60);
            }
        }
    })();

    static initDatePicker(): Picker[]{
        let pickers = [],
            yearPicker: Picker,
            mouthPicker: Picker,
            dayPicker: Picker;

        let changeDayData = (mouth, year) => {
            dayPicker && (dayPicker.optionData = DatetimeMb.datetimeData.getDayData(mouth, year));
        };
        yearPicker = <Picker name="year" title="年" isMulti={false}
                             optionData={DatetimeMb.datetimeData.getYearData()}/>;
        mouthPicker = <Picker name="mouth" title="月" isMulti={false}
                              optionData={DatetimeMb.datetimeData.getMouthData()}/>;
        dayPicker = <Picker name="day" title="日" isMulti={false}
                            optionData={DatetimeMb.datetimeData.getDayData((mouthPicker.value as ListItem).value, (yearPicker.value as ListItem).value)}/>;
        yearPicker.onChange = () =>
            changeDayData((mouthPicker.value as ListItem).value, (yearPicker.value as ListItem).value);
        mouthPicker.onChange = () =>
            changeDayData((mouthPicker.value as ListItem).value, (yearPicker.value as ListItem).value);
        pickers.push(yearPicker);
        pickers.push(mouthPicker);
        pickers.push(dayPicker);
        return pickers;
    }

    static initTimePicker(): Picker[]{
        let pickers = [];
        pickers.push(<Picker name="hour" title="时" isMulti={false}
                             optionData={DatetimeMb.datetimeData.getHourData()}/>);
        pickers.push(<Picker name="minute" title="分" isMulti={false}
                             optionData={DatetimeMb.datetimeData.getMinuteData()}/>);
        pickers.push(<Picker name="second" title="秒" isMulti={false}
                             optionData={DatetimeMb.datetimeData.getSecondData()}/>);
        return pickers;
    }

    protected initPicker(){
        this.input.blur();
        this.type = getDateTypeByFormat(this._format);
        let pickers = [];
        switch (this.type){
            case 'time':
                pickers = DatetimeMb.initTimePicker();
                break;
            case 'date':
                pickers = DatetimeMb.initDatePicker();
                break;
            case 'datetime':
                pickers = DatetimeMb.initDatePicker().concat(DatetimeMb.initTimePicker());
                break;
        }

        this.pickerList = <PickerList className={"data-time-picker"}
                                      isOnceDestroy={true}
                                      isWatchMsg={true}
                                      onSet={(a, values) => {
            let valStr = '';
            switch (this.type) {
                case 'date' :
                    valStr = `${values.year.text}-${values.mouth.text}-${values.day.text}`;
                    break;
                case 'time' :
                    valStr = `${values.hour.text}:${values.minute.text}:${values.second.text}`;
                    break;
                case 'datetime' :
                    valStr = `${values.year.text}-${values.mouth.text}-${values.day.text} ${values.hour.text}:${values.minute.text}:${values.second.text}`;
                    break;
            }
            this.set(valStr);
        }}>
            {pickers}
        </PickerList>;
    }

    protected setSelectedValue(str){
        if(this.pickerList){
            let date = new Date();
            if(tools.isNotEmpty(str)){
                if(this.type === 'time'){
                    str = '2018-01-01 ' + str;
                }
                if(tools.os.ios){
                    str = str.replace(/-/g, "/");
                }
                date = new Date(str);
            }
            let year = this.pickerList.pickers['year'],
                mouth = this.pickerList.pickers['mouth'],
                day = this.pickerList.pickers['day'],
                hour = this.pickerList.pickers['hour'],
                minute = this.pickerList.pickers['minute'],
                second = this.pickerList.pickers['second'];

            year && year.setCurrentByValue(date.getFullYear());
            mouth && mouth.setCurrentByValue(date.getMonth() + 1);
            day && day.setCurrentByValue(date.getDate());
            hour && hour.setCurrentByValue(date.getHours());
            minute && minute.setCurrentByValue(date.getMinutes());
            second && second.setCurrentByValue(date.getSeconds());
        }
    }

    public format(str:string){
        this.pickerList && this.pickerList.destroy();
        this._format = str;
        this.initPicker();
        this.setSelectedValue(this.input.value);
    }

    set(str){
        if(str instanceof Date){
            super.set(tools.date.format(str, this._format));
        }else{
            super.set(str);
        }
        // this.com.setDate(str)
    }

    destroy(){
        this.pickerList && this.pickerList.destroy();
        super.destroy();
    }
}

// export class DatetimeMb extends TextInput {
//     private com: any;
//     protected para: IDatetimePara;
//     protected type : string;
//
//     constructor(p: IDatetimePara) {
//
//         let timePara: IDatetimePara = tools.obj.merge(p, {
//             icons: ['iconfont icon-calendar'],
//             iconHandle : ()=> {
//                 //设置默认值
//                 if(this.input.value){
//                     this.com.setSelectedValue(this.input.value);
//                 }
//                 else{
//                     this.com.ui.h.picker.setSelectedValue(this.para.defaultHour ? this.para.defaultHour : 0);
//                     this.com.ui.i.picker.setSelectedValue(this.para.defaultMinute ?  this.para.defaultMinute : 0);
//                 }
//                 let valStr = '';
//                 this.com.show( (item : Mui_Date) => {
//                     switch (this.type) {
//                         case 'date' :
//                             valStr = `${item.y.value}-${item.m.value}-${item.d.value}`;
//                             break;
//                         case 'time' :
//                             valStr = `${item.h.value}:${item.i.value}:00`;
//                             break;
//                         case 'datetime' :
//                             valStr = `${item.y.value}-${item.m.value}-${item.d.value} ${item.h.value}:${item.i.value}:00`;
//                             break;
//                     }
//                     this.set(valStr);
//                     // this.com.dispose();
//                 });
//             }
//         });
//
//         super(timePara);
//
//         this.para = timePara;
//
//         this.initDatetime();
//     }
//
//
//     public format(str:string){
//         this.com.dispose();
//         this.para.format = str;
//         this.initDatetime();
//     }
//
//     private initDatetime(){
//         // this.iconGroup.firstElementChild.setAttribute('data-toggle', '');
//         this.input.dataset.input = '';
//         // this.para.format.replace()
//
//         // 判断日期类型
//         this.type = getDateTypeByFormat((this.para.format));
//
//         this.com = new mui.DtPicker({
//             beginYear: 1970,
//             type: this.type
//         });
//
//     }
//
//     public set(str){
//         if(str instanceof Date){
//             super.set(tools.date.format(str, this.para.format))
//         }else{
//             super.set(str);
//         }
//         // this.com.setDate(str)
//     }
// }

