/// <amd-module name="FastTableData"/>

import {FastTable} from "./FastTable";
import tools = G.tools;
import {DataManager, IDataManagerPara} from "../DataManager/DataManager";

interface IFastTableDataPara extends IDataManagerPara{
    ftable: FastTable;
}

export class FastTableData extends DataManager{

    private ftable: FastTable;

    constructor(para: IFastTableDataPara) {
        // debugger;
        let ftable = para.ftable;
        para.loading = Object.assign({
            msg: '数据加载中...',
            disableEl: ftable.wrapper,
            container: ftable.wrapper.parentElement
        }, para.loading);

        if(para.page){
            para.page.container = tools.isMb ? ftable.mainTable.body.wrapper : ftable.wrapper;
        }
        super(para);

        this.onError = () => {
            if(!this.ftable.rows || this.ftable.rows.length === 0) {
                this.ftable.loadedError();
            }
        };
    }

    protected init(para: IFastTableDataPara){
        this.ftable = para.ftable;
    }
    // 数据获取方法
    protected dataAdd(dataArr: obj[]) {
        if(!Array.isArray(dataArr)) {
            return
        }
        this.dataSplit(dataArr).forEach((data, index) => {
            this.ftable.tableBases[index].tableData.add(data);
        });
    }

    protected _originalData: obj[];
    get originalData(){
        return this._originalData;
    }
    set originalData(data: obj[]){
        this._originalData = data.map((obj) => {
            return Object.assign({}, obj || {});
        });
    }

    set data(dataArr: obj[]){
        if(!Array.isArray(dataArr)) {
            return
        }

        this.dataSplit(dataArr).forEach((data, index) => {
            let table = this.ftable.tableBases[index];
            if (table) {
                table.tableData.set(data);
            }
        });
    }

    get data() {
        let dataArr: obj[] = null;
        this.ftable.tablesEach(table => {
            let tableData = table.data;
            if(!dataArr){
                dataArr = tableData;
            }else {
                let fixedArr = [];
                this.ftable.columns.forEach((column) => {
                    if(column.isFixed){
                        fixedArr.push(column.name);
                    }
                });

                dataArr = dataArr.map((data, i) => {
                    let result = Object.assign({}, data);
                    fixedArr.forEach((name) => {
                        result[name] = tableData[i] ? tableData[i][name] : null;
                    });
                    return result;
                });
            }
        });
        return dataArr;
    }

    get noEditData(){
        let dataArr: obj[] = null;
        this.ftable.tablesEach(table => {
            let tableData = table.tableData.edit.getOriginalData();
            if(!dataArr){
                dataArr = tableData;
            }else {
                let fixedArr = [];
                this.ftable.columns.forEach((column) => {
                    if(column.isFixed){
                        fixedArr.push(column.name);
                    }
                });

                dataArr = dataArr.map((data, i) => {
                    let result = Object.assign({}, data);
                    fixedArr.forEach((name) => {
                        result[name] = tableData[i] ? tableData[i][name] : null;
                    });
                    return result;
                });
            }
        });
        return dataArr;
    }

    rowDataGet(index: number) {
        let data: obj = {};
        this.ftable.tablesEach(table => Object.assign(data, table.tableData.get(index)));
        return data;
    }

    dataSplit(dataArr: obj[]): [obj[], obj[]]
    dataSplit(dataArr: obj): [obj, obj]
    dataSplit(datas) {
        let leftTable = this.ftable.leftTable,
            leftColsName = (leftTable ? leftTable.columns : []).map(col => col.name);

        if(tools.isEmpty(leftColsName)){
            return [datas];
        }

        let dataArr = tools.toArray(datas),
            splited = [[],[]];

        dataArr.forEach(data => {
            let left: obj = {},
                main: obj = Object.assign({}, data);

            leftColsName.forEach(name => {
                if(name in main) {
                    left[name] = main[name];
                    delete main[name];
                }
            });
            splited[0].push(main);
            splited[1].push(left);
        });

        return Array.isArray(datas) ? splited : splited.map(dataArr => dataArr[0]);
    }

    destroy(){
        super.destroy();
        this.ftable = null;
    }
}
