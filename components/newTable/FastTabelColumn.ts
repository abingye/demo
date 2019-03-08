/// <amd-module name="FastTableColumn"/>

import {ITableColumnPara, TableColumn} from "./base/TableColumn";
import {FastTable} from "./FastTable";
import {IColumnDelObj} from "./base/TableBase";
import tools = G.tools;
import d = G.d;
import {SortType} from "../DataManager/DataManager";
import {Modal} from "../feedback/modal/Modal";

interface IFastTableColumnPara extends ITableColumnPara {
    sortState?: SortType;
    isFixed?: boolean;
}

export class FastTableColumn extends TableColumn {
    constructor(para: IFastTableColumnPara) {
        super(para);
        this._isFixed = tools.isEmpty(para.isFixed) ? false : para.isFixed;
        this._sortState = tools.isEmpty(para.sortState) ? 'NO' : para.sortState;
    }

    get ftable() {
        return this.table.content as FastTable;
    }

    // 锁列
    private _isFixed: boolean = false;
    set isFixed(isFixed: boolean) {
        this._isFixed = isFixed;
        if(!this.isVirtual){
            this._setColumnFixed(isFixed);
        }
    }

    get isFixed() {
        return this._isFixed;
    }

    _setColumnFixedNotRender(isFixed:boolean){
        this._isFixed = isFixed;
    }

    // 设置锁列
    _setColumnFixed(isFixed) {
        let fTable = this.ftable,
            leftTable = fTable.leftTable,
            mainTable = fTable.mainTable,
            leftLen = leftTable ? leftTable.columns.length : 0;
        if (isFixed) {
            // 设置锁列
            if (leftLen === 0) {
                fTable.createLeftTable([]);
                leftTable = fTable.leftTable;
                leftTable.head.innerWrapper.classList.add("left-table");
                leftTable.body.innerWrapper.classList.add("left-table");
            }
            // console.log(fTable.columns.indexOf(this) - leftLen);
            // console.log(fTable.mainTable.body.rows);
            let delCol: IColumnDelObj = fTable.mainTable.columnsDel(fTable.columns.indexOf(this) - leftLen, false);
            leftTable.columnInsertBefore(delCol, leftLen);

            // 表格可以换行时，重新创建锁列时，给锁列的高度赋值。
            if (this.ftable.isWrapLine && leftLen === 0) {
                this.ftable.rows.forEach((row) => {
                    row._setHeight();
                });
            }
        } else {
            // 取消锁列
            // debugger;
            let delCol: IColumnDelObj = fTable.leftTable.columnsDel(fTable.columns.indexOf(this), false);
            mainTable.columnInsertBefore(delCol, leftLen - 1);
            if (leftTable.columns.length <= 0) { d.remove(fTable.leftTable.body.tableEl, true);
                d.remove(fTable.leftTable.body.innerWrapper, true);
                d.remove(fTable.leftTable.head.tableEl, true);
                d.remove(fTable.leftTable.head.innerWrapper, true);
                if(fTable.leftTable.foot){
                    d.remove(fTable.leftTable.foot.tableEl, true);
                    d.remove(fTable.leftTable.foot.innerWrapper, true);
                }
                fTable.leftTable.destroy();
                fTable.tableBases.pop();
                fTable.setTableStyle();
            }
        }
        this.ftable.setMainTableWidth();
    }

    private _sortState: SortType;
    set sortState(sortState: SortType) {
        this.sort(sortState);
    }

    get sortState() {
        if(this.sortName){
            let column = this.ftable.columnGet(this.sortName);
            return column ? column.sortState : this._sortState;
        }else{
            return this._sortState;
        }
    }

    sort(order: SortType, ctrl: boolean = false, isStyle = true) {
        if(!this.isCanSort){
            Modal.toast('该列无排序功能');
            return null;
        }

        this.ftable.columns.forEach((col) => {
            if(!ctrl || col === this){
                col._sortState = col === this ? order : 'NO'
            }
            let sortCol = col.cells[0][0],
                wrapper = sortCol && sortCol.wrapper;

            if(isStyle && wrapper){
                if (col._sortState === 'NO') {
                    !ctrl && d.classRemove(wrapper, 'sort-desc sort-asc');
                } else {
                    let isDesc = col._sortState === 'DESC';
                    d.classToggle(wrapper, 'sort-desc', isDesc);
                    d.classToggle(wrapper, 'sort-asc', !isDesc);
                }
            }

        });

        // 清除其他列的状态 并设置本列状态
        if(this.sortName){
            let column = this.ftable.columnGet(this.sortName);
            return column ? column.sort(order, ctrl, false) : null;
        }else{
            let indexes = null,
                ftableData = this.ftable.tableData;
            // debugger;
            // console.log(this.ftable.tableData.getServerMode())
            if (ftableData.serverMode) {
                let arr = [this.name, this.sortState] as [string, SortType];
                if(ctrl){
                    if(Array.isArray(ftableData.sortState)){
                        ftableData.sortState = ftableData.sortState.filter( obj => obj[0] !== this.name) as [[string, SortType]];
                        ftableData.sortState.push(arr);
                    }else {
                        ftableData.sortState = [arr];
                    }
                }else {
                    ftableData.sortState = [arr];
                }

                ftableData.refresh();
            } else {
                let leftTable = this.ftable.leftTable,
                    mainTable = this.ftable.mainTable,
                    table = leftTable ? ((leftTable.columns.length - 1 >= this.ftable.columns.indexOf(this)) ? leftTable : mainTable) : mainTable,
                    otherTable = leftTable ? (table === leftTable ? mainTable : leftTable) : mainTable;
                indexes = table.tableData.sort(this.name, order);
                table !== otherTable && otherTable.sortByIndex(indexes);
                // table.render(0, table.tableData.get().length);
                this.ftable.render(0, this.ftable.data.length);
            }


            return indexes
        }
    }

    // get maxWidth(){
    //     let num = this._maxWidth;
    //     if(this.ftable.isFullWidth && this.ftable.width < this.ftable.container.offsetWidth){
    //         num = Infinity
    //     }
    //     return num;
    // }

    // 设置获取是否选中
    protected _selected: boolean = false;
    get selected(){
        return this._selected;
    }

    set selected(selected: boolean){
        this._selectedInnerColSet(selected,true);
    }


    // 内部使用
    _selectedInnerColSet(selected:boolean,isDraw:boolean) {
        this._selected = selected;
        let cell = this.headCells[0];
        !this.isVirtual && cell && (cell.selected = selected);
        isDraw && !this.isVirtual && this.bodyWrapper.classList.toggle('selected', selected);
    }
}