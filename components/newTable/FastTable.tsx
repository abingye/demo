/// <amd-module name="FastTable"/>
import {IColumnDelObj, ITableCellFormatter, ITableCol, TableBase} from "./base/TableBase";
import {FastTableRow, IFastTableRowPara} from "./FastTableRow";
import {FastTableColumn} from "./FastTabelColumn";
import IComponentPara = G.IComponentPara; import Component = G.Component;
import {FastPseudoTable, PseudoTableType} from "./FastPseudoTable";
import {FastTableCell} from "./FastTableCell";
import {FastTableData} from "./FastTableData";
import {FastTableMenu, IFastTableMenuItem} from "./FastTableMenu";
import {Button} from "../general/button/Button";
import {InputBox} from "../general/inputBox/InputBox";
import {Modal} from "../feedback/modal/Modal";
import {TableDataCell} from "./base/TableCell";
import {FormCom} from "../form/basic";
import {IDataManagerAjax, IDataManagerPageConf} from "../DataManager/DataManager";
import d = G.d;
import tools = G.tools;

interface ITableEditInitPara {
    isPivot?: boolean;
    defData?: obj; // 默认值
    updatable?: boolean; // 是否能编辑  默认true
    insertble?: boolean; // 是否能插入  默认true
    autoInsert?: boolean; //是否自动插入  默认false
    cellCanInit?(col: FastTableColumn, type: number): boolean; // 单元格是否能编辑, type: 0修改 1新增
    rowCanInit?(row: FastTableRow): boolean; // 行是否能编辑
    inputInit(cell: FastTableCell, col: FastTableColumn, defaultData: any): FormCom // 控件初始化
}

export interface IFastTablePara extends IComponentPara {
    cols: IFastTableCol[][];
    isResizeCol?: boolean; // 是否可拖拽表头改变宽度
    dragSelect?: boolean; // 是否开启拖动选中状态
    clickSelect?: boolean; // 是否开启点击选中状态
    sort?: boolean, // 是否可排序
    pseudo?: { // 是否开启伪列, 默认不开,
        type: PseudoTableType;
        isShow?: boolean;
        isAll?: boolean; // 是否开启全选
        multi?: boolean; // 点击时单选还是多选, 默认单选
    },
    ajax?: IDataManagerAjax;
    page?: IDataManagerPageConf; // 分页配置
    data?: obj[]; // 表格内容数据
    cellFormat?: ITableCellFormatter;
    rowFormat?: ITableRowFormatter;
    isFullWidth?: boolean;
    maxWidth?: number;  // 最大宽度
    colCount?: boolean; // 是否列统计
    maxHeight?: number; // 最大高度
    // editable?: boolean;
    // insertable?: boolean;
    menu?: IFastTableMenuItem[], // 右键菜单配置
    dragCol?: boolean; // 列拖动
    isWrapLine?: boolean; // 是否换行，默认false
    isLockRight?: boolean; // 是否右侧锁列，默认否
}

export interface IFastTableCol extends ITableCol {
    isFixed?: boolean; // 默认false
}

export interface ITableRowFormatter {
    (rowData: obj): {
        color?: string;
        bgColor?: string;
        attr?: obj
    }
}

export class FastTable extends Component {
    static readonly EVT_RENDERED = '_FT_RENDERED_';
    static readonly EVT_CHANGED = TableBase.EVT_CHANGED;
    static readonly EVT_SELECTED = '_FT_SELECTED_';    // 选中事件
    static readonly EVT_CELL_EDIT_CANCEL = TableBase.EVT_CELL_EDIT_CANCEL;
    static readonly EVT_TABLE_COL_CHANGE = '_FT_COLUMNS_CHANGE_';
    static readonly EVT_WIDTH_CANCEL = TableBase.EVT_WIDTH_CANCEL; // 宽度改变是触发事件

    static readonly TABLE_NOT_DATA_CLASS = 'table-nodata';
    static readonly TABLE_LOADED_ERROR_CLASS = 'table-loaded-error';
    static readonly TABLE_RIGHT_LOCK_CLASS = 'table-right-lock';

    protected wrapperInit(): HTMLElement {
        if (tools.isMb) {
            return <div className="fast-table-container"></div>
        } else {
            return <div className="fast-table-container">
                <div className="tables"></div>
                <div className="scroll-container">
                    <div className="scroll-content"></div>
                </div>
            </div>
        }
    }

    on(name: string, handler: Function) {
        super.on(name, handler);
        this.tablesEach((table) => {
            table.on(name, handler);
        })
    }

    off(name: string, handler?: Function) {
        super.off(name, handler);
        this.tablesEach((table) => {
            table.off(name, handler);
        });
    }

    tableData: FastTableData = null;
    public rowFormat: ITableRowFormatter;
    public cellFormat: ITableCellFormatter;
    private isChangeColWidth: boolean;
    protected maxHeight: number;

    private _colCount: boolean; // 判断是否有列统计
    get colCount() {
        return this._colCount;
    }

    protected _isLockRight: boolean;
    get isLockRight(){
        return this._isLockRight;
    }

    // protected _insertable: boolean;
    // get insertable(){
    //     return this._insertable;
    // }

    constructor(para: IFastTablePara) {
        super(para);
        this.maxHeight = para.maxHeight;
        this.rowFormat = para.rowFormat;
        this._isLockRight = para.isLockRight || false;
        // this._insertable = tools.isEmpty(para.insertable) ? true : para.insertable;
        this.cellFormat = para.cellFormat;

        this.init(para);
        this.mainTable.body.wrapper.classList.add(FastTable.TABLE_NOT_DATA_CLASS);
        this.isLockRight && this.wrapper.classList.add(FastTable.TABLE_RIGHT_LOCK_CLASS);

        if (tools.isMb) {
            d.on(window, 'resize', () => {
                this.recountWidth();
            });
        }

    }

    get errorMsg(){
        let errorMsg = null;
        for(let row of this.rows){
            if(errorMsg){
                break;
            }
            for(let cell of row.cells){
                if(cell.show && !cell.isVirtual && tools.isNotEmpty(cell.errorMsg)){
                    errorMsg = cell.errorMsg;
                    break;
                }
            }
        }
        return errorMsg;
        // return this.rows ? this.rows.every((row) => {
        //     return row.cells.every((cell) => {
        //         return (!cell.show || cell.isVirtual) ? true : tools.isEmpty(cell.errorMsg);
        //     })
        // }) : true;
    }

    // 重新计算表格宽度
    recountWidth (){
        this.tablesEach(table => {
            table.adjustColWidth();
        });
        this.isWrapLine && this.setRowsHeight();
        this.calcWidth();
        this.setMainTableWidth();
        this.changeScrollWidth(0);
    }

    protected mutiSelect: boolean;

    // 初始化
    protected init(para: IFastTablePara) {
        // debugger;
        this._isWrapLine = tools.isMb ? (tools.isEmpty(para.isWrapLine) ? false : para.isWrapLine) : false;
        this._colCount = tools.isEmpty(para.colCount) ? false : para.colCount;
        // this.maxWidth = para.maxWidth;
        this.initTable(para);
        this._isFullWidth = tools.isEmpty(para.isFullWidth) ? true : para.isFullWidth;
        if (this.isFullWidth) {
            this.wrapper.classList.add('table-width-full');
        }
        this.mutiSelect = tools.isNotEmpty(para.pseudo) ? !!para.pseudo.multi : false;

        this.noData.toggle(true);
        this.tableData = new FastTableData({
            ajax: para.ajax,
            page: para.page,
            data: para.data,
            ftable: this,
            render: (start, length, isRefresh) => {
                if(!tools.isMb && !this.tableData.serverMode){
                    if(isRefresh){
                        this.tableData.originalData = this.tableData.data;
                    }
                    tools.isEmpty(this.tableData.originalData) && (this.tableData.originalData = this.tableData.data);
                    this.tableData.data = this.tableData.originalData.slice(start, start + length);
                    start = 0;
                }
                this.render(start, length);
            }
        });

        // this.data = para.data;

        // 索引列

        if (para.pseudo) {
            let {type, isShow, isAll} = para.pseudo;
            this.initPseudoTable(type, isShow, isAll);
        }
        // else {
        //     this.pseudoTable = null;
        // }

        // this.setWrapperPaddingLeft(this.calcMainTableLeftOffSet(0));
        // setTimeout(() => {
        //     //   监听滚动事件
        //     if (!tools.isMb) {
        //         // PC端
        //         this.changeScrollWidth(0);
        //         this.scrollEvent.on();
        //     } else {
        //         //  移动端
        //         // this.wrapper.querySelector('.scroll-container').classList.add('hide');
        //         this.touchMoveEvent.on();
        //     }
        // }, 200);

        this.isChangeColWidth = false;
        // 开启拖动改变列宽功能
        if (para.isResizeCol) {
            this.colWidthEvent.on();
        }

        // 开启选中状态
        if (para.dragSelect) {
            this.selectedEvent.dragOn();
        }

        if (para.clickSelect) {
            this.selectedEvent.selectedOn();
        }

        // 开启右键菜单
        if (tools.isNotEmpty(para.menu)) {
            this.fastTableMenu = new FastTableMenu({items: para.menu, ftable: this});
            // new FastTableMenu({items: para.menu, ftable: this});
        }

        // 双击打开详情页
        // d.on(this.wrapper, 'dblclick', 'tbody td', (e) => {
        //     let index = parseInt(e.srcElement.parentElement.dataset.index);
        //     let row = this.rowGet(index);
        //     let cols: ITableCol[] = [];
        //     this.columns.forEach((col) => {
        //         let obj = {
        //             name: col.name,
        //             title: col.cells[0][0].text
        //         };
        //         cols.push(obj);
        //     });
        //     let detailCells = row.cells;
        //     let detail = new RowDetail({
        //         detailCols: cols,
        //         detailCells: detailCells
        //     });
        //     let modal = new Modal({
        //         body: detail.wrapper,
        //         width: '400px',
        //         header: '查看详情',
        //         isOnceDestroy: true
        //     });
        // })

        if (para.sort) {
            this.sortEvent.on();
        }
        // if (tools.isMb) {
        //     this.sortEvent('touchstart');
        // } else {
        //     this.sortEvent('click');
        // }
        if (para.dragCol) {
            this.dragColumnsEvent.on();
        }
        if(this.isWrapLine){
            this.on(FastTable.EVT_CELL_EDIT_CANCEL, (cell) => {
                this.setRowHeight(cell);
            });
        }
        if(!tools.isMb) {
            this.hoverEvent.on();
            this.hoverMoreEvent.on();
        }
        this.middleButtonEvent.on();

        this.edit.event.scroll.on();
    };

    private fastTableMenu: FastTableMenu;

    protected _isFullWidth: boolean;
    get isFullWidth() {
        return this._isFullWidth;
    }

    // protected _maxWidth: number = Infinity;
    // get maxWidth() {
    //     return this._maxWidth;
    // }
    //
    // set maxWidth(num: number) {
    //     if (typeof num === 'number' && num > 0) {
    //         this._maxWidth = num;
    //     }
    // }

    private sortEvent = (() => {
        let handler = null;
        return {
            on: () => d.on(this.wrapper, 'click', 'th', handler = (e) => {
                if (!this.isChangeColWidth) {
                    let target = e.target as HTMLElement;
                    if (target.tagName === 'TH' || target.parentElement.tagName === 'TH') {
                        let th = target.tagName === 'TH' ? target : target.parentElement,
                            dataName = th.dataset.name,
                            col = this.columnGet(dataName);

                        if (dataName === 'selectCol') {
                            // 选择的是伪列的列头
                            return;
                        }
                        if (tools.isNotEmpty(col)) {
                            let ctrl = e.ctrlKey;
                            if (col.sortState === 'NO') {
                                ctrl ? col.sort('ASC', true) : col.sortState = 'ASC';
                            } else if (col.sortState === 'DESC') {
                                ctrl ? col.sort('ASC', true) :  col.sortState = 'ASC';
                            } else if (col.sortState === 'ASC') {
                                ctrl ? col.sort('DESC', true) : col.sortState = 'DESC';
                            }
                        }
                    }
                }
            }),
            off: () => d.off(this.wrapper, 'click', 'th', handler)
        }

    })();

    // 设置表的样式，当伪列和锁列存在不存在时主表的样式
    public setTableStyle() {
        d.queryAll('.left-table', this.wrapper).forEach(el => el.style.removeProperty('padding-left'));
        d.queryAll('.main-table', this.wrapper).forEach(el => el.style.removeProperty('padding-left'));
        let leftTable = this.leftTable,
            paddingLeft = 40,
            pseudoTable = this.pseudoTable;
        if (tools.isNotEmpty(leftTable) && (tools.isNotEmpty(pseudoTable)) && pseudoTable.isShow) {
            let tables = this.isLockRight ? d.queryAll('.main-table', this.wrapper)
                : d.queryAll('.left-table', this.wrapper);
            tables.forEach(el => el.style.paddingLeft = paddingLeft + 'px');
        }
        if (tools.isEmpty(leftTable) && (tools.isNotEmpty(pseudoTable)) && pseudoTable.isShow) {
            d.queryAll('.main-table', this.wrapper).forEach(el => el.style.paddingLeft = paddingLeft + 'px');
        }
    }

    // 改变滚动条宽度
    changeScrollWidth(width: number = 0) {
        //     let mwidth = window.getComputedStyle(d.query('.main-table')).width,
        //         mwidth_num = parseInt(mwidth.slice(0,mwidth.length-2));
        if (!tools.isMb) {
            let minus = this.tableData.data.length * 40 > this.mainTable.body.wrapper.offsetHeight ? 0 : 10;
            width = (this.mainTable.width + this.calcMainTableLeftOffSet(width) - minus) + 7;
            d.query(".scroll-content", this.wrapper).style.width = width + "px";
        }
        // console.log(this.mainTable.width);
        // PC端设置表格高度
        // let fwidth = window.getComputedStyle(d.query('.fast-table-container')).width,
        //     fwidth_num = parseInt(fwidth.slice(0,fwidth.length-2));
        // let height = 0;
        // if (fwidth_num < this.mainTable.width + this.calcMainTableLeftOffSet(width)){
        //     height += 10;
        // }
        // if (this.tableData.pageSize > 0){
        //     height += 50;
        // }
        // d.query('.tables',this.wrapper).style.height = `calc(100% - ${height}px)`;
        // if ((this.mainTable.width + this.calcMainTableLeftOffSet(width)) <= window.innerWidth) {
        //     this.wrapper.classList.remove('pc-scroll');
        // } else {
        //     this.wrapper.classList.add('pc-scroll');
        // }
    }

    private calcMainTableLeftOffSet(width) {
        let offsetWidth = 0;
        if (this.leftTable) {
            offsetWidth += this.leftTable.width;
        }
        if (this.pseudoTable) {
            offsetWidth += this.pseudoTable.width;
        }
        offsetWidth += width;
        return offsetWidth;
    };

    private initTable(para: IFastTablePara) {
        let cols = para.cols,
            fastTableCols = [[], []];
        if (cols.length === 1) {
            for (let i = 0; i < cols[0].length; i++) {
                if (cols[0][i].isFixed) {
                    fastTableCols[1].push(cols[0][i]);
                } else {
                    fastTableCols[0].push(cols[0][i]);
                }
            }
        }else{
            fastTableCols[0][0] = [];
            for (let i = 0; i < cols[0].length; i++) {
                let rowspan = tools.isEmpty(cols[0][i].rowspan) ? 0 : cols[0][i].rowspan;
                if (cols[0][i].isFixed && rowspan === cols.length) {
                    fastTableCols[1].push(cols[0][i]);
                } else {
                    fastTableCols[0][0].push(cols[0][i]);
                }
            }
            for (let i = 1; i < cols.length; i++) {
                fastTableCols[0].push(cols[i]);
            }
        }
        let con = null;
        if (tools.isMb) {
            con = this.wrapper;
        } else {
            con = this.wrapper.querySelector('.tables');
        }
        let mainTable = new TableBase({
            cols: Array.isArray(fastTableCols[0][0]) ? fastTableCols[0] : [fastTableCols[0]],
            container: con,
            construct: {
                dataCell: FastTableCell,
                col: FastTableColumn
            },
            cellFormat: this.cellFormat,
            content: this,
            colCount: this.colCount,
            maxHeight: this.maxHeight,
            // colMaxWidth: this.maxWidth,
            isWrapLine: this.isWrapLine,
            deviation: this.isLockRight ? 10 : 0,
        });
        this.tableBases.push(mainTable);
        // 给主表添加类
        this.mainTable.head.innerWrapper.classList.add("main-table");
        this.mainTable.body.innerWrapper.classList.add("main-table");
        if (this.colCount) {
            this.mainTable.foot.innerWrapper.classList.add("main-table");
        }
        if (fastTableCols[1].length > 0) {
            this.createLeftTable(fastTableCols[1]);
        }

        this.footSelectEvents.on();
    }

    // 创建左侧锁列表格
    public createLeftTable(cols?: ITableCol[]) {
        // debugger;
        let leftTable = this.mainTable._createAnnexedTable({
            cols: [cols],
            construct: {
                dataCell: FastTableCell,
                col: FastTableColumn
            },
            content: this,
            cellFormat: this.cellFormat,
            colCount: this.colCount,
            maxHeight: this.maxHeight,
            // colMaxWidth: this.maxWidth,
            isWrapLine: this.isWrapLine,
        }, TableBase, 1);

        // leftTable.on(TableBase.EVT_COL_COUNT_CHANGED, (indexes) => {
        //     console.log(indexes);
        // });

        // 加入到基表数组中
        this.tableBases.push(leftTable);
        if (tools.isMb) {
            leftTable.on(TableBase.EVT_COL_VISIBILITY_CHANGED, () => {
                this.setMainTableWidth();
            });
        }


        // 设置样式
        this.leftTable.head.innerWrapper.classList.add("left-table");
        this.leftTable.body.innerWrapper.classList.add("left-table");
        if (this.colCount) {
            this.leftTable.foot.innerWrapper.classList.add("left-table");
        }

        // 设置各表样式
        this.setTableStyle();
    }


    private _tableBases: TableBase[]; // 第0个为主表
    get tableBases() {
        if (!this._tableBases) {
            this._tableBases = [];
        }
        return this._tableBases;
    }

    get mainTable(): TableBase {
        return this.tableBases[0];
    }

    get leftTable(): TableBase {
        return this.tableBases[1];
    }

    tablesEach(fun: (t: TableBase, i: number) => void) {
        this.tableBases.forEach((t, i) => {
            fun(t, i)
        });
    }

    setMainTableWidth() {
        if (tools.isMb) {
            let width = 0;
            if (this.pseudoTable) {
                width += 40;
            }
            if(this.isLockRight){
                width -= 10;
            }
            // console.log(width);
            if (this.leftTable) {
                width += this.leftTable.width;
                let widthStr = 'calc(100% - ' + width + 'px)';
                if(!tools.cssSupports('width', widthStr)){
                    let offsetWidth = this.mainTable.body.innerWrapper.offsetWidth;
                    if(offsetWidth == 0){
                        setTimeout(() => {
                            this.setMainTableWidth();
                        },  1000);
                        return ;
                    }else{
                        widthStr = offsetWidth - width + 'px';
                    }
                }
                this.mainTable.body.innerWrapper.style.width = widthStr;
                this.mainTable.head.innerWrapper.style.width = widthStr;
                this.colCount && (this.mainTable.foot.innerWrapper.style.width = widthStr);
            }else{
                let widthStr = this.isLockRight ? 'calc(100% - 10px)' : '100%';
                if(!tools.cssSupports('width', widthStr)){
                    let offsetWidth = this.mainTable.body.innerWrapper.offsetWidth;
                    if(offsetWidth == 0){
                        setTimeout(() => {
                            this.setMainTableWidth();
                        },  1000);
                        return ;
                    }else{
                        widthStr = offsetWidth - 10 + 'px';
                    }
                }
                this.mainTable.body.innerWrapper.style.width = widthStr;
                this.mainTable.head.innerWrapper.style.width = widthStr;
                this.colCount && (this.mainTable.foot.innerWrapper.style.width = widthStr);
            }

        }
    }

    // 索引列
    private _pseudoTable: FastPseudoTable = null;
    get pseudoTable() {
        return this._pseudoTable;
    }

    private initPseudoTable(type: PseudoTableType, isShow: boolean, isAll = true) {
        // let count = this.mainTable.body.rows ? this.mainTable.body.rows.length : 0;
        this._pseudoTable = this.mainTable._createAnnexedTable({
            fastTable: this,
            type,
            isShow,
            isAll,
            multiHeadRow: this.mainTable.head.rows.length,
            colCount: this.colCount && {text: ' '}
        }, FastPseudoTable, 0) as FastPseudoTable;

        // this._pseudoTable.checkAllBox.onClick = (isChecked) => {
        //     console.log(isChecked);
        // };

        this.setTableStyle();
    }

    // 获取所有行
    private _rows: FastTableRow[] = [];
    get rows(): FastTableRow[] {
        return this._rows;
    }

    // 获取row或者rows
    rowGet(index: number): FastTableRow;
    rowGet(index: number[]): FastTableRow[];
    rowGet(index) {
        let result = [];
        index = tools.toArray(index);
        index.forEach(value => {
            result.push(this.rows[value]);
        });
        return result.length === 1 ? result[0] : result;
    }

    /*rowGet(domIndex: number): FastTableRow {
        let index = null;
        for (let row of this.mainTable.body.rows) {
            if (row && row.domIndex === domIndex) {
                index = row.index;
                break;
            }
        }
        return index !== null ? this.rows[index] : null;
    }*/

    resetRowIndex() {
        this.rows.forEach((row, index) => {
            row.index = index;
        });
    }

    // 添加row或者rows
    rowAdd(obj?: IFastTableRowPara[]);
    rowAdd(obj?: IFastTableRowPara, index?: number);
    rowAdd(obj?, i = 0) {
        if (this.editing && this.editor.insertble) {
            let len = Object.keys(this.mainTable.tableData.get()).length;
            this.tableBases.forEach((table, index) => {
                table.tableData.add(tools.isEmpty(this.editor.defData) ? {} : tools.obj.copy(this.editor.defData), i);
            });
            this.render(0, 1, this.rows.length === 0 ? -1 : i);
            this.initDisabledEditorRow(this.rows[i]);
            this.rows[i].isAdd = true;
            this._drawSelectedCells();
            // 新增行
            typeof len === 'number' && this.edit.addIndex.add(this.data[i][TableBase.GUID_INDEX]);
            return len;
        } else if (tools.isNotEmpty(obj)) {
            tools.toArray(obj).forEach(para => {
                let fastTableRow = new FastTableRow(para);
                this.rows.push(fastTableRow);
            });
            if (this.pseudoTable) {
                this.pseudoTable.render();
            }
        }
        this.resetRowIndex();
    }

    // 删除行
    rowDel(index: number[]): FastTableRow[];
    rowDel(index: number): FastTableRow;
    rowDel(index) {
        if(tools.isNotEmpty(index)) {
            let row = [];
            index = tools.toArray(index);
            index.sort((a, b) => {
                if (a > b) {
                    return -1;
                } else if (a < b) {
                    return 1;
                } else {
                    return 0;
                }
            });
            let isCanDel = this.editing ? index.every((i) => this.editor.rowCanInit(this.rows[i])) : true,
                tableData = this.tableData.data;
            if(isCanDel){
                for (let value of index) {
                    row.push(this.rows[value]);
                    let data = Object.assign({}, tableData[value]);
                    let guidIndex = this.editing ? data[TableBase.GUID_INDEX] : null;
                    this.tablesEach(table => {
                        if (table) {
                            table.body.rowDel(value);
                        }
                    });
                    if (this.editing) {
                        let addIndexObj = this.edit.addIndex,
                            changeIndexObj = this.edit.changeIndex;
                        if (addIndexObj.get().indexOf(guidIndex) > -1) {
                            // 删除行时，若是新增的行则从新增的行中去除
                            addIndexObj.del(guidIndex);
                        } else if (changeIndexObj.get().indexOf(guidIndex) > -1) {
                            // 删除行时，若行已编辑过，则先清除编辑的行，再添加至删除的行中
                            changeIndexObj.del(guidIndex);
                            this.edit.delIndex.add(guidIndex, data);
                        } else {
                            // 添加删除的行
                            this.edit.delIndex.add(guidIndex, data);
                        }
                    }
                    this.rows.splice(value, 1, null);
                }
                this._rows = this._rows.filter(row => row !== null);
                this.resetRowIndex();
                if (this.pseudoTable) {
                    this.pseudoTable.render();
                }
                this.noData.toggle(Object.keys(this.tableData.data).length === 0);
                return row.length === 1 ? row[0] : row;
            }else{
                Modal.alert('系统禁止删除当前记录');
            }

        }else{
            return null;
        }
    }

    // 获取所有被选择的行，返回行数组
    rowSelectedGet(): FastTableRow[] {
        let result = [];
        this.rows.forEach(item => {
            if (item.selected) {
                result.push(item);
            }
        });
        return result;
    }

    // 获取cell
    cellGet(col: number | string, row: number): FastTableCell {
        if (this.rows) {
            let fastTableRow = this.rows[row];
            return tools.isNotEmpty(fastTableRow) ? fastTableRow.cellGet(col) : null;
        } else {
            return null;
        }
    }

    // 获取所有列
    get columns() {
        let columns: FastTableColumn[] = [];
        this.tablesEach((table, i) => {
            if (table) {
                if(this.isLockRight){
                    columns = columns.concat(table.columns as FastTableColumn[]);
                }else{
                    columns = table.columns.concat(columns) as FastTableColumn[];
                }
            }
        });
        return columns;
    }

    get columnsVisible() {
        return this.columns.filter(col => !col.isVirtual && col.show)
    }

    // 获取列
    columnGet(col: number | string): FastTableColumn;
    columnGet(col: (number | string)[]): FastTableColumn[];
    columnGet(col) {
        let result = [];
        col = tools.toArray(col);
        col.forEach(value => {
            result.push(this.columns[this.getColIndex(value)] || null);
        });
        return result.length === 1 ? result[0] : result;
    }

    columnAdd(col: IFastTableCol, data?: any[], index = -1) {
        this.mainTable.columnAdd(col, data);
        if(index !== -1){
            this.changeColIndex(col.name, index);
        }
    }

    changeColIndex(colIndex: string | number, index: number){
        colIndex = this.getColIndex(colIndex);
        let leftLen = this.leftTable ? this.leftTable.columns.length : 0,
            insertTable = index >= leftLen ? this.mainTable : this.leftTable,
            deleteTable = colIndex >= leftLen ? this.mainTable : this.leftTable;
        colIndex = colIndex >= leftLen ? colIndex - leftLen : colIndex;
        index = index >= leftLen ? index - leftLen : index;
        let delCol = deleteTable.columnsDel(colIndex, false);
        insertTable.columnInsertBefore(delCol, index);
    }

    columnDel(col: number | string | (number | string)[]) {
        this.mainTable.columnsDel(col as any, true);
        this.leftTable && this.leftTable.columnsDel(col as any, true);
        this.mainTable.updateTableWidth();
        this.leftTable.updateTableWidth();
    }

    // 设置表格数据
    set data(data: obj[]) {
        // debugger
        if (!Array.isArray(data) || !this.mainTable) {
            return;
        }
        let tableData = this.tableData;
        tableData.data = data;
        let pageSize = tableData.pageSize === -1 ? void 0 : tableData.pageSize;
        this.render(tableData.current, pageSize);
    }

    get data() {
        return this.tableData.data;
    }

    // 添加一行
    dataAdd(data: obj | obj[]) {
        // 处理数据
        let dataLen = this.tableData.data.length,
            rowLen = this.rows.length,
            maxRowLen = this.tableData.pageSize;

        maxRowLen = Math.ceil((rowLen || 1) / maxRowLen) * maxRowLen;

        tools.toArray(data).forEach((data, index) => {
            let dataSplit = this.tableData.dataSplit(data);
            this.tablesEach((table, index) => {
                if (table) {
                    table.tableData.add(dataSplit[index]);
                }
            });

            rowLen ++;
            if(rowLen === maxRowLen) {
                this.render(dataLen, index, -1);
            }
        });
        if(rowLen < maxRowLen) {
            this.render(this.rows.length, tools.toArray(data).length, -1);
        }
        if(!this.tableData.serverMode){
            this.tableData.total = this.tableData.data.length;
        }
    }

    // 删除表格数据
    dataDel(index: number[]): FastTableRow[];
    dataDel(index: number): FastTableRow;
    dataDel(index) {
        let result = [];
        index = tools.toArray(index);
        index.sort().reverse();
        index.forEach(value => {
            this.data.splice(value, 1);
            this.tablesEach(table => {
                if (table) {
                    table.dataDel(value);
                }
            });
        });
        if (this.pseudoTable) {
            this.pseudoTable.render();
        }
        return result.length === 1 ? result[0] : result;
    }

    getColIndex(index: number | string) {
        if (typeof index === "string") {
            this.columns.forEach((item, i) => {
                if (item.name === index) {
                    index = i;
                }
            });
        }
        return typeof index === 'string' ? -1 : index;
    }

    // 处理列数据
    private handleRowData(data) {
        let cols = [];
        this.tablesEach(table => {
            if (table) {
                cols.push(table.columns);
            } else {
                cols.push([]);
            }
        });
        let fastTableData = [];
        if (Array.isArray(data)) {
            fastTableData = [[], []];
            for (let i = 0; i < data.length; i++) {
                let rowObj = data[i];
                let arr = handleData(rowObj);
                fastTableData[0].push(arr[0]);
                fastTableData[1].push(arr[1]);
            }
        } else {
            fastTableData = handleData(data);
        }

        function handleData(oneData) {
            let arr = [{}, {}];
            for (const key in oneData) {
                cols.forEach((col, index) => {
                    col.forEach(colItem => {
                        if (colItem.name === key) {
                            arr[index][key] = oneData[key];
                        }
                    });
                });
            }
            return arr;
        }

        return fastTableData;
    }

    private currentSccrollLeft: number = 0;
    // 创建滚动事件
    private scrollEvent = (() => {
        let self = this;
        let timer = null;
        let scrollHandler = function (e) {
            // self.fastTableMenu && (self.fastTableMenu.ftableMenu.show = false);
            self.currentSccrollLeft = this.scrollLeft;
            d.queryAll(".main-table table", self.wrapper).forEach(el => {
                el.style.webkitTransform = `translateX(${-self.currentSccrollLeft}px) translateZ(0)`;
                el.style.transform = `translateX(${-self.currentSccrollLeft}px) translateZ(0)`;
            });
        };
        let scrollingHandler = () => {
            let handler;
            self.wrapper.classList.add('scrolling');
            d.on(document, 'mouseup', handler = () => {
                d.off(document, 'mouseup', handler);
                self.wrapper.classList.remove('scrolling');
            })
        };
        return {
            on: () => {
                d.on(d.query(".scroll-container", this.wrapper), "scroll", scrollHandler);
                d.on(d.query(".scroll-container", this.wrapper), "mousedown", scrollingHandler);
            },
            off: () => {
                d.off(d.query(".scroll-container", this.wrapper), "scroll", scrollHandler);
                d.off(d.query(".scroll-container", this.wrapper), "mousedown", scrollingHandler);
            }
        }
    })();

    private touchMoveEvent = (() => {
        let displacement = 0,
            self = this,
            headTable,
            footTable;

        let touchMoveHandler = function (e) {
            let currentScrollLeft = self.mainTable.body.innerWrapper.scrollLeft;
            if(displacement !== currentScrollLeft) {
                displacement = currentScrollLeft;

                headTable = d.query("table", self.mainTable.head.innerWrapper);
                self.colCount && (footTable = d.query("table", self.mainTable.foot.innerWrapper));
                // 表头
                headTable.style.webkitTransform = `translateX(${-displacement}px) translateZ(0)`;
                headTable.style.transform = `translateX(${-displacement}px) translateZ(0)`;

                // 表尾
                if (self.colCount) {
                    footTable.style.webkitTransform = `translateX(${-displacement}px) translateZ(0)`;
                    footTable.style.transform = `translateX(${-displacement}px) translateZ(0)`;

                }
            }
        };

        let menuHidden = () => {
            self.fastTableMenu && (self.fastTableMenu.show = false);
        };

        return {
            on: () => {
                d.on(this.mainTable.body.innerWrapper, "scroll", touchMoveHandler);
                d.on(this.wrapper, "touchmove", menuHidden);
            },
            off: () => {
                d.off(this.mainTable.body.innerWrapper, "scroll", touchMoveHandler);
                d.off(this.wrapper, "touchmove", menuHidden);
            }
        }
    })();

    protected footSelectEvents = ((self) => {
        // 列统计change事件
        function change() {
            // debugger;
            let option = this.options[this.selectedIndex];
            let values = d.data(option),
                key = d.closest(this, '[data-name]').dataset.name;
            let indexes = [],
                mainIndexes = self.mainTable ? self.mainTable.tableData.colCount(key, values) : null,
                leftIndexes = self.leftTable ? self.leftTable.tableData.colCount(key, values) : null;

            if(mainIndexes !== null && leftIndexes !== null){
                indexes = mainIndexes.filter((val) => leftIndexes.indexOf(val) > -1);
            }else if(mainIndexes !== null && leftIndexes === null){
                indexes = mainIndexes;
            }else if(mainIndexes === null && leftIndexes !== null){
                indexes = leftIndexes;
            }else{
                indexes = null;
            }

            // // 触发TableBase.EVT_COL_COUNT_CHANGED事件，并将对应的索引返回
            // let handlers = self.eventHandlers[TableBase.EVT_COL_COUNT_CHANGED];
            // handlers && handlers.forEach((item) => {
            //     typeof item === 'function' && item(indexes);
            // });

            self.tablesEach((table) => {
                table.colCountByIndex(indexes);
            });
            self.render(0, void 0, void 0, false);
            // self.body.render(0, Object.keys(self.tableData.get()).length, void 0, false);
        }

        return {
            on() {
                if (self.colCount) {
                    d.off(self.wrapper, 'change', 'select', change);
                    d.on(self.wrapper, 'change', 'select', change);
                }
            },
            off() {
                if (self.colCount) {
                    d.off(self.wrapper, 'change', 'select', change);
                }
            }
        }
    })(this);

    // 改变列宽
    changeColWidth(width: number, name: string) {
        this.columnGet(name).width = width;
    }

    /*
    * 本地过滤
    * */
    public filter = (() => {
        let originalData = [];
        return {
            set: (params) => {
                let len = this.tableData.data.length;
                originalData = this.tableData.data.slice(0, this.editing ? len - 1 : len).concat(originalData);
                let filterData = filteringSeparation(originalData, params);
                this.tableData.data = filterData.conformity;
                originalData = filterData.inconformity;
                this.render(0, this.data.length);
                if (this.editing) {
                    this.rowAdd();
                }

                function filteringSeparation(array: Array<any>, filter: Array<any>) {
                    let inconformity = [],
                        conformity = [];
                    for (let item of array) {
                        let flag = true;
                        filter.forEach((obj) => {
                            if (obj.field === 0) {
                                flag = false;
                                for (let key in item) {
                                    if (queryOp(item[key], obj)) {
                                        flag = true;
                                        break;
                                    }
                                }
                            } else {
                                flag = flag && queryOp(item[obj.field], obj);
                            }
                            if (obj.not) {
                                flag = !flag;
                            }
                        });
                        if (flag) {
                            conformity.push(item);
                        } else {
                            inconformity.push(item);
                        }
                    }
                    return {
                        inconformity,
                        conformity,
                    }
                }
            },
            clear: () => {
                // this.mainTable.tableData.set(allData);
                let len = this.tableData.data.length;
                originalData = this.tableData.data.slice(0, this.editing ? len - 1 : len).concat(originalData);
                this.tableData.data = originalData;
                originalData = [];
                this.render(0, void 0);
                if (this.editing) {
                    this.rowAdd();
                }
            }
        };

        function queryOp(val: any, condition) {
            switch (condition.op) {
                case 2: //等于
                    if (val == condition.values[0]) {
                        return true;
                    }
                    break;
                case 3://大于
                    if (val > condition.values[0]) {
                        return true;
                    }
                    break;
                case 4://大于等于
                    if (val >= condition.values[0]) {
                        return true;
                    }
                    break;
                case 5://小于
                    if (val < condition.values[0]) {
                        return true;
                    }
                    break;
                case 6://小于等于
                    if (val <= condition.values[0]) {
                        return true;
                    }
                    break;
                case 7://介于 between
                    if (val >= condition.values[0] && val <= condition.values[1]) {
                        return true;
                    }
                    break;
                case 9://包含 like
                    if ((typeof val !== "undefined" && val !== null) && (val.toString().indexOf(condition.values[0]) > -1)) {
                        return true;
                    }
                    break;
                case 10://为空 isnull
                    if (!val && val !== 0) {
                        return true;
                    }
                    break;
            }
            return false;
        }
    })();

    // 编辑相关方法与事件
    public edit = (() => {
        let self = this,
            editingCell: TableDataCell = null,
            editedAddIndexes: Array<number> = [],
            deletedIndexes: Array<number> = [],
            deletedData: Array<obj> = [],
            changedIndexes: Array<number> = [],
            editEvent = (e) => {
                e.preventDefault();
                let td = d.closest(e.target, 'td');
                let rowIndex = parseInt(td.parentElement.dataset.index), // 当前行
                    columnIndex = this.getColIndex(td.dataset.name);//当前列

                editingCell = this.rows[rowIndex] ? this.rows[rowIndex].cells[columnIndex] : null;

                let isInsert = this.rows[rowIndex] ? editedAddIndexes.indexOf(this.rows[rowIndex].data[TableBase.GUID_INDEX]) > -1 : false;

                if (tools.isNotEmpty(editingCell) && !editingCell.editing &&
                    (this.editor.updatable || (isInsert && this.editor.insertble))) {
                    if (this.editor.rowCanInit(this.rows[rowIndex]) &&
                        this.editor.cellCanInit(editingCell.column as FastTableColumn,
                            isInsert ? 1 : 0)) {

                        editingCell.editing = true;
                    }
                }

                // console.log(this.rows[rowIndex].cells[columnIndex]);
            };

        function pcEditingScroll(ev) {
            ev.stopPropagation();
            if (this.scrollLeft !== 0) {
                let scrollLeft = this.scrollLeft + 300;
                this.scrollLeft = 0;
                let translate = d.query(".scroll-container", self.wrapper).scrollLeft += scrollLeft;
                d.queryAll(".main-table table", self.wrapper).forEach(el => {
                    el.style.transform = `translateX(${-translate}px) translateZ(0)`;
                });
            }
        }

        function mbEditingScroll(ev) {
            ev.stopPropagation();
            if (this.scrollLeft !== 0) {
                let scrollLeft = this.scrollLeft;
                this.scrollLeft = 0;
                self.mainTable.body.innerWrapper.scrollLeft += scrollLeft;
            }
        }

        let selector = '.section-inner-wrapper:not(.pseudo-table) tbody td:not(.disabled-cell):not(.cell-editing)';

        return {
            addIndex: {
                add(num: number) {
                    editedAddIndexes.push(num);
                },
                del(num?: number) {
                    if (typeof num === 'number') {
                        let index = editedAddIndexes.indexOf(num);
                        index > -1 && editedAddIndexes.splice(index, 1);
                    } else {
                        editedAddIndexes = [];
                    }
                },
                get: () => {
                    if(this.editor) {
                        return editedAddIndexes.slice(0, this.editor.autoInsert ? editedAddIndexes.length - 1 : editedAddIndexes.length);
                    }else{
                        return editedAddIndexes.slice();
                    }
                },
                spaceRowIndex() {
                    return editedAddIndexes[editedAddIndexes.length - 1];
                }
            },
            changeIndex: {
                add(num: number) {
                    changedIndexes.push(num);
                },
                del(num?: number) {
                    if (typeof num === 'number') {
                        let index = changedIndexes.indexOf(num);
                        index > -1 && changedIndexes.splice(index, 1);
                    } else {
                        changedIndexes = [];
                    }
                },
                get() {
                    return changedIndexes.slice();
                },
            },
            delIndex: {
                add(num: number, data: obj) {
                    deletedIndexes.push(num);
                    deletedData.push(Object.assign({}, data || {}));
                },
                del(num?: number) {
                    if (typeof num === 'number') {
                        let index = deletedIndexes.indexOf(num);
                        if (index > -1) {
                            deletedIndexes.splice(index, 1);
                            deletedData.splice(index, 1);
                        }
                    } else {
                        deletedIndexes = [];
                        deletedData = [];
                    }
                },
                get() {
                    return deletedIndexes.slice();
                },
                getData() {
                    return deletedData.map((obj) => {
                        return Object.assign({}, obj || {});
                    });
                }
            },
            event: {
                // 编辑状态事件
                click: {
                    on: () => d.on(this.wrapper, 'click', selector, editEvent),
                    off: () => {
                        d.off(this.wrapper, 'click', selector, editEvent);
                        this.edit.destroyCellInput();
                    },
                },
                // 编辑时触发滚动事件
                scroll: {
                    on: () => {
                        if (!tools.isMb) {
                            d.on(this.mainTable.body.innerWrapper, 'scroll', pcEditingScroll);
                            d.on(this.mainTable.body.wrapper, 'scroll', pcEditingScroll);
                        } else {
                            d.on(this.mainTable.body.wrapper, 'scroll', mbEditingScroll);
                        }
                    },
                    off: () => {
                        if (!tools.isMb) {
                            d.off(this.mainTable.body.innerWrapper, 'scroll', pcEditingScroll);
                            d.off(this.mainTable.body.wrapper, 'scroll', pcEditingScroll);
                        } else {
                            d.off(this.mainTable.body.wrapper, 'scroll', mbEditingScroll);
                        }
                    }
                }
            },
            destroyCellInput() {
                editingCell && (editingCell.editing = false);
                editingCell = null;
            }
        }
    })();

    // 监听拖动改变列宽事件
    private colWidthEvent = (() => {
        let name = "",
            offsetX = 0,
            col = null,
            selector = '.section-inner-wrapper:not(.pseudo-table) th';

        let changeColHandler = (e: IDefinedEvent) => {
            if (e.isFirst) {
                this.hoverEvent.off();
                let node = e.srcEvent.target as Node;
                if (node.nodeName === "TH") {
                    if (e.target.dataset.name !== 'selectCol') {
                        d.query("body").classList.add("showCursor");
                        name = e.target.dataset["name"];
                        col = this.columnGet(e.target.dataset.name);
                    }
                }
                offsetX = 0;
            } else {
                if (name !== "") {
                    this.isChangeColWidth = true;
                    offsetX = offsetX + e.deltaX;
                    if (e.direction === 'right') {
                        if (offsetX >= 0) {
                            this.changeColWidth(
                                col.width + e.deltaX,
                                name
                            );
                        }
                    } else {
                        this.changeColWidth(
                            col.width + e.deltaX,
                            name
                        );
                    }
                    this.changeScrollWidth(0);
                }
            }
            if (e.isFinal) {
                this.hoverEvent.on();
                name = "";
                d.query("body").classList.remove("showCursor");
                this.isChangeColWidth = false;
                this.setMainTableWidth();
            }
        };
        return {
            on: () => {
                d.on(this.wrapper, "pan", selector, changeColHandler);
                this.columns.forEach((column) => {
                    column.isResize = true;
                });
            },
            off: () => {
                d.off(this.wrapper, "pan", selector, changeColHandler);
                this.columns.forEach((column) => {
                    column.isResize = false;
                });
            }
        }
    })();

    // 右键菜单
    private rightMenuEvent = (() => {
        let menuEvent = (e) => {
            e.preventDefault();
        };
        return {
            on: () => d.on(this.wrapper, 'contextmenu', 'tbody td', menuEvent),
            off: () => d.off(this.wrapper, 'contextmenu', 'tobdy td', menuEvent)
        }
    })();

    // 选中的所有cell
    get selectedCells() {
        let cells: FastTableCell[][] = [];
        this.rows.forEach((row) => {
            let arr: FastTableCell[] = [];
            row && row.cells.forEach((cell) => {
                if (cell.selected === true) {
                    arr.push(cell);
                }
            });
            cells.push(arr);
        });
        return cells;
    }

    clearSelectedRows(){
        this.selectedRows.forEach((row) => {
            row.selected = false;
        });
        this.pseudoTable && this.pseudoTable.setCheckBoxStatus();
        // this.pseudoTable && this.pseudoTable.clearPresentSelected();
        this._drawSelectedCells();
    }

    // 获取所有选中的行
    get selectedRows() {
        return this.rows.filter(row => row && row.selected);
    }

    get unselectedRows() {
        return this.rows.filter(row => !row.selected);
    }

    get selectedRowsData() {
        return this.selectedRows.map(row => row.data);
    }

    get selectedPreRowData(){
        if(!this.pseudoTable){
            return null;
        }
        let index = this.pseudoTable.selectIndex;
        if(index in this.rows){
            return this.rows[index].data;
        }
        return null;
    }

    get visibleCol() {
        let visibleCol = [];
        this.columns.forEach((col) => {
            if (col.show) {
                visibleCol.push(col.name);
            }
        });
        return visibleCol;
    }

    get unselectedRowsData() {
        return this.unselectedRows.map(row => row.data);
    }

    // // 双击开启编辑状态
    // private openEditEvent = (() => {
    //     let handler = null,
    //         selector = '.section-inner-wrapper:not(.pseudo-table) tbody';
    //     return {
    //         on: () => d.on(this.wrapper, 'dblclick', selector, handler = () => this.editing = true),
    //         off: () => d.off(this.wrapper, 'dblclick', selector, handler)
    //     }
    // })();

    // 选中效果
    private selectedEvent = (() => {
        // 用于标记shiftkey的起点位置
        let shiftComparePosition = {
            rowIndex: -1,
            columnIndex: -1
        };
        let isDrag = true,
            canSelectMbSet = ['cell-link'], // 当td中包含该class，则在移动端被点击时也可选中；
            timer = null;
        // 点击选中
        let selectedEvent = (e) => {
            isDrag = false;
            let td = d.closest((e.target as HTMLElement), 'td'),
                isCanSelectMb = false,// 在移动端是否可被点击选中
                rowIndex = parseInt(td.parentElement.dataset.index), // 当前行
                columnIndex = this.getColIndex(td.dataset.name);//当前列
            // console.log(columnIndex);

            //判断td在移动端是否可被选中
            if(tools.isMb && td){
                for(let className of canSelectMbSet){
                    if(td.classList.contains(className)){
                        isCanSelectMb = true;
                        break;
                    }
                }
            }

            if (this.pseudoTable && td.dataset.name === 'selectCol') {
                if (this.pseudoTable._type === 'number') {
                    // 未使用checkbox
                    if (e.ctrlKey === true) {
                        singleSelectedPseudoTableCell(rowIndex);
                        shiftComparePosition.rowIndex = rowIndex;
                        shiftComparePosition.columnIndex = 0;
                    } else if (e.shiftKey === true) {
                        if (shiftComparePosition.rowIndex === -1) {
                            shiftComparePosition.rowIndex = rowIndex;
                        }
                        shiftComparePosition.columnIndex = 0;
                        this._clearAllSelectedCells();
                        let columnIndex = this.columns.length - 1;
                        shiftKeySelectedTable({rowIndex: rowIndex, columnIndex});
                    } else {
                        !this.mutiSelect && this._clearAllSelectedCells();
                        singleSelectedPseudoTableCell(rowIndex);
                        shiftComparePosition.rowIndex = rowIndex;
                        shiftComparePosition.columnIndex = 0;
                    }
                }
                this.trigger(FastTable.EVT_SELECTED, rowIndex);
            } else if(!tools.isMb || isCanSelectMb) {
                // 点击表格cell选中只在 “PC端” 或者 “cell 为link类型的 ”开启；
                if (e.ctrlKey === true) {
                    if (this.selectedCells[rowIndex].length === this.rowGet(rowIndex).cells.length) {
                        let row = this.rowGet(rowIndex);
                        row && row._selectedInnerRowSet(true);
                    } else {
                        singleSelectedTabelCell(rowIndex, columnIndex);
                    }
                    shiftComparePosition.rowIndex = rowIndex;
                    shiftComparePosition.columnIndex = columnIndex;
                } else if (e.shiftKey === true) {
                    if (shiftComparePosition.columnIndex === -1 && shiftComparePosition.rowIndex === -1) {
                        shiftComparePosition.columnIndex = columnIndex;
                        shiftComparePosition.rowIndex = rowIndex;
                    }
                    this._clearAllSelectedCells();
                    shiftKeySelectedTable({rowIndex: rowIndex, columnIndex});
                } else {
                    let cell = this.cellGet(columnIndex, rowIndex);
                    if (e.button === 2 && cell.selected === true) {
                    } else {
                        this._clearAllSelectedCells();
                        singleSelectedTabelCell(rowIndex, columnIndex);
                        shiftComparePosition.rowIndex = rowIndex;
                        shiftComparePosition.columnIndex = columnIndex;
                    }
                }
            }
            this._drawSelectedCells();
            this.pseudoTable.setCheckBoxStatus();
            /*clearTimeout(timer);
            timer = setTimeout(() => {
                this.trigger(FastTable.EVT_SELECTED);
                clearTimeout(timer);
            }, 100);*/
        };

        // 拖动选中
        let dragSelectedEvent = (e) => {
            let td = d.closest((e.target as HTMLElement), 'td');
            let /*rowIndex = parseInt(td.parentElement.dataset.index), // 当前行*/
                rowIndex = parseInt(td.parentElement.dataset.index),
                columnIndex = this.getColIndex(td.dataset.name);//当前列
            let previousePostion = {
                rowIndex: -1,
                columnIndex: -1
            };
            isDrag = true;
            let moveHandler = (ev) => {
                if (isDrag) {
                    shiftComparePosition.columnIndex = columnIndex;
                    shiftComparePosition.rowIndex = rowIndex;
                    isDrag = false;
                }
                let td = d.closest((ev.target as HTMLElement), 'td');
                if (ev.target.tagName === 'TD') {
                    let currentPosition = {
                        rowIndex: parseInt(td.parentElement.dataset.index),
                        columnIndex: this.getColIndex(ev.target.dataset.name)
                    };
                    if (currentPosition === previousePostion) {
                        return;
                    }
                    if (this.pseudoTable && td.dataset.name === 'selectCol') {

                    } else {
                        if (ev.ctrlKey === true) {

                        } else if (ev.shiftKey === true) {

                        } else {
                            let cell = this.cellGet(currentPosition.columnIndex, currentPosition.rowIndex);
                            if (e.button === 2 && cell.selected === true) {

                            } else {
                                if (ev.target.dataset.name !== 'selectCol') {
                                    this._clearAllSelectedCells();
                                    shiftKeySelectedTable(currentPosition);
                                }
                            }
                        }
                    }
                    previousePostion = currentPosition;

                    this._drawSelectedCells();
                    this.pseudoTable.setCheckBoxStatus();
                }
            };
            let newMoveHandler = tools.pattern.throttling(moveHandler, 30);
            let endHandler;
            d.on(document, 'mousemove', newMoveHandler);
            d.on(document, 'mouseup', endHandler = () => {
                isDrag = false;
                d.off(document, 'mousemove', newMoveHandler);
                d.off(document, 'mouseup', endHandler);
                clearTimeout(timer);
                timer = setTimeout(() => {
                    this.trigger(FastTable.EVT_SELECTED);
                    clearTimeout(timer);
                }, 100);
            })
        };
        let singleSelectedTabelCell = (row, column) => {
            let rowObj = this.rowGet(row);
            if (rowObj) {
                let cell = rowObj.cellGet(column);
                if (!cell.isVirtual)
                    cell._selectedInnerSet(true);
            }
        };
        let singleSelectedPseudoTableCell = (row: number) => {
            // let pseudoTableRow = this.pseudoTable.body.rowGet(tools.isEmpty(domIndex) ? row : domIndex);
            // pseudoTableRow.cells[0].selected = true; // 伪列选中
            let sRow = this.rowGet(row);
            (this.mutiSelect && sRow) ? sRow._selectedInnerRowSet(!sRow.selected) : sRow._selectedInnerRowSet(true);

        };
        let shiftKeySelectedTable = (currentPosition) => {
            let minRowIndex = Math.min(shiftComparePosition.rowIndex, currentPosition.rowIndex),
                maxRowIndex = Math.max(shiftComparePosition.rowIndex, currentPosition.rowIndex),
                minColumnIndex = Math.min(shiftComparePosition.columnIndex, currentPosition.columnIndex),
                maxColumnIndex = Math.max(shiftComparePosition.columnIndex, currentPosition.columnIndex);
            if (maxColumnIndex - minColumnIndex === this.columns.length - 1) {
                // 选择整行
                for (let i = minRowIndex; i <= maxRowIndex; i++) {
                    let row = this.rowGet(i);
                    row && row._selectedInnerRowSet(true);
                }
            } else {
                for (let i = minRowIndex; i <= maxRowIndex; i++) {
                    for (let j = minColumnIndex; j <= maxColumnIndex; j++) {
                        let row = this.rowGet(i);
                        if (row) {
                            let cell = row.cellGet(j);
                            if (!cell.isVirtual)
                                cell._selectedInnerSet(true);
                        }
                    }
                }
            }
        };
        let selector = '.section-inner-wrapper:not(.pseudo-table) tbody td:not(.disabled-cell)',
            eventName = tools.isMb ? 'click' : 'mousedown';
        return {
            selectedOn: () => d.on(this.wrapper, eventName, 'tbody td:not(.disabled-cell)', selectedEvent),
            selectedOff: () => d.off(this.wrapper, eventName, 'tbody td:not(.disabled-cell)', selectedEvent),
            dragOn: () => d.on(this.wrapper, 'mousedown', selector, dragSelectedEvent),
            dragOff: () => d.off(this.wrapper, 'mousedown', selector, dragSelectedEvent)
        }
    })();

    calcWidth() {
        if (this.container) {
            let fullWidth = this.container.clientWidth,
                allWidth = this.mainTable.width,
                cols: FastTableColumn[] = this.columns || []; // 存放每一列的宽度
            if(this.leftTable){
                allWidth += this.leftTable.width;
            }
            if(this.pseudoTable){
                allWidth += this.pseudoTable.width;
            }
            let len = 0;
            cols.forEach((col) => {
                if (col.show && !col.isVirtual) {
                    len++;
                }
            });
            if (this.isFullWidth && allWidth < fullWidth) {

                if (len > 0) {
                    let remainingWidth = tools.isMb ? fullWidth - this.width + 2 : fullWidth - this.width - 2,
                        avg = (remainingWidth + 10) / len;
                    cols.forEach((col) => {
                        if (col.show && !col.isVirtual) {
                            col.width += avg;
                        }
                    })
                }
            }

            // 判断有右侧滚动条时，设置右侧锁列与锁头对齐
            if(this.mainTable.body.scrollWrapper.offsetHeight > this.mainTable.body.wrapper.offsetHeight + 10){
                if(this.isLockRight){
                    this.leftTable && (this.leftTable.body.innerWrapper.style.marginRight = '-10px');
                }
            }else{
                if(this.isLockRight) {
                    this.leftTable && this.leftTable.body.innerWrapper.style.removeProperty('margin-right');
                }
            }
        }

        let events = this.eventHandlers[FastTable.EVT_WIDTH_CANCEL];
        tools.isNotEmpty(events) && events.forEach((handler) => {
            typeof handler === 'function' && handler();
        });


        // 超出父元素宽度时，限制最大宽度
        // fullWidthCalc();

        // // 撑开到父元素宽度
        // function fullWidthCalc() {
        // // 平均值
        //     let ave = fullWidth / cols.length,
        //     remainingWidth = ave , // 剩下的宽度
        //     remainingLen = cols.length; // 剩下的列
        //
        //     // 大于平均值的取平均值
        //     for(let col of cols){
        //         if(col.width > ave){
        //             remainingWidth -= col.width; // 剩下的宽度
        //             remainingLen --; // 剩下的数量
        //             col.width = ave;
        //         }
        //     }
        //
        //     let remainingAve = remainingWidth / remainingLen; // 除去大于平均宽度之后的总宽
        //     for(let col of cols){
        //         if(col.width <= ave){
        //             col.width = remainingAve; // 再赋值给剩下的列
        //         }
        //     }
        // }
    }

    protected rendering = false;
    // 渲染
    render(indexes: number[], position?: number): void
    render(start: number, length: number, position?: number, isUpdateFoot?: boolean): void
    render(x, y?, w?, z = true) {
        if(this.rendering){
            return;
        }
        this.rendering = true;

        let promiseList: Promise<any>[] = [];
        this.wrapper.style.display = 'none';
        this.tablesEach(table => {
            promiseList.push(table.render(x, y, w, z));
        });
        // debugger;
        let indexes = this.mainTable.body.rows.map(row => row ? row.index : null);
        let delIndexes = [];
        d.diff(indexes, this.rows, {
            create: (index: number) => {
                if (index !== null) {
                    /* this._rows.push(new FastTableRow({
                         fastTable: this,
                         index: index
                     }))*/
                    let flag = true;
                    for (let i = 0, len = this._rows.length; i < len; i++) {
                        if (!(i in this._rows)) {
                            this._rows[i] = new FastTableRow({
                                fastTable: this,
                                index: index
                            });
                            flag = false;
                            break;
                        }
                    }
                    if (flag) {
                        this._rows.push(new FastTableRow({
                            fastTable: this,
                            index: index
                        }));
                    }
                }
            },
            replace: (index, row) => {
                if (tools.isNotEmpty(row) && index !== null) {
                    row.index = index;
                } else if (tools.isEmpty(row) && index !== null) {
                    this._rows[index] = new FastTableRow({
                        fastTable: this,
                        index: index
                    });

                } else if (tools.isNotEmpty(row) && index === null) {
                    let index = this._rows.indexOf(row);
                    if (index >= 0) {
                        delete this._rows[index];
                    }
                    row.destroy();
                }
            },
            destroy: (row) => {
                if (tools.isNotEmpty(row)) {
                    let index = this._rows.indexOf(row);
                    if (index >= 0) {
                        delIndexes.push(index)
                    }
                }
            }
        });
        this.rowDel(delIndexes);
        this.pseudoTable && this.pseudoTable.render();
        this.noData.toggle(Object.keys(this.tableData.data).length === 0);

        this.wrapper.style.display = 'block';
        // this.tablesEach((table) => {
        //     table.adjustColWidth(0);
        //     // if (this.tableData.serverMode) {
        //     //     table.adjustColWidth(/*tools.isMb ? Math.max(0, len - this.tableData.pageSize) :*/ 0);
        //     // } else {
        //     //     table.adjustColWidth(0);
        //     // }
        // });
        // this.isWrapLine && this.setRowsHeight();
        // //   监听滚动事件
        //
        // this.calcWidth();
        // this.setMainTableWidth();

        this.rows && this.rows.forEach((row) => {
            row.format();
        });
        if (tools.isPc) {
            // PC端
            this.scrollEvent.off();
            this.scrollEvent.on();
        } else {
            //  移动端
            // this.wrapper.querySelector('.scroll-container').classList.add('hide');
            this.touchMoveEvent.off();
            this.touchMoveEvent.on();

        }

        let handlers = this.eventHandlers[FastTable.EVT_RENDERED];
        Array.isArray(handlers) && handlers.forEach(handler => {
            handler();
        });
        Promise.all(promiseList).then(() => {}).catch((e) => {
            console.log(e);
        }).finally(() => {
            this.recountWidth();
            this.rendering = false;
        });
    }

    loadedError = () => {
        let clickHandler = null;
        this.noData.toggle(false);
        this.errorData.toggle(true);

        d.on(this.mainTable.body.wrapper, 'click', clickHandler = () => {
            this.tableData.refresh();
            this.errorData.toggle(false);
            this.noData.toggle(true);
            d.off(this.mainTable.body.wrapper, 'click', clickHandler);
        });
    };

    protected errorData = (() => {
        return {
            toggle: (isShow: boolean) => {
                this.mainTable.body.wrapper.classList.remove(FastTable.TABLE_NOT_DATA_CLASS);
                this.mainTable.body.wrapper.classList.toggle(FastTable.TABLE_LOADED_ERROR_CLASS, isShow);
            }
        }
    })();

    protected noData = (() => {
        return {
            toggle: (isShow: boolean) => {
                this.mainTable.body.wrapper.classList.remove(FastTable.TABLE_LOADED_ERROR_CLASS);
                this.mainTable.body.wrapper.classList.toggle(FastTable.TABLE_NOT_DATA_CLASS, isShow);
            }
        };
    })();

    get width() {
        let pseudoTableWidth = this.pseudoTable ? this.pseudoTable.width : 0;
        return this.tableBases.reduce((width, table) => table.width + width, 0) + pseudoTableWidth
    }

    _clearAllSelectedCells() {
        this.selectedCells.forEach((row, index) => {
            if (row.length > 0) {
                let selRow = this.rowGet(index);
                if (selRow) {
                    selRow._selectedInnerRowSet(false);
                    row && row.forEach((cell, i, arr) => {
                        if (cell) {
                            let headerCell = this.columnGet(cell.name).cells[0][0];
                            headerCell && (headerCell.selected = false);
                            if (i === arr.length - 1 && index === this.selectedCells.length - 1) {
                                // 最后一次绘制
                                cell._selectedInnerSet(false);
                            } else {
                                cell._selectedInnerSet(false);
                            }
                        }
                    })
                }
            }
        })
    }

    _drawSelectedCells() {
        // 清除表头的状态
        this.columns.forEach((col) => {
            // col.cells[0][0].selected = false;
            col.selected = false;
        });
        let uniIndex = {};
        this.selectedCells.forEach((rowCells, i, array) => {
            if (this.mainTable.body.rows[i]) {
                let index = this.mainTable.body.rows[i].index;
                // 绘制伪列
                if (this.pseudoTable) {
                    uniIndex[index] = rowCells.length;
                }
                rowCells.forEach((cell) => {
                    // 绘制表头
                    // headerCell = column.cells[0][0];
                    // if (headerCell.selected === false) {
                    //     headerCell.selected = true;
                    // }
                    let columnIndex = this.getColIndex(cell.name);
                    let column = this.columns[columnIndex];
                    if (column.selected === false) {
                        column._selectedInnerColSet(true, false);
                    }

                    let allBorderClass = ['topBorder', 'bottomBorder', 'leftBorder', 'rightBorder'];
                    allBorderClass.forEach((cName) => {
                        cell.wrapper.classList.add(cName);
                    });
                    // let currentDomIndex = this.mainTable.body.rows[index].domIndex,
                    //     prevDomIndex = currentDomIndex - 1,
                    //     nextDomIndex = currentDomIndex + 1;
                    // if (prevDomIndex >= 0){
                    //     let prevIndex  = parseInt((this.mainTable.body.rows[index].wrapper.previousElementSibling as HTMLElement).dataset.index);
                    //     if (this.rowGet(prevIndex).cellGet(columnIndex).selected) {
                    //         cell.wrapper.classList.remove('topBorder');
                    //     }
                    // }
                    // if (nextDomIndex <= array.length-1){
                    //     let nextIndex  = parseInt((this.mainTable.body.rows[index].wrapper.nextElementSibling as HTMLElement).dataset.index);
                    //     if (this.rowGet(nextIndex).cellGet(columnIndex).selected) {
                    //         cell.wrapper.classList.remove('topBorder');
                    //     }
                    // }

                    //上一行
                    let topIndex = 1,
                        topRow = this.rowGet(index - topIndex);
                    while (topRow && index - topIndex >= 0) {
                        let topCell = topRow.cellGet(columnIndex);
                        if (topCell && !topCell.isVirtual && topCell.show) {
                            topCell.selected && cell.wrapper.classList.remove('topBorder');
                            break;
                        }
                        topIndex++;
                        topRow = this.rowGet(index - topIndex);
                    }
                    // if (domIndex - 1 >= 0) {
                    //     if (this.rowGet(domIndex - 1).cellGet(columnIndex).selected) {
                    //         !cell.isVirtual && cell.wrapper.classList.remove('topBorder');
                    //     }
                    // }

                    // 下一行
                    let bottomIndex = 1,
                        bottomRow = this.rowGet(index + bottomIndex);
                    while (bottomRow && index + bottomIndex < array.length) {
                        let bottomCell = bottomRow.cellGet(columnIndex);
                        if (bottomCell && !bottomCell.isVirtual && bottomCell.show) {
                            bottomCell.selected && cell.wrapper.classList.remove('bottomBorder');
                            break;
                        }
                        bottomIndex++;
                        bottomRow = this.rowGet(index + bottomIndex);
                    }
                    // if (domIndex + 1 < array.length) {
                    //     if (this.rowGet(domIndex + 1).cellGet(columnIndex).selected) {
                    //         !cell.isVirtual && cell.wrapper.classList.remove('bottomBorder');
                    //     }
                    // }


                    // 左侧列
                    let leftIndex = 1,
                        leftRow = this.rowGet(index);
                    while (leftRow && columnIndex - leftIndex >= 0) {
                        let leftCell = leftRow.cellGet(columnIndex - leftIndex);
                        if (leftRow && !leftCell.isVirtual && leftCell.show) {
                            leftCell.selected && cell.wrapper.classList.remove('leftBorder');
                            break;
                        }
                        leftIndex++;
                        leftRow = this.rowGet(index);
                    }
                    // 右侧列
                    let rightIndex = 1,
                        rightRow = this.rowGet(index);
                    while (rightRow && columnIndex + rightIndex < this.columns.length) {
                        let rightCell = rightRow.cellGet(columnIndex + rightIndex);
                        if (rightCell && !rightCell.isVirtual && rightCell.show) {
                            rightCell.selected && cell.wrapper.classList.remove('rightBorder');
                            break;
                        }
                        rightIndex++;
                        rightRow = this.rowGet(index);
                    }
                    // if (columnIndex + 1 < this.columns.length) {
                    //     if (this.rowGet(domIndex).cellGet(columnIndex + 1).selected) {
                    //         !cell.isVirtual && cell.wrapper.classList.remove('rightBorder');
                    //     }
                    // }
                })
            }
        });
        for (let index in uniIndex) {
            let status = 0,
                row = this.rowGet(parseInt(index)),
                len = uniIndex[index],
                length = row.cells.filter((cell) => cell.show && !cell.isVirtual).length;
            row && row._rowSelectedWidthDraw(false, false);
            if (len > 0 && len < length) {
                status = 2;
            } else if (row && length <= len) {
                status = 1;
            }
            if (status > 0) {
                row && row._rowSelectedWidthDraw(true, false);
            }
            this.pseudoTable._setCellsSelected(parseInt(index), status);
        }
    }

    hoverMoreEvent = (() => {
        let selected = '.section-inner-wrapper:not(.pseudo-table) td',
            overHandler = null,
            outHandler = null,
            moreWrapper,
            timer = null;

        return {
            on: () => {
                d.on(this.wrapper, 'mouseover', selected, overHandler = (ev) => {
                    clearTimeout(timer);
                    moreWrapper && d.remove(moreWrapper);
                    let td = d.closest(ev.target, 'td'),
                        rowIndex = td.parentElement.dataset['index'],
                        colName = td.dataset['name'],
                        cell = this.rows[rowIndex].cellGet(colName);
                    if(cell.isMore){
                        moreWrapper = <div className="more-detail"/>;
                        moreWrapper.innerHTML = cell.text;
                        d.setPosition(moreWrapper, cell.wrapper, true);
                        moreWrapper.style.zIndex = '1009';
                        d.on(moreWrapper, 'mouseover', () => {
                            clearTimeout(timer);
                            d.off(moreWrapper, 'mouseover');
                            d.on(moreWrapper, 'mouseout', () => {
                                clearTimeout(timer);
                                timer = setTimeout(() => {
                                    moreWrapper && d.remove(moreWrapper);
                                    moreWrapper = null;
                                }, 100);
                                d.off(moreWrapper, 'mouseout');
                            });
                        })
                    }
                });
                d.on(this.wrapper, 'mouseout', outHandler = () => {
                    clearTimeout(timer);
                    timer = setTimeout(() => {
                        moreWrapper && d.remove(moreWrapper);
                        moreWrapper = null;
                    }, 100);
                });
            },
            off: () => {
                moreWrapper && d.remove(moreWrapper);
                moreWrapper = null;
                d.off(this.wrapper, 'mouseover', selected, overHandler);
                d.off(this.wrapper, 'mouseout', outHandler);
            }
        }
    })();

    hoverEvent = (() => {
        let selected = '.section-inner-wrapper:not(.pseudo-table) th',
            column = null,
            overHandler = null,
            outHandler = null;
        return {
            on: () => {
                d.on(this.wrapper, 'mouseover', selected, overHandler = (ev) => {
                    let th = d.closest(ev.target, 'th');
                    column = this.columnGet(th.dataset.name);
                    column && column.bodyWrapper.classList.add('hover');
                });
                d.on(this.wrapper, 'mouseout', selected, outHandler = () => {
                    column && column.bodyWrapper.classList.remove('hover');
                    column = null;
                });
            },
            off: () => {
                d.off(this.wrapper, 'mouseover', selected, overHandler);
                d.off(this.wrapper, 'mouseout', selected, outHandler);
            }
        }
    })();

    public click = (() => {
        let handlers: objOf<EventListener[]> = {},
            isOn = true;

        /**
         * 添加事件数组
         *
         * 1.缓存handler
         * 2.判断当前是否为开启状态
         * 3.是 - 用d.on 添加监听
         * 4.否 - 不用处理
         *
         * @param {string} selector 代理对象
         * @param {EventListener} handler 事件函数
         */
        let add = (selector: string, handler: EventListener) => {
            handlers[selector] = handlers[selector] || [];
            handlers[selector].push(handler);

            isOn && d.on(this.wrapper, 'click', selector, handler);
        };
        /**
         * 删除事件数组
         *
         * 1.从缓存删除handler
         * 2.判断当前是否为开启状态
         * 3.是 - 用d.off 移除监听
         * 4.否 - 不用处理
         *
         * @param {string} selector 代理对象
         * @param [handler]
         */
        let remove = (selector: string, handler?: EventListener) => {
            let selHandlers = handlers[selector];
            let index = Array.isArray(selHandlers) ? selHandlers.indexOf(handler) : -1;
            if (index === -1) {
                return
            }

            selHandlers.splice(index, 1);
            !selHandlers[0] && delete handlers[selector];

            isOn && d.off(this.wrapper, 'click', selector, handler);
        };

        let on = () => {
            off();
            isOn = true;
            for (let selector in handlers) {
                handlers[selector].forEach((handler) => {
                    d.on(this.wrapper, 'click', selector, handler);
                })
            }
        };

        let off = () => {
            isOn = false;
            for (let selector in handlers) {
                handlers[selector].forEach((handler) => {
                    d.off(this.wrapper, 'click', selector, handler);
                })
            }
        };

        return {add, remove, on, off}
    })();

    // 获取当前选择列的个数
    getSelectedCols(): FastTableColumn[] {
        let cols = [];
        this.columns.forEach((col) => {
            col.selected && cols.push(col);
        });
        return cols;
    }

    protected columnsSort(procedure: Array<Array<string>>) {
        let len = this.leftTable.columns.length;
        this.columns.forEach((col) => {
            if (col.isFixed) {
                col.isFixed = false;
            }
        });
        procedure && procedure.forEach((items) => {
            if(items[0] === 'hide'){
                this.columnGet(items[1]).show = false;
            }else if(items[0] === 'show'){
                this.columnGet(items[1]).show = true;
            }else{
                this.mainTable.columnExchange(items[0], items[1]);
            }
        });
        for (let i = 0; i < len; i++) {
            this.columns[i].isFixed = true;
        }

        let result = {}, index = 0;
        for(let column of this.columns){
            if(!column.isVirtual){
                result[column.name] = {
                    index,
                    isShow: column.show,
                    isFixed: column.isFixed
                };
                index ++;
            }
        }

        let handlers = this.eventHandlers[FastTable.EVT_TABLE_COL_CHANGE];
        tools.isNotEmpty(handlers) && handlers.forEach(handler => {
            typeof handler === 'function' && handler({
                data: {
                    [tools.isMb ? 'mb' : 'pc']: result
                }
            });
        })

        /*let diffReplace = (n, o) => {
            if (n !== o) {
                let index = allNames.indexOf(o);
                allNames[allNames.indexOf(n)] = o;
                allNames[index] = n;
                this.mainTable.columnExchange(n, o);
            }
        };

        let i = 0,
            hasNew = i in names,
            hasOld = i in allNames;

        while (hasNew || hasOld) {
            diffReplace(names[i], allNames[i]);
            i++;
            hasNew = i in names;
            hasOld = i in allNames;
        }
        for (let i = 0; i < len; i++) {
            this.columns[i].isFixed = true;
        }*/
    }

    colsSort = (() => {
        let modal: Modal = null,
            guidIndex = tools.getGuid(),
            showList: HTMLElement = null,
            body: HTMLElement = null,
            hideList: HTMLElement = null,
            draggingItem: HTMLElement = null,
            draggedItem: HTMLElement = null,
            selectedItem: HTMLElement = null,
            selectedIndex: number = null,
            isFirst: boolean = true,
            handler: EventListener = null,
            draggingType: 'hide' | 'show' = 'show',
            hideListTop: number = 0,
            showListTop: number = 0,
            offset = {x: 0, y: 0},
            procedure = [],
            items: Array<{ x?: number, y?: number, w?: number, h?: number, el: HTMLElement, index: number }> = null,
            hideItems: Array<{ x?: number, y?: number, w?: number, h?: number, el: HTMLElement, index: number }> = [];

        function initModal() {
            return new Modal({
                container: document.body,
                header: '列管理',
                position: tools.isMb ? 'full' : '',
                width: '730px',
                isShow: true,
            });
        }

        let dragEvent = {
            on: () => {
                d.on(body, 'touchstart', '.col-admin-list', handler = (ev) => {
                    let handleMove, handleEnd, disX = 0, disY = 0;
                    draggedItem = d.closest(ev.target as HTMLElement, '.col-list-item>div');
                    draggingType = d.closest(ev.target as HTMLElement, 'ul').classList.contains('list-show') ? 'hide' : 'show';
                    if (draggedItem !== null) {
                        draggingItem = draggedItem.cloneNode(true) as HTMLElement;

                        draggedItem.classList.add('placeholder');
                        selectedItem = draggedItem;
                        selectedItem.classList.add('selected');

                        draggingItem.classList.add('dragging');
                        offset.x = (ev as TouchEvent).targetTouches[0].clientX;
                        offset.y = (ev as TouchEvent).targetTouches[0].clientY;
                        disX = offset.x - draggedItem.getBoundingClientRect().left;
                        disY = offset.y - draggedItem.getBoundingClientRect().top;
                        offset.x = offset.x - disX;
                        offset.y = offset.y - disY;

                        draggingItem.style.cssText = 'transform: translateX(' + offset.x +
                            'px) translateY(' + offset.y + 'px) translateZ(0)';
                        d.append(document.body, draggingItem);
                        hideListTop = hideList.getBoundingClientRect().top;
                        showListTop = showList.getBoundingClientRect().top + showList.getBoundingClientRect().height;
                        items.forEach((obj) => {
                            let offset = obj.el.getBoundingClientRect();
                            obj.x = offset.left;
                            obj.y = offset.top;
                            obj.w = offset.width;
                            obj.h = offset.height;
                        });
                    }

                    d.on(document, 'touchmove', handleMove = tools.pattern.throttling((e) => {
                        // isHide = (e as TouchEvent).targetTouches[0].clientY > hideListTop;
                        if (draggingItem !== null) {
                            moveChange(offset.x, offset.y);
                            offset.x = (e as TouchEvent).targetTouches[0].clientX - disX;
                            offset.y = (e as TouchEvent).targetTouches[0].clientY - disY;
                            draggingItem.style.cssText = 'transform: translateX(' + offset.x +
                                'px) translateY(' + offset.y + 'px) translateZ(0)';
                        }
                    }, 30));
                    d.on(document, 'touchend', handleEnd = (ev) => {
                        isFirst = true;
                        exchange();
                        d.off(document, 'touchmove', handleMove);
                        d.off(document, 'touchend', handleEnd);
                    })
                });
            },
            off: () => {
                d.off(body, 'touchstart', '.col-admin-list', handler);
            }
        };

        let exchange = () => {
            draggedItem && draggedItem.classList.remove('placeholder');
            draggingItem && draggingItem.classList.remove('dragging');
            selectedItem && selectedItem.classList.remove('selected');
            if (draggedItem !== selectedItem) {
                if(selectedItem.classList.contains('list-' + draggingType)){
                    d.remove(draggedItem.parentElement);
                    draggingItem.removeAttribute('style');
                    let li = <li className="col-list-item">{draggingItem}</li>;
                    if(draggingType === 'hide'){
                        d.append(hideList, li);
                        for(let i = 0; i < items.length; i ++){
                            let item = items[i];
                            if(item.el.dataset['name'] === draggedItem.dataset['name']){
                                let item = items.splice(i, 1)[0];
                                item.el = draggingItem;
                                hideItems.push(item);
                                break;
                            }
                        }
                    }else{
                        d.append(showList, li);
                        for(let i = 0; i < hideItems.length; i ++){
                            let item = hideItems[i];
                            if(item.el.dataset['name'] === draggedItem.dataset['name']){
                                let item = hideItems.splice(i, 1)[0];
                                item.el = draggingItem;
                                items.push(item);
                                break;
                            }
                        }
                    }
                    procedure.push([draggingType, draggedItem.dataset.name]);
                } else{
                    let cloneNode = selectedItem.cloneNode(true) as HTMLElement;
                    draggingItem.removeAttribute('style');
                    for (let item of items) {
                        if (item.el === draggedItem) {
                            item.el = cloneNode;
                        }
                    }
                    items[selectedIndex].el = draggingItem;
                    procedure.push([draggingItem.dataset.name, selectedItem.dataset.name]);
                    d.replace(draggingItem, selectedItem);
                    d.replace(cloneNode, draggedItem);
                }
            } else {
                d.remove(draggingItem);
            }
            draggedItem = null;
            draggingItem = null;
            selectedItem = null;
        };

        let moveChange = (x: number, y: number) => {

            if((draggingType === 'hide' && y > hideListTop) || (draggingType === 'show' && y < showListTop)){
                selectedItem && selectedItem.classList.remove('selected');
                selectedItem = draggingType === 'hide' ? hideList : showList;
                selectedItem.classList.add('selected');
            }else{
                let begin = (Math.pow(items[0].x - x, 2) + Math.pow(items[0].y - y, 2));
                selectedIndex = 0;
                for (let i = 1; i < items.length; i++) {
                    let item = items[i];
                    let offset = (Math.pow(item.x - x, 2) + Math.pow(item.y - y, 2));
                    if (offset < begin) {
                        begin = offset;
                        selectedIndex = i;
                    }
                }
                selectedItem && selectedItem.classList.remove('selected');
                selectedItem = items[selectedIndex].el;
                selectedItem.classList.add('selected');
            }

        };

        return {
            open: () => {
                showList = <ul className="col-admin-list list-show"/>;
                hideList = <ul className="col-admin-list list-hide"/>;
                items = [];
                let showFrag = document.createDocumentFragment(),
                    hideFrag = document.createDocumentFragment();
                this.columns.forEach((col, index) => {
                    if(!col.isVirtual){
                        let div = <div data-index={index + ''} data-name={col.name}><span>{col.title}</span></div>;
                        let li = <li className="col-list-item">{div}</li>;
                        if(col.show){
                            showFrag.appendChild(li);
                            items.push({el: div, index});
                        }else{

                            hideFrag.appendChild(li);
                            hideItems.push({el: div, index});
                        }
                    }
                });

                d.append(showList, showFrag);
                d.append(hideList, hideFrag);
                let names = items.map((item) => {
                    return item.el.dataset.name;
                });

                body = <div className="col-admin-content">
                    <h4 className="title">显示</h4>
                    {showList}
                    <h4 className="title">隐藏</h4>
                    {hideList}
                </div>;
                if (modal === null) {
                    modal = initModal();
                    modal.body = body;
                    modal.modalHeader.rightPanel = (() => {
                        let rightInputBox = new InputBox(),
                            clearBtn = new Button({
                                content: '确定',
                                onClick: () => {
                                    this.columnsSort(procedure);
                                    procedure = [];
                                    dragEvent.off();
                                    modal.isShow = false;
                                }
                            });
                        rightInputBox.addItem(clearBtn);
                        return rightInputBox;
                    })();
                    modal.onClose = () => {
                        procedure = [];
                        dragEvent.off();
                    }
                } else {
                    modal.body = body;
                    modal.isShow = true;
                }

                dragEvent.on();
            },
            destroy: () => {
                dragEvent.off();
                modal && modal.destroy();
                modal = null;
                showList = null;
                items = null;
                offset = null;
                this.fastTableMenu && this.fastTableMenu.destory();
            }
        }
    })();

    private dragColumnsEvent = (() => {
        let dragHandler = e => {
            let th = d.closest(e.target, 'th'),
                isTh = d.matches(e.target, '.section-inner-wrapper:not(.pseudo-table) th>div'),
                resouceCol: FastTableColumn = null,
                destinationCol: FastTableColumn = null,
                tempCol: HTMLElement = null,
                offsetLeft = tools.offset.left(this.mainTable.wrapper),
                offsetTop = tools.offset.top(this.mainTable.wrapper),
                leftTableColsName = [],
                scrollLeft = 0;
            this.leftTable && this.leftTable.columns.forEach((col) => {
                leftTableColsName.push(col.name);
            });
            if (isTh) {
                let dx = e.clientX - tools.offset.left(th),
                    dy = e.clientY + tools.scrollTop() - tools.offset.top(th), mouseMoveEvent, thMouseUpEvent;
                resouceCol = this.columnGet(th.dataset.name);
                if(!resouceCol){
                    return ;
                }
                if (leftTableColsName.indexOf(resouceCol.name) < 0) {
                    scrollLeft = this.currentSccrollLeft;
                }
                tempCol = <div class="tempCol">{resouceCol.cells[0][0].text}</div>;
                tempCol.style.width = resouceCol.width + 'px';
                tempCol.style.left = e.clientX - offsetLeft - dx - scrollLeft + 'px';
                tempCol.style.top = e.clientY - offsetTop - dy + tools.scrollTop() + 'px';
                this.mainTable.wrapper.appendChild(tempCol);
                mouseMoveEvent = me => {
                    tempCol.style.left = me.clientX - scrollLeft - dx - offsetLeft + 'px';
                    tempCol.style.top = me.clientY + tools.scrollTop() - dy - offsetTop + 'px';
                    let meTh = d.closest(me.target, 'th');
                    if (tools.isEmpty(meTh)) {
                        d.remove(tempCol);
                        d.off(document, 'mousemove', mouseMoveEvent);
                        d.off(this.wrapper, 'mousemove', '.section-inner-wrapper:not(.pseudo-table) th', thMouseMoveHandler);
                        d.off(this.wrapper, 'mouseup', '.section-inner-wrapper:not(.pseudo-table) th', thMouseUpEvent);
                        d.off(document, 'mouseup', mouseMoveEvent);
                    }
                };
                let thMouseMoveHandler = (tm) => {
                    let tmTh = d.closest(tm.target, 'th');
                    destinationCol = this.columnGet(tmTh.dataset.name);
                    if (destinationCol != resouceCol) {
                        d.queryAll('.section-inner-wrapper:not(.pseudo-table) th', this.mainTable.head.wrapper).forEach(th => {
                            th.classList.remove('dragStyle');
                        });
                        tmTh.classList.add('dragStyle');
                    }
                };
                thMouseMoveHandler = tools.pattern.throttling(thMouseMoveHandler, 50);
                d.on(document, 'mousemove', mouseMoveEvent);
                d.on(this.wrapper, 'mousemove', '.section-inner-wrapper:not(.pseudo-table) th', thMouseMoveHandler);
                let mouseUpHandler = () => {
                    d.remove(tempCol);
                    d.off(document, 'mousemove', mouseMoveEvent);
                    d.off(this.wrapper, 'mouseup', '.section-inner-wrapper:not(.pseudo-table) th', thMouseUpEvent);
                    d.off(this.wrapper, 'mousemove', '.section-inner-wrapper:not(.pseudo-table) th', thMouseMoveHandler);
                    d.off(document, 'mouseup', mouseMoveEvent);
                };
                d.on(document, 'mouseup', mouseMoveEvent);
                d.on(this.wrapper, 'mouseup', '.section-inner-wrapper:not(.pseudo-table) th', thMouseUpEvent = (upEv) => {
                    let upTh = d.closest(upEv.target, 'th');
                    destinationCol = this.columnGet(upTh.dataset.name);
                    if (destinationCol != resouceCol) {
                        this.dragCol(resouceCol, destinationCol);
                    }
                    d.remove(tempCol);
                    d.off(document, 'mousemove', mouseMoveEvent);
                    d.off(this.wrapper, 'mouseup', '.section-inner-wrapper:not(.pseudo-table) th', thMouseUpEvent);
                    d.off(this.wrapper, 'mousemove', '.section-inner-wrapper:not(.pseudo-table) th', thMouseMoveHandler);
                    d.off(document, 'mouseup', mouseMoveEvent);
                    upTh.classList.remove('dragStyle');
                })
            }
        };
        return {
            on: () => d.on(this.mainTable.head.wrapper, 'mousedown', dragHandler),
            off: () => d.off(this.mainTable.head.wrapper, 'mousedown', dragHandler)
        }
    })();

    private dragCol(resouceCol: FastTableColumn, destinationCol: FastTableColumn) {
        let leftTableColsName = [],
            len = this.leftTable ? this.leftTable.columns.length : 0,
            resouceName = resouceCol.name,
            destinationName = destinationCol.name;
        this.leftTable && this.leftTable.columns.forEach((col) => {
            leftTableColsName.push(col.name);
        });
        // 判断删除列的基表以及插入列的基表
        let deleteTable: TableBase = null,
            insertTable: TableBase = null;
        if (leftTableColsName.indexOf(resouceName) >= 0) {
            deleteTable = this.leftTable;
        } else {
            deleteTable = this.mainTable;
        }
        if (leftTableColsName.indexOf(destinationName) >= 0) {
            insertTable = this.leftTable;
        } else {
            insertTable = this.mainTable;
        }

        let deleteCol: IColumnDelObj = deleteTable.columnsDel(resouceName, false);
        insertTable.columnInsertBefore(deleteCol, destinationName);
        this.leftTable && this.leftTable.columns.forEach((col: FastTableColumn,index:number) => {
            if (index < len){
                col._setColumnFixedNotRender(true);
            }else{
                col._setColumnFixed(false);
            }
        });
    }

    protected static sepPivotData(obj: obj): {keys: string[], data: obj}{
        let keys = [],
            data = {};
        for(let key in obj){
            if(key.indexOf('.') > -1){
                keys.push(key);
            }else{
                data[key] = obj[key];
            }
        }

        return {
            keys,
            data
        }
    }

    getSelectedRows(): FastTableRow[] {
        let rows = [];
        this.rows.forEach((row) => {
            row.selected && rows.push(row);
        });
        return rows;
    }

    closeCellInput(){
        this.edit.destroyCellInput();
    }

    get editedData() {
        if (this.editing) {
            this.edit.destroyCellInput();
            let edit = this.edit,
                result: objOf<any> = {
                    update: [],
                    insert: [],
                    delete: [],
                },
                oldData = this.tableData.noEditData,
                oldUpdateData = [],
                insertIndex = edit.addIndex.get(),
                editedIndex = edit.changeIndex.get();

            let obj = {};
            for (let name of this.columns.map(col => col.name)) {
                obj[name] = null;
            }

            this.data.forEach((data, i) => {
                let index = data[TableBase.GUID_INDEX];
                data = Object.assign({}, data);
                delete data[TableBase.GUID_INDEX];
                if (insertIndex.indexOf(index) > -1) {
                    result.insert.push(Object.assign({}, obj, data));
                } else if (editedIndex.indexOf(index) > -1) {
                    // data = Object.assign({}, data);
                    // delete data[TableBase.GUID_INDEX];
                    result.update.push(Object.assign({}, obj, data));
                }
            });
            oldData.forEach((data, i) => {
                let index = data[TableBase.GUID_INDEX];
                data = Object.assign({}, data);
                if (editedIndex.indexOf(index) > -1) {
                    oldUpdateData.push(Object.assign({}, obj, data))
                }
            });

            edit.delIndex.getData().forEach((data) => {
                let delData = Object.assign({}, data);
                delete delData[TableBase.GUID_INDEX];
                result.delete.push(delData);
            });

            // 在交叉表模式下表格编辑的数据格式与普通表格不一样
            if(this.editor.isPivot){
                let pivotResult = {
                    update: [],
                    insert: [],
                    delete: [],
                };
                console.log(result);
                for(let operation in result){
                    result[operation].forEach((obj, index) => {
                        let sepData = FastTable.sepPivotData(obj);
                        switch (operation){
                            case 'insert':
                                // 新增
                                sepData.keys.forEach((key) => {
                                    if(tools.isNotEmpty(obj[key])){
                                        pivotResult.insert.push(Object.assign({}, sepData.data,
                                            {[key]: obj[key]}));
                                    }
                                });
                                break;
                            case 'delete':
                                // 删除
                                sepData.keys.forEach((key) => {
                                    if(tools.isNotEmpty(obj[key])){

                                    }
                                    pivotResult.delete.push(Object.assign({}, sepData.data,
                                        {[key]: obj[key]}));
                                });
                                break;
                            case 'update':
                                // 修改需要分状态
                                sepData.keys.forEach((key) => {
                                    let oldData = oldUpdateData[index] ? oldUpdateData[index][key] : null,
                                        data = obj[key];

                                    if(tools.isEmpty(oldData) && tools.isNotEmpty(data)) {
                                        // 新增 （原始数据为空）
                                        pivotResult.insert.push(Object.assign({}, sepData.data,
                                            {[key]: data}));
                                    }else if(tools.isNotEmpty(oldData) && tools.isEmpty(data)){
                                        // 删除 （现有数据变成空）
                                        pivotResult.delete.push(Object.assign({}, sepData.data,
                                            {[key]: data}));
                                    }else if(oldData != data){
                                        // 修改 （原始数据与修改过的数据都不为空，且不与原始数据一样）
                                        pivotResult.update.push(Object.assign({}, sepData.data,
                                            {[key]: data}));
                                    }
                                });
                                break;
                        }
                    })
                }

                pivotResult['isPivot'] = true;
                return pivotResult;
            }

            result['isPivot'] = false;
            return result;
        }
        return null;
    }

    get editedCells(): FastTableCell[]{
        let editedCells: FastTableCell[] = [];
        this.rows.forEach((row) => {
            if(row.isAdd){
                editedCells = editedCells.concat(row.cells);
            }else{
                row.cells.forEach((cell) => {
                    cell.isEdited && editedCells.push(cell);
                });
            }
        });
        return editedCells;
    }

    protected _editing: boolean = false;
    get editing() {
        return this._editing;
    }

    set editing(isEdit: boolean) {
        if (this._editing !== isEdit) {
            this._editing = isEdit;
            this.tableData.disabled = isEdit;

            if (isEdit) {
                this.edit.event.click.on();
                this.sortEvent.off();
                this.click.off();
                !tools.isMb && this.hoverMoreEvent.off();
                this.mainTable.initEditor(this.editor.inputInit);
                this.leftTable && this.leftTable.initEditor(this.editor.inputInit);
                this.edit.event.scroll.on();
                if (this.editor.autoInsert) {
                    let num = this.rowAdd();
                } else {
                    this._drawSelectedCells();
                }
            } else {
                this.edit.event.click.off();
                !tools.isMb && this.hoverMoreEvent.on();
                this.sortEvent.on();
                this.click.on();
                this.mainTable.cancelEditor();
                this.leftTable && this.leftTable.cancelEditor();
                this.edit.event.scroll.off();
                this.rowDel(this.edit.addIndex.spaceRowIndex());
                this.tablesEach(table => {
                    table.tableData.edit.close();
                    if(table.body && table.body.rows)
                        table.body.rows = table.body.rows.filter(row => tools.isNotEmpty(row));
                });

                this.edit.addIndex.del();
                this.edit.delIndex.del();
                this.edit.changeIndex.del();
                this.tablesEach(table => {
                    if(table.body && table.body.rows)
                        table.body.rows = table.body.rows.filter(row => tools.isNotEmpty(row));
                });
                this._rows = this.rows.filter(row => tools.isNotEmpty(row));
                this._drawSelectedCells();
                this.rows.forEach((row) => {
                    row.isAdd = false;
                });

                Promise.all(this.tableBases.map((table) => table.renderPromise())).then(() => {
                    console.log(this.data);
                    this.render(0, void 0);
                });

            }
        }
    }

    protected editor: ITableEditInitPara;
    protected editHandlers = [];

    editorInit(editor: ITableEditInitPara) {
        this.editor = {
            isPivot: editor.isPivot || false,
            defData: editor.defData,
            updatable: tools.isEmpty(editor.updatable) ? true : editor.updatable,
            insertble: tools.isEmpty(editor.insertble) ? true : editor.insertble,
            inputInit: editor.inputInit,
            cellCanInit: tools.isEmpty(editor.cellCanInit) ? () => true : editor.cellCanInit,
            rowCanInit: tools.isEmpty(editor.rowCanInit) ? () => true : editor.rowCanInit,
            autoInsert: tools.isEmpty(editor.autoInsert) ? false : editor.autoInsert,
        };
        this.initDisabledEditor();
        this.editing = true;

        this.tablesEach((table, index) => {
            table.on(TableBase.EVT_EDITED, (ev) => {
                if (ev.row === 0 && this.editor.autoInsert) {
                    let num = this.rowAdd(void 0, 0);
                } else {
                    let index = this.data[ev.row][TableBase.GUID_INDEX];
                    let addIndexes = this.edit.addIndex.get(),
                        changeIndexes = this.edit.changeIndex.get();

                    // 编辑数据时，若该条数据未加入新增或编辑中，则加入编辑行中
                    if (addIndexes.indexOf(index) === -1 && changeIndexes.indexOf(index) === -1) {
                        this.edit.changeIndex.add(index);
                    }
                }
            });
            table.on(TableBase.EVT_CELL_EDIT_CANCEL, this.editHandlers[index] = (cell: TableDataCell) => {
                let index = cell.row.index;
                if(!this.rows[index]){
                    return
                }
                let isChange = this.rows[index].cells.some((cell: TableDataCell) => cell.isEdited);
                if(!isChange){
                    let index = this.data[cell.row.index][TableBase.GUID_INDEX];
                    // if (this.edit.addIndex.get().indexOf(index) > -1) {
                    //     this.edit.addIndex.del(index);
                    // }else if(this.edit.changeIndex.get().indexOf(index) > -1){
                    //     this.edit.changeIndex.del(index);
                    // }

                    // 修改数据时，若数据无改变，则删除编辑的行
                    if(this.edit.changeIndex.get().indexOf(index) > -1){
                        this.edit.changeIndex.del(index);
                    }
                }
            });
        })

    }

    editorCancel() {
        this.editing = false;
        this.clearDisabledEditor();
        this.editor = null;
        this.tablesEach((table, index) => {
            table.off(TableBase.EVT_EDITED);
            table.off(TableBase.EVT_CELL_EDIT_CANCEL, this.editHandlers[index]);
        });


    }

    protected initDisabledEditorRow(row) {
        let editor = this.editor;
        row && row.cells.forEach((cell: TableDataCell) => {
            let column = cell.column;
            if (!(editor.updatable && editor.rowCanInit(row) && editor.cellCanInit(column as FastTableColumn, 1))) {
                cell.disabled = true;
                cell.isNotPassiveModify = tools.isEmpty(column.content.flag) ? false : !column.content.flag;
            }
        });
    }

    protected initDisabledEditor() {
        let editor = this.editor;
        this.rows.forEach((row) => {
            row && row.cells.forEach((cell: TableDataCell) => {
                let column = cell.column;
                if (!(editor.updatable && editor.rowCanInit(row) && editor.cellCanInit(column as FastTableColumn, 0))) {
                    cell.disabled = true;
                    cell.isNotPassiveModify = tools.isEmpty(column.content.flag) ? false : !column.content.flag;
                }
            })
        })
    }

    protected clearDisabledEditor() {
        this.rows.forEach((row) => {
            row && row.cells.forEach((cell) => {
                cell.disabled = false;
                cell.errorMsg = '';
            })
        })
    }

    protected _isWrapLine = false;
    get isWrapLine(){
        return this._isWrapLine;
    }

    protected setRowHeight(cell: TableDataCell) {
        let canvas = document.createElement("canvas");
        let context = canvas.getContext("2d");
        context.font = '12px Arial';

        let column = cell.column,
            row = cell.row,
            text = cell.text,
            width = getTextWidth(text),
            scale = Math.ceil(width / (column.maxWidth - 14));

        let nowHeight = (scale -  1) * 17 + 40;
        if(nowHeight > row.height){
            row._setHeight(nowHeight);
            this.rows[row.index]._setHeight();
            this.pseudoTable.body.rows[row.index].height = row.height;
        }
        canvas = null;
        context = null;

        function getTextWidth(text) {
            let metrics = context.measureText(text);
            return metrics.width;
        }
    }

    // 根据参数定位到行
    // colName 列名称， data 任意数据
    locateToRow(colName: string, data: any, isClear = false): number {
        let index = null;
        if(isClear){
            this.rows && this.rows.forEach((row) => {
                row.selected = false;
            });
        }

        this.rows && this.rows.forEach((row) => {
            let cell = row.cellGet(colName);
            if(cell && cell.data == data){
                row.selected = true;
                if(tools.isEmpty(index)){
                    index = row.index;
                }
            }
        });
        this._drawSelectedCells();
        return index;
    }

    protected setRowsHeight(){
        this.rows.forEach((row, i) => {
            row._setHeight();
            this.pseudoTable.body.rows[i].height = row.height;
        });
    }

    middleButtonEvent = (() => {
        let handler = null;
        return {
            on: () => {
                d.on(this.wrapper, 'mousedown', handler = (ev) => {
                    if (ev.button === 1) {
                        ev.stopPropagation();
                        ev.preventDefault();
                    }
                });
            },
            off: () => {
                d.off(this.wrapper, 'mousedown', handler);
            }
        }
    })();
}
