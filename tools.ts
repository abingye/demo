/**
 * js各种公用且与业务无关的工具类方法
 */
namespace G {
    let isMb = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    export let tools = {

        toArray<T>(any:T|T[]):T[]{
            if(!Array.isArray(any)){
                return [any];
            }else {
                return any
            }
        },
        /**
         * undefined null '' [] {} 为空
         * @param {*} obj
         * @return {boolean} is_empty
         */
        isEmpty(obj) {
            let is_empty = false;
            if (obj === undefined || obj === null || obj === '') {
                is_empty = true;
            } else if (Array.isArray(obj) && obj.length === 0) {
                is_empty = true;
            } else if (obj.constructor === Object && Object.keys(obj).length === 0) {
                is_empty = true;
            }
            return is_empty;
        },
        isNotEmpty(obj) {
            return !tools.isEmpty(obj)
        },
        isNotEmptyArray(arr) {
            return Array.isArray(arr) && !tools.isEmpty(arr)
        },
        isFunction(fun) {
            return typeof fun === 'function';
        },
        isUndefined(any) {
            return typeof any === 'undefined';
        },
        isPrimitive(any) {
            return ['string', 'number', 'boolean'].includes(typeof any)
        },
        // randomColor() {
        //     let colorClass = ['blue', 'green', 'yellow', 'red', 'purple', 'black', 'grey'];
        //     return colorClass[(Math.random() * (colorClass.length - 1)).toFixed(0)];
        // },
        escapeRegExp(str) {
            return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        },
        cssSupports(property: string, value: string): boolean {
            if('CSS' in window && CSS && CSS.supports){
                return CSS.supports(property, value) || CSS.supports(property + ':' + value);
            }
            return false;
        },
        /**
         * 为特定字符串设置为高亮
         * @param {string} str - 整个字符串
         * @param {string} hlstr - 需要设置为高亮的字符串
         * @param {string} color - 高亮颜色
         * @param {boolean} ignoreCase
         * @returns {string}
         */
        highlight(str: string, hlstr: string, color: string, ignoreCase = true) {

            if (typeof str === 'string' && hlstr.trim()) {
                let searchPara = new RegExp(`(${tools.escapeRegExp(hlstr)})`, ignoreCase ? 'ig' : 'g');
                return str.replace(searchPara, `<span class="${color}">$1</span>`);

            } else {
                return str;
            }
        },
        /**
         * 直接通过键值组获取数据，没有则返回undefined
         * @param obj
         * @param {(number | string)[]} keys - 键值数组
         * @return {boolean}
         */
        keysVal(obj, ...keys: (number | string)[]) {
            let last = obj,
                keyLen = keys.length;

            for (let i = 0; i < keyLen; i++) {
                let key = keys[i];

                if (typeof last === 'object' && last !== null) {
                    if (key in last) {
                        last = last[key];
                    } else {
                        return undefined;
                    }

                    // 最后
                } else {
                    return i === keyLen - 2 ? last : undefined;
                }
            }

            return last;
        },

        copy(text: string) {
            let input = <HTMLTextAreaElement>d.create(
                '<textarea style="position: absolute;top: -1px;height: 1px;width: 1px;"></textarea>');
            input.value = text;
            d.append(document.body, input);
            input.select();
            document.execCommand("Copy");
            // G.Modal.toast('复制成功');
            d.remove(input);
        },
        getGuid: (function () {
            let guid = 999;
            return function (prefix = 'guid-') {
                return `${prefix}${guid++}`
            }
        }()),
        isMb: isMb,
        isPc: !isMb,
        val2RGB(colorVal: number | string) {
            let r = 0,
                g = 0,
                b = 0;

            // 显示颜色
            if (typeof colorVal !== 'number') {
                colorVal = parseInt(colorVal);
            }
            if (typeof colorVal == 'number' && !isNaN(colorVal)) {
                r = colorVal % 256;
                g = Math.floor(colorVal / 256) % 256;
                b = Math.floor(colorVal / 256 / 256) % 256;
            }

            return {r, g, b};
        },
        url: {
            /*
            * 替换url中的模板数据
            * 例：http://www.test.cn/sf/{name}/a => http://www.test.cn/sf/name/a
            * @param {string} url - 要替换的路径地址
            * @param {obj} data - 根据数据替换url中花括号{}的数据
            * */
            replaceTmpUrl(url: string, data: obj){
                return url ? url.replace(/{([\w\W]+?)}/g, (str, name) => {
                    return tools.isEmpty(data[name]) ? name : data[name];
                }): '';
            },
            /**
             * 获取url中请求参数的值
             * @param {string} name - 参数名
             * @param {string} [url]
             * @returns {*}
             */
            getPara: function (name: string, url = window.location.href) {
                let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
                let r = url.split('?')[1] ? url.split('?')[1].match(reg) : null;
                return r !== null ? decodeURIComponent(r[2]) : null;
            },
            /**
             * url连接object为后面的参数
             * @param {string} url
             * @param {object} obj
             * @param {boolean} [isLowCase=true]
             * @param {boolean} [isReplace=false]
             * @return {string}
             */
            addObj: function (url: string, obj: obj, isLowCase = true, isReplace = false) {
                if(Array.isArray(obj)){
                    return url;
                }
                let paraObj = Object.assign({}, obj || {});
                if(isReplace){
                    let currentPara = tools.url.getObjPara(url, isLowCase);
                    paraObj = Object.assign(currentPara, tools.obj.copy(paraObj, isLowCase));
                    url = url.split('?')[0];
                }else{
                    for (let key in paraObj) {
                        if (tools.url.getPara(key, url)) {
                            delete paraObj[key];
                        }
                    }
                }
                if (!tools.isEmpty(paraObj)) {
                    return url + (url.indexOf('?') === -1 ? '?' : '&') + tools.obj.toUri(paraObj, isLowCase);
                } else {
                    return url;
                }
            },
            getObjPara(url: string, isLowCase = true){
                let theRequest = {};
                if (url.indexOf("?") != -1) {
                    let str = url.split('?')[1],
                        strs = str.split("&");
                    for(let i = 0; i < strs.length; i ++) {
                        let map = strs[i].split("=");
                        theRequest[isLowCase ? map[0].toLowerCase() : map[0]] = decodeURIComponent(map[1]);
                    }
                }
                return theRequest;
            }
        },
        str: {
            /**
             * null,undefined,false 转为 ''
             * @param value
             * @param str
             * @return {*|string}
             */

            toEmpty: function (value: any, str: string = '') {
                return value || value === 0 ? value : str;
            },
            /**
             * 移除html标签
             * @param s
             * @return {string}
             */
            _htmlTagReg: /(&nbsp;|<([^>]+)>)/ig,
            removeHtmlTags: function (s: string) {
                if (typeof s === 'string') {
                    return s.replace(tools.str._htmlTagReg, '').replace(/\s+/g, ' ');
                } else {
                    return s;
                }
                // let div = document.createElement('div');
                // div.innerHTML = s;
                // return div.innerText;
            },
            /**
             * html encode
             * @param html
             * @return {string}
             */
            htmlEncode: function (html: string) {
                if (html === null || typeof html === 'undefined') {
                    html = '';
                }


                return html.toString().replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/\//g, '&#x2F;');

            },
            /**
             * 解析模版 模板中的{{xxx}} 对应 data中的属性名xxx
             * @param tpl
             * @param data
             * @param isEncode
             * @param regExp
             * @param num 1:{}  2:{{}}
             * @return {string}
             */
            parseTpl: function (tpl: string, data: obj, isEncode = true, num : number = 2, regExp? : RegExp) {
                let parseReg = regExp || /\{\{\S+?}}/g,
                    self = this;
                return tpl.replace(parseReg, function (param) {
                    param = param.slice(num, -num);

                    let [key, param1] = param.split(','),
                        isEn = param1 ? param1 === '1' : isEncode,
                        isRemove = param1 ? param1 === '2' : false;

                    return tools.isEmpty(data[key]) ? '' :
                        (isRemove ? self.htmlEncode(self.removeHtmlTags(data[key])) :
                            (isEn ? self.htmlEncode(data[key]) : data[key]));
                });
            },
            removeEmpty: function (str: string) {
                let parseReg = /\s{2,}/g;
                if (typeof str === 'string') {
                    return str.replace(parseReg, ' ');
                }
                return str;
            },

            /**
             * 按utf-8编码 截取字符串
             * @param {string} str 字符串
             * @param {int} len 长度
             * @return {string}
             */
            cut: function (str: string, len: number) {
                let cutStr = '';
                let realLength = 0;
                if (!tools.isEmpty(len)) {
                    let sLen = str.length;
                    for (let i = 0; i < sLen; i++) {
                        if (str.charCodeAt(i) >= 0 && str.charCodeAt(i) <= 128) {
                            realLength += 1;
                        } else {
                            realLength += 2;
                        }
                        if (realLength > len) {
                            continue;
                        }
                        cutStr += str[i];
                    }

                    if (cutStr.length > 0 && realLength > len) {
                        cutStr += '...';
                    }
                } else {
                    cutStr = str;
                }

                return cutStr;
            },
            utf8Len: function (str) {
                let sLen = str.length,
                    utf8len = 0;
                for (let i = 0; i < sLen; i++) {
                    if (str.charCodeAt(i) >= 0 && str.charCodeAt(i) <= 128) {
                        utf8len += 1;
                    } else {
                        utf8len += 2;
                    }
                }
                return utf8len;
            },
            toBytes: function (str) {
                let pos = 0;
                let len = str.length;
                if (len % 2 != 0) {
                    return null;
                }
                len /= 2;
                let hexA = [];
                for (let i = 0; i < len; i++) {
                    let s = str.substr(pos, 2);
                    let v = parseInt(s, 16);
                    hexA.push(v);
                    pos += 2;

                }
                return hexA;
            },

            /**
             * 为特定字符串设置为高亮
             * @param {string} str - 整个字符串
             * @param {string} hlstr - 需要设置为高亮的字符串
             * @param {string} hue - 高亮颜色
             * @returns {string}
             */
            setHeightLight: function (str, hlstr, hue) {
                let color = {
                    red: '#dd524d',
                };
                if (Object.prototype.toString.call(str).slice(8, -1) === 'String') {
                    return str.replace(hlstr, `<span style="color:${hue}" >${hlstr}</span>`);
                } else {
                    return str;
                }
            }

        },
        obj: {
            /**
             * 原型继承
             * @param Child 子类
             * @param Parent 父类
             * @param {Object} [newProto] 需要重写的prototype
             */
            protoExtend: function (Child, Parent, newProto) {
                newProto = newProto || {};
                let F = function () {
                };
                F.prototype = Parent.prototype;
                Child.prototype = new F();
                //新的proto
                for (let attr in newProto) {
                    if (!newProto.hasOwnProperty(attr)) {
                        continue;
                    }
                    Child.prototype[attr] = newProto[attr];
                }
                Child.prototype.constructor = Child;
            },

            /**
             * 对象转成url参数
             * @param {Object} object
             * @param {boolean} isLowCase
             * @returns {string} urlDataStr
             */
            toUri: function (object: obj, isLowCase = true) {
                let urlDataStr = '';
                if(object){
                    for (let key in object) {
                        if (object.hasOwnProperty(key)) {
                            urlDataStr += `&${isLowCase ? key.toLowerCase() : key}=${encodeURIComponent(object[key])}`;
                        }
                    }
                }

                return urlDataStr.slice(1);
            },
            /**
             * object转dom属性
             * @param {Object} object
             * @return {string}
             */
            toAttr: function (object): string {
                let attrStr = '';
                for (let key in object) {
                    if (object.hasOwnProperty(key)) {
                        attrStr += (' ' + key + '="' + tools.str.htmlEncode(object[key]) + '"');
                    }
                }
                return attrStr;
            },
            /**
             * 浅复制Object
             * @param {object} object
             * @return {object}
             */
            copy: function (object, isLowCase = false): any {
                let key, cp = {};
                for (key in object) {
                    if (object.hasOwnProperty(key)) {
                        let name = key;
                        if(isLowCase){
                            name = name.toLowerCase();
                        }
                        cp[name] = object[key];
                    }
                }
                return cp;
            },
            /**
             * 对象合并，第一个参数为true时，则为深度合并
             * @param args
             * @return {{}}
             */


            merge: function (...args): obj {
                // Variables
                let extended = {};
                let deep = false;
                let i = 0;
                let length = args.length;

                // Check if a deep merge
                if (Object.prototype.toString.call(args[0]) === '[object Boolean]') {
                    deep = args[0];
                    i++;
                }

                // Merge the object into the extended object
                let merge = function (obj) {
                    for (let prop in obj) {
                        if (!Object.prototype.hasOwnProperty.call(obj, prop)) {
                            continue;
                        }
                        // If deep merge and property is an object, merge properties
                        let objStr = Object.prototype.toString.call(obj[prop]);
                        if (deep && (objStr === '[object Object]' || objStr === '[object Array]')) {

                            if (objStr === '[object Object]') {
                                extended[prop] = tools.obj.merge(true, extended[prop], obj[prop]);
                            } else {
                                extended[prop] = obj[prop].slice(0);
                            }
                        } else {
                            extended[prop] = obj[prop];
                        }
                    }
                };

                // Loop through each object and conduct a merge
                for (; i < length; i++) {
                    let obj = args[i];
                    merge(obj);
                }

                return extended;
            },
            /**
             * 对象转数组
             * @param {obj} o
             * @return {Array}
             */
            toArr(o: obj) {
                let arr = [];
                for (let key in o) {
                    if (o.hasOwnProperty(key)) {
                        arr.push(o[key])
                    }
                }
                return arr;
            },
            /**
             * 比较两个对象是否相等
             * @param o1
             * @param o2
             * @returns {boolean}
             */
            isEqual(o1,o2){
                let props1 = Object.getOwnPropertyNames(o1),
                    props2 = Object.getOwnPropertyNames(o2);
                if (props1.length != props2.length) {
                    return false;
                }
                for (let i = 0,max = props1.length; i < max; i++) {
                    let propName = props1[i];
                    if (o1[propName] !== o2[propName]) {
                        return false;
                    }
                }
                return true;
             }

},
        cookie: {
            set: function (name, value, days?) {
                let expires = "";
                if (days) {
                    let date = new Date();
                    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                    expires = "; expires=" + date.toUTCString();
                }
                document.cookie = name + "=" + value + expires + "; path=/sf";
            },
            get: function (name) {
                let nameEQ = name + "=";
                let ca = document.cookie.split(';');
                for (let i = 0; i < ca.length; i++) {
                    let c = ca[i];
                    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
                }
                return null;
            },
            clear: function eraseCookie(name) {
                this.set(name, "", 0);
            }
        },
        valid: {
            isTel: function (tel) {
                return /^1\d{10}$/.test(tel);
            },

            // isObj: function (obj) {
            //     return Object.prototype.toString.call(obj).substring(8, 1) === 'object';
            // }
        },
        event: {
            /**
             * 触发自定义事件
             * @param eventName
             * @param detail
             * @param [win]
             */
            fire: function (eventName: string, detail = null, win: EventTarget = window) {
                let e = null;
                if (typeof eventName !== 'string' || !eventName) {
                    return;
                }
                if ('CustomEvent' in window) {
                    e = new CustomEvent(eventName, {detail: detail, bubbles: true});
                } else {
                    e = document.createEvent('CustomEvent');
                    e.initCustomEvent(eventName, true, false, {detail: detail});
                }
                win.dispatchEvent(e);
            }
        },
        date: {
            oneDay: 86400000,
            today: () => new Date(),
            add: (date: Date, day: number) => {
                date.setTime(date.getTime() + day * tools.date.oneDay);
                return date;
            },
            tomorrow: () => tools.date.add(new Date(), 1),
            yesterday: () => tools.date.add(new Date(), -1),
            range: {
                today: () => {
                    return tools.date._getRange(new Date(), new Date());
                },
                yesterday: () => {
                    return tools.date._getRange(tools.date.yesterday(), tools.date.yesterday());
                },
                tomorrow: () => {
                    return tools.date._getRange(tools.date.tomorrow(), tools.date.tomorrow());
                },
                thisWeek: () => {
                    let date1 = new Date(), date2 = tools.date.yesterday(),
                        day = date1.getDay();
                    return tools.date._getRange(tools.date.add(date1, -7), date2);
                },
                lastWeek: () => {
                    let date1 = new Date(), date2 = new Date();
                        // lastWeekDay = date1.getDay();

                    // lastWeekDay = lastWeekDay === 0 ? 7 : lastWeekDay;
                    return tools.date._getRange(tools.date.add(date1, -14), tools.date.add(date2, -8));
                },

                thisMonth: () => {
                    let date = new Date(),
                        year = date.getFullYear(),
                        month = date.getMonth();

                    return tools.date._getRange(new Date(year, month, 1), new Date(year, month + 1, 0));
                },
                lastMonth: () => {
                    let date = new Date();
                    date.setMonth(date.getMonth() - 1);
                    let year = date.getFullYear(),
                        month = date.getMonth();

                    return tools.date._getRange(new Date(year, month, 1), new Date(year, month + 1, 0));
                },
                _getSeasonIndex: (date: Date) => Math.floor(date.getMonth() / 3),
                _getSeason: (year, season) => {
                    let firstMonth = season * 3,
                        monthLen = ((firstMonth / 9 % 1 === 0) ? 31 : 30);
                    return tools.date._getRange(new Date(year, firstMonth, 1), new Date(year, firstMonth + 2, monthLen))
                },
                // (year) => [new Date(year, 3, 1), new Date(year, 5, 30)],
                // (year) => [new Date(year, 6, 1), new Date(year, 8, 30)],
                // (year) => [new Date(year, 9, 1), new Date(year, 11, 31)]
                thisSeason: () => {
                    let date = new Date(),
                        dateRange = tools.date.range;

                    return dateRange._getSeason(date.getFullYear(), dateRange._getSeasonIndex(date));
                },
                lastSeason: () => {
                    let date = new Date(),
                        dateRange = tools.date.range,
                        lastSeasonIndex = (dateRange._getSeasonIndex(date) - 1 + 4) % 4,
                        year = date.getFullYear() - (lastSeasonIndex === 3 ? 1 : 0);

                    return dateRange._getSeason(year, lastSeasonIndex);
                },
                thisYear: () => {
                    let year = new Date().getFullYear();
                    return tools.date._getRange(new Date(year, 0, 1), new Date(year, 11, 31));
                },
                lastYear: () => {
                    let year = new Date().getFullYear() - 1;
                    return tools.date._getRange(new Date(year, 0, 1), new Date(year, 11, 31));
                }
            },
            _getRange: (date1: Date, date2: Date) => {
                date1.setHours(0, 0, 0, 0);
                date2.setHours(23, 59, 59, 999);
                return [date1, date2];
            },
            format: (date: Date, fmt: string) => {
                if (!fmt) {
                    return date.toString();
                }
                let o = {
                    "M+": date.getMonth() + 1,                 //月份
                    "d+": date.getDate(),                    //日
                    "H+": date.getHours(),                   //小时
                    "m+": date.getMinutes(),                 //分
                    "s+": date.getSeconds()                 //秒
                    // "S": date.getMilliseconds()             //毫秒
                };
                if (/(y+)/.test(fmt))
                    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
                for (let k in o)
                    if (new RegExp("(" + k + ")").test(fmt))
                        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                return fmt;
            }
        },

        /**
         * 触发自定义事件
         * @param dataurl base64字符串
         * @param filename 文件名称
         * @param [lastModify] 最后编辑时间
         */
        base64ToFile(dataurl: string, filename: string, lastModify?: number): CustomFile{
            let arr = dataurl.split(',');
            if(arr.length === 2){
                let mime = arr[0].match(/:(.*?);/)[1],
                    bstr = atob(arr[1]),
                    n = bstr.length,
                    u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                let blob = new Blob([u8arr], {type: mime});
                return {
                    blob,
                    type: blob.type,
                    name: filename,
                    lastModifiedDate: new Date(lastModify) || new Date().getTime(),
                    size: blob.size
                };
            }else{
                return null;
            }
        },
        pattern: {
            singleton: function (fn) {
                let single = null;
                return function () {

                    return single || (single = fn.apply(this, arguments));
                }
            },
            throttling: function(action, delay){ // 函数节流
                let last = 0;
                return function(...args){
                    let curr = + new Date();
                    if (curr - last > delay){
                        action.apply(this, args) ;
                        last = curr
                    }
                }
            },
            debounce: function (method, delay){ // 函数防抖
                let timer = null;
                return function(...args){
                    let context = this;
                    clearTimeout(timer);
                    timer = setTimeout(function(){
                        method.apply(context, args);
                    },delay);
                }
            }
        },
        /**
         * 获取offset参数
         * @author yrh
         */
        offset: {
            left: function (obj) {
                if (obj === window) {
                    return 0;
                }
                return obj.offsetLeft + (obj.offsetParent ? this.left(obj.offsetParent) : 0);
            },
            top: function (obj) {
                if (obj === window) {
                    return 0;
                }
                return obj.offsetTop + (obj.offsetParent ? this.top(obj.offsetParent) : 0);
            }
        },
        /**
         * 获取滚动条scrollTop
         * @author yrh
         */
        scrollTop: function () {
            return document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
        },
        getScrollTop:function (element:HTMLElement) {
            let ele = element.parentElement,
                scrollTopArr = [];
            while (ele !== document.documentElement){
                scrollTopArr.push(ele.scrollTop);
                ele = ele.parentElement;
            }
            for (let i = scrollTopArr.length-1;i >= 0 ;i--){
                if(scrollTopArr[i] !== 0){
                    return scrollTopArr[i];
                }
            }
            return document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
        },
        calc: function (express: string) {
            let operator = '',
                num1 , num2;
            if(typeof express !== 'string'){
                return;
            }

            express = express.replace(/\s+/g, '');
            for(let i = 0,len = express.length; i < len; i ++) {
                let char = express[i];
                if(~'+-*/'.indexOf(char)) {
                    if(i === 0 && ~'+-'.indexOf(char)){
                        continue
                    }
                    operator = char;
                    num1 = Number(express.substr(0, i));
                    num2 = Number(express.substr(i + 1));

                    break;
                }
            }
            // for(let op of ['+','-','*','/']){
            //     if(~express.indexOf(op)) {
            //         operator = op;
            //         [num1, num2] = express.split(op);
            //
            //         num1 = Number(num1);
            //         num2 = Number(num2);
            //
            //         break;
            //     }
            // }
            if(!operator) {
                return Number(express);
            }
            let is1Num = !isNaN(num1);
            let is2Num = !isNaN(num2);
            if(!is1Num && ['+','-'].includes(operator)){
                return Number(operator + num2);
            }

            if(is1Num && !operator && !is2Num) {
                return num1;
            }

            if(operator && is1Num && is2Num) {
                switch (operator) {
                    case '+':
                        return num1 + num2;
                    case '-':
                        return num1 - num2;
                    case '*':
                        return num1 * num2;
                    case '/':
                        return num1 / num2;
                }
            }

            return NaN;
        },
        // select多选下拉框，选中项移动
        // selectMove: function (oldSel, newSel) {
        //     let opts = oldSel.options;
        //     for (let i = 0, l = opts.length; i < l; i++) {
        //         if (opts[i].selected) {
        //             newSel.appendChild(opts[i]);
        //             i--;
        //             l--;
        //         }
        //     }
        // },

        iPage: function (src, attrs) {
            let iframe = d.create(`<iframe class="pageIframe" src="${src}" ${tools.obj.toAttr(attrs)}></iframe>`);

            document.body.appendChild(iframe);

            return {
                show: function () {
                    // console.log(1);
                    iframe.classList.add('active');
                },

                close: function () {
                    iframe.classList.remove('active');
                },
                get: () => iframe
            }
        },

        // 设置select表单选中
        selVal(select, val) {
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].value == val) {
                    select.options[i].selected = true;
                    break;
                }
            }
        },
        os: (() => {
            const ua = navigator.userAgent,
                os = {
                    wechat: {
                        version: ''
                    },
                    ios: false,
                    iphone: false,
                    ipad: false,
                    android: false,
                    version: ''
                };

            const funcs = [
                function () { //wechat
                    let wechat = ua.match(/(MicroMessenger)\/([\d\.]+)/i);
                    if (wechat) { //wechat
                        os.wechat = {
                            version: wechat[2].replace(/_/g, '.')
                        };
                    }
                    return false;
                },
                function () { //android
                    let android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
                    if (android) {
                        os.android = true;
                        os.version = android[2];

                        // os.isBadAndroid = !(/Chrome\/\d/.test(window.navigator.appVersion));
                    }
                    return os.android;
                },
                function () { //ios
                    let iphone = ua.match(/(iPhone\sOS)\s([\d_]+)/);
                    if (iphone) { //iphone
                        os.ios = os.iphone = true;
                        os.version = iphone[2].replace(/_/g, '.');
                    } else {
                        let ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
                        if (ipad) { //ipad
                            os.ios = os.ipad = true;
                            os.version = ipad[2].replace(/_/g, '.');
                        }
                    }
                    return os.ios;
                }
            ];
            funcs.every(function (func) {
                return !func();
            });
            return os;
        })()
    };
    // tools.iPage.prototype.getActives = function () {
    //     return document.querySelectorAll('iframe.pageIframe.active');
    // };

    document.body.classList.add(tools.isMb ? 'fl-mobile' : 'fl-pc'); // 全局类

}

var Tools = {
    event : {
        fire : function () {
            G.tools.event.fire.apply(null, arguments);
        }
    }
};
// function applyMixins(derivedCtor: any, baseCtors: any[]) {
//     baseCtors.forEach(baseCtor => {
//         Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
//             derivedCtor.prototype[name] = baseCtor.prototype[name];
//         });
//     });
// }