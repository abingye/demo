/**
 * 规则
 */

namespace G{

    export class Rule {
        static DT_NUMBER = '10'; //数值

        static DT_MONEY = '11'; // ￥#,### 货币代码 + 数值格式

        static DT_DATETIME = '12'; // YYYY-MM-DD HH24:MI:SS 日期

        static DT_TIME = '13';  // HH24:MI:SS 时间

        static DT_PERCENT = '14'; // 百分比

        static DT_BOOL = '17'; // 布尔

        static DT_IMAGE = '20'; // 图片

        static DT_SIGN = '26'; // 签名图片

        static DT_MUL_IMAGE = '22'; // 多图

        static DT_UNI_IMAGE = '27'; // 新单图

        static DT_UNI_MUL_IMAGE = '28'; // 新多图

        static DT_HTML = '30'; // 超文本

        static DT_MULTI_TEXT = '31'; // 显示时保留空格与换行的文本

        static DT_FILE = '43'; // 文件

        static DT_UNI_FILE = '47'; // 新单附件
        
        static DT_UNI_MUL_FILE = '48'; // 新多附件

        static isNumber(dataType: string) {
            return [Rule.DT_NUMBER, Rule.DT_MONEY, Rule.DT_PERCENT].indexOf(dataType) >= 0
        }
        /**
         * 生成fieldList中的数据显示的格式
         */

        private static parseNumberReg = /(\.)(\d*[1-9]+)?(0+)$/;

        private static easyLocalString(num: number | string, minFraction = 0) {

            num = num.toString();

            let dotNum = num.split('.'),
                intNumArr = dotNum[0].split(''),
                fraction = dotNum[1] === void 0 ? '' : dotNum[1], // 小数部分
                minus = intNumArr[0] === '-';

            // 整数补充逗号
            for (let pos = intNumArr.length - 3; intNumArr[pos]; pos -= 3) {
                // console.log(123);
                if ((minus && pos === 1) || pos === 0) {
                    break;
                }
                intNumArr.splice(pos, 0, ',');
            }
            dotNum[0] = intNumArr.join('');

            // 小数点补全位数
            for (let fraLen = fraction.length; fraLen < minFraction; fraLen++) {
                fraction += '0';
            }
            if (fraction.length) {
                dotNum[1] = fraction;
            }

            return dotNum.join('.');
        }

        static parseNumber(number, displayFormat) {
            let formatArr, hasDot;
            if (!tools.isEmpty(displayFormat) && typeof number === 'number') {
                formatArr = displayFormat.split('.');
                hasDot = formatArr[1] !== undefined;
            } else {
                return number;
            }

            if (hasDot) {
                let afterDot = formatArr[1];
                let beforeDot = formatArr[0];
                //0.00 ...
                number = number.toFixed(afterDot.length);

                //0.## ...
                if (afterDot[0] === '#') {
                    number = number.replace(Rule.parseNumberReg, function (match, p1, p2, p3) {
                        if (p1 === '.' && tools.isEmpty(p2)) {
                            //去.
                            return '';
                        } else {
                            //去0
                            return p1 + p2;
                        }
                    });
                }

                if (beforeDot[0] === '#') {
                    let dotNum = number.split('.');
                    let len = !tools.isEmpty(dotNum[1]) ? dotNum[1].length : 0;
                    number = Rule.easyLocalString(number, len);

                }
            } else {
                // 格式为 "###,###", 因为displayFormat不包含"."符号
                number = Math.round(number);
                if (number >= 1000) {
                    number = Rule.easyLocalString(number);

                }
            }
            return number;
        }

        /**
         *
         * @param {string | number} text
         * @param {object} formats
         * @param {string} formats.dataType
         * @param {string} [formats.displayFormat]
         * @param {string} [formats.trueExpr = 1]
         * @param {int} [formats.displayWidth = 0]
         * @param {boolean} [isWidth = true] - displayWidth参数是否有效
         * @param {boolean} [isNum = false] - 是否传参为字符串型数字
         * @return {string}
         */
        static formatText(text: string | number, formats: any, isWidth = true, isNum = false) {


            if (formats.atrrs) {
                formats.dataType = formats.dataType || formats.atrrs.dataType;
                formats.displayFormat = formats.displayFormat || formats.atrrs.displayFormat;
                formats.trueExpr = formats.trueExpr || formats.atrrs.trueExpr;
                formats.displayWidth = formats.displayWidth || formats.atrrs.displayWidth;
            }


            let formatStr = '',
                formatsSetting = {
                    trueExpr: '1'
                    , displayWidth: 0
                },

                f: any = Object.assign(formatsSetting, formats),
                dataType = f.dataType,
                displayFormat = f.displayFormat,
                trueExpr = f.trueExpr ? f.trueExpr : 1;

            if (tools.isEmpty(text)) {
                return formatStr;
            }

            // 如果是数字类型，但值却不是数字，则不处理直接显示
            if (Rule.isNumber(dataType) && typeof text !== 'number' && !isNum) {
                formatStr = text;
            } else {
                switch (dataType) {
                    case Rule.DT_NUMBER:
                        // 数值
                        formatStr = Rule.parseNumber(text, displayFormat);
                        break;
                    case Rule.DT_MONEY:
                        //￥#,### 货币代码 + 数值格式
                        formatStr = '¥' + Rule.parseNumber(text, displayFormat.slice(1));
                        break;
                    case Rule.DT_DATETIME:
                    case Rule.DT_TIME:
                        //YYYY-MM-DD HH24:MI:SS 日期
                        //HH24:MI:SS 时间
                        formatStr = Rule.strDateFormat(<string>text, displayFormat);
                        break;
                    case Rule.DT_PERCENT:
                        //百分比
                        formatStr = Rule.parseNumber(<number>text * 100, displayFormat.slice(0, -1)) + '%';
                        break;
                    case Rule.DT_BOOL:
                        //布尔
                        // 临时 双等号, 目前不清楚是否可以确定类型
                        formatStr = (text == trueExpr) ? '是' : '否';
                        break;


                    case Rule.DT_MULTI_TEXT:
                        formatStr = `<pre>${text}</pre>`;

                        break;
                    case Rule.DT_HTML:
                    default:
                        formatStr = text.toString();
                }
            }


            if (isWidth && f.displayWidth > 0) {
                formatStr = tools.str.cut(formatStr, f.displayWidth);
            }

            return formatStr;
        };

        /**
         * 表格数据展示
         * @param {string | number} text
         * @param {object} formats
         * @param {string} formats.dataType
         * @param {string} [formats.displayFormat]
         * @param {string} [formats.trueExpr = 1]
         * @param {int} [formats.displayWidth = 0]
         * @return {string} - 返回处理后的文字，与文字的位置(左右对齐)
         */
        static formatTableText(text, formats) {
            let t = Rule.formatText(text, formats, false);
            if (formats.atrrs) {
                formats.dataType = formats.dataType || formats.atrrs.dataType;
            }
            switch (formats.dataType) {
                case Rule.DT_HTML:
                case Rule.DT_MULTI_TEXT:
                    t = tools.str.removeEmpty(tools.str.removeHtmlTags(<string>text));
                    break;
                case Rule.DT_FILE:
                    if (!tools.isEmpty(t)) {
                        t = '<span title="' + t + '" class="ti-clip"></span> ' + t;
                    }
                    break;
            }

            return t;
        };

        static dateFormat(date: Date, fmt: string) {
            let o = {
                "M+": date.getMonth() + 1,                 //月份
                "d+": date.getDate(),                    //日
                "H+": date.getHours(),                   //小时
                "m+": date.getMinutes(),                 //分
                "s+": date.getSeconds(),                 //秒
                "S": date.getMilliseconds()             //毫秒
            };
            if (/(y+)/.test(fmt))
                fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
            for (let k in o)
                if (new RegExp("(" + k + ")").test(fmt))
                    fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            return fmt;
        }

        static strDateFormat(dateStr: string, fmt?: string) {
            let date:Date = null;
            if (dateStr === '%date%'){
                date = new Date();
            }else{
                date = new Date(dateStr);
            }
            if (!isNaN(date.getTime()) && fmt) {
                return Rule.dateFormat(date, fmt);
            }
            return dateStr;
        }

        static reqAddr(reqAddr: R_ReqAddr, dataObj?: obj | obj[]) {
            // console.log(reqAddr, dataObj);
            let {addr, data} = this.reqAddrFull(reqAddr, dataObj);
            // console.log(addr,111111111 ,data);
            return tools.url.addObj(addr, data);
        }

        static reqAddrFull(reqAddr: R_ReqAddr, data?: obj | obj[]): { addr: string, data: obj } {
            if (!this.reqAddrCommit[reqAddr.commitType]) {
                reqAddr.commitType = 1;
            }
            
            return this.reqAddrCommit[reqAddr.commitType](reqAddr, data);

        }

        static reqAddrCommit = {
            1: function (reqAddr: R_ReqAddr, data?: obj | obj[]) {
                let varData = Rule.varList(reqAddr.varList, data, true),
                    urlPara: { [key: string]: obj[] | string } = {};

                if (reqAddr.varType === 2) {
                    if (!Array.isArray(varData)) {
                        varData = [varData];
                    }
                    (<obj[]>varData).forEach(function (d) {
                        for (let key in d) {
                            if (!urlPara[key]) {
                                urlPara[key] = [];
                            }
                            (<obj[]>urlPara[key]).push(d[key])
                        }
                    });

                    if (!tools.isEmpty(reqAddr.varList) && !reqAddr.varList[1]) {
                        //长度等于1
                        let varName = reqAddr.varList[0].varName.toLowerCase();
                        urlPara['selection'] = urlPara[varName];
                        delete urlPara[varName];
                    }
                    for (let key in urlPara) {
                        let para = <obj[]>urlPara[key];
                        if (Array.isArray(para)) {
                            urlPara[key.toLocaleLowerCase()] = para.join(',');
                        }
                    }
                }

                return {
                    addr: reqAddr.dataAddr,
                    data: reqAddr.varType === 2 ? <obj>urlPara : varData
                }
            },
            
        };
        /**
         * 解析varList数据
         * @param {Array} varList - 服务端的varList
         * @param {String} varList.varName
         * @param {String} varList.varValue
         * @param {Object} data - 需要填充varList的数据, 一般是数据查询的数据
         * @param {boolean} [isLowerKey] 键值是否转为小写
         * @param {boolean} [isLimitField]
         * @returns {object}
         */
        static varList(varList: R_VarList[] = [], data: obj | obj[], isLowerKey = false, isLimitField = true): obj | obj[] {
            if (typeof data === 'undefined') {
                return {};
            }

            let isMulti = Array.isArray(data);
            isMulti || (data = [data]);
            varList = Array.isArray(varList) ? varList : [];

            let varData = (<obj[]>data).map(function (d) {
                let tmpData = {};
                varList.forEach(function (v) {
                    let value = null,
                        varName = v.varName;

                    if (d[varName] !== null && d[varName] !== undefined) {
                        //优先从用户给的data取值
                        value = d[varName];

                    } else if (!tools.isEmpty(v.varValue)) {
                        //再从服务器给的value
                        value = v.varValue;
                    }

                    // if (value !== null) {
                    let key = isLowerKey ? varName.toLowerCase() : varName;
                    tmpData[key] = value;
                    // }
                });
                if(!isLimitField){
                    for(let key in d){
                        if(key.indexOf('.') > -1){
                            tmpData[key] = d[key];
                        }
                    }
                }

                return tmpData;
            });

            if (isMulti) {
                varData = varData.filter(data => !tools.isEmpty(data));
                if (tools.isEmpty(varData)) {
                    varData = null;
                }
            }
            return isMulti ? varData : varData[0];
        }

        /**
         * 解析parseVarList数据
         * @param parseVarList
         * @param data
         */
        static parseVarList(parseVarList : R_VarList[], data : obj | obj[]){
            let isMulti = Array.isArray(data);
            isMulti || (data = [data]);
            parseVarList = Array.isArray(parseVarList) ? parseVarList : [];

            let parData = (<obj[]>data).map(function (d) {
                let para = {};
                parseVarList.forEach(function (p) {
                    para[p.varName] = tools.str.parseTpl(p.varValue, d);
                });
                return para;
            });

            return isMulti ? parData : parData[0];
        }
    }
}

