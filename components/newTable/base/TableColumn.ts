/// <amd-module name="TableColumn"/>
import {TableBase} from "./TableBase";
import d = G.d;
import tools = G.tools;
import {TableCell, TableDataCell, TableFooterCell, TableHeaderCell} from "./TableCell";
export interface ITableColumnPara{
    table: TableBase
    name: string;
    index: number;
    content?:any;
    maxWidth?: number;
    minWidth?: number;
    // inputInit?(cell: TableDataCell, col: TableColumn): TextInput;
    isNumber?: boolean;
    isVirtual?: boolean;
    title: string;
    isCanSort?: boolean; // 是否可排序，默认true;
    sortName?: string;
}
export class TableColumn{
    protected isCanSort: boolean;
    protected sortName: string;

    constructor(para: ITableColumnPara){
        this.content = para.content;
        this.sortName = para.sortName;
        this._isVirtual = tools.isEmpty(para.isVirtual) ? false : para.isVirtual;
        this.isCanSort = tools.isEmpty(para.isCanSort) ? true : para.isCanSort;
        this._table = para.table;
        this._title = para.title;
        this._name = para.name;
        this._index= para.index;
        this.maxWidth = tools.isEmpty(para.maxWidth) ? 200 : para.maxWidth + 16;
        this.minWidth = tools.isEmpty(para.minWidth) ? 40 : para.minWidth;
        // this._inputInit = para.inputInit;
        this._isNumber = tools.isEmpty(para.isNumber) ? false : para.isNumber;

    }

    protected _isVirtual: boolean;
    get isVirtual(){
        return this._isVirtual;
    }

    protected _isNumber: boolean;
    get isNumber(){
        return this._isNumber;
    }

    protected _isResize = false;
    get isResize(){
        return this._isResize;
    }
    set isResize(isResize: boolean){
        this._isResize = isResize;
        this.headCells[0].wrapper.classList.toggle('resize-col', isResize);
    }

    // protected _inputInit:(cell: TableDataCell, col: this) => TextInput;
    // get inputInit(){
    //     return this._inputInit;
    // }

    // 首次渲染表格时的列最大宽度
    protected _maxWidth: number = 200;
    get maxWidth(){
        return this._maxWidth;
    }
    set maxWidth(num: number){
        if(typeof num === 'number' && num > 0){
            num = Math.max(this.minWidth, num);
            this._maxWidth = num;
        }
    }

    // 列最小宽度（包括拖动、首次渲染时）
    protected _minWidth: number = 40;
    get minWidth(){
        return this._minWidth;
    }

    set minWidth(num: number){
        if(typeof num === 'number' && num > 0){
            num = Math.min(this.maxWidth, num);
            this._minWidth = num
        }
    }

    public content: any;

    protected _show: boolean = true;
    get show(){
        return this._show;
    }
    set show(show: boolean){
        show = !!show;
        if(!this.isVirtual && show !== this._show) {
            this._show = show;
            let handlers =this.table.eventHandlers[TableBase.EVT_COL_VISIBILITY_CHANGED];
            handlers && handlers.forEach((item) => {
                typeof item === 'function' && item(show);
            });
            this._headWrapper && this._headWrapper.classList.toggle('hide', !show);
            this._bodyWrapper && this._bodyWrapper.classList.toggle('hide', !show);
            this.table.colCount && this._footWrapper && this._footWrapper.classList.toggle('hide', !show);
            this.cells.forEach((cells: TableCell[]) => {
                cells.forEach((cell) => {
                    cell.show = show;
                })
            });
            this.table.updateTableWidth();
        }
    }

    _changeWrapper(wrappers: {head: HTMLTableColElement, body: HTMLTableColElement, foot: HTMLTableColElement}){
        this._headWrapper = wrappers.head;
        this._bodyWrapper = wrappers.body;
        this.table.colCount && wrappers.foot && (this._footWrapper = wrappers.foot);
    }

    // 获取元素
    // THead的col元素
    protected _headWrapper: HTMLTableColElement = null;
    get headWrapper(){
        if(!this.isVirtual && this._headWrapper === null){
            this._headWrapper = document.createElement('col');
        }
        return this._headWrapper;
    }

    // TBody的col元素
    protected _bodyWrapper: HTMLTableColElement = null;
    get bodyWrapper(){
        if(!this.isVirtual && this._bodyWrapper === null){
            this._bodyWrapper = document.createElement('col');
        }
        return this._bodyWrapper;
    }

    // TFoot的col元素
    protected _footWrapper: HTMLTableColElement = null;
    get footWrapper(){
        if(!this.isVirtual && this._footWrapper === null){
            this._footWrapper = document.createElement('col');
        }
        return this._footWrapper;
    }

    // 行名称
    protected _name: string;
    get name(){
        return this._name;
    }
    protected _index: number;
    get index(){
        return this._index;
    }

    // TableBase
    protected _table: TableBase = null;
    get table() {
        return this._table;
    }
    set table(table: TableBase){
        if(table !== this.table){
            this._table = table;
        }
    }

    // 设置获取是否选中
    protected _selected: boolean = false;
    get selected(){
        return this._selected;
    }

    set selected(selected: boolean){
        if(tools.isNotEmpty(selected)){
            this._selected = selected;
            this.bodyWrapper.classList.toggle('selected', selected);
            this.headWrapper.classList.toggle('selected', selected);
        }
    }

    _setColElWidth(){
        if(!this.isVirtual){
            this.bodyWrapper.style.width = this._width + 'px';
            this.headWrapper.style.width = this._width + 'px';
            this.footWrapper.style.width = this._width + 'px';
            this.table.updateTableWidth();
        }
    }
    // 设置获取列宽度
    protected _width: number = 67;
    set width(num: number) {
        if(typeof num === 'number' && num > 0){
            num = num < this.minWidth ? this.minWidth : num;
            if(num !== this._width){
                // if(num > this.maxWidth){
                //     num = this.maxWidth;
                // }
                this._width = num;
                this._setColElWidth();
            }
        }
    }
    get width(){
        return (this.show  && !this.isVirtual) ? this._width : 0;
    }

    protected _title: string;
    get title(): string{
        return this._title;
    }
    set title(title: string){
        if(this.headCells[0]){
            this.headCells[0].text = title;
            this._title = this.headCells[0].text;
        }
    }

    // 获取表头单元格
    get headCells(): TableHeaderCell[]{
        let cells: TableHeaderCell[] = [];
        for(let item of this.table.head.rows){
            if(!tools.isEmpty(item)){
                for(let cell of item.cells){
                    if(cell.name === this.name){
                        cells.push(cell as TableHeaderCell);
                        break;
                    }
                }
                if(cells.length === 1){
                    break;
                }
            }
        }
        return cells;
    }
    // 获取TBody单元格
    get bodyCells(): TableDataCell[]{
        let result = [];
        for(let item of (this.table.body.rows || [])){
            item && (result.push(tools.isEmpty(item) ? null : item.cellGet(this.name) as TableDataCell))
        }
        return result;
    }
    // 获取表尾单元格
    get footCells(): TableFooterCell[]{
        let result = [];
        if(this.table.colCount){
            for(let item of this.table.foot.rows){
                item && (result.push(tools.isEmpty(item) ? null : item.cellGet(this.name) as TableFooterCell))
            }
        }
        return result;
    }

    // 获取列下面的全部cell
    get cells():[TableHeaderCell[], TableDataCell[], TableFooterCell[]] {
        let headCells: TableHeaderCell[] = this.headCells,
            bodyCells: TableDataCell[] = this.bodyCells,
            footCells: TableFooterCell[] = this.footCells;

        return [headCells, bodyCells, footCells];
    }

    // 获取列下面的全部cell的数据
    get data(){
        let data = [];
        for (let item of this.cells[1]){
            data.push(item.data);
        }
        return data;
    }

    // 列排序
    sort(order: 'ASC' | 'DESC' = 'DESC'){
        if(tools.isNotEmpty(this.sortName)){
            let column = this.table.columnsGet(this.sortName);
            return column ? column.sort(order) : null;
        }else if(this.isCanSort){
            let indexes = this.table.tableData.sort(this.name, order);
            // this.table.render(0, this.table.tableData.get().length);
            return indexes;
        }else{
            return null;
        }
    }

    destroy(isClear: boolean = true){
        this.headWrapper && d.remove(this.headWrapper, isClear);
        this.bodyWrapper && d.remove(this.bodyWrapper, isClear);
        this.footWrapper && d.remove(this.footWrapper, isClear);
        let index = this.table.columns.indexOf(this);
        if(index !== -1){
            this.table.columns.splice(index, 1);
        }
        this._table = null;
        if(isClear){
            this._headWrapper = null;
            this._bodyWrapper = null;
            this._footWrapper = null;
        }
    }
}