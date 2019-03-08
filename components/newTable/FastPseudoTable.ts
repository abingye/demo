/// <amd-module name="FastPseudoTable"/>
import {ITableBasePara, TableBase} from "./base/TableBase";
import {CheckBox} from "../form/checkbox/checkBox";
import {FastTable} from "./FastTable";
import d = G.d;
import tools = G.tools;
import {TableDataCell} from "./base/TableCell";
export type PseudoTableType = 'number' | 'checkbox';

interface IFastPseudoTablePara extends ITableBasePara {
    type?: PseudoTableType;
    container?: HTMLElement;
    className?: string;
    isShow?: boolean;
    fastTable: FastTable;
    multiHeadRow?: number;
    isAll?: boolean;
}

export class FastPseudoTable extends TableBase {
    private fastTable: FastTable;
    public _type: PseudoTableType;
    public readonly checkAllBox: CheckBox;

    constructor(para: IFastPseudoTablePara, _wrappers?) {
        super({
            container: para.container,
            cols: (() => {
                let result = [];

                result.push([{
                    name: 'selectCol',
                    title: '',
                }]);
                // for(let i = 1; i < multiHead; i ++){
                //     result.push([])
                // }

                return result;
            })(),
            className: para.className,
            _wrapper: para._wrapper,
            colCount: para.colCount,
        }, _wrappers);
        this.fastTable = para.fastTable;
        this.init(para);
        this.isShow = tools.isEmpty(para.isShow) ? true : para.isShow;

        let multiHead = tools.isEmpty(para.multiHeadRow) ? 1 : para.multiHeadRow;

        let allCheckBoxWrapper = this.head.rows[0].cells[0].wrapper;
        allCheckBoxWrapper.style.height = multiHead * 40 + 1 + 'px';
        let div = d.query('.cell-content', allCheckBoxWrapper);
        if(div){
            div.style.height = multiHead * 40 + 'px';
            div.style.lineHeight = multiHead * 40 + 'px';
        }

        let isAll = tools.isEmpty(para.isAll) ? true : para.isAll;
        if(isAll){
            this.checkAllBox = new CheckBox({
                container: d.query('div.cell-content', this.head.rows[0].cells[0].wrapper),
                onClick: (isChecked) => {
                    if( this._type === 'number') {
                        this.body.rows && this.body.rows.forEach((row) => {
                            if(row){
                                let index = row.index;
                                typeof index === 'number' && this._setCellsSelected(index, isChecked ? 1 : 0);
                            }
                        });

                        isChecked ? this.fastTable.rows.forEach((row) => {
                            row && row._selectedInnerRowSet(isChecked);
                        }) : this.fastTable._clearAllSelectedCells();

                        this.fastTable._drawSelectedCells();
                    }else{
                        this.allCheckBox && this.allCheckBox.forEach((btn) => {
                            btn.checked = isChecked;
                        });
                    }
                    this.fastTable.trigger(FastTable.EVT_SELECTED);
                }
            });
        }

    }

    protected preSelCell: TableDataCell = null;
    protected preSelIndex: number = -1;
    get selectIndex(){
        return this.preSelIndex;
    }
    setPresentSelected(index: number){
        let rows = this.body.rows || [];
        if(rows.length === 0){
            return;
        }
        if(index >= rows.length){
            index = 0;
        }
        this.preSelIndex = index;
        this.preSelCell && (this.preSelCell.presentSelected = false);
        this.preSelCell = rows[this.preSelIndex].cells[0];
        this.preSelCell && (this.preSelCell.presentSelected = true);
    }
    clearPresentSelected(){
        this.preSelCell && (this.preSelCell.presentSelected = false);
        this.preSelCell = null;
        this.preSelIndex = null;
    }
    offsetPresentSelected(offset: number){
        this.preSelIndex !== null && this.setPresentSelected(this.preSelIndex + offset);
    }
    get presentOffset(){
        return this.preSelIndex;
    }

    setCheckBoxStatus(){
        let flag = this.fastTable.rows.length > 0;
        let flagCount = 0;
        if(flag){
            if(this._type === 'number'){
                this.fastTable.rows && this.fastTable.rows.forEach((row) => {
                    if(row){
                        for(let cell of row.cells){
                            flag = flag && cell.selected;
                        }
                        row.selected && flagCount ++;
                    }
                });

            }else{
                this.allCheckBox && this.allCheckBox.forEach((checkBox) => {
                    flag = flag && checkBox.status === 1;
                    (checkBox.status === 2 || checkBox.status === 1) && flagCount ++;
                });
            }

            if(this.checkAllBox){
                if(flag){
                    this.checkAllBox.status = 1;
                }else if(!flag && flagCount > 0){
                    this.checkAllBox.status = 2;
                }else{
                    this.checkAllBox.status = 0;
                }
            }
        }else{
            this.checkAllBox && (this.checkAllBox.status = 0);
        }

    }

    // 初始化
    private init(para: IFastPseudoTablePara) {

        this._type = para.type || 'number';
        this.allCheckBox = [];
        this.head.innerWrapper.classList.add('pseudo-table');
        this.body.innerWrapper.classList.add('pseudo-table');
        if(this.fastTable.colCount){
            this.foot.innerWrapper.classList.add('pseudo-table');
        }
    }

    allCheckBox: CheckBox[];

    render() {
        let indexes = [];
        for(let row of this.fastTable.rows){
            if(row){
                indexes.push(row.index);
            }
        }
        let delIndexes = [];
        d.diff(indexes, this.body.rows, {
            create: (index: number) => {
                if (this._type === 'number') {
                    let dataObj = {selectCol: index + 1};
                    this.dataAdd(dataObj);
                } else {
                    let timer = null;
                    this.body.rowAdd({});
                    let box = new CheckBox({
                        container: this.body.rowGet(index).cells[0].wrapper,
                        clickArea: 'all',
                        onSet: (isChecked) => {
                            if (this.fastTable.rowGet(index)) {
                                this.fastTable.rowGet(index)._selectedInnerRowSet(isChecked);
                                this.setCheckBoxStatus();
                                clearTimeout(timer);
                                timer = setTimeout(() => {
                                    this.fastTable._drawSelectedCells();
                                }, 20);
                            }
                        }
                    });
                    this.allCheckBox[index] = box;
                    let dataObj = {
                        selectCol: box.wrapper
                    };
                    this.body.rowGet(index).data = dataObj;
                    this.body.rowGet(index).index = index;
                }
            },
            replace: (index, row) => {
                row.index = index;
                row.cells[0].selected = this.fastTable.rows[index].selected;
                // row.selected = this.fastTable.rows[index].selected;
            },
            destroy: (row) => {
                let index = this.body.rows.indexOf(row);
                delIndexes.push(row);
                if (this._type === 'checkbox') {
                    delete this.allCheckBox[index]
                }
            }
        });
        for(let row of delIndexes.sort().reverse()){
            d.remove(row.wrapper);
            this.body.rows.splice(this.body.rows.indexOf(row), 1);
        }
        this.preSelCell && (this.preSelCell.presentSelected = false);

        this.setCheckBoxStatus();
        this.tableData.set(this.tableData.get().filter((item) => {
            return typeof item !== 'undefined';
        }));
        return Promise.resolve();
    }

    private _isShow: boolean;
    set isShow(isShow: boolean) {
        this._isShow = isShow;
        d.queryAll('.pseudo-table', this.fastTable.wrapper).forEach((el) => {
            el.classList.toggle('hide', !this._isShow);
        });
        this.fastTable.setTableStyle();
    }

    get isShow() {
        return this._isShow;
    }


    //获取wrapper宽度
    get width() {
        return 40;
    }

    _setCellsSelected(index: number, status: number) {
        if (this._type === 'checkbox') {
            if (this.allCheckBox[index].status !== status) {
                this.allCheckBox[index].status = status;
            }
        } else {
            let row = this.body.rowGet(index);
            row && (row.cells[0].selected = status > 0);
        }
    }

    _clearCellSelected(){
        if (tools.isNotEmpty(this.allCheckBox)){
            this.allCheckBox.forEach((checkbox)=>{
                checkbox.get() && checkbox.set(false);
            })
        }
    }
}
