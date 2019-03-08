/// <amd-module name="Validate"/>
import tools = G.tools;

export interface ValidateRule {
    rule: string; // maxLength, maxValue, minLength, minValue, requieredFlag, regExp
    errMsg?: string;
    title?: string,
    value?: any
}

export interface ValidateResult {
    // 数据键值
    [dataName: string]: {
        errMsg: string; // 错误信息
        rule: keyof typeof errMsgs; // 规则名称
    }
}

let errMsgs = {
    number: '{{title}}必须是数字',
    maxLength: '{{title}}的最大长度不超过{{value}}',
    maxValue: '{{title}}超过最大值{{value}}或者为非数字',
    minLength: '{{title}}小于最小长度{{value}}或者为非字符串',
    minValue: '{{title}}小于最小值{{value}}或者为非数字',
    requieredFlag: '{{title}}为空',
    regExp: '{{title}}匹配正则规则{{value}}',
    validChars: '{{title}}必须由“{{value}}”组成'
};

const strategies = {
    validChars: function (data, value: string) {
        if (typeof data === 'string' && tools.isNotEmpty(data)) {
            return data.split('').every((char) => {
                return value.indexOf(char) > -1;
            });
        } else {
            return true;
        }
    },

    maxLength: function (data, value) {
        if (value === 0) {
            return true;
        }
        return tools.isEmpty(data) ? true : (typeof data == "string" ? !(data.length > value) : true);
    },

    maxValue: function (data, value) {
        return tools.isEmpty(data) ? true : (typeof data == "number" ? data < value : true);
    },

    minLength: function (data, value) {
        if (value === 0) {
            return true;
        }
        return tools.isEmpty(data) ? true : (typeof data == "string" ? !(data.length < value) : true);
    },

    minValue: function (data, value) {
        return tools.isEmpty(data) ? true : (typeof data == "number" ? !(data < value) : true);
    },

    requieredFlag: function (data, value) {
        return value ? tools.isNotEmpty(data) : true;
    },

    regExp: function (data, value) {
        return data ? data.match(new RegExp(value)) != null : true;
    },

    number: function (data, value) {
        if (tools.isEmpty(data)) {
            return true;
        } else {
            return !isNaN(data);
        }
    }
};


export class Validate {
    private name2Rules: objOf<ValidateRule[]> = {};

    add(dataName: string, rules: ValidateRule[]) {
        this.name2Rules[dataName] = rules;
    }

    get(dataName) {
        return this.name2Rules[dataName];
    }

    start(data: obj) {
        let result: ValidateResult = null;
        for (let name in this.name2Rules) {
            let rules = this.name2Rules[name];
            for (let r of rules) {
                if (name in data && (data[name] !== undefined || r.rule === 'requieredFlag')) {
                    if (!strategies[r.rule](data[name], r.value)) {
                        let err = r.errMsg ? r.errMsg : errMsgs[r.rule];
                        err = G.tools.str.parseTpl(err, {
                            title: r.title,
                            value: r.value
                        });

                        if (result === null) {
                            result = {};
                        }

                        result[name] = {
                            errMsg: err,
                            rule: <keyof typeof errMsgs>r.rule
                        };

                        break;
                    }
                }
            }
        }
        return result;
    }
}

