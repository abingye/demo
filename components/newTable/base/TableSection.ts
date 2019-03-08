///<reference path="TableBase.tsx"/>
/// <amd-module name="TableSection"/>
import {ITableCol, TableBase} from "./TableBase";
import {ITableRowPara, TableDataRow, TableFooterRow, TableHeaderRow, TableRow} from "./TableRow";
import {Tab} from "../../ui/tab/tab";
import {TableCell, TableFooterCell} from "./TableCell";
import tools = G.tools;
import d = G.d;

/**
 * thead和tbody的基类
 */
export interface ITableSectionPara {
    // disabled?: boolean;
    content?: any;
    table: TableBase;
    // rows?:
    wrapper?: HTMLElement;  // 无
    appendRule? : number; // 元素放置位置
    scrollWrapper?: HTMLElement;
}

export abstract class TableSection {
    constructor(para: ITableSectionPara) {
        this.content = para.content;
        this._table = para.table;
        this.tableData = this.table.tableData;
        this._wrapper = para.wrapper || null;
        this._scrollWrapper = para.scrollWrapper || null;
        this.innerWrapper = d.create('<div class="section-inner-wrapper"></div>');
        let tableSection = document.createElement(this.tableTagName());
        this.tableEl = document.createElement('table');
        d.append(this.tableEl, this.colgroup);
        d.append(this.tableEl, tableSection);
        d.append(this.innerWrapper, this.tableEl);
        if(para.appendRule === 0){
            d.prepend(this.scrollWrapper, this.innerWrapper);
        }else if(para.appendRule === 1){
            if(this.scrollWrapper.children.length > 1){
                d.after(<HTMLElement>this.scrollWrapper.children[0], this.innerWrapper);
            }else if(this.scrollWrapper.children.length === 1){
                d.prepend(this.scrollWrapper, this.innerWrapper);
            }
        }else{
            d.append(this.scrollWrapper, this.innerWrapper);
            d.append(this.wrapper, this.scrollWrapper);
        }
        
    }

    // destory(){
    //     d.remove(this.tableEl, true);
    //     d.remove(this.scrollWrapper, true);
    //     d.remove(this.innerWrapper, true);
    //     d.remove(this.wrapper, true);
    //     this._wrapper = null;
    //     this.innerWrapper = null;
    //     this.tableEl = null;
    //     this._scrollWrapper = null;
    // }

    public content: any;

    protected tableData;

    public innerWrapper: HTMLElement;
    public tableEl: HTMLTableElement;

    protected _table: TableBase = null;
    get table() {
        return this._table;
    }

    protected abstract tableTagName(): string;
    protected abstract className(): string;

    //  获取元素
    protected _wrapper: HTMLElement = null;
    get wrapper() {
        if (this._wrapper === null) {
            this._wrapper = document.createElement('div');
            this._wrapper.classList.add(this.className());
            if(this instanceof TableBody) {
                let headRowLength = this.table.head.rows.length;
                if (headRowLength !== 1) {
                    this._wrapper.style.height = 'calc(100% - ' + (headRowLength * 40) + 'px)';
                }
            }
        }
        return this._wrapper;
    }


    protected _scrollWrapper: HTMLElement = null;
    get scrollWrapper() {
        if (this._scrollWrapper === null) {
            this._scrollWrapper = document.createElement('div');
            this._scrollWrapper.classList.add('table-scroll-wrapper');
        }
        return this._scrollWrapper;
    }

    protected _colgroup: HTMLElement = null;
    get colgroup() {
        if (this._colgroup === null) {
            this._colgroup = document.createElement('colgroup');
        }
        return this._colgroup;
    }

    //  获取全部行rows对象
    protected _rows: TableRow[] = [];
    get rows() {
        return this._rows;
    }

    //  设置 rows
    set rows(row: TableRow[]) {
        this._rows = null;
        if (tools.isNotEmpty(row)) {
            this._rows = row;
        }
    }

    //  获取某个行rows
    rowGet(index: number): TableRow {
        let row = this.rows[index];
        return row || null;
    }

    //  删除某个行rows
    rowDel(index: number | number[], isClear: boolean = true) {
        let result = isClear ? null : [];
        if (!Array.isArray(index)) {
            index = [index];
        }

        this._rows = this._rows || [];
        for(let i = 0; i < this._rows.length; i++){
            if(this._rows[i]){
                if((<number[]>index).indexOf(this._rows[i].index) > -1){
                    let row = this._rows.splice(i, 1, null)[0];
                    let index = row.index;
                    row.destroy(isClear);
                    if (!isClear) {
                        result.push(row);
                    }else{
                        this.tableData.del(index);
                    }
                }
            }
        }
        this._rows = this._rows.filter(row => row !== null);
        if(this instanceof TableBody){
            this.resetRowIndex();
        }

        return result;
    }

    /*resetDomIndex(){
        this.rows.forEach((row) => {
            row && row.resetDomIndex();
        });
    }*/

    //  添加rows对象
    public abstract rowAdd(row: TableRow | ITableRowPara | (ITableRowPara | TableRow)[], index?: number) : void

    //  获取全部被选中的行
    rowSelectedGet() {
        this._rows = this.rows || [];
        let result = [];
        this._rows.forEach((item, index) => {
            if (item.selected) {
                result.push(item);
            }
        });
        return result;
    }
}


export interface ITableBodyPara extends ITableSectionPara {
    data?: obj[]; // 表格展示的数据
    cols: ITableCol[];
}

export class TableBody extends TableSection {

    constructor(para: ITableBodyPara) {
        super(para);

        let data = para.data,
            cols = para.cols[para.cols.length - 1] && para.cols[para.cols.length - 1],
            rows: TableDataRow[] = [];
        data && data.forEach((item, i) => {
            let cells = {};
            for (let key in cols) {
                let name = cols[key].name;
                cells[name] = {
                    name: key,
                    data: item[name]
                };
            }
            rows.push(new TableDataRow({
                cells: cells,
                section: this,
                index: i
            }));
        });
        this.rows = rows;
        rows.forEach((item, index) => {
            d.append(d.query('tbody', this.tableEl), item.wrapper);
            // item.resetDomIndex();
        });
    }

    rowGet(index: number): TableDataRow {
        return <TableDataRow>super.rowGet(index);
    }

    protected _rows: TableDataRow[] = [];
    get rows(): TableDataRow[] {
        return this._rows;
    }

    resetRowIndex(){
        this.rows.forEach((row, index) => {
            row.index = index;
        });
    }

    // 设置 rows
    set rows(row: TableDataRow[]) {
        this._rows = null;
        if (tools.isNotEmpty(row)) {
            this._rows = row;
        }
    }

    get data(): obj[] {
        return this.tableData.get();
    }

    set data(data: obj[]) {
        if (Array.isArray(data)) {
            // console.log(data)
            this.tableData.set(data);
            this.render();
        }
    }

    render(start?: number, length?: number, position?: number, isUpdateFoot?:boolean): void
    render(indexes?: number[], position?: number, isUpdateFoot?:boolean): void
    render(x?, y?, w?, z = true) {
        let data = [],
            isArray = Array.isArray(x),
            len = this.tableData.get().length - 1;
        z = isArray ? (tools.isEmpty(w) ? true : w) : z;
        w = isArray ? (tools.isEmpty(y) ? void 0 : y) : w;
        y = isArray ? null : (tools.isEmpty(y) ? len + 1 : y);
        x = isArray ? x : (tools.isEmpty(x) ? 0 : x);

        let dataLen = this.tableData.get().length;
        if(dataLen !== 0) {
            if (isArray) {
                x.forEach((item, index) => {
                    if (typeof item === 'number') {
                        data.push([this.tableData.get(item), item]);
                    } else {
                        data.push([item, index]);
                    }
                });
            } else {
                for (let i = 0; i < Math.min(y, dataLen); i++) {
                    data.push([this.tableData.get(x + i), x + i]);
                }
            }
        }

        this._rows = this.rows || [];
        if(tools.isEmpty(w)){
            let delIndexes = [];
            d.diff(data, this._rows, {
                replace: (n, o) => {
                    if(tools.isNotEmpty(o) && typeof n !== 'undefined'){
                        let row = this.rowGet(this.rows.indexOf(o));
                        row.render();
                        row.index = n[1];
                    }else if(tools.isEmpty(o) && typeof n !== 'undefined'){
                        let cells = {};
                        for (let item of this.table.columns) {
                            if (n[0] && n[0][item.name]) {
                                cells[item.name] = {
                                    data: n[0][item.name]
                                }
                            }
                        }
                        let row: TableDataRow = new TableDataRow({
                            cells,
                            section: this,
                            index: n[1]
                        });
                        this._rows.splice(n[1], 0, row);
                        let parent = d.query('tbody', this.tableEl);
                        let child = parent.children[n[1]];
                        if(tools.isEmpty(child)){
                            d.append(parent, row.wrapper)
                        }else{
                            d.after(child, row.wrapper);
                        }
                    }else if(tools.isNotEmpty(o) && typeof n === 'undefined'){
                        delIndexes.push(o.index);
                    }
                },
                create: (n) => {
                    if(typeof n !== 'undefined') {
                        let cells = {};
                        for (let item of this.table.columns) {
                            if (n[0] && n[0][item.name]) {
                                cells[item.name] = {
                                    data: n[0][item.name]
                                }
                            }
                        }
                        let row: TableDataRow = new TableDataRow({
                            cells,
                            section: this,
                            index: n[1]
                        });
                        this._rows.splice(n[1], 0, row);
                        d.append(d.query('tbody', this.tableEl), row.wrapper);
                    }
                },
                destroy: (o) => {
                    if(tools.isNotEmpty(o)){
                        delIndexes.push(o.index);
                    }
                    // o.destroy(true, true)
                }
            });
            this.rowDel(delIndexes.sort().reverse(), z);

            // this.table.adjustColWidth(tools.isMb ? Math.max(0, len - 50) : 0);
        }else{
            data.forEach((n) => {
                if(typeof n !== 'undefined'){
                    let cells = {};
                    for (let item of this.table.columns) {
                        if(n[0] && n[0][item.name]){
                            cells[item.name] = {
                                data: n[0][item.name]
                            }
                        }
                    }
                    let row: TableDataRow = new TableDataRow({
                        cells,
                        section: this,
                        index: n[1]
                    });
                    if(w === -1){
                        this._rows.push(row);

                        d.append(d.query('tbody', this.tableEl), row.wrapper);
                    }else{
                        if(this._rows[w]){
                            d.before(d.query('tbody', this.tableEl).children[w], row.wrapper)
                        }else{
                            d.append(d.query('tbody', this.tableEl), row.wrapper)
                        }
                        this._rows.splice(w, 0, row);
                        w ++;
                    }
                }
            });
            this.resetRowIndex();
        }

        z && this.table.updateColOption();
    }

    rowAdd(rows: TableRow | ITableRowPara | (ITableRowPara | TableRow)[], index?: number) {
        this._rows = this._rows || [];
        index = index || this.rows.length;

        for (let row of <any>tools.toArray(rows)) {
            let cells = row.cells,
                data = {};
            for(let key in cells){
                data[key] = cells[key].data;
            }
            row.index = tools.isEmpty(row.index) ? this.tableData.get().length : row.index;
            row.section = this;
            this.tableData.add(data);
            // console.log(row);
            if (row.constructor === Object) {
                row = new TableDataRow(row);
            }
            if(this.rows[index - 1]){
                if(this.rows[index - 1] !== row.wrapper){
                    d.after(this.rows[index - 1].wrapper, row.wrapper);
                }
            }else{
                d.append(d.query('tbody', this.tableEl), row.wrapper);
            }
            this._rows.push(row);
        }
        // this.resetDomIndex();
    }

    protected className() {
        return 'table-body-wrapper';
    }

    protected tableTagName(){
        return 'tbody';
    }
}

export interface ITableHeadPara extends ITableSectionPara {
    // selected?: boolean; // 是否选中
    // disabled?: boolean;
    cols: ITableCol[][];
}

export class TableHead extends TableSection {
    protected className() {
        return 'table-head-wrapper';
    }

    protected tableTagName(){
        return 'thead';
    }

    constructor(para: ITableHeadPara) {
        super(para);
        this._rows = this.rows || [];
        /*para.cols[0].forEach((col) => {
            let index = 0;
            let rowspan = tools.isEmpty(col.rowspan) ? 1 : col.rowspan;

        });*/

        para.cols.forEach((items, index) => {
            let cells = {};
            items.forEach((item, i) => {
                let name = item.name;
                cells[name] = {
                    'name': name,
                    'text': item.title,
                    'rowspan': item.rowspan,
                    'colspan': item.colspan,
                    'index': i
                };
            });
            let row = new TableHeaderRow({
                cells,
                section: this,
                index
            });
            this._rows.push(row);
        });

        for (let item of this.rows) {
            d.append(d.query('thead', this.tableEl), item.wrapper);
        }
    }

    rowAdd(row: TableRow | ITableRowPara | (ITableRowPara | TableRow)[]) {
        // this._rows = this._rows || [];
        // let rows: any = Array.isArray(row) ? row : [row],
        //     len = this.rows.length;
        // for (let item of rows) {
        //     let row = item;
        //     if (item.constructor === Object) {
        //         row = new TableHeaderRow(item);
        //     }
        //     row.index = len;
        //     len ++;
        //     d.append(d.query('thead', this.tableEl), row.wrapper);
        //     this._rows.push(row);
        // }
    }
}

export interface ITableFootPara extends ITableSectionPara{
    cols: ITableCol[];
    text: string
}

export class TableFoot extends TableSection{
    protected className(): string {
        return 'table-foot-wrapper';
    }

    protected tableTagName(){
        return 'tfoot';
    }

    rowAdd(row: TableRow | ITableRowPara | (ITableRowPara | TableRow)[], index?: number): void {
    }
    constructor(para: ITableFootPara){
        super(para);

        let cells = {};
        para.cols.forEach((item, index) => {
            cells[item.name] = {
                'name': item.name,
                'rowspan': item.rowspan,
                'colspan': item.colspan,
                'index': index,
                'colCount': tools.isEmpty(para.text),
                'text' : para.text
            };
        });
        this.rows = <TableFooterRow[]>[new TableFooterRow({
            cells,
            section: this,
            index: 0
        })];

        for (let item of this.rows) {
            d.append(d.query('tfoot', this.tableEl), item.wrapper);
        }
    }

    protected _rows: TableFooterRow[] = [];
    get rows(): TableFooterRow[] {
        return this._rows;
    }

    // 设置 rows
    set rows(row: TableFooterRow[]) {
        this._rows = null;
        if (tools.isNotEmpty(row)) {
            this._rows = row;
        }
    }

    // 渲染表尾
    render(){
        // this.wrapper.style.display = 'none';
        // 获取去重数据
        let getColUniqueData = (): objOf<Array<any>> => {
            let colsName = {},
                colCounts = this.table.tableData.getColCounts();

            for(let key of Object.keys(colCounts)){
                if(tools.isEmpty(colsName[key])){
                    colsName[key] = [];
                }
                for(let value of Object.values(colCounts[key])){
                    colsName[key].push(value[0]);
                }
            }
            return colsName;
        };
        let data = getColUniqueData();
        this._rows = this._rows || [];
        this._rows.forEach((row) => {
            row.cells && row.cells.forEach((cell) => {
                if(cell.colCount && !cell.isVirtual){
                    cell.options = data[cell.name] || [];
                }
            });
        });
        // this.wrapper.style.display = 'block';

        // function unique(arr: Array<any>){
        //     let result = [];
        //     for(let item of arr){
        //         if(result.indexOf(item) === -1){
        //             result.push(item);
        //         }
        //     }
        //     return result;
        // }
    }
}