/// <amd-module name="FastTableRow"/>

import {FastTable} from "./FastTable";
import {FastTableCell} from "./FastTableCell";
import {TableDataRow} from "./base/TableRow";
import tools = G.tools;
import {TableBase} from "./base/TableBase";

export interface IFastTableRowPara {
    fastTable: FastTable;
    index: number; // 当前行索引

    selected?: boolean; // 是否选中
    disabled?: boolean; // 是否禁用
    isShow?: boolean; // 是否显示
    data?: obj
}

export class FastTableRow {
    private fastTable: FastTable;
    public isAdd = false;
    constructor(para: IFastTableRowPara) {
        this.fastTable = para.fastTable;
        this.index = para.index;

        this.isShow = para.isShow;
        this.disabled = para.disabled;
        this.selected = para.selected;
        //
        // this.fastTable.tableBases.forEach(table => {
        //     // table.dataAdd([]);
        //     table.body.rowAdd({
        //         content: para.fastTable
        //     })
        // });
        this.data = para.data;
    }

    // 获取cell或者cell[]
    public cellGet(col: number | string): FastTableCell;
    public cellGet(col: (number | string)[]): FastTableCell[];
    public cellGet(col) {
        let cols = tools.toArray(col);
        let result = [];
        for (let item of cols) {
            result.push(this.cells[this.fastTable.getColIndex(item)] || null);
        }
        return Array.isArray(col) ? result : result[0];
    }

    // 获取cell
    get cells(): FastTableCell[] {
        let cells = [];
        this.rowsEach(row => {
            if (row) {
                if(this.fastTable.isLockRight){
                    cells = cells.concat(row.cells);
                }else{
                    cells = row.cells.concat(cells);
                }
            }
        });
        return cells;
    }

    private rowsEach(fun: (r: TableDataRow, i: number, rowArr: TableDataRow[]) => void) {
        this.rowsInner.forEach((row, i, rowArr) => {
            fun(row, i, rowArr)
        });
    }

    private get rowsInner() {
        return this.fastTable.tableBases.map(table => table.body.rowGet(this.index));
    }

    index: number;
    //
    // private _index: number;
    // get index() {
    //     return this._index;
    // }
    // set index(index: number) {
    //     this._index = index;
    //
    // }

    private _disabled: boolean = false;
    get disabled() {
        return this._disabled;
    }

    set disabled(disabled: boolean) {
        if (tools.isNotEmpty(disabled)) {
            this._selected = disabled;
            this.rowsEach(row => row.disabled = disabled)
            // this.fastTable.tableBases.forEach((table) => {
            //     if (table) {
            //         table.body.rowGet(this.index).disabled = disabled;
            //     }
            // });
        }
    }

    private _selected: boolean = false;
    get selected() {
        return this._selected;
    }

    set selected(selected: boolean) {
        if (tools.isNotEmpty(selected)) {
            this._selectedInnerRowSet(selected);

            let events = this.fastTable.eventHandlers[FastTable.EVT_SELECTED];
            events && events.forEach((item) => {
                typeof item === 'function' && item(this);
            });
        }
    }

    get height(){
        return this.rowsInner[0].height;
    }
    _setHeight(){
      let maxHeight = 0;
      this.rowsEach((row) => {
          maxHeight = Math.max(row.height, maxHeight);
      });
      this.rowsEach((row) => {
          row.height = maxHeight;
      });
    }

    _rowSelectedWidthDraw(selected: boolean, isDraw: boolean) {
        this._selected = selected;
        isDraw && this._selectedInnerRowSet(selected);
    }

    // 内部使用
    _selectedInnerRowSet(selected) {
        this._selected = selected;

        this.rowsEach((row, rowindex, rowArr) => {
            row.selected = selected;

            row.cells.forEach((cell: FastTableCell, index, array) => {
                cell && cell._selectedInnerSet && cell._selectedInnerSet(selected);
            });
        });

        // this.fastTable.tableBases.forEach((table) => {
        //     if (table) {
        //         table.body.rowGet(this.index).selected = selected;
        //         table.body.rowGet(this.index).cells.forEach((cell) => {
        //             (<FastTableCell>cell)._selectedInnerSet(selected, isInnerEvent);
        //         })
        //     }
        // });
    }

    get isShow() {
        return this.rowsInner[0].isShow;
    }

    set isShow(isShow: boolean) {
        if (tools.isNotEmpty(isShow)) {
            this.rowsEach(row => {
                row.isShow = isShow
            })
            // this.fastTable.tableBases.forEach((table) => {
            //     if (table) {
            //         table.body.rowGet(this.index).isShow = isShow;
            //     }
            // });
        }
    }

    destroy() {
        this.rowsEach(row => {
            row && row.destroy()
        });
        this.fastTable = null;
    }

    // private _data: obj;
    set data(data: obj) {
        if (data) {
            let dataArr = this.fastTable.tableData.dataSplit(data);
            // this.fastTable.tablesEach((table) => {
            //
            // });
            this.rowsEach((row, i) => {
                row.data = dataArr[i]
            });

        }
        this.format();
    }

    public format() {
        let format = this.fastTable.rowFormat,
            formated = format && format(this.data);

        this.color = formated ? formated.color : '';
        this.background = formated ? formated.bgColor : '';
    }

    get data() {
        let data: obj = {};
        this.rowsEach(row => {
            let rowData = {};
            for(let cell of row.cells){
                rowData[cell.name] = cell.data;
            }

            // debugger;
            data = Object.assign({
                [TableBase.GUID_INDEX]: row.data[TableBase.GUID_INDEX]
            }, data, rowData || {});
        });
        return data;
    }

    set color(color: string) {
        this.rowsEach(r => color ? (r.wrapper.style.color = color)
            : r.wrapper.style.removeProperty('color'));
    }

    get color() {
        return this.rowsInner[0].wrapper.style.color;
    }

    set background(color: string) {
        this.rowsEach(r => color ? (r.wrapper.style.background = color)
            : r.wrapper.style.removeProperty('background'));
    }

    get background() {
        return this.rowsInner[0].wrapper.style.background;
    }

}