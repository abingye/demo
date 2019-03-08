onmessage = function (ev) {
    let result = null;
    switch(ev.data.type){
        case "cols" :
            result = crossTable.getCols(ev.data.data.config);
            break;
        case "data":
            result = crossTable.getData(ev.data.data);
            break
    }
    postMessage({type: ev.data.type, result}, void 0);
};

let crossTable = (() => {
    let cols = [];
    let getCols = (conf) => {
        let result = null,
            resultLength = conf.col.length + (conf.val.length === 1 ? 0 : 1);
        cols = conf.cols;
        if(conf.colsSum){
            result = getSumCols(conf.col, conf.val, conf.data, resultLength);
        }else{
            result = getNotSumCols(conf.col, conf.val, conf.data, resultLength);
        }

        conf.row.forEach((name, index) => {
            let title = getTitle(name);
            result[0].splice(index, 0, {
                title,
                name,
                rowspan: resultLength,
                isFixed: conf.isFixed,
            })
        });

        return result;
    };

    let getNotSumCols = (colNames, values, colsData, resultLength) => {
        let scope = values.length,
            valSum = 0,
            result: any[][] = Array.from({length: resultLength}, () => []);

        colNames.forEach((name, index) => {
            colsData.forEach((data, i) => {
                // conf.val.forEach(val => {
                let colspan = scope;
                result[index].push({
                    title: data[name],
                    name: name + '-' + i,
                    colspan
                });
                valSum += colspan;
                // });
            });
        });

        if(scope > 1) {
            for (let i = 0, valLen = values.length; i < valSum; i += valLen) {
                let num = i / valLen;
                values.forEach((name, index) => {
                    let title = getTitle(name);
                    result[result.length - 1].push({
                        title,
                        name: name + '-' + num,
                    })
                });
            }
        }else{
            let lastIndex = result.length - 1;
            for (let i = 0, valLen = values.length; i < valLen; i ++) {
                let name = values[i];
                result[lastIndex].forEach((item, index) => {
                    if((index - i) % valLen === 0) {
                        item.name = name + '-' + (index - i) / valLen;
                    }
                });
            }
        }
        return result;
    };

    let getSumCols = (colNames, values, colData, resultLength) => {
        let colLength = colNames.length,
            scope = values.length,
            valSum = 0,
            result: any[][] = Array.from({length: resultLength}, () => []);

        colNames.forEach((name, index) => {
            colData.forEach((data, i) => {
                let colspan = (colLength - index) * scope;
                result[index].push({
                    title: data[name],
                    name: name + '-' + i,
                    colspan: colspan,
                });
                if (index > 0) {
                    result[index].push({
                        title: '合计',
                        name: name + '-total-' + i,
                        rowspan: colLength - index,
                        colspan: scope
                    });
                } else {
                    valSum += colspan;
                }
            })
        });
        result[0].push({
            title: '合计',
            name: 'total',
            rowspan: colLength,
            colspan: scope,
        });

        let totalIndex = 0;
        if(scope > 1) {
            for (let i = 0, valLen = values.length; i < valSum; i += valLen) {
                let num = i / valLen;
                values.forEach((name, index) => {
                    let title = getTitle(name);
                    result[result.length - 1].push({
                        title,
                        name: name + '-total-' + totalIndex,
                    })
                });
                totalIndex++;
            }
        }else{
            let name = values[0];
            result[0].forEach((item, index) => {
                item.name = name + '-' + index;
            });
        }
        values.forEach((name, index) => {
            let title = getTitle(name);
            result[result.length - 1].push({
                title,
                name: name + '-total',
            })
        });

        return result;
    };
    let getTitle = (name) => {
        for (let value of cols) {
            if (Object.values(value).includes(name)) {
                return value.title;
            }
        }
        return '';
    };

    let getSumData = (config, defaultObj) => {
        let result = [];
        config.data.forEach(() => {

        });
        return result;
    };
    let getNotSumData = (config, defaultObj) => {
        let result = [];
        config.data.forEach((data, index) => {
            let obj = {};
            config.row.forEach((name, i) => {
                obj[name] = data[name];
            });
            config.val.forEach((name, i) => {
                obj[name + '-' +  index] = data[name];
            });
            result.push(Object.assign({}, defaultObj, obj));
        });
        return result;
    };

    let getData = ({cols, config}: {cols: Array<obj>, config}) => {
        let result = [];

        let defaultObj = {};
        for(let col of cols){
            defaultObj[col.name] = null;
        }

        if(config.colsSum){
            result = getSumData(config, defaultObj);
        }else{
            result = getNotSumData(config, defaultObj);
        }

        return result;
    };

    return {
        getCols,
        getData,
    }
})();