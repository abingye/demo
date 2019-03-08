/// <amd-module name="FastBtnTable"/>
import {FastTable, IFastTablePara} from "../newTable/FastTable";
import {Button, IButton} from "../general/button/Button";
import d = G.d;
import tools = G.tools;
import {InputBox} from "../general/inputBox/InputBox";
import {IPopoverItemPara, Popover} from "../ui/popover/popover";
import {Modal} from "../feedback/modal/Modal";
import {TextInput} from "../form/text/text";
import {DropDown} from "../ui/dropdown/dropdown";
import {TableDataCell} from "../newTable/base/TableCell";
import {SelectBox} from "../form/selectBox/selectBox";
import {Spinner} from "../ui/spinner/spinner";
export interface IFastBtnTablePara extends IFastTablePara{
    btn?: IFastBtnTableBtn;
    exportTitle?: string;
}
interface IFastBtnTableBtn {
    name: ('search' | 'statistic' | 'export')[];
    type?: 'button' | 'dropdown';
    target?: HTMLElement; // button 时代表放button的容器, dropdown时代表点击触发出现dropdown的元素
    isReplaceTable?: boolean;
}
type statisticType = 'count' | 'statistic' | 'chart' | 'crosstab' | 'analysis';

export class FastBtnTable extends FastTable{
    protected inputBox: InputBox;
    protected popover: Popover;
    protected spinner: Spinner;
    protected isButton: boolean;
    protected isReplaceTable: boolean;
    protected exportTitle: string = '';
    public btnWrapper: HTMLElement;
    protected modals: Modal[] = [];

    wrapperInit(){
        let wrapper = super.wrapperInit();
        this.btnWrapper = <div className='fast-table-btns'/>;
        d.prepend(wrapper, this.btnWrapper);
        return wrapper;
    }

    constructor(para: IFastBtnTablePara){
        super(para);
        this.exportTitle = para.exportTitle || '';
        if(tools.isNotEmpty(para.btn)){
            this.isReplaceTable = tools.isEmpty(para.btn.isReplaceTable) ? false : para.btn.isReplaceTable;
            this.isButton = (tools.isEmpty(para.btn.type) ? 'button' : para.btn.type) === 'button';
            if(this.isButton){
                this.inputBox = new InputBox({
                    container: this.btnWrapper,
                    className: 'fast-table-statistic-btns'
                });

                // d.classAdd(this.wrapper, 'has-top-btn');
            }else{
                this.popover = new Popover({
                    items: [],
                    target: para.btn.target,
                    position: "down",
                    isWatch: true
                });
            }

            if(this.isReplaceTable && !tools.isMb){
                let parent = d.closest(this.wrapper, '.panel.panel-white');
                let isFirst = true;
                d.on(parent, 'click', 'a.statistics-chart', (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if(isFirst){
                        this.spinner = new Spinner({
                            el: d.query('a.statistics-chart' ,parent),
                            type: 1,
                        });
                        this.spinner.show();
                        isFirst = false;
                    }
                    this.statistic('chart');
                });
            }
            tools.toArray(para.btn.name).forEach((name) => {
                name && this.btnAdd(name);
            });
        }

        window['f'] = this;
    }

    protected _btnShow: boolean = true;
    get btnShow(){
        return this._btnShow;
    }
    set btnShow(isShow: boolean){
        this._btnShow = isShow;
        this.btnWrapper && this.btnWrapper.classList.toggle('btn-hidden', !isShow);
        let tables = d.query('.tables', this.wrapper);
        if(tables){
            isShow ? tables.style.removeProperty('height')
                : (tables.style.height = 'calc(100% - 44px)');
        }
    }

    static readonly names = ['search', 'statistic', 'export'];

    private initSearch(){
        if(this.isButton){
            return new Button({
                type: 'default',
                icon: 'wangyuanjing',
                content: '本地查找',
                onClick: () => {
                    this.search.init();
                },
            });
        }else{
            let prevValue = '';
            let input = <input type="text"
                               placeholder="请输入..."
                               className="mui-input-clear mui-input"
                               autocapitalize="off"
                               autocorrect="off"/>;
            let searchEl =
                <div className="search-input mui-input-row">
                    <label><span className="mui-icon mui-icon-search grey"></span></label>
                </div>;

            d.append(searchEl, input);
            d.append(this.btnWrapper, searchEl);
            d.classAdd(this.wrapper, 'has-top-search');
            tools.isMb && d.on(input, 'blur', () => {
                document.body.scrollTop = 0;
            });

            d.on(input, 'input', tools.pattern.debounce(() => {
                let val = input.value;
                if(val !== prevValue){
                    prevValue = val;
                    if(tools.isEmpty(val)){
                        this.search.removeHighLightTag();
                        this.filter.clear();
                    }else{
                        let params = {
                            op: 9,
                            field: 0,
                            not: false,
                            values: [val],
                        };
                        this.filter.set([params]);
                        this.search.findCellByKey(val);
                    }
                }
            }, 500));
            // d.on(input, 'keyup', (ev) => {
            //     if(ev.keyCode === 13){
            //         input.blur();
            //     }
            // });
        }
    }

    // 创建本地查找模态框
    protected search = (() => {
        let self = this,
            prevKey = '',
            index = 0,
            input = null,
            prevCell: TableDataCell = null,
            cells = null;

        // 初始化本地查找框中body内容
        function initBody(){
            let container = <div className="search-group"></div>,
                inputGroup = <div className="modal-input-group"></div>,
                btnGroup = <div className="modal-btn-group"></div>,
                inputBox = new InputBox({
                    container: btnGroup
                });

            d.append(container, inputGroup);
            d.append(container, btnGroup);
            input = new TextInput({
                container: inputGroup,
                placeholder: '请输入要查找的内容...',
            });
            let prev = new Button({
                content: '查找上一个',
                isDisabled: false,
                onClick: () => {
                    let key = input.get();
                    if(tools.isNotEmpty(key)) {
                        if (key !== prevKey) {
                            prevKey = key;
                            index = 0;
                            findCellByKey(key);
                        }else{
                            index--;
                            if (index === -1) {
                                index = cells.length - 1;
                            }
                        }
                        cellScrollIntoView();
                    }
                }
            });
            let next = new Button({
                content: '查找下一个',
                onClick: () => {
                    let key = input.get();
                    if(tools.isNotEmpty(key)) {
                        if (key !== prevKey) {
                            prevKey = key;
                            index = 0;
                            removeHighLightTag();
                            findCellByKey(key);
                        }else{
                            index++;
                            if (index === cells.length) {
                                index = 0;
                            }
                        }
                        cellScrollIntoView();
                    }
                }
            });
            inputBox.addItem(prev);
            inputBox.addItem(next);

            /*if(self.editing){
                let reInputWrapper = <div className="modal-input-group"/>,
                    reInput = new TextInput({
                        container: reInputWrapper,
                        placeholder: '请输入替换的内容',
                    });
                let replace = new Button({
                    content: '替换',
                    onClick: () => {
                        let search = input.get(),
                            replace = reInput.get();
                        if(tools.isNotEmpty(search)) {
                            replaceContent(search, replace);
                        }
                    }
                });
                let replaceAll = new Button({
                    content: '全部替换',
                    onClick: () => {
                        let search = input.get(),
                            replace = reInput.get();
                        if(tools.isNotEmpty(search)) {
                            replaceContent(search, replace, true);
                        }
                    }
                });
                inputBox.addItem(replace);
                inputBox.addItem(replaceAll);
                d.after(inputGroup, reInputWrapper);
            }*/

            return container;
        }

        /*function replaceContent(search: string, replace: string, isAll = false){
            if(self.editing){
                findCellByKey(search);
                cellScrollIntoView();
                let replaceCells = [cells[0]];
                if(isAll){
                    replaceCells = cells;
                }
                removeHighLightTag();
            }else{
                Modal.toast('请点击编辑再进行替换');
            }
        }*/

        // 按下按钮，跳转至对应可视区中
        function cellScrollIntoView(){
            prevCell && prevCell.wrapper.classList.remove('searched');
            let cell = cells[index];
            prevCell = cell;
            if (cell) {
                let td = cell.wrapper;
                td.classList.add('searched');
                d.queryAll(".main-table table", self.wrapper).forEach(el => {
                    el.style.transform = `translateX(${0}px) translateZ(0)`;
                });
                d.query(".scroll-container", self.wrapper).scrollLeft = 0;
                if ('scrollIntoViewIfNeeded' in td) {
                    td.scrollIntoViewIfNeeded(false)
                } else {
                    td.scrollIntoView(false);
                }
            }
        }

        // 删除高亮显示
        function removeHighLightTag(){
            cells && cells.forEach((cell) => {
                cell.highLight = null;
            });
        }

        // 查找对应内容，给予高亮显示
        function findCellByKey(str: string){
            removeHighLightTag();
            cells = [];
            self.rows.forEach((row) => {
                row.cells.forEach((cell) => {
                    let column = cell.column;
                    if(column.show && !column.isVirtual && cell.text.toUpperCase().indexOf(str.toUpperCase()) > -1){
                        cell.highLight = str;
                        cells.push(cell);
                    }
                });
            });
        }

        return {
            findCellByKey,
            removeHighLightTag,
            init: () => {
                let modal = new Modal({
                    className: 'search-replace',
                    isBackground: false,
                    header: self.editing ? '查找/替换' : '查找',
                    body: initBody(),
                    isShow : true,
                    isOnceDestroy: true,
                    onClose: () => {
                        input.set('');
                        prevKey = '';
                        prevCell && prevCell.wrapper.classList.remove('searched');
                        prevCell = null;
                        removeHighLightTag();
                        let index = this.modals.indexOf(modal);
                        if(index > -1){
                            this.modals.splice(index, 1);
                        }
                    }
                });
                this.modals.push(modal);
            }
        }
    })();

    private initStatistic(){
        if(this.isButton){
            let btn = new Button({
                type: 'default',
                icon: 'tongji',
                content: '统计',
            });
            let exportStaBut = [
                {
                    content: '列统计',
                    icon: 'pinlei',
                    type:'default',
                    onClick : () => this.statistic('count'),
                },
                {
                    content: '数据统计',
                    icon: 'statistic',
                    type:'default',
                    onClick : () => this.statistic('statistic'),
                },
                {
                    content: '图形报表',
                    icon: 'bingzhuangtu',
                    type:'default',
                    onClick: () => this.statistic('chart'),
                },
                {
                    content: '交叉制表',
                    icon: 'shejiqijiaohuanxinglie',
                    type:'default',
                    onClick: () => this.statistic('crosstab'),
                },
                {
                    content: 'abc分析',
                    icon: 'tongji',
                    type:'default',
                    onClick: () => this.statistic('analysis'),
                }
            ];
            btn.dropDown = new DropDown({
                el: btn.wrapper,
                inline: false,
                data: [],
                multi: null,
                className: "input-box-morebtn"
            });
            for(let i = 0,l = exportStaBut.length; i < l; i++){
                btn.dropDown.getUlDom().appendChild(new Button(exportStaBut[i]).wrapper);
            }

            return btn;
        }else{
            let data = [{value: 'count', text: '列统计'},
                {value: 'statistic', text: '数据统计'},
                {value: 'chart', text: '图形报表'},
                {value: 'crosstab', text: '交叉制表'},
                {value: 'analysis', text: 'abc分析'}];
            return {
                title: '统计字段',
                onClick: () => {
                    this.initModal('统计字段', data, (ev) => {
                        this.statistic(ev)
                    })
                }
            }
        }

    }

    dataTools = (() => {
        return {
            getColCounts: () => {
                return Object.assign({}, this.mainTable.tableData.getColCounts(),
                    tools.isEmpty(this.leftTable) ? {} : this.leftTable.tableData.getColCounts())
            },
            getCols: () => {
                let cols = [];
                this.columns.forEach((col) => {
                    if(col.show && !col.isVirtual){
                        cols.push({
                            name: col.name,
                            title: col.title,
                            isNumber: col.isNumber,
                            content: col.content,
                        })
                    }
                });
                return cols;
            }
        };
    })();

    statistic (type: statisticType): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            let initCount = () => {
                require(['NewCount'], (Count) => {
                    new Count({
                        container: tools.isMb ? document.body : d.closest(this.wrapper, '.table-module-wrapper'),
                        cols: this.dataTools.getCols(),
                        isShow: true,
                        colDataGet: (colName) => {
                            // let column = this.columnGet(colName);
                            // if(column){
                            //     let field = column.content as R_Field;
                            //     if(field.elementType === 'lookup'){
                            //         colName = field.lookUpKeyField;
                            //         console.log(colName);
                            //     }
                            // }
                            let colCounts = this.dataTools.getColCounts();
                            let obj = {};
                            console.log(colCounts);
                            if(colName in colCounts){
                                for (let value of Object.values(colCounts[colName])) {
                                    obj[value[0]] = value[1]
                                }
                            }
                            return obj;
                        },
                        getVisibleCol: () => this.visibleCol
                    });
                });
            };
            let hasStatistic = () => {
                for (let col of this.columns) {
                    if (col.isNumber) {
                        return true;
                    }
                }
                return false;
            };
            let initStatistic = (type: statisticType) => {
                if (hasStatistic()) {
                    switch (type) {
                        case 'statistic':
                            require(['NewStatisticBasic'], (Statistic) => {
                                new Statistic({
                                    container: tools.isMb ? document.body : d.closest(this.wrapper, '.table-module-wrapper'),
                                    cols: this.dataTools.getCols(),
                                    colDataGet: (index) => this.columnGet(index).data,
                                    isShow: true,
                                    getVisibleCol: () => this.visibleCol
                                });
                            });
                            break;
                        case 'chart':
                            require(['NewChartBasic'], (ChartBasic) => {
                                if(!tools.isMb){
                                    this.spinner && this.spinner.hide();
                                }
                                resolve();
                                new ChartBasic({
                                    container: tools.isMb ? document.body : d.closest(this.wrapper, '.table-module-wrapper'),
                                    cols: this.dataTools.getCols(),
                                    allData: () => this.tableData.data,
                                    selectedData: () => this.selectedRowsData,
                                    colDataGet: (index) => this.columnGet(index).data,
                                    getTablePara: () => {
                                        let name = '';
                                        this.columns.forEach((col) => {
                                            for (let attr of ['drillAddr', 'webDrillAddr', 'webDrillAddrWithNull']) {
                                                if (attr in col.content) {
                                                    name = col.name;
                                                }
                                            }
                                        });
                                        return {
                                            keyField: name,
                                            isReplaceTable: this.isReplaceTable,
                                        };
                                    },
                                    getWrapper: () => {
                                        return this.wrapper;
                                    },
                                    getVisibleCol: () => this.visibleCol,
                                    isShow: true,
                                    callBack: resolve,
                                });
                            });
                            break;
                        case 'crosstab':
                            require(['NewCrossTabBasic'], (CrossTabBasic) => {
                                new CrossTabBasic({
                                    container: tools.isMb ? document.body : d.closest(this.wrapper, '.table-module-wrapper'),
                                    cols: this.dataTools.getCols(),
                                    allData: () => this.tableData.data,
                                    selectedData: () => this.selectedRowsData,
                                    getVisibleCol: () => this.visibleCol
                                });
                            });
                            break;
                        case 'analysis':
                            require(['NewAnalysisBasic'], (AnalysisBasic) => {
                                new AnalysisBasic({
                                    container: tools.isMb ? document.body : d.closest(this.wrapper, '.table-module-wrapper'),
                                    cols: this.dataTools.getCols(),
                                    allData: () => this.tableData.data,
                                    selectedData: () => this.selectedRowsData,
                                    getVisibleCol: () => this.visibleCol
                                });
                            });
                            break;
                    }
                } else {
                    Modal.alert('无可统计字段');
                }
            };

            switch (type) {
                case 'count':
                    initCount();
                    break;
                default:
                    initStatistic(type);
                    break;
            }
        })
    }

    private initExport(){
        if(this.isButton){
            let btn = new Button({
                type: 'default',
                icon: 'daochu2',
                content: '导出'
            });
            let exportBut = [
                {content: 'csv',icon: 'csv1',type:'default',onClick:() => this.export('csv')},
                {content: 'excel',icon: 'excel',type:'default',onClick:() => this.export('xls')},
                {content: 'word',icon: 'word',type:'default',onClick:() => this.export('doc')},
                // {content: 'pdf',icon: 'pdf',type:'default', onClick:() => this.export('pdf')},
                {content: 'png',icon: 'png',type:'default',onClick:() => this.export('image')}
            ];
            btn.dropDown = new DropDown({
                el: btn.wrapper,
                inline: false,
                data: [],
                multi: null,
                className: "input-box-morebtn"
            });
            for(let i = 0,l = exportBut.length; i < l; i++){
                btn.dropDown.getUlDom().appendChild(new Button(exportBut[i]).wrapper);
            }
            return btn;
        }else{
            let data = [{value: 'csv', text: '导出csv'},
                {value: 'xls', text: '导出excel'},
                {value: 'doc', text: '导出word'},
                // {value: 'pdf', text: '导出pdf'},
                {value: 'image', text: '导出png'}];
            return {
                title: '导出报表',
                onClick: () => {
                    this.initModal('导出报表', data, (ev) => {
                        this.export(ev);
                    })
                }
            }
        }
    }
    /**
     * 导出报表
     */
    protected export(action : string){
        require(['tableExport'], (tableExport) => {
            let names = [];
            this.columns.forEach((col) => {
                 if(col.isFixed){
                     col.isFixed = false;
                     names.push(col.name);
                 }
            });
            let tbody = d.query('tbody', this.mainTable.body.tableEl).cloneNode(true) as HTMLElement,
                thead = d.query('thead', this.mainTable.head.tableEl).cloneNode(true) as HTMLElement;
            let table: HTMLTableElement = <table border="1" id="tableExport"/>;
            table.innerHTML = thead.outerHTML + tbody.outerHTML;
            d.append(document.body, table);
            tableExport('tableExport', this.exportTitle, action);
            d.remove(table, true);
            table = null;
            this.columns.forEach((col) => {
                if(names.indexOf(col.name) > -1){
                    col.isFixed = true;
                }
            });
        })
    }

    /**
     * 添加一个新的按钮
     * @param {string} name - 按钮名
     * @param {IButton} btn - 外部按钮
     * @param {number} index - 插入位置
     */
    protected btnNameGroup = [];
    btnAdd(name: string, btn?: IButton, index?: number) {
        let btnGroup: any = this.isButton ? this.inputBox : this.popover;
        if(!btnGroup){
            return false;
        }
        if(FastBtnTable.names.indexOf(name) > -1){
            switch (name){
                case 'search':
                    this.isButton ? btnGroup.addItem(this.initSearch()) : this.initSearch();
                    break;
                // case 'filter':
                //     this.inputBox.addItem(this.initFilter());
                //     break;
                case 'statistic':

                    btnGroup.addItem(this.initStatistic());
                    break;
                case 'export':
                    btnGroup.addItem(this.initExport());
                    break;
            }
            typeof index === 'number' ? this.btnNameGroup.splice(index, 0, name) : this.btnNameGroup.push(name);
        }else{
            if(!this.isButton){
                let obj: IPopoverItemPara = {
                    title: btn.content,
                    onClick: btn.onClick
                };
                this.popover.addItem(obj);
                this.btnNameGroup.push(name);
            }else{
                this.inputBox.addItem(new Button(btn), index);
                typeof index === 'number' ? this.btnNameGroup.splice(index, 0, name) : this.btnNameGroup.push(name);
            }
        }
        return true;
    }

    btnRemove(name: string){
        let index = this.btnNameGroup.indexOf(name);
        if(index > -1){
            this.inputBox.delItem(index);
            this.btnNameGroup.splice(index, 1);
        }
    }

    btnGet(name: string){
        let index = this.btnNameGroup.indexOf(name);
        return index > -1 ? this.inputBox.getItem(index) : null;
    }

    removeAllModal(){
        this.modals.forEach((modal) => {
            modal.destroy();
        });
        this.modals = [];
    }

    public initModal(header: string, data:ListItem[], callback: Function){
        let body = <div className="fast-btn-modal-body" data-name="export"></div>;
        let sel = new SelectBox({
            container: body,
            select: {
                multi: false,
                isRadioNotchecked: false
            },
            data: data
        });
        let previewRB = new InputBox();
        let okBtn = new Button({
            key: 'okBtn',
            content: '确定',
            type: 'primary',
            onClick: () => {
                typeof callback === 'function' && callback(data[sel.get()[0]].value);
                modal.isShow = false;
            }
        });
        previewRB.addItem(okBtn);
        let modal = new Modal({
            header: header,
            body: body,
            position: tools.isMb ? 'center' : 'top',
            container : document.body,
            isOnceDestroy: true,
            footer: {
                rightPanel: previewRB
            },
            isMb: false,
            onClose: () => {
                let index = this.modals.indexOf(modal);
                if(index > -1){
                    this.modals.splice(index, 1);
                }
            }
        });
        this.modals.push(modal);
        return modal;
    }
}