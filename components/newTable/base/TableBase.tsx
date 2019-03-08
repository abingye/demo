/// <amd-module name="TableBase"/>
import {ITableColumnPara, TableColumn} from "./TableColumn";
import {TableBody, TableFoot, TableHead} from "./TableSection";
import {TableCell, TableDataCell, TableFooterCell, TableHeaderCell} from "./TableCell";
import IComponentPara = G.IComponentPara; import Component = G.Component;
import {FormCom} from "../../form/basic";
import tools = G.tools;
import d = G.d;

export interface ITableBasePara extends IComponentPara {
    cols: ITableCol[][]; // 表格格式
    data?: obj[];   // 表格数据
    cellFormat?: ITableCellFormatter;
    maxHeight?: number;     // 表格最大高度
    // colMinWidth?: number;   // 列最小宽度
    // colMaxWidth?: number;   // 列最大宽度
    content?: any;
    style?: 'table-border' | 'table-strip';  //表格样式，是否有边框 ，默认无
    colCount?: boolean | { text: string };     // 是否有列统计，默认无
    construct?: {       // 自定义类
        body?: typeof TableBody;
        head?: typeof TableHead;
        foot?: typeof TableFoot;
        col?: typeof TableColumn;
        dataCell?: typeof TableDataCell;
    };
    _wrapper?: HTMLElement; // 内部使用，外部创建不使用
    isHeadTextWrap?: boolean;
    isWrapLine?: boolean; // 是否换行，默认false
    deviation?: number;
}

interface ITableBaseAnnexedPara {    // 创建附表的参数
    headWrapper: HTMLElement;
    bodyWrapper: HTMLElement;
    footWrapper?: HTMLElement;
    headScrollWrapper: HTMLElement;
    bodyScrollWrapper: HTMLElement;
    footScrollWrapper?: HTMLElement;
    appendRule: 1 | 0,
}

// cell格式
export interface ITableCellFormatter {
    (data: any, cell: TableCell): Promise<{
        text: string | Node,
        color?: string;
        bgColor?: string;
        classes?: string[],
        data?: any
    }>
}


export interface ITableCol extends ITableColPara {    // 表格格式接口
    rowspan?: number;
    colspan?: number;
}

interface ITableColPara {    // 创建列对象参数
    name?: string;
    title?: string;
    isNumber?: boolean;
    minWidth?: number;
    maxWidth?: number;
    content?: any;
    // inputInit?(cell: TableDataCell, col: TableColumn): FormCom;
    isVirtual?: boolean;
    isCanSort?: boolean;
    sortName?: string;
}


// interface ITableAddColPara{ // 添加列参数
//     name: string,
//     text: string,
// }

export interface IColumnDelObj { //列删除返回的对象接口
    col: TableColumn,
    cells: [TableHeaderCell[], TableDataCell[], TableFooterCell[]],
    data: obj[],
}

interface ISortRule {    // 根据索引进行排序使用的接口
    indexes: number[];
    key: string;
    rule: string;
}


export class TableBase extends Component {
    static readonly EVT_EDITED = '__EVENT_DATA_EDITED__';        // 编辑事件
    static readonly EVT_CHANGED = '__EVENT_DATA_CHANGED__';      // 编辑事件
    static readonly EVT_SELECTED = '__EVENT_DATA_SELECTED__';    // 选中事件
    static readonly EVT_SORTED = '__EVENT_DATA_SORTED__';        // 排序事件
    static readonly EVT_COL_COUNT_CHANGED = '__EVENT_DATA_COL_COUNT_CHANGED__';    // 列统计事件
    static readonly EVT_COL_VISIBILITY_CHANGED = '__EVENT_COL_VISIBILITY_CHANGED__';    // 列显示隐藏事件
    static readonly EVT_CELL_EDIT_CANCEL = '__EVENT_CELL_EDIT_CANCEL__'; // 编辑组件销毁事件
    static readonly EVT_WIDTH_CANCEL = '__EVENT_WIDTH_CANCEL__'; // 宽度改变是触发事件

    static readonly GUID_INDEX = tools.getGuid(); 
    
    protected wrapperInit(para): HTMLElement {
        if (typeof para._wrapper !== 'undefined') {
            return para._wrapper;
        }
        return <div className="new-table-wrapper"></div>;
        // this._wrapper.appendChild(this.headWrapper);
        // this._wrapper.appendChild(this.bodyWrapper);
    }

    public readonly head: TableHead = null; // THead对象
    public readonly body: TableBody = null; // TBody对象
    public readonly foot: TableFoot = null; // TFoot对象
    public columns: TableColumn[] = []; // 列对象数组
    private BodyConstruct: typeof TableBody;
    private HeadConstruct: typeof TableHead;
    private FootConstruct: typeof TableFoot;
    private ColConstruct: typeof TableColumn;
    public DataCellConstruct: typeof TableDataCell;

    content: any;
    public cellFormat: ITableCellFormatter;

    constructor(para: ITableBasePara, wrappers?: ITableBaseAnnexedPara) {
        super(para);
        this.content = para.content;
        this.deviation = para.deviation || 0;

        this._colCount = tools.isEmpty(para.colCount) ? false : para.colCount;

        if (tools.isNotEmpty(para.isHeadTextWrap) && para.isHeadTextWrap) {
            this.wrapper.classList.add('table-head-text-wrap');
        }

        this.cellFormat = para.cellFormat;

        let col = TableBase.getDataCol(para.cols);

        // 定义构造类
        let construct = para.construct || {};
        this.BodyConstruct = construct.body || TableBody;
        this.HeadConstruct = construct.head || TableHead;
        this.FootConstruct = construct.foot || TableFoot;
        this.ColConstruct = construct.col || TableColumn;
        this.DataCellConstruct = construct.dataCell || TableDataCell;

        let colList = Array.isArray(col) ? col : [col];

        // 创建TableColumns
        this.createCol(colList);

        // 初始化表头
        this.head = new this.HeadConstruct({
            cols: para.cols,
            table: this,
            wrapper: wrappers && wrappers.headWrapper,
            scrollWrapper: wrappers && wrappers.headScrollWrapper,
            appendRule: wrappers && wrappers.appendRule,
        });

        // 添加数据
        this.tableData.add(para.data || []);
        // 初始化表内容TBody
        this.body = new this.BodyConstruct({
            cols: col,
            data: para.data || [],
            table: this,
            wrapper: wrappers && wrappers.bodyWrapper,
            appendRule: wrappers && wrappers.appendRule,
            scrollWrapper: wrappers && wrappers.bodyScrollWrapper,
        });

        // 判断是否需要列统计，创建TableFoot
        if (this.colCount) {
            tools.isNotEmpty(this.wrapper) && this.wrapper.classList.add('table-col-count-wrapper');
            this.foot = new this.FootConstruct({
                cols: col,
                table: this,
                text: typeof this.colCount === 'object' ? this.colCount.text : null,
                wrapper: wrappers && wrappers.footWrapper,
                appendRule: wrappers && wrappers.appendRule,
                scrollWrapper: wrappers && wrappers.footScrollWrapper,
            });
        }

        this.columns.forEach((col) => {
            if (!col.isVirtual) {
                d.append(this.head.colgroup, col.headWrapper);
                d.append(this.body.colgroup, col.bodyWrapper);
                this.colCount && d.append(this.foot.colgroup, col.footWrapper);
            }
        });

        tools.isNotEmpty(this.wrapper) && d.append(this.wrapper, this.head.wrapper);
        tools.isNotEmpty(this.wrapper) && d.append(this.wrapper, this.body.wrapper);
        tools.isNotEmpty(this.wrapper) && this.colCount && d.append(this.wrapper, this.foot.wrapper);

        tools.isNotEmpty(this.wrapper) && d.append(this.container, this.wrapper);
        this.maxHeight = para.maxHeight;

        // 设置表格的宽度
        this.updateTableWidth();
        // this.adjustColWidth();
        this._isWrapLine =tools.isEmpty(para.isWrapLine) ? false : para.isWrapLine;
        tools.isNotEmpty(this.wrapper) && this._isWrapLine && this.wrapper.classList.add('wrap-line-table');

        // this.events.on();

    }

    protected deviation: number;
    protected _isWrapLine = false;
    get isWrapLine(){
        return this._isWrapLine;
    }

    static getDataCol(cols: ITableCol[][]): ITableCol[] {
        let result = [],
            len = cols.length,
            indexes = Array.from({length: len}, () => 0);

        cols[0].forEach((col) => {
            alg(col, 0);
        });

        function alg(col: ITableCol, index: number) {
            let rowspan = tools.isEmpty(col.rowspan) ? 1 : col.rowspan,
                colspan = tools.isEmpty(col.colspan) ? 1 : col.colspan;
            if (index + rowspan >= len) {
                result.push(col);
            } else {
                let nextIndex = index + rowspan;
                for (let i = 0; i < colspan;) {
                    let item = cols[nextIndex][indexes[nextIndex]];
                    let itemColspan = item ? (tools.isEmpty(item.colspan) ? 1 : item.colspan) : 1;
                    i += itemColspan;
                    alg(item, nextIndex);
                }
            }
            indexes[index]++;
        }

        return result;
    };

    protected _inputInit: (cell: TableCell, col: TableColumn, defaultData: any) => FormCom;
    get inputInit() {
        return this._inputInit;
    }

    initEditor(input?: (cell: TableCell, col: TableColumn, defaultData: any) => FormCom) {
        this._editing = true;
        this._inputInit = tools.isEmpty(input) ? () => null : input;
        this.tableData.edit.open();
    }

    cancelEditor() {
        this._editing = false;
        this._inputInit = null;
        this.body && this.body.rows && this.body.rows.forEach((row) => {
            if (row && row.isEdited) {
                row.cells.forEach((cell) => {
                    cell.isEdited = false;
                    cell.isChecked = false;
                });
            }
        });
    }

    protected _editing: boolean = false;
    get editing() {
        return this._editing;
    }

    // set editing(isEdit: boolean){
    //     if(this._editing !== isEdit){
    //         this._editing = isEdit;
    //         if(isEdit){
    //             this.tableData.edit.open();
    //         }else{
    //             this.body.rows.forEach((row) => {
    //                 if(row.isEdited){
    //                     row.cells.forEach((cell) => {
    //                         cell.isEdited = false;
    //                     });
    //                 }
    //             })
    //         }
    //     }
    // }

    //列统计
    private _colCount: boolean | { text: string };
    get colCount() {
        return this._colCount;
    }

    //重构容器
    set container(container: HTMLElement) {
        // 容器发生改变，组件的dom元素也转移到相应容器中
        if (container && this.wrapper && this._container !== container) {
            d.append(container, this.wrapper);
            this._container = container;
        }
    }

    get container() {
        return this._container;
    }

    // 是否是第一次计算宽度
    // private firstCalc = true;

    //自动调整列宽
    adjustColWidth(begin = 0) {
        let canvas = document.createElement("canvas"),
            context = canvas.getContext("2d");
        context.font = '12px Arial';

        if(this.isWrapLine) {
            this.body.rows && this.body.rows.forEach((row) => {
                row._setHeight(40);
            });
        }

        // console.log(this.firstCalc);
        // if (!force && !this.firstCalc && !tools.isMb) {
        //     return;
        // }
        // this.firstCalc = false;
        let bodyRows = this.body.rows || [],
            len = this.tableData.get().length;
        this.columns = this.columns || [];
        if (len > 0) {
            for (let i = 0; i < this.columns.length; i++) {
                let column = this.columns[i],
                    max = 0;
                if (column) {
                    let colCells = column.cells,
                        headCells = colCells[0],
                        bodyCells = colCells[1],
                        colMaxWidth = column.maxWidth;
                    let text = headCells[headCells.length - 1] ? headCells[headCells.length - 1].text : '';
                    // max = tools.isNotEmpty(text) ? tools.str.utf8Len(text.toString()) * 8 : 0;
                    max = tools.isNotEmpty(text) ? getTextWidth(text) + 25 : 0;
                    column.maxWidth = Math.max(max, colMaxWidth);
                    for (let j = begin; j < len; j++) {
                        let cell = bodyCells[j];
                        if (cell) {
                            let data: any = cell.text;
                            let width = 0;
                            if (tools.isNotEmpty(data)) {
                                if (data instanceof HTMLElement) {
                                    width = cell.wrapper.offsetWidth + 16;
                                    max = Math.max(width, max);
                                } else {
                                    // max = Math.max(tools.str.utf8Len(data.toString().replace('', /\s+/g)) * 8, max);
                                    width = getTextWidth(data.toString());
                                    if(this.isWrapLine) {
                                        let scale = Math.ceil(width / (column.maxWidth - 17));
                                        let height = ((scale - 1) * 17 + 39) >= cell.row.height ? scale * 17 + 39 : cell.row.height;
                                        cell.row._setHeight(height);
                                    }
                                    width = width + 20;
                                    max = Math.max(width, max);
                                }
                            }
                            // cell.width = width;
                        }
                    }
                }
                if (max !== 0) {
                    let width = Math.ceil(max); // + padding + border
                    width = Math.max(width, 50);
                    width = Math.min(width, this.columns[i].maxWidth);
                    this.columns[i].width = width;
                    !this.isWrapLine && this.columns[i].bodyCells.forEach((cell) => {
                        cell && cell.initMoreBtn();
                    });
                }
            }
        }
        canvas = null;
        context = null;

        let events = this.eventHandlers[TableBase.EVT_WIDTH_CANCEL];
        tools.isNotEmpty(events) && events.forEach((handler) => {
            typeof handler === 'function' && handler();
        });

        function getTextWidth(text) {
            let metrics = context.measureText(text);
            return metrics.width;
        }
    }

    //创建列对象TableColumn
    private createCol(cols: ITableColPara | ITableColPara[]) {
        cols = tools.toArray(cols);
        let columns: TableColumn[] = this.columns || [],
            index = columns.length;
        cols.forEach((item, i) => {
            columns.push(new this.ColConstruct(Object.assign({
                table: this,
                index: index,
            }, item) as ITableColumnPara));
            index ++;
        });

        this.columns = columns;
    }

    //设置table的宽度
    updateTableWidth() {
        let width = this.width - 4 + this.deviation;
        this.body.tableEl.style.width = width + 'px';
        this.head.tableEl.style.width = width + 'px';
        this.colCount && (this.foot.tableEl.style.width = width + 'px');
    }

    //更新列统计项
    updateColOption() {
        if (this.colCount) {
            this.foot && this.foot.render();
        }
    }

    //设置表格的最大高度
    private _maxHeight = null;
    get maxHeight() {
        return this._maxHeight;
    }

    set maxHeight(height: number) {
        this._maxHeight = height;
        if (tools.isNotEmpty(this._maxHeight)) {
            if (tools.isNotEmpty(this.wrapper)) {
                let bodyWrapper = d.query('.table-body-wrapper', this.wrapper);
                bodyWrapper && (bodyWrapper.style.maxHeight = this._maxHeight + 'px');
            }
        }
    }

    // 获取数据
    get data() {
        return this.tableData.get();
    }

    set data(data: obj[]) {
        if (tools.isNotEmpty(this.body)) {
            // this.body.rows && this.body.rows.forEach((row) => {
            //     row.destroy();
            // });
            // this.body.rows = [];
            this.body.data = data;
        }
    }

    get currentData() {
        return this.body.data;
    }

    //添加数据
    dataAdd(data: obj | obj[]) {
        // tools.toArray(data).forEach((data) => {
        //     let cells = {};
        //     for(let item of this.columns){
        //         cells[item.name] = {
        //             data: data[item.name]
        //         };
        //     }
        //
        //     this.body.rowAdd({
        //         cells,
        //         section: this.body,
        //         index: data.index
        //     });
        // });
        let len = this.tableData.get().length;
        this.tableData.add(tools.toArray(data));
        this.body.render(len, tools.toArray(data).length, -1);

    }

    //删除数据
    dataDel(index: number | number[]) {
        tools.toArray(index).forEach((item) => {
            this.body.rowDel(item);
        })
    }

    // private _cols: ITableCol[];
    //
    // colGet(col: (number|string)[]): ITableCol[];
    // colGet(col: number|string): ITableCol;
    // colGet(col) {
    //     let result = null;
    //     return result;
    // }

    //将一个删除的列对象插入到指定位置前面
    columnInsertBefore(column: IColumnDelObj, ref: number | string) {
        this.columns = this.columns || [];
        let columns = this.columns.filter((col) => {
            return !col.isVirtual;
        });
        let index = this.getColIndex(ref),
            col = column.col,
            data = column.data,
            cells = column.cells;
        while (this.columns[index] && this.columns[index].isVirtual){
            index ++;
        }

        if (col && cells) {
            col.table = this;
            if (this.columns[index]) {
                d.before(this.columns[index].bodyWrapper, col.bodyWrapper);
                d.before(this.columns[index].headWrapper, col.headWrapper);
                this.colCount && d.before(this.columns[index].footWrapper, col.footWrapper);
                this.columns.splice(index, 0, col);
            } else {
                d.append(this.body.colgroup, col.bodyWrapper);
                d.append(this.head.colgroup, col.headWrapper);
                this.colCount && d.append(this.foot.colgroup, col.footWrapper);
                this.columns.splice(index, 0, col);
            }
            cells[0].forEach((item, i) => {
                if (this.head.rows && this.head.rows[i]) {
                    if (tools.isEmpty(this.head.rows[i].cells[index])) {
                        d.append(this.head.rows[i].wrapper, item.wrapper);
                    } else {
                        d.before(this.head.rows[i].cells[index].wrapper, item.wrapper);
                    }
                    (item.row = this.head.rows[i]);
                    this.head.rows[i].cells.splice(index, 0, item);
                } else {
                    this.head.rowAdd({});
                    let row = this.head.rows[this.head.rows.length - 1];
                    item.row = row;
                    d.append(row.wrapper, item.wrapper);
                    this.head.rows[i].cells.push(item);
                }
            });
            // if(this.tableData.get().length === 0){
            //     this.tableData.set(data);
            // }else{
            //     data.forEach((data, index) => {
            //         this.tableData.update(data, index);
            //     });
            // }
            cells[1].forEach((item, i) => {
                if (this.body.rows && this.body.rows[i]) {
                    if (tools.isEmpty(this.body.rows[i].cells[index])) {
                        d.append(this.body.rows[i].wrapper, item.wrapper);
                    } else {
                        d.before(this.body.rows[i].cells[index].wrapper, item.wrapper);
                    }
                    (item.row = this.body.rows[i]);
                    this.body.rows[i].cells.splice(index, 0, item);
                } else {
                    let cells = {};
                    for(let key in data[i]){
                        cells[key] = {data:data[i][key]};
                    }
                    this.body.rowAdd({
                        cells
                    });
                    let row = this.body.rows[this.body.rows.length - 1];
                    row.cellDel(0);
                    item.row = row;
                    d.append(row.wrapper, item.wrapper);
                    this.body.rows[i].cells.push(item);
                }
                this.tableData.update(data[i], i)
            });
            this.colCount && cells[2].forEach((item, i) => {
                if (this.foot.rows && this.foot.rows[i]) {
                    if (tools.isEmpty(this.foot.rows[i].cells[index])) {
                        d.append(this.foot.rows[i].wrapper, item.wrapper);
                    } else {
                        d.before(this.foot.rows[i].cells[index].wrapper, item.wrapper);
                    }
                    (item.row = this.foot.rows[i]);
                    this.foot.rows[i].cells.splice(index, 0, item);
                }
            });
            this.updateTableWidth();
            return true;
        }
        return false;
    }


    //在同一个表中交换列的位置
    columnExchange(index1: number | string, index2: number | string) {
        index1 = this.getColIndex(index1);
        index2 = this.getColIndex(index2);
        if (index1 !== null && index2 !== null) {
            let col1 = this.columns[index1],
                col2 = this.columns[index2],
                cells1 = col1.cells,
                cells2 = col2.cells,
                headerCell1s = cells1[0],
                headerCell2s = cells2[0],
                dataCell1s = cells1[1],
                dataCell2s = cells2[1],
                footCell1s = cells1[2],
                footCell2s = cells2[2],
                cell1Wrappers = {
                    head: col1.headWrapper,
                    body: col1.bodyWrapper,
                    foot: col1.footWrapper
                },
                cell2Wrappers = {
                    head: col2.headWrapper,
                    body: col2.bodyWrapper,
                    foot: col2.footWrapper
                };

            col1._changeWrapper(cell2Wrappers);
            col2._changeWrapper(cell1Wrappers);
            col1._setColElWidth();
            col2._setColElWidth();
            for (let i = 0; i < headerCell1s.length; i++) {
                let cell1 = headerCell1s[i],
                    cell2 = headerCell2s[i],
                    name = cell1.name;

                cell1.name = cell2.name;
                cell2.name = name;
                let tmp = cell1.text;
                cell1.text = cell2.text;

                cell2.text = tmp;
            }
            for (let i = 0; i < dataCell1s.length; i++) {
                let cell1 = dataCell1s[i],
                    cell2 = dataCell2s[i],
                    name = cell1.name,
                    width = cell1.width;

                cell1.name = cell2.name;
                cell2.name = name;
                cell1.width = cell2.width;
                cell2.width = width;

                cell1.render();
                cell2.render();
            }
            this.columns[index2] = col1;
            this.columns[index1] = col2;
        }

    }

    // 添加列
    columnAdd(col: ITableColPara, data?: any[]) {
        let self = this;
        let map = [];
        this.columns.forEach((item) => {
            map.push(item.name);
        });
        if (map.indexOf(col.name) === -1) {
            this.createCol({
                name: col.name
            });
            this.head.rows.forEach((item) => {
                item.cellAdd(new TableHeaderCell({
                    row: item,
                    name: col.name,
                    data: null,
                    text: col.title
                }))
            });
            let rowLen = this.body.rows ? this.body.rows.length : 0;
            addCol(Array.isArray(data) ? Math.max(data.length, rowLen) : rowLen);

            this.updateTableWidth();
            return true;
        }
        return false;

        function addCol(length) {
            for (let i = 0; i < length; i++) {
                let row = self.body.rows[i],
                    cellData = data ? (tools.isEmpty(data[i]) ?  '' : data[i]) : '';
                self.tableData.get(i)[col.name] = cellData;
                if (row) {
                    row.cellAdd(new TableDataCell({
                        row: row,
                        name: col.name,
                        data: cellData,
                    }));
                } else {
                    let cells = {};
                    for (let item of self.columns) {
                        cells[item.name] = {
                            row: null,
                            name: item.name,
                            data: ''
                        };
                        if (item.name === col.name) {
                            cells[item.name].data = cellData;
                        }
                    }
                    self.body.rowAdd({
                        cells,
                        section: self.body
                    })
                }
            }
        }
    }

    // 获取列
    columnsGet(col: (number | string)[]): TableColumn[];
    columnsGet(col: number | string): TableColumn;
    columnsGet(col) {
        let result = [];
        tools.toArray(col).forEach((item) => {
            result.push(this.columns[this.getColIndex(item,)] || null);
        });
        return Array.isArray(col) ? result : result[0];
    }

    //删除列
    columnsDel(index: (string | number)[], isClear?: boolean): IColumnDelObj[];
    columnsDel(index: string | number, isClear?: boolean): IColumnDelObj;
    columnsDel(index, isClear = true) {
        let result = [];
        tools.toArray(index).forEach((item) => {
            let col = this.columns[this.getColIndex(item)];
            if (col) {
                let obj: IColumnDelObj = {
                    col,
                    cells: [[], [], []],
                    data: []
                };
                col.cells[0].forEach((item) => {
                    if (!isClear) {
                        obj.cells[0].push(item);
                    }
                    item.destroy(isClear);
                });
                col.cells[1].forEach((item) => {
                    let index = item.row.index;
                    obj.data.push({[item.name]: item.data});
                    if (!isClear) {
                        obj.cells[1].push(item);

                    }
                    item.destroy(isClear);
                });
                col.cells[2].forEach((item) => {
                    if (!isClear) {
                        obj.cells[2].push(item);
                    }
                    item.destroy(isClear);
                });
                col.destroy(isClear);
                result.push(obj);
            }
        });
        if (!isClear) {
            this.updateTableWidth();
            return Array.isArray(index) ? result : result[0];
        }
        return null;
    }

    //获取wrapper宽度
    get width() {
        let width = 0;
        this.columns = this.columns || [];
        this.columns.forEach((item) => {
            width += item.width;
        });
        return width + 4;
    }

    // private _allData: obj[];
    // private current: [number, number];
    _promiseList: Promise<any>[] = [];
    addStack(promise: Promise<any>){
        this._promiseList.push(promise);
    }
    renderPromise(){
        return Promise.all(this._promiseList);
    }

    render(indexes: number[], position?: number): Promise<any>
    render(start: number, length: number, position?: number, isUpdateFoot?: boolean): Promise<any>
    render(x, y, w?, z = true): Promise<any> {
        this._promiseList = [];
        this.body.render(x, y, w, z);
        return this.renderPromise();
    }

    public sortByIndex(sortRule: ISortRule) {
        this.tableData.sortByIndex(sortRule);
        // this.render(0, this.tableData.get().length);
    }

    public colCountByIndex(indexes: Array<number>) {
        this.tableData.colCountByIndex(indexes);
        // this.body.render(0, this.tableData.get().length, false);
    }

    //tableBase的数据
    public tableData = ((self) => {
        let allData = [],
            data = null,
            sortMap: ISortRule = {
                indexes: [],
                key: null,
                rule: null,
            },
            isChangeData = false,
            conditions = {},    //限制条件
            lastUniIndex = 0,
            objOfIndex: objOf<Array<number>> = {},
            colCounts = {}; //限制条件获取的数据的对应索引值

        function initColCount(data: Array<any>) {
            let colCounts = {};
            data.forEach((obj) => {
                for (let key of Object.keys(obj)) {
                    tools.isEmpty(colCounts[key]) && (colCounts[key] = {});

                    tools.isEmpty(colCounts[key][obj[key]]) ?
                        (colCounts[key][obj[key]] = [obj[key], 1]) :
                        colCounts[key][obj[key]][1]++;
                }
            });
            return colCounts;
        }

        //根据条件限制数据
        function astrictData(data: Array<any>): Array<any> {
            let result = data;
            if (tools.isEmpty(conditions)) {
                return null;
            } else {
                let keys = Object.keys(conditions);
                keys.sort((a, b) => {
                    if (conditions[a].length > conditions[b].length)
                        return -1;
                    else if ((conditions[a].length < conditions[b].length))
                        return 1;
                    else
                        return 0;
                });
                keys.forEach((key, i) => {
                    let array = [];
                    conditions[key] && conditions[key].forEach((val) => {
                        result.forEach((item, index) => {
                            let eq = val == (item[key]);
                            if (eq) {
                                array.push(item);
                                if (typeof objOfIndex[key] !== 'undefined') {
                                    let index = data.indexOf(item);
                                    objOfIndex[key].indexOf(index) === -1 && objOfIndex[key].push(index);
                                }
                            }
                        })
                    });
                    result = array;
                })
                /*data.forEach((item, index) =>{
                    let accord = true;
                    for(let key in conditions){
                        conditions[key] && conditions[key].forEach((val) => {
                            let eq = val == (item[key]);
                            accord = accord && (eq);
                            if(eq && typeof objOfIndex[key] !== 'undefined'){
                                objOfIndex[key].indexOf(index) === -1 && objOfIndex[key].push(index);
                            }
                        });
                    }
                    if(accord){
                        array.push(item);
                    }
                })*/
            }
            return result;
        }

        return {
            destroy: () => {
                allData = [];
                data = null;
            },
            edit: (() => {
                let originalData = null;
                return {
                    open() {
                        if (originalData === null) {
                            originalData = allData.map(data => Object.assign({}, data));
                        }
                    },
                    close() {
                        if (originalData !== null) {
                            allData = originalData;
                            originalData = null;
                        }
                    },
                    getOriginalData() {
                        return [...originalData || []];
                    },
                }
            })(),
            getSortType() {
                return sortMap.key;
            },
            colCountByIndex(indexes: Array<number>) {
                if (Array.isArray(indexes)) {
                    data = [];
                    tools.toArray(indexes).forEach((item) => {
                        data.push(allData[item]);
                    });
                } else {
                    data = null;
                }
                return [...(data || [])];
            },
            colCount(key: string, value: any) {
                isChangeData = true;
                if (self.columns && self.columns.map((col) => col.name).indexOf(key) === -1){
                    if(Object.keys(conditions).length === 0){
                        return null;
                    }
                } else if (tools.isEmpty(value)) {
                    delete conditions[key];
                    delete objOfIndex[key];
                } else {
                    conditions[key] = value;
                    objOfIndex[key] = [];
                }
                data = astrictData(allData);

                return intersect(Object.values(objOfIndex));

                //求交集
                function intersect(arr: Array<Array<number>>): Array<number> {
                    let minLen = Infinity,
                        minLenArr = null,
                        data = [];
                    if (arr.length === 1) {
                        return arr[0];
                    } else if (arr.length === 0) {
                        return null;
                    }
                    for (let item of arr) {
                        let len = item.length;
                        if (len < minLen) {
                            minLen = len;
                            minLenArr = item;
                        }
                    }
                    for (let item of minLenArr) {
                        let result = [];
                        arr.forEach((a) => {
                            result.push(a.indexOf(item));
                        });
                        if (result.indexOf(-1) === -1) {
                            data.push(item);
                        }
                    }
                    return data;
                }
            },
            sortByIndex(sortRule: ISortRule) {
                sortMap.key = sortRule.key;
                sortMap.rule = sortRule.rule;
                if (sortRule.indexes.length === this.get().length) {
                    let data = [];
                    for (let i of sortRule.indexes) {
                        data.push(allData[i]);
                    }
                    allData = data;
                }
            },
            sort(key: string, order: string) {
                let array = data || allData;

                sortMap.indexes = Array.from({length: array.length}, (v, k) => k);
                // 判断key值是否与上次排序一值和期间数据是否改变（isChangeData）
                // 如果都为真，直接方向排序数据
                if (sortMap.key === key && !isChangeData) {
                    if (sortMap.rule !== order) {
                        sortMap.rule = order;
                        array.reverse();
                        sortMap.indexes.reverse();
                    }
                } else {
                    sortMap.key = key;
                    sortMap.rule = order;
                    isChangeData = false;
                    for (let i = 0; i < array.length; i++) {
                        for (let j = i + 1; j < array.length; j++) {
                            let jVal = tools.str.toEmpty(array[j][key]),
                                iVal = tools.str.toEmpty(array[i][key]);
                            if (order === 'DESC' && jVal >= iVal) {
                                exchange(i, j);
                            } else if (order === 'ASC' && jVal <= iVal) {
                                exchange(i, j);
                            }
                        }
                    }
                }
                // let events = self.eventHandlers[TableBase.EVT_SORTED];
                // console.log(self);
                // events && events.forEach((item) => {
                //     typeof item === 'function' && item({
                //         name: key,
                //         order
                //     });
                // });
                return sortMap;

                // 交换数据
                function exchange(i, j) {
                    let n = sortMap.indexes[j];
                    sortMap.indexes[j] = sortMap.indexes[i];
                    sortMap.indexes[i] = n;
                    let tmp = array[j];
                    array[j] = array[i];
                    array[i] = tmp;
                }
            },
            // 获取数据，没有参数直接获取全部数据
            get(index?: number | number[]) {
                let res = data || allData;
                if (typeof index === 'undefined') {
                    return res;
                }
                let result = [];
                for (let i of tools.toArray(index)) {
                    result.push(Object.assign({}, res[i]));

                }
                return Array.isArray(index) ? result : result[0];
            },
            set(arrData: obj[]) {
                allData = arrData.map((data, index) => {
                    lastUniIndex = index;
                    data[TableBase.GUID_INDEX] = lastUniIndex;
                    return data;
                });
                data = null;
                this.clearConditions();
                colCounts = initColCount(allData);
                isChangeData = true;
            },
            add(data: obj | obj[], index?: number) {
                // let num = allData.length;
                tools.toArray(data).forEach((data) => {
                    data[TableBase.GUID_INDEX] = ++lastUniIndex;
                    if(typeof index === 'number'){
                        allData.splice(index, 0, data);
                        index ++;
                    }else{
                        allData.push(data);
                    }
                });
                colCounts = initColCount(allData);
                isChangeData = true;
            },
            initColCount() {
                colCounts = initColCount(allData);
            },
            // 更新数据
            update(data: obj, index: number) {
                let cols = [];
                if (allData[index]) {
                    for (let key in data) {
                        if (self.foot) {
                            let cell = self.foot.rows[0].cells[self.getColIndex(key)];
                            if (cell && colCounts[key]) {
                                if (tools.isEmpty(colCounts[key][data[key]])) {
                                    colCounts[key][allData[index][key]][1] === 1 ?
                                        cell.replaceOption(data[key], allData[index][key]) :
                                        cell.addOption(data[key]);
                                } else if (colCounts[key][allData[index][key]][1] === 1) {
                                    cell.removeOption(allData[index][key]);
                                }
                            }
                        }
                        if (self.colCount && colCounts[key]) {
                            tools.isEmpty(colCounts[key][data[key]]) ?
                                (colCounts[key][data[key]] = [data[key], 1]) :
                                (colCounts[key][data[key]][1]++);

                            colCounts[key][allData[index][key]][1]--;
                            colCounts[key][allData[index][key]][1] === 0 && delete colCounts[key][allData[index][key]];
                        }

                        allData[index][key] = data[key];
                        cols.push(key);
                    }
                    isChangeData = true;
                }

                // 当tableBase进入编辑状态时，修改数据会触发TableBase.EVT_EDITED事件。
                if (self.editing) {
                    let events = self.eventHandlers[TableBase.EVT_EDITED];
                    events && events.forEach((item) => {
                        typeof item === 'function' && item({
                            cols,
                            row: index,
                        });
                    });
                }
            },
            // 判断索引是否在数据中
            has(index) {
                return index in allData;
            },
            del(index: number | number[], name?: string) {
                for (let i of tools.toArray(index)) {
                    tools.isEmpty(name) ? allData.splice(i, 1) : delete allData[i][name];
                }
                isChangeData = true;
            },
            getAll() {
                return [...allData];
            },
            clearConditions() {
                conditions = {};
                data = null;
            },
            getColCounts() {
                return colCounts;
            }
        }
    })(this);

    //获取列名对应的索引值
    getColIndex(index: number | string): number {
        let num = null;
        if (typeof index === 'string') {
            this.columns.forEach((item, i) => {
                if (item.name === index) {
                    num = i;
                }
            })
        } else if (typeof index === 'number') {
            num = index;
        }
        return num;
    }
    getNotVirtualColIndex(){}


    //添加附表
    _createAnnexedTable<K extends typeof TableBase>(para: any, Constructor: K = this.constructor as any, appendRule?: 1 | 0) {
        let request: any = para;
        request._wrapper = null;
        let wrappers: ITableBaseAnnexedPara = {
            headWrapper: this.head.wrapper,
            bodyWrapper: this.body.wrapper,
            headScrollWrapper: this.head.scrollWrapper,
            bodyScrollWrapper: this.body.scrollWrapper,
            appendRule,
        };
        if (this.colCount) {
            wrappers.footWrapper = this.foot.wrapper;
            wrappers.footScrollWrapper = this.foot.scrollWrapper;
        }
        return new Constructor(request, wrappers);
    }

    destroy(){
        this.tableData.destroy();
        super.destroy();
    }
}
