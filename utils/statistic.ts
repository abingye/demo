/// <amd-module name="statistic"/>

import {TableBase} from "../components/newTable/base/TableBase";
import tools = G.tools;
import {Loading} from "../components/ui/loading/loading";
import {IFastTableCol} from "../components/newTable/FastTable";
import {TreeNodeBase} from "../dataStruct/tree/TreeNodeBase";

interface BT_cross {
    colsSum?: boolean,
    col: any[],       // 列
    row: any[],       // 行
    val: any[]        // 值
    cols: any[],		// 表头数据
    data: any[], 	    // 表格数据
}

interface BT_abc {
    class: string,  // 分类
    val: string,    // 值
    a: number,      // A类比例
    b: number,      // B类比例
    cols: any,		// 表头数据
    data: any	    // 表格数据
}

export class Statistic {
    // 交叉制表
    private colFormula = [];
    private colIndexTemp = 0;
    private cols = [];          // 存储表头顺序，用于渲染表格主体数据
    private dataTemp = {};      // 用于临时存储聚合数据


    /**
     * 构造函数
     * @param paraConf
     */
    constructor() {

    }

    static getCrossTableData = (data: Array<Array<string | number>>, colLength: number = 1, isTotal = true, valTitle: Array<string> = []) => {
        let rows: Array<Array<string | number>> = [],
            cols: Array<Array<string | number>> = [],
            pos: Array<{row: number, col: number, value: number, isTotal: boolean}> = [],
            rowLength = data[0].length - colLength - 1;

        data.forEach((datum, index) => {
            let colItem: Array<string | number> = [],
                rowItem: Array<string | number> = [],
                posItem = {
                    row: -1,
                    col: -1,
                    value: null,
                    isTotal: false
                };

            for(let i = 0; i < cols.length; i++){
                let col = cols[i];
                if(col.every((val, index) => {
                        return val == datum[index]
                    })){
                    posItem.col = i;
                    break;
                }
            }

            for(let i = 0; i < rows.length; i++){
                let row = rows[i];
                if(row.every((val, index) => {
                        return val == datum[colLength + index]
                    })){
                    posItem.row = i;
                    break;
                }
            }

            for(let i = 0; i < datum.length; i++){
                let value = datum[i];
                if(i < colLength) {
                    colItem.push(value);
                }else if(i < datum.length - 1){
                    rowItem.push(value);
                }else{
                    posItem.value = Number(value);
                }
            }
            if(posItem.col === -1){
                colItem['index'] = cols.length;
                posItem.col = cols.push(colItem) - 1;
            }
            if(posItem.row === -1){
                rowItem['index'] = rows.length;
                posItem.row = rows.push(rowItem) - 1;
            }
            pos.push(posItem);
        });

        let tableData: Array<{row: number, col: number, value: number, isTotal: boolean}> = [];
        pos.forEach((datum) => {
            let isAdd = false;
            for(let i = 0; i < tableData.length; i ++){
                let data = tableData[i];
                if(data.row === datum.row && data.col === datum.col){
                    tableData[i].value = tableData[i].value + datum.value;
                    isAdd = true;
                    break;
                }
            }
            !isAdd && tableData.push(datum);
        });

        rows = rows.sort();
        if(isTotal){
            let colItem = new Array(colLength),
                colCount = cols.length,
                rowCount = rows.length,
                valLength = valTitle.length || 1;
            colItem[0] = '合计';
            colItem['index'] = colCount;
            colItem['isTotal'] = true;
            cols.push(colItem);

            if(Array.isArray(valTitle) && valLength > 1){
                valTitle.forEach((title, index) => {
                    let rowItem = new Array(rowLength);
                    rowItem[0] = '合计';
                    rowItem[1] = title;
                    rowItem['index'] = rowCount + index;
                    rowItem['isTotal'] = true;
                    rows.push(rowItem);
                })
            }else{
                let rowItem = new Array(rowLength);
                rowItem[0] = '合计';
                rowItem['index'] = rowCount;
                rowItem['isTotal'] = true;
                rows.push(rowItem);
            }

            for(let i = 0; i < colCount; i ++){
                for(let k = 0; k < valLength; k++) {
                    let value = tableData.reduce((previousValue, currentValue) => {
                        let val = !currentValue.isTotal && (currentValue.col === i && currentValue.row % valLength === k)
                            ? currentValue.value : 0;
                        return previousValue + val;
                    }, 0);
                    tableData.push({
                        row: rowCount + k,
                        col: i,
                        value: value,
                        isTotal: true
                    });
                }
            }

            for(let i = 0; i < rowCount; i ++){
                let value = tableData.reduce((previousValue, currentValue) => {
                    let val = !currentValue.isTotal && currentValue.row === i
                        ? currentValue.value : 0;
                    return previousValue + val;
                }, 0);
                tableData.push({
                    row: i,
                    col: colCount,
                    value: value,
                    isTotal: true
                });
            }

            for(let k = 0; k < valLength; k++) {
                let value = tableData.reduce((previousValue, currentValue) => {
                    let val = currentValue.isTotal && (currentValue.col !== colCount && currentValue.row % valLength === k)
                        ? currentValue.value : 0;
                    return previousValue + val;
                }, 0);
                tableData.push({
                    row: rowCount + k,
                    col: colCount,
                    value: value,
                    isTotal: true
                });
            }

        }
        return {
            tableData,
            rows: rows,
            cols: cols
        }
    };

    static crossTable = (() => {
        let getData = (para: BT_cross) => {
            let tableData = [],
                {
                    data,
                    col,
                    row,
                    val,
                    cols,
                    colsSum
                } = para,
                valTitle = [];
            data.forEach((item) => {
                let datum = [];
                col.forEach((name) => {
                    datum.push(item[name]);
                });
                row.forEach((name) => {
                    datum.push(item[name]);
                });
                if(val.length > 1){
                    val.forEach((name) => {
                        let data = datum.slice();
                        for(let col of cols){
                            if(name === col.name){
                                data.push(col.title);
                                valTitle.push(col.title);
                            }
                        }
                        data.push(item[name]);
                        tableData.push(data);
                    });
                    valTitle = valTitle.slice(0, val.length);
                }else{
                    val.forEach((name) => {
                        datum.push(item[name]);
                    });
                    tableData.push(datum);
                }
            });
            return Statistic.getCrossTableData(tableData, col.length, colsSum, valTitle);
        };

        let getProp = (result, config: BT_cross) => {
            let rowLength = result.rows[0].length,
                fields: IFastTableCol[][] = Array.from({length: rowLength}, () => []),
                colName = config.col,
                values = config.val,
                valFields = [],
                isTotal = config.colsSum;

            config.cols.forEach((col) => {
                if(~colName.indexOf(col.name)){
                    fields[0].push({
                        title: col.title,
                        name: col.name,
                        rowspan: rowLength,
                        isFixed: true
                    })
                }
                if(~values.indexOf(col.name)){
                    valFields.push(col)
                }
            });

            let trees: TreeNodeBase = new TreeNodeBase({});

            result.rows.forEach((row) => {
                let parent: TreeNodeBase = trees,
                    rowIndex = row['index'];
                row.forEach((col) => {
                    let children = parent.find((child) => {
                        return child.content ? child.content.title == col : false;
                    });
                    if(children && tools.isNotEmpty(children[0])){
                        children[0].content.colspan ++;
                        children[0].content.indexes.push(rowIndex);
                        parent = children[0];
                    }else{
                        let rowspan = row['isTotal'] && !parent.content ? rowLength : 1,
                            colspan = 1;
                        if(row['isTotal'] && !parent.content && config.val.length > 1){
                            rowspan = rowspan - 1;
                        }
                        parent.childrenAdd(parent = new TreeNodeBase({
                            content: {
                                title: col,
                                name: tools.getGuid(),
                                rowspan: rowspan,
                                colspan: colspan,
                                indexes: [rowIndex]
                            }
                        }))
                    }
                })
            });
            let colLength = result.cols.length,
                colData = Array.from({length: colLength}, () => ({})),
                rowIndexes: Array<{indexes: number[], name: string}> = [];

            trees.each((child, deep) => {
                if(Array.isArray(fields[deep - 1])){
                    let rowspan = child.content ? child.content.rowspan || 1 : 1,
                        parentRowSpan = child.parent && child.parent.content ? child.parent.content.rowspan || 1 : 1;
                    if(deep - 1 + parentRowSpan === fields.length){
                        fields[fields.length - 1].push(child.content);
                        rowIndexes.push({
                            indexes: child.content.indexes,
                            name: child.content.name
                        });
                    }else{
                        fields[deep - 1].push(child.content);
                    }
                }
            });
            result.cols.forEach((values, index) => {
                for(let i = 0; i < values.length; i ++){
                    let val = values[i] || '';
                    let name = fields[0][i].name;
                    colData[index][name] = values['isTotal'] ? '合计' : val;
                }
                // values.forEach((val) => {
                // })
            });
            result.tableData.forEach(({row, col, value}, index) => {
                for(let item of rowIndexes){
                    if(~item.indexes.indexOf(row)){
                        colData[col][item.name] = value || '';
                        break;
                    }
                }
            });

            let valFieldLength = valFields.length;
            if(valFieldLength > 1){
                fields[fields.length - 1].forEach((item, index) => {
                    if(item && item.title){
                        for(let val of valFields){
                            if(val.title === item.title){
                                item.content = val;
                                break;
                            }
                        }
                    }
                });
            }else{
                let last = fields.length - 1,
                    start = last > 0 ? 0 : colName.length;
                for(let i = start, len = fields[last].length; i < len; i++){
                    fields[last][i].content = valFields[0];
                }
            }
            console.log(fields);
            return {
                cols: fields,
                data: colData
            }
        };
        return {
            init(para: BT_cross) {
                let result = {
                    cols: null,
                    data: null
                }, defaultConf = {
                    colsSum: false,     // 是否聚合计算每列汇总数据
                    col: [],
                    row: [],
                    val: [],
                    cols: [],	// 表头数据
                    data: [],	// 表格数据
                };

                let config = <BT_cross>Object.assign({}, defaultConf, para);
                // result.data = getData(TableBase.getDataCol(result.cols), conf);
                let data = getData(config);
                return getProp(data, config);
                // return new Promise((resolve, reject) => {
                //     if ('Worker' in window) {
                //         let worker = new Worker(G.requireBaseUrl + 'statisticWorker.js');
                //         let loading = new Loading({});
                //         loading.show();
                //         worker.postMessage({
                //             type: "cols",
                //             data: {
                //                 config: config,
                //             }
                //         });
                //         worker.onmessage = (ev) => {
                //             if(ev.data.type === 'cols'){
                //                 result.cols = ev.data.result;
                //                 worker.postMessage({
                //                     type: "data",
                //                     data: {
                //                         cols: TableBase.getDataCol(result.cols),
                //                         config: config,
                //                     }
                //                 });
                //             }else if(ev.data.type === 'data') {
                //                 result.data = ev.data.result;
                //                 resolve(result);
                //                 worker.terminate();
                //                 worker = null;
                //                 loading.hide();
                //             }
                //         };
                //     }else {
                //         reject('您的设备暂时不支持交叉制表');
                //     }
                // });
            }
        }
    })();

    // 交叉表
    public crossTab(args: BT_cross) {
        let self = this, conf,
            defaultConf = {
                colsSum: false,     // 是否聚合计算每列汇总数据
                col: [],
                row: [],
                val: [],
                cols: [],	// 表头数据
                data: []	// 表格数据
            };

        conf = <BT_cross>Object.assign({}, defaultConf, args);
        return self.crossFunc.create(conf);
    }

    private crossFunc = (function (self) {
        let childIndex = 0;

        // 构建取值列-交叉表
        function cols_getVal(vals, cols, opts = {}) {
            let result = [];
            for (let item of cols) {
                if (vals.includes(item.name)) {
                    result.push(tools.obj.merge({
                        title: item.title,
                        name: item.name
                    }, opts));
                }
            }
            return result;
        }

        // 构建交叉表头 [数组结构]-交叉表
        function buildCols(col, val, data) {
            if (col.length > 0) {
                let child = col.shift(),
                    colTree = {},
                    result = [];
                data.forEach((item, i) => {
                    colTree[item[child]] = colTree[item[child]] || {title: item[child], data: []};
                    colTree[item[child]].data.push(item);
                });
                for (let i in colTree) {
                    if (colTree.hasOwnProperty(i)) {
                        let childs = buildCols(col.concat(), val, colTree[i].data);

                        if (childs && (childs.length > 1 || childs[0].children)) {
                            result.push({
                                title: colTree[i].title,
                                name: child,
                                children: childs
                            });
                        }
                        else {
                            let name = child;
                            if (childs && childs.length === 1) {
                                let childName = childs[0].name;
                                childName = childName.replace(/^.*?=/, '');
                                name = `${child}=${childName}`;
                            }

                            result.push({
                                title: colTree[i].title,
                                name
                            });
                        }

                    }
                }
                //childIndex = 0;
                return result;
            }
            else if (val) {
                let childVal = [];
                val.forEach((item) => {
                    childVal.push(G.tools.obj.merge(item, {name: `${item.name}-${childIndex++}`}));
                });
                return childVal;
            }
        }


        // 获取每列的运算条件-交叉表
        function getFormula(cols, val, parent = []) {
            if (cols) {
                cols.forEach((item, i) => {
                    let path = parent.concat();
                    if (item.type != 'val') {
                        path.push({name: item.name, title: item.title});
                    }
                    getFormula(item.children, val, path);
                });
            }
            else {

                if (!val || val.length === 0) {
                    parent.push(null);
                }
                else {
                    let valItem;
                    self.colIndexTemp = self.colIndexTemp < val.length ? self.colIndexTemp : 0;
                    valItem = val[self.colIndexTemp];
                    valItem.group = self.colIndexTemp; // 用于计算汇总数据
                    parent.push(valItem);
                    self.colIndexTemp++;
                }
                //console.log('getFormula', cols, val, parent);
                self.colFormula.push(parent);
            }

        }

        // 构建交叉表格主体 [数组结构]-交叉表
        function buildRows(row, val, data, colFormula, cols = [], parent = {}) {
            if (row.length > 0) {
                let child = row.shift(),
                    colTree = {},
                    result = [];

                data.forEach((item, i) => {
                    colTree[item[child]] = colTree[item[child]] || [];
                    colTree[item[child]].push(item);
                });
                for (let i in colTree) {
                    if (colTree.hasOwnProperty(i)) {
                        let col = cols.concat();
                        col.push({name: child, title: i});
                        parent[child] = i;
                        result = [...result, ...buildRows(row.concat(), val, colTree[i], colFormula, col, parent)];
                    }
                }
                return result;
            }
            else {
                let childTemp = {};

                data.forEach((item, i) => {
                    let rowData = {},
                        sumGroup = [],
                        keys = [], key = '';

                    self.cols = [];

                    colFormula.forEach((colItem, j) => {
                        let check = true,
                            currentCol = colItem[colItem.length - 1],
                            group = currentCol.group,
                            currentName = currentCol.name,
                            colName = `${currentName}-${childIndex}`,
                            sumName = `${currentName}_SUM`,
                            colLength;
                        sumGroup[group] = sumGroup[group] || {name: `${sumName}`, title: 0};
                        // 判断是否有数据

                        // 单值
                        /*if(val.length===1) {
                            colLength = colItem.length-2;
                        }
                        // 多值
                        else {
                            colLength = colItem.length-1;
                        }*/
                        colLength = colItem.length - 1;

                        for (let k = 0, l = colLength; k < l; k++) {
                            let name = colItem[k].name;
                            // 单值
                            if (val.length === 1 && !!~name.indexOf('=')) {
                                name = name.replace(/=.*?$/, '');
                                //console.log(name);
                            }

                            /*if(item['GOO_NAME'] === 'SANFU(SH)' && item['GOO_ID'] === '348577') {
                                console.log('----->', name, colItem, item[name], colItem[k].title, typeof item[name] === 'undefined' || item[name] !== colItem[k].title);
                            }*/


                            if (typeof item[name] === 'undefined' || item[name] !== colItem[k].title) {
                                check = false;
                                break;
                            }
                        }

                        /*if(item['GOO_NAME'] === 'SANFU(SH)' && item['GOO_ID'] === '348577') {
                            console.log('>>>>', check, item);
                        }*/

                        // 单值
                        if (val.length === 1) {
                            colName = colItem[colItem.length - 2].name;
                        }

                        if (check) {
                            sumGroup[group].title += item[currentName];
                            /*rowData.push({
                                name: colName,
                                title: item[currentName]
                            });*/

                            rowData[colName] = item[currentName];
                            self.cols.push({
                                name: colName,
                                title: item[currentName]
                            });
                        }
                        else {
                            self.cols.push({name: colName, title: '--'});  //单元格无数据
                            rowData[colName] = '--';
                        }
                        childIndex++;
                    });
                    // 求总计
                    /*if(sumGroup.length>1) {
                        let val = sumGroup.reduce((sum, item)=>{return sum.title+item.title;});
                        sumGroup.unshift({
                            name: 'STAT_SUM',
                            title: val
                        });
                    }*/

                    sumGroup.forEach((item, i) => {
                        rowData[item.name] = item.title;
                    });

                    //rowData = [...parent, ...rowData];

                    rowData = G.tools.obj.merge(rowData, parent);

                    self.cols = [...cols, ...self.cols, ...sumGroup];

                    cols.forEach((colItem, j) => {
                        keys.push(colItem.title);
                    });
                    key = keys.join('-');

                    // 聚合数据
                    if (self.dataTemp[key]) {
                        for (let rowItem in rowData) {
                            if (typeof rowData[rowItem] === 'number') {
                                if (typeof self.dataTemp[key][rowItem] === 'number') {
                                    self.dataTemp[key][rowItem] += rowData[rowItem];
                                }
                                else {
                                    self.dataTemp[key][rowItem] = rowData[rowItem];
                                }
                            }
                        }
                    }
                    else {
                        self.dataTemp[key] = rowData;
                    }

                    //children.push(rowData);
                    childIndex = 0;
                });
                //return children;
            }
        }

        function createData(conf) {
            let row = conf.row,
                col = conf.col,
                val = conf.val,
                rowCol, sum,
                result = {
                    cols: [],
                    data: []
                };

            val = cols_getVal(val, conf.cols, {type: 'val'});
            rowCol = cols_getVal(row, conf.cols);

            // 构建表头
            childIndex = 0;
            result.cols = buildCols(col, val, conf.data);

            // 获取每列的筛选条件
            self.colFormula = [];

            getFormula(result.cols, val);

            // 获取行数据
            childIndex = 0;

            self.dataTemp = {};
            buildRows(row, val, conf.data, self.colFormula);
            result.cols = [...rowCol, ...result.cols];
            result.data = [];
            for (let dataItem in self.dataTemp) {
                result.data.push(self.dataTemp[dataItem]);
            }

            // 添加汇总列
            if (val.length > 1) {
                sum = {title: '汇总', name: 'stat_SUM', children: []};
                val.forEach((item, i) => {
                    sum.children.push({title: item.title + '汇总', name: item.name + '_SUM'});
                });
            }
            else {
                let name = 'stat_SUM';
                if (val.length === 1) {
                    name = val[0].name + '_SUM';
                }
                sum = {title: '汇总', name};
                /*val.forEach((item, i)=> {
                    sum.push({title: item.title + '汇总', name: item.name+'_SUM'});
                });*/
            }


            result.cols.push(sum);

            //for(let item)

            return result;
        }


        // 转换为表格数据格式
        function tableFormat(data) {
            data.cols = self.multiTable.createThead(data.cols);
            data.colsIndex = self.cols;
            data.data = data.data;
            //data.data = self.multiTable.createTbody(self.cols, data.data);
            return data;
        }

        function create(conf) {
            let result = createData(conf);
            result = tableFormat(result);
            return result;
        }

        return {
            create
        };
    })(this);


    // 多行表头数据格式化
    private multiTable = (function (self) {
        let multiRow = [];

        // 计算每列的colspan
        function getColspan(item) {
            if (item.children) {
                let children = item.children, childCount = 0;

                for (let child of children) {
                    childCount += <number>getColspan(child);
                }
                return childCount;
            }
            else {
                return 1;
            }
        }

        // 更新colspan=1的列，计算rowspan
        function updateRowspan(data) {
            let len = data.length;
            data.forEach((item, row) => {
                item.forEach((col, i) => {
                    if (col.colspan === 1) {
                        let rowspan = len - row;
                        delete col.colspan;
                        if (rowspan !== 1) {
                            col.rowspan = rowspan;
                        }
                    }
                })
            });
            return data;
        }

        function initThead(data, result = []) {
            let rows = [],
                children = [];
            //console.log('initThead', data);
            data.forEach((item, i) => {
                let cell = {
                    colspan: getColspan(item)
                };
                for (let s in item) {
                    if (item.hasOwnProperty(s)) {
                        if (s === 'children' && item[s]) {
                            children = children.concat(item[s]);
                        }
                        else {
                            cell[s] = item[s];
                        }
                    }
                }
                rows.push(cell);
            });
            result.push(rows);
            if (children.length === 0) {
                return result;
            }
            else {
                return initThead(children, result);
            }
        }

        function createThead(data) {
            let result = initThead(data);
            result = updateRowspan(result);
            return result;
        }

        // 计算每行的rowspan
        function getRowspan(item) {
            if (item.children) {
                let children = item.children, childCount = 0;

                for (let child of children) {
                    childCount += <number>getRowspan(child);
                }
                return childCount;
            }
            else {
                return 1;
            }
        }

        function getCell(item) {
            let cell = {},
                rowspan = getRowspan(item);

            if (rowspan > 1) {
                cell['rowspan'] = rowspan;
            }
            for (let s in item) {
                if (item.hasOwnProperty(s)) {
                    if (s !== 'children' && item[s]) {
                        cell[s] = item[s];
                    }
                }
            }
            return cell;
        }

        function initTbody(cols, data, parentRow = []) {
            console.log('initTbody', cols, data);
            /*if(data[0].children[0].children) {
                data.forEach((item, i)=> {
                    if(item.children) {
                        let cell = getCell(item);
                        if(i===0) {
                            let parent = [];
                            parentRow.forEach((parentItem, i)=>{
                                parent.push(G.tools.obj.merge({}, parentItem));
                            });
                            parent.push(cell);
                            initTbody(cols, item.children, parent);
                        }
                        else {
                            initTbody(cols, item.children, [cell]);
                        }
                    }
                });
            }
            else {
                let parent = [];
                parentRow.forEach((parentItem)=>{
                    parent.push(G.tools.obj.merge({}, parentItem));
                });


                data.forEach((row, i)=>{
                    let cell = getCell(row),
                        childHead = [...parent, cell];

                    /!*console.log('============');
                    console.log('data', data);
                    console.log('row', row);
                    console.log('cell', cell);
                    console.log('parent', parent);
                    console.log('childHead', childHead);*!/

                    row.children.forEach((item, j)=>{
                        if(i===0) {
                            multiRow.push([...childHead, ...item]);
                        }
                        else {
                            multiRow.push([cell, ...item]);
                        }
                    });
                    parent = [];
                });
            }*/
        }

        /*function tbodyFormat(data) {
            let result = [];
            data.forEach((item)=>{
                let colItem = {};
                item.forEach((cell)=>{
                    colItem[cell.name] = cell.title;
                });
                result.push(colItem);
            });
            return result;
        }*/
        function createTbody(cols, data) {
            multiRow = [];
            initTbody(cols, data);
            //multiRow = tbodyFormat(multiRow);
            return multiRow;
        }

        return {
            createThead,
            createTbody
        }
    })(this);

    // abc制表
    public abc(args: BT_abc) {
        let self = this, conf,
            defaultConf = {
                row: [],
                val: [],
                a: 65,
                b: 85,
                cols: [],
                data: []
            };

        conf = <BT_abc>G.tools.obj.merge(defaultConf, args);

        return self.abcFunc.create(conf);
    }

    private abcFunc = (function (self) {
        // 构造field
        function createField(val, cols, classify) {
            let result = [];

            function doFor(name, cb) {
                for (let item of cols) {
                    if (name === item.name) {
                        let title = item.title;
                        cb.call(this, title);
                    }
                }
            }

            doFor(classify, function (title) {
                result.push({title: `${title}类`, name: 'classify'});
                result.push({title: `${title}项数`, name: 'group'});
                result.push({title: `${title}占比`, name: 'ratio'});
            });
            doFor(val, function (title) {
                result.push({title: `${title}总价占比`, name: 'total_ratio'});
                result.push({title: `${title}总价均值`, name: 'total_avg'});
            });
            return result;
        }

        // 构造data
        function createData(conf) {
            let {classify, val, a, b, cols, data} = conf,
                total = 0, // 总价
                count = 0, // 总项数
                rowIndex = 0,
                valIndex = 0,
                currentRatio = 0, // 当前占比指针
                arr = [],
                result = [
                    {classify: 'A类', group: 0, ratio: <any>0, total_ratio: <any>0, total_avg: <any>0},  // 类别, 项数, 项数占比, 累计占比, 累计总价
                    {classify: 'B类', group: 0, ratio: <any>0, total_ratio: <any>0, total_avg: <any>0},
                    {classify: 'C类', group: 0, ratio: <any>0, total_ratio: <any>0, total_avg: <any>0}
                ];
            // 提取目标列数据
            data.forEach((item, i) => {
                arr.push([item[classify], item[val]]);
                total += item[val];
                count++;
            });

            // 降序排序
            arr.sort((a, b) => {
                return b[1] - a[1];
            });

            // 计算[累计占比]
            arr.forEach((item, i) => {
                let index = 2; //C类索引
                currentRatio += (item[1] / total) * 100;
                currentRatio < a && (index = 0);  // A类索引
                currentRatio >= a && currentRatio < b && (index = 1);  // B类索引

                result[index].group = <number>result[index].group + 1;    // 项数
                result[index].total_ratio = <number>currentRatio;    // 总价占比
                result[index].total_avg = <number>result[index].total_avg + item[1];    // 累计总价
            });

            // 由[累计占比]计算[总价占比]
            result[2].total_ratio = (<number>result[2].total_ratio - <number>parseFloat(result[1].total_ratio)).toFixed(2) + '%';
            result[1].total_ratio = (<number>result[1].total_ratio - <number>parseFloat(result[0].total_ratio)).toFixed(2) + '%';
            result[0].total_ratio = (<number>result[0].total_ratio).toFixed(1) + '%';


            result.forEach((item, i) => {
                // 由[累计总价]计算[总价均值]
                result[i].total_avg = (<number>result[i].total_avg / <number>result[i].group).toFixed(2);
                result[i].total_avg === 'NaN' && (result[i].total_avg = 0);
                // 计算[项数占比]
                result[i].ratio = ((<number>result[i].group / count) * 100).toFixed(2) + '%';
            });

            return result;
        }

        function create(conf) {
            let result = {
                cols: createField(conf.val, conf.cols, conf.classify),
                data: createData(conf)
            };
            return result;
        }

        return {
            create
        };
    })(this);

    /**
     *_dataFilter 数据过滤-数据类型只能是数组，内容只能是数字
     * sum: 合计值
     * avg: 平均值
     * max: 最大值
     * min: 最小值
     * stDev: 标准差
     * null: 空值数
     * percent:百分比
     * groupPercent:组内百分比
     */
    static math = {
        _dataFilter: function (data) {
            if (!Array.isArray(data)) {
                return false;
            }
            let length = data.length;
            for (let i = 0; i < length; i++) {
                if (data[i] === "" || isNaN(data[i]) || data[i] === null) {
                    data.splice(i, 1);
                    i = i - 1;
                    length = length - 1;
                } else {
                    data[i] = Number(data[i]);
                }
            }
            if (data.length === 0) {
                data[0] = 0;
            }
            return data;
        },
        sum: function (data) {
            data = Statistic.math._dataFilter(data);
            if (data === false) {
                return false
            }
            let result = 0;
            let length = data.length;
            for (let i = 0; i < length; i++) {
                result += data[i]
            }
            return result;
        },
        avg: function (data) {
            data = Statistic.math._dataFilter(data);
            if (data === false) {
                return false
            }
            let length = data.length;
            return <number>Statistic.math.sum(data) / length;
        },
        max: function (data) {
            data = Statistic.math._dataFilter(data);
            if (!data) {
                return false
            }
            return Math.max.apply(Math, data);
        },
        min: function (data) {
            data = Statistic.math._dataFilter(data);
            if (!data) {
                return false
            }
            return Math.min.apply(Math, data);
        },
        stDev: function (data) {
            data = Statistic.math._dataFilter(data);
            if (data === false) {
                return false
            }
            let length = data.length;
            let temp = new Array(length);
            for (let i = 0; i < length; i++) {
                let dev = data[i] - <number>Statistic.math.avg(data);
                temp[i] = Math.pow(dev, 2);
            }
            let powSum = <number>Statistic.math.sum(temp);
            return Math.sqrt(powSum / length)
        },
        nullCount: function (data) {
            if (!Array.isArray(data)) {
                return false;
            }
            let count = 0;
            for (let i = 0; i < data.length; i++) {
                if (data[i] === "" || isNaN(data[i]) || data[i] === null) {
                    count++;
                }
            }
            return count;
        },
        percent: function (data, sum) {
            data = Statistic.math._dataFilter(data);
            if (data === false) {
                return false
            }
            let total = <number>Statistic.math.sum(data);
            return total / sum;
        },
        groupPercent: function (data) {
            data = Statistic.math._dataFilter(data);
            if (!data) {
                return false
            }
        }
    }
}