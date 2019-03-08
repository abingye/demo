/// <amd-module name="TableRow"/>
import d = G.d;
import tools = G.tools;
import {
    ITableCellPara, ITableDataCellPara, ITableFooterCellPara, ITableHeaderCellPara, TableCell, TableDataCell,
    TableFooterCell, TableHeaderCell
} from "./TableCell";
import {TableSection} from "./TableSection";
import {TableBase} from "./TableBase";

export interface ITableRowPara {
    section?: TableSection;
    selected?: boolean; // 是否选中
    disabled?: boolean;
    content?: any;
    cells?: objOf<ITableCellPara>;
    index?: number;
}

export abstract class TableRow {
    // 获取Cell构造函数
    abstract cellClass();

    constructor(para: ITableRowPara) {
        this._cellMap = para.cells;
        this.index = para.index;
        this._section = para.section;
        this.tableData = this.section.table.tableData;
        this.disabled = para.disabled;
        this.selected = para.selected;
        this._cells = this.cellsInit(para.cells);
        this.content = para.content;
    }

    protected _cellMap: objOf<ITableCellPara>;
    get cellMap() {
        let result: obj = this._cellMap;
        if (this.section.table.columns && this.section.table.columns.length > 0) {
            result = {};
            for (let item of this.section.table.columns) {
                result[item.name] = '';
            }
        }
        return result;
    }

    public content: any;

    // 指向TableBase中的tableData
    protected tableData;

    // 初始化cells对象
    protected abstract cellsInit<T extends ITableCellPara>(cells: objOf<T>);


    // 指向上一级TableSection
    protected _section: TableSection;
    get section() {
        return this._section;
    }

    // 行索引
    protected _index: number;
    set index(index: number) {
        this._index = index;
        this.wrapper.dataset.index = this._index + '';
    }

    get index() {
        return this._index;
    }

    protected _height: number = 40;
    set height(height: number){
        this._height = height;
        this.wrapper.style.height = height + 'px';
    }
    get height(){
        return this._height;
    }

    // 设置高度，内部使用
    _setHeight(height: number){
        this._height = height;
    }

    // protected _domIndex = null;
    // get domIndex() {
    //     if (this._domIndex === null) {
    //         let parent = (<HTMLElement>this.wrapper.parentNode);
    //         if (tools.isNotEmpty(parent)) {
    //             this._domIndex = Array.prototype.slice.call(parent.children).indexOf(this.wrapper);
    //         } else {
    //             this._domIndex = 0;
    //         }
    //         this.wrapper.dataset.domIndex = this._domIndex + '';
    //     }
    //     return this._domIndex;
    // }

    /*resetDomIndex() {
        let parent = (<HTMLElement>this.wrapper.parentNode);

        this._domIndex = null;
        if (tools.isNotEmpty(parent)) {
            this._domIndex = Array.prototype.slice.call(parent.children).indexOf(this.wrapper);
        }
        this.wrapper.dataset.domIndex = this._domIndex;
    }*/

    // colGet(name?: string) {
    //     // return this.section.table.colGet(name);
    // }
    // 表格单元格对象数组
    protected _cells: TableCell[] = [];
    get cells(): TableCell[] {
        return this._cells;
    }

    // cellsSet(cellPara: ITableCellPara[]) {
    //     // tools.diffOperate(cellPara, this.cells, {})
    // }

    // 创建Cell对象
    protected cellCreate(data: number | string | ITableCellPara) {
        let para: ITableCellPara = {
            row: this
        };

        if (typeof data === 'object') {
            para = <ITableCellPara>Object.assign(data, para);
        } else {
            para.data = data;
        }
        let cellClass = <any>this.cellClass();
        return new cellClass(para);
    }

    // 获取cell
    public cellGet(col: number | string): TableCell;
    public cellGet(col: (number | string)[]): TableCell[];
    public cellGet(col) {
        let result: any = null;
        if (Array.isArray(col)) {
            result = [];
            for (let item of col) {
                result.push(this.cells[this.section.table.getColIndex(item)] || null);
            }
        } else {
            result = this.cells[this.section.table.getColIndex(col)] || null;
        }
        return result;
    }

    // 添加cell
    public cellAdd(cell: TableCell | ITableCellPara | (TableCell | TableCell)[]) {
        let cells: any = Array.isArray(cell) ? cell : [cell];
        cells.forEach((item) => {
            let cell = item;
            if (item.constructor === Object) {
                let TableClass = this.cellClass();
                item.row = this;
                cell = new TableClass(item);
            }
            this._cells.push(cell);
        })
    }

    // 删除cell
    public cellDel(index: number | string, isClear: boolean = true) {
        let cells = this._cells[this.section.table.getColIndex(index)];
        cells.destroy(isClear);
        return isClear ? null : cells[0];
    }

    // tr标签
    private _wrapper: HTMLTableRowElement = null;
    get wrapper() {
        if (this._wrapper === null) {
            this._wrapper = document.createElement('tr');
        }
        return this._wrapper;
    }

    // 设置是否不可操作
    private _disabled: boolean = false;
    get disabled() {
        return this._disabled;
    }

    set disabled(disabled: boolean) {
        if (tools.isNotEmpty(disabled)) {
            this._selected = disabled;
            this.wrapper.classList.toggle('disabled', disabled);
        }
    }

    // 设置是否选中
    private _selected: boolean = false;
    get selected() {
        return this._disabled;
    }

    set selected(selected: boolean) {
        if (tools.isNotEmpty(selected)) {
            this._selected = selected;
            this.wrapper.classList.toggle('selected', selected);
        }
    }

    // 设置是否显示
    private _isShow: boolean = true;
    get isShow() {
        return this._isShow;
    }

    set isShow(bool: boolean) {
        if (tools.isNotEmpty(bool)) {
            this._isShow = bool;
            this.wrapper.classList.toggle('hide', !bool);
        }
    }

    // 销毁
    destroy(isClear: boolean = true) {
        d.remove(this._wrapper, isClear);
        if (isClear) {
            this._cells = this.cells || [];
            this._cells.forEach((item) => {
                item.destroy(isClear);
            });
            this._wrapper = null;
        }
    }
}

export class TableDataRow extends TableRow {

    cellClass() {
        return this.section.table.DataCellConstruct;
    }

    // 获取该列是否编辑过（与原始数据不一致）
    get isEdited() {
        let flag = false;
        this.cells.forEach(cell => flag = flag || cell.isEdited);
        return flag;
    }

    protected cellsInit(obj: objOf<ITableDataCellPara>): TableDataCell[] {
        let cellsObj = [],
            cells = obj || {},
            num = 0;
        for (let key in this.cellMap) {
            let cell = this.cellGet(key);
            if (tools.isEmpty(cell)) {

                if (!cells[key]) {
                    cells[key] = {
                        row: this,
                        name: key,
                        data: cells[key] && cells[key].data
                    };
                } else {
                    cells[key].row = this;
                    cells[key].name = key;
                }
                cellsObj.push(this.cellCreate(cells[key]));
                num++;
            } else {
                for (let attr in cells[key]) {
                    cell[attr] = cells[key][attr];
                }
            }
        }

        return cellsObj;
    }

    set data(data: obj) {
        if (!data) {
            return;
        }
        // let result = {};
        this.tableData.update(data, this.index);
        for (let item of this.cells) {
            item.data = data[item.name];
        }
    }

    get data() {
        // let data = {};
        return this.tableData.get(this.index);
        // for(let item of this.cells){
        //     data[item.name] = item.data;
        // }
        // return data;
    }

    render() {
        // let result = {};
        for (let item of this.cells) {
            item.render();
        }
    }

    get cells(): TableDataCell[] {
        return <TableDataCell[]>this._cells;
    }

    constructor(para: ITableRowPara) {
        super(para);
    }
}

export class TableHeaderRow extends TableRow {

    cellClass() {
        return TableHeaderCell;
    }

    get cells(): TableHeaderCell[] {
        return <TableHeaderCell[]>this._cells;
    }

    protected cellsInit(obj: objOf<ITableHeaderCellPara>): TableHeaderCell[] {
        let cellsObj = [],
            cells: objOf<ITableHeaderCellPara> = obj,
            num = 0;
        if (tools.isNotEmpty(cells)) {
            for (let item of Object.values(cells).sort((itemA, itemB) => {
                let a = itemA.index, b = itemB.index;
                return a > b ? 1: (a < b ? -1 : 0);
            })) {
                let key = item.name;
                let cell = this.cellGet(key);
                if (tools.isEmpty(cell)) {
                    if (!cells[key]) {
                        cells[key] = {
                            row: null,
                            name: key,
                        };
                    } else {
                        cells[key].row = null;
                        cells[key].name = key;
                    }
                    cellsObj.push(this.cellCreate(cells[key]));
                    num++;
                } else {
                    for (let attr in cells[key]) {
                        cell[attr] = cells[key][attr];
                    }
                }
            }
        }
        return cellsObj;
    }
}

// TFoot
export class TableFooterRow extends TableRow {
    cellClass() {
        return TableFooterCell;
    }

    protected cellsInit(obj: objOf<ITableFooterCellPara>): TableFooterCell[] {
        let cellsObj = [],
            cells: objOf<ITableFooterCellPara> = obj;
        // let json = {},
        //     options = {};
        // for(let item of this.tableData.get()){
        //     for(let key in item){
        //         if(!json[key]){
        //             options[key] = [];
        //             json[key] = {
        //                 [item[key]]: 1
        //             };
        //         }
        //         if(json[key][item[key]] !== 1){
        //             json[key][item[key]] = 1;
        //             options[key].push(item[key]);
        //         }
        //     }
        // }
        if (tools.isNotEmpty(cells)) {
            for (let item of Object.values(cells).sort((itemA, itemB) => {
                let a = itemA.index, b = itemB.index;
                return a > b ? 1: (a < b ? -1 : 0);
            })) {
                let key = item.name;
                let cell = this.cellGet(key);
                if (tools.isEmpty(cell)) {
                    if (!cells[key]) {
                        cells[key] = {
                            row: null,
                            name: key,
                            // options: options[key]
                        };
                    } else {
                        cells[key].row = null;
                        cells[key].name = key;
                        // cells[key].options = options[key];
                    }
                    cellsObj.push(this.cellCreate(cells[key]));
                } else {
                    for (let attr in cells[key]) {
                        cell[attr] = cells[key][attr];
                    }
                }
            }
        }
        return cellsObj;
    }

    get cells(): TableFooterCell[] {
        return <TableFooterCell[]>this._cells;
    }
}

