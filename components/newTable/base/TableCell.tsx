/// <amd-module name="TableCell"/>
import {TableDataRow, TableRow} from "./TableRow";
import d = G.d;
import tools = G.tools;
import {TextInput} from "../../form/text/text";
import {FastTable} from "../FastTable";
import {TableBase} from "./TableBase";
import {FormCom} from "../../form/basic";
import {Button} from "../../general/button/Button";
import {Modal} from "../../feedback/modal/Modal";

/**
 * 单元格cell的基类
 */
export interface ITableCellPara {
    row?: TableRow;           // 上级的row对象
    name?: string;
    isRender?: boolean;      // 是否渲染到页面
    // selected?: boolean;      // 是否选中
    // disabled?: boolean;      // 是否禁用
    colspan?: number;        // 跨列数
    rowspan?: number;        // 跨行数
    data?: any;              // 数据
    text?: string;              // 文字
}

export abstract class TableCell {

    abstract tagName(): string;

    // public name: string = '';
    constructor(para: ITableCellPara) {
        // this.name = para.name;
        let isRender = tools.isEmpty(para.isRender) ? true : para.isRender;
        this.row = para.row;
        this._name = para.name;
        this.wrapper.dataset.name = para.name;
        this._isVirtual = tools.isEmpty(this.column) ? false : this.column.isVirtual;
        this.colspan = para.colspan;
        this.rowspan = para.rowspan;
        // this.disabled = para.disabled;
        // if (para.selected){
        //     this.selected = para.selected;
        // }
        if(isRender && !this.isVirtual) {
            d.append(para.row.wrapper, this.wrapper);
        }
        this.show = this.column ? this.column.show: true;
    }

    // 指向当前Cell对应的Row对象
    protected _row: TableRow = null;
    get row(): TableRow{
        return this._row;
    }
    set row(row: TableRow){
        this._row = row;
    }

    protected _isVirtual: boolean = false;
    get isVirtual(){
        return this._isVirtual;
    }

    // 获取当前列的名称
    protected _name:string = null;
    get name(){
        return this._name;
    }
    set name(name: string){
        this._name = name;
        this.wrapper.dataset.name = name;
    }

    // 指向当前Cell对应的Column对象
    get column(){
        return this.table.columnsGet(this.name);
    }

    // 渲染到页面的格式
    protected format(data: any): Promise<{
        text: string | Node,
        color?: string;
        bgColor?: string;
        classes?: string[],
        data?: any
    }> {
        let format = this.table.cellFormat,
            formated = format && format(data, this);
        // formated = format && format(this.column, (this.row as TableDataRow).data || {[this.name]: data});
        // if(this instanceof TableFooterCell){
        //     console.log(this.column)
        // }
        // formated = formated || {text: data};
        // formated.text = tools.str.removeHtmlTags(tools.str.toEmpty(formated.text));
        return new Promise((resolve, reject) => {
            formated ? formated.then((result) => {
                result = result || {text: data};
                result.text = tools.str.removeHtmlTags(tools.str.toEmpty(result.text));
                resolve(result);
            }) : resolve({text: data});
        });
    }

    // 是否显示在页面上
    protected _show: boolean = true;
    get show(){
        return this._show;
    }
    set show(show: boolean){
        if(tools.isNotEmpty(show)){
            this._show = show;
            this.wrapper.classList.toggle('hide', !show);
        }
    }

    // 列合并
    protected _colspan: number = 1;
    get colspan() {
        return this._colspan;
    }
    set colspan(colspan: number) {
        colspan = colspan || 1 ;
        this._colspan = colspan;
        this.wrapper.colSpan = colspan;
    }

    // 行合并
    protected _rowspan: number = 1;
    get rowspan() {
        return this._rowspan;
    }
    set rowspan(rowspan: number) {
        rowspan = rowspan || 1;
        this._rowspan = rowspan;
        this.wrapper.rowSpan = rowspan;
        if(this.rowspan !== 1){
            this.wrapper.style.height = rowspan * 40 + 'px';
            let div = d.query('.cell-content', this.wrapper);
            if(div){
                div.style.height = rowspan * 40 + 'px';
                div.style.lineHeight = rowspan * 40 + 'px';
            }
        }
    }

    // 获取td或th 标签
    protected _wrapper: HTMLTableCellElement = null;
    get wrapper() {
        if(!this.isVirtual && this._wrapper === null){
            // 判断是在 thead(对应th) 中 还是 tbody(对应td) 的 tr.
            this._wrapper = document.createElement(this.tagName()) as HTMLTableCellElement;
        }
        return this._wrapper;
    }

    // 设置是否选中
    protected _selected:boolean = false;
    get selected(){
        return this._selected
    }
    set selected(selected) {
        if(tools.isNotEmpty(selected)){
            this._selected = selected;
            this.wrapper && this.wrapper.classList.toggle('selected', selected);
        }
    }

    protected _presentSelected = false;
    set presentSelected(selected: boolean){
        if(tools.isNotEmpty(selected) && selected !== this._presentSelected){
            this._presentSelected = selected;
            this.wrapper.classList.toggle('present-selected', selected);
        }
    }
    get presentSelected(){
        return this._presentSelected;
    }

    // 设置颜色
    set color(color: string) {
        color = color || null;
        this.wrapper && (this.wrapper.style.color = color);
    }
    get color() {
        return this.wrapper ? this.wrapper.style.color : '';
    }

    // 设置背景颜色
    set background(color: string) {
        color = color || null;
        this.wrapper && (this.wrapper.style.background = color);
    }
    get background(){
        return this.wrapper ? this.wrapper.style.background : '';
    }

    private _classes:string[] = [];
    set classes(strArr: string[]) {
        if(tools.isNotEmptyArray(strArr)){
            d.classRemove(this.wrapper, strArr);
            d.classAdd(this.wrapper, strArr);
            this._classes = [...strArr];
        }

    }
    get classes() {
        return [...(this._classes || [])]
    }

    // 设置是否不可操作
    protected _disabled:boolean = false;
    set disabled(disabled: boolean){
        if(tools.isNotEmpty(disabled)) {
            this._disabled = disabled;
            this.wrapper && this.wrapper.classList.toggle('disabled-cell', disabled);
        }
    }
    get disabled(){
        return this._disabled;
    }

    // 获取cell中的文本内容
    protected _text: string;
    get text(){
        return this._text || '';
    }
    // set text(text: string){
    //     text = tools.str.toEmpty(text);
    //     if(text !== this._text){
    //         d.setHTML(this.wrapper, '<div class="cell-content">' + text + '</div>');
    //         this._text = text;
    //     }
    // }

    // protected _editing:

    // 指向tableBase对象
    get table(): TableBase{
        let table = null;
        if(this.row){
            table = this.row.section.table;
        }
        return table;
    }

    destroy(isClear: boolean = true){
        this._wrapper && d.remove(this._wrapper, isClear);
        let index = this.row.cells.indexOf(this);
        if(index !== -1){
            this.row.cells.splice(index, 1);
        }
        if(isClear){
            this._wrapper = null;
            this.row = null;
        }
    }


}

/**
 * 表数据单元格， td
 */
export interface ITableDataCellPara extends ITableCellPara{
    data?: any;              // 数据
}

export class TableDataCell extends TableCell {
    constructor(para: ITableDataCellPara) {
        super(para);
        this.render(para.data);
    }

    _highLight: string = null;
    get highLight(){
        return this._highLight
    }
    set highLight(str: string){
        if(str !== this._highLight){
            let html = '';
            this._highLight = tools.isEmpty(str) ? null : tools.str.htmlEncode(str);
            if(this._highLight === null){
                html = this.text;
            }else{
                if(this.text.toLocaleUpperCase().indexOf(this._highLight.toLocaleUpperCase()) > -1){
                    html = tools.highlight(tools.str.htmlEncode(this.text), this._highLight, 'red')
                }else{
                    html = this.text;
                }
            }
            this.wrapper && (this.wrapper.innerHTML = tools.isEmpty(html) ? '' : html);
            this.initMoreBtn();
        }
    }

    width: number = 0;
    protected moreButton: Button = null;
    get isMore(){
        return this.width + 10 > this.column.width;
    }
    initMoreBtn(){
        let isWrapLine = this.table ? this.table.isWrapLine : false;
        if(!isWrapLine && this.isMore){
            if(tools.isMb) {
                if(tools.isEmpty(this.moreButton)){
                    this.moreButton = new Button({
                        container: this.wrapper,
                        content: '...',
                        className: 'more-button',
                        onClick: tools.pattern.throttling(() => {
                            Modal.alert(this.text);
                        }, 1000),
                    });
                }else{
                    // d.append(this.wrapper, this.moreButton.wrapper);
                }
            }
        }else{
            this.moreButton && this.moreButton.destroy();
            this.moreButton = null;
        }
    }

    // 在编辑状态下无法修改 不能编辑 且 isNotPassiveModify为true 的cell的数据
    isNotPassiveModify: boolean = false;

    get data(){
        let rowData = this.table.tableData.get(this.row.index);
        return tools.isEmpty(rowData) ? null : rowData[this.name];
    }
    set data(data: Primitive | Node){
        if(this.table.editing && !this.editing){
            if(this.isNotPassiveModify){
                return ;
            }
        }
        if(data != this.data) {
            if(this.column && this.column.isNumber && tools.isNotEmpty(data) && typeof data === 'string'){
                data = parseFloat(data);
            }
            this.table.tableData.update({[this.name]: data}, this.row.index);
        }
        this.editing && (this.editing = false);
        this.render();
        this.renderPromise.finally(() => {
            let events = this.table.eventHandlers[TableBase.EVT_CHANGED];
            tools.isNotEmpty(events) && events.forEach((fun) => {
                typeof fun === 'function' && fun(this.table.editing);
            });
        });
    }

    protected rendering = false;
    protected renderPromise: Promise<any> = Promise.resolve();
    render(cellData?){
        // debugger
        if(this.rendering){
            return;
        }
        this.rendering = true;
        setTimeout(() => {
            this.rendering = false;
        }, 200);
        let data = tools.isEmpty(cellData) ? this.data : cellData;

        // 移除 除了moreBtn以外的所有dom
        if(this.wrapper){
            if(this.moreButton){
                let childNodes = (this.wrapper as Node).childNodes;
                for(let i = 0; i < childNodes.length; i ++){
                    let child = childNodes[i];
                    if(this.moreButton.wrapper !== child) {
                        this.wrapper.removeChild(child);
                    }
                }
            }else{
                this.wrapper.innerHTML = '';
            }
        }
        // this.wrapper && (this.wrapper.innerHTML = '');
        this.table.addStack(this.renderPromise = new Promise((resolve) => {
            if(data instanceof Node) {
                this.wrapper && d.append(this.wrapper, data);
                resolve();
            }else{
                this.format(data).then((formated) => {
                    if(formated) {
                        let {classes, text, color, bgColor, data} = formated;
                        if(text instanceof Node){
                            this.wrapper && d.append(this.wrapper, text);
                        }else {
                            text = tools.isEmpty(text) ? '' : text;
                            this._text = text + '';
                            if(this.wrapper){
                                d.append(this.wrapper, document.createTextNode(this._text));
                            }
                        }
                        this.width = getTextWidth(this.text);
                        this.initMoreBtn();
                        this.classes = classes;
                        this.color = color;
                        this.background = bgColor;
                        if(data){
                            this.table.tableData.update({[this.name]: data}, this.row.index);
                        }
                    }
                    resolve();
                });
            }
        }).then(() => {
            this.rendering = false;
            !this.table.isWrapLine && this.initMoreBtn();

            if(this.table.editing){
                let guidIndex = this.table.tableData.get()[this.row.index][TableBase.GUID_INDEX],
                    rowData = null;
                for(let data of this.table.tableData.edit.getOriginalData()){
                    if(data[TableBase.GUID_INDEX] === guidIndex){
                        rowData = data;
                        break;
                    }
                }
                // console.log(rowsData);
                let originalCellData = tools.isEmpty(rowData) ? null : rowData[this.name];
                // console.log(tools.str.toEmpty(originalCellData), tools.str.toEmpty(this.data));
                this.isEdited = tools.str.toEmpty(originalCellData) != tools.str.toEmpty(this.data);
            }
        }))
    }

    tagName() {
        return 'td';
    }

    protected _isEdited: boolean = false;
    get isEdited(){
        return this._isEdited;
    }
    set isEdited(flag: boolean){
        if(this._isEdited !== flag){
            this._isEdited = flag;
            this.wrapper && this.wrapper.classList.toggle('edited-cell', flag);
        }
    }

    protected input: FormCom = null;
    protected blurHandler = null;

    get inputFinish(){
        return this.input ? this.input.isFinish : true;
    }

    public isChecked = false;
    protected _editing: boolean = false;
    get editing(){
        return this._editing;
    }
    set editing(flag: boolean) {
        this.wrapper.classList.toggle("cell-editing", flag);
        if(this.table && this.table.editing && this._editing !== flag){
            // this.input = new
            this._editing = flag;
            if(!this.isVirtual){
                if(flag) {
                    if(this.input){
                        this.input.container = this.wrapper;
                        return;
                    }

                    // 缓存当前内容
                    let tmpDoc = document.createDocumentFragment();
                    Array.prototype.slice.call(this.wrapper.childNodes, 0).forEach(node => {
                        tmpDoc.appendChild(node);
                    });

                    this.wrapper.innerHTML = '';
                    this.input = this.table.inputInit(this, this.column, tools.isEmpty(this.data) ? '' : this.data.toString());

                    if(this.input instanceof FormCom) {
                        tmpDoc = null;
                        // this.input.set();

                        // 选中input全部内容
                        if(this.input instanceof TextInput){
                            this.input.focus();
                            (d.query('input', this.input.wrapper) as HTMLInputElement).select();
                        }
                    }else{
                        // 初始化失败时还原缓存
                        d.append(this.wrapper, tmpDoc);
                    }

                    // 绑定默认点击其他cell取消编辑状态，销毁input插件
                    d.off(this.row.section.wrapper, 'click');
                    d.on(this.row.section.wrapper, 'click', 'tbody>tr>td', this.blurHandler = (ev) => {
                        let td = d.closest(ev.target, 'td');
                        if(td !== this.wrapper){
                            // d.off(d.query('input', this.input.wrapper), 'focus');
                            // console.log(this.editing);
                            if(!this.inputFinish){
                                ev.stopPropagation();
                                Modal.confirm({
                                    msg: '文件正在上传，是否要停止上传？',
                                    callback: (flag) => {
                                        if(flag){
                                            this.editing = false;
                                            td.click();
                                        }
                                    }
                                })
                            }else{
                                this.editing = false;
                            }
                        }
                    });
                    /* d.on(d.query('input', this.input.wrapper), 'focus', () => clearTimeout(timer));
                     d.on(d.query('input', this.input.wrapper), 'blur', () => {
                         timer = setTimeout(() => {
                             d.off(d.query('input', this.input.wrapper), 'blur');
                             // d.off(d.query('input', this.input.wrapper), 'focus');
                             // console.log(this.editing);
                             this.editing = false;

                             let rowsData = this.table.tableData.edit.getOriginalData()[this.row.index];
                             // console.log(rowsData);
                             let originalCellData = tools.isEmpty(rowsData) ? null : rowsData[this.name];
                             // console.log(tools.str.toEmpty(originalCellData), tools.str.toEmpty(this.data));
                             this.isEdited = tools.str.toEmpty(originalCellData) != tools.str.toEmpty(this.data);
                         }, 100);
                     });*/
                }else{
                    // 设置新的值
                    if(tools.isNotEmpty(this.input) && this.input instanceof FormCom) {
                        let str = this.input.get();
                        if(this.data !== str && (tools.isNotEmpty(str) || tools.isNotEmpty(this.data))){
                            this.data = str;
                        }else{
                            this.render();
                        }
                        d.off(this.row.section.wrapper, 'click');

                        this.input.destroy();
                        this.input = null;
                        this.triggerEditCancel();
                    }
                    // let isChange = this.row.cells.some((cell: TableDataCell) => cell.isEdited);

                }
            }
        }

    }

    triggerEditCancel(){
        this.renderPromise.finally(() => {
            let events = this.table.eventHandlers[TableBase.EVT_CELL_EDIT_CANCEL];
            tools.isNotEmpty(events) && events.forEach((fun) => {
                typeof fun === 'function' && fun(this);
            });
        });
    }
}

/**
 * 表头单元格 th
 */
export interface ITableHeaderCellPara extends ITableCellPara{
    index?: number;
}
export class TableHeaderCell extends TableCell{
    constructor(para: ITableHeaderCellPara) {
        super(para);
        this.text = para.text;
        this.rowspan = para.rowspan;
    }

    protected _text:string;
    get text(){
        return this._text;
    }
    set text(text: string){
        text = tools.str.toEmpty(text);
        if(text !== this._text){
            this.wrapper && d.setHTML(this.wrapper, '<div class="cell-content" title="' + text + '">' + text + '</div>');
            this._text = text;
        }
    }

    tagName() {
        return 'th';
    }

}

/*
* 表尾单元格
* */
export interface ITableFooterCellPara extends ITableCellPara{
    options?: string[];
    colCount?: boolean;
    index?: number;
}
export class TableFooterCell extends TableCell{

    constructor(para: ITableFooterCellPara) {
        super(para);
        this.options = para.options;
        this._colCount = tools.isEmpty(para.colCount) ? true : para.colCount;
        if(this.colCount) {
            this.wrapper && d.append(this.wrapper, this.selectEl);
        }else{
            this.wrapper && d.append(this.wrapper, <div className="cell-content">{tools.isEmpty(this.text) ? '' : this.text}</div>);
        }
    }

    protected _colCount: boolean;
    get colCount(){
        return this._colCount;
    }


    // 初始化选项
    private initOption(){
        // this.selectEl.innerHTML = '';
        // for(let item of this.options){
        //     // console.log(this.format(item).text );
        //     let option = <HTMLOptionElement>d.create('<option value="' + item + '">' + this.format(item).text + '</option>');
        //     this.selectEl.add(option, null);
        // }
        if(this.colCount) {
            this.optionGroup = {};
            let optionGroup = this.optionGroup;
            let promises = [];
            this.options.forEach((data) => {
                promises.push(this.format(data));
                // let text = this.format(data).text;
                // if (Array.isArray(optionGroup[text])) {
                //     optionGroup[text].push(data);
                // } else {
                //     optionGroup[text] = [data];
                // }
            });
            Promise.all(promises).then((data) => {
                data.forEach(({text}) => {
                    if (Array.isArray(optionGroup[text])) {
                        optionGroup[text].push(data);
                    } else {
                        optionGroup[text] = [data];
                    }
                });
                let arr = Array.from({length: this.selectEl.length - 1}, (v, k) => k + 1);

                d.diff(Object.keys(optionGroup), arr, {
                    create: (n) => {
                        let option = <option>{n}</option>;
                        d.data(option, optionGroup[n]);
                        this.selectEl.add(option);
                    },
                    replace: (n, o) => {
                        let option = this.selectEl.options[o];
                        d.data(option, optionGroup[n]);
                    },
                    destroy: (o) => {
                        this.selectEl.remove(o);
                    }
                });
            });
        }

    }

    // 选择框选项数据列表
    private _options: string[] = [];
    get options(){
        return [...(this._options || [])];
    }
    set options(options: string[]){
        if(tools.isNotEmpty(options)){
            this._options = options;
            this.initOption();
        }
    }

    public optionGroup = {};

    // Select元素
    private _selectEl: HTMLSelectElement = null;
    get selectEl (){
        if(this._selectEl === null){
            this._selectEl = <select className="form-control"></select>;
            this._selectEl.add(<option value="all">--</option>, null);
        }
        return this._selectEl
    }

    // 添加选项Option
    addOption(data: string){
        if(tools.isNotEmpty(data)){
            if(this._options.indexOf(data) === -1){
                this._options.push(data);
                this.format(data).then((result) => {
                    let text = result.text as string;
                    if(Array.isArray(this.optionGroup[text])){
                        this.optionGroup[text].push(data);
                        for(let i = 0; i < this.selectEl.length; i ++){
                            let option = this.selectEl.options[i];
                            let tem = option.text;
                            if(tem == text){
                                d.data(option, this.optionGroup[text]);
                                break;
                            }
                        }
                    }else{
                        let option = <option>{text}</option>;
                        this.optionGroup[text] = [data];
                        this.selectEl.add(option, null);
                    }
                });

            }
        }
    }

    removeOption(data: string){
        let index = this._options.indexOf(data);
        if(index > -1){
            this.selectEl.remove(index + 1);
            this._options.splice(index, 1);
        }
    }

    // 替换选项和数据
    replaceOption(newData, oldData){
        let oldIndex =  this._options.indexOf(oldData),
            optionEl = this.selectEl.options[oldIndex + 1];
        if(oldIndex > -1){
            optionEl.value = newData;
            this.format(newData).then(({text}) => {
                optionEl.innerText = text as string;
            });
        }
    }

    tagName() {
        return 'td';
    }
}

let canvasContext = document.createElement("canvas").getContext('2d');
canvasContext.font = '12px Arial';
function getTextWidth(text) {
    let metrics = canvasContext.measureText(text);
    return metrics.width;
}


