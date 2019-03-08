/// <amd-module name="FastTableCell"/>

import {ITableDataCellPara, TableDataCell} from "./base/TableCell";
import {FastTable} from "./FastTable";
import {Tooltip} from "../ui/tooltip/tooltip";
import {FastTableRow} from "./FastTableRow";
import tools = G.tools;
import d = G.d;

export interface IFastTableCellPara extends ITableDataCellPara {

}

export class FastTableCell extends TableDataCell {
    constructor(para: IFastTableCellPara) {
        super(para);
    }

    get ftable() {
        return this.row.section.table.content as FastTable;
    }
    // isInnerEvent 用于标记当前是否是用户触发的事件(内部定义的事件)
    _selectedInnerSet(selected: boolean) {
        this._selected = selected;
        this.wrapper.classList.toggle('selected', selected);
        let allBorderClass = ['topBorder', 'bottomBorder', 'leftBorder', 'rightBorder'];

        allBorderClass.forEach((cName) => {
            this.wrapper.classList.remove(cName);
        });
        // 为true的时候绘制
        // if (isDraw) {
        //     // 绘制
        //     // this.ftable._drawSelectedCells();
        // }
    }

    set selected(selected) {
        this._selectedInnerSet(selected);
        this.ftable.trigger(FastTable.EVT_SELECTED);
    }
    get selected() {
        return this._selected;
    }

    get frow(): FastTableRow{
        return this.ftable.rowGet(this._row.index);
    }

    private _errorMsg: string;
    get errorMsg() {
        return this._errorMsg || '';
    }
    set errorMsg(msg: string) {
        if(msg == this.errorMsg) {
            return
        }
        if(msg){
            let visibleCols = this.ftable.columnsVisible.map(col => col.name),
                isLastCol = visibleCols.indexOf(this.name) > visibleCols.length / 2;

            new Tooltip({
                // visible: tools.isMb,
                errorMsg: msg,
                el: this.wrapper,
                length: 'medium',
                pos: isLastCol ? 'left' : 'right'
            });
            d.classAdd(this.wrapper, 'error');
            this.wrapper.innerHTML = '';
            d.append(this.wrapper, <div>{this.text}</div>)
        }else{
            Tooltip.clear(this.wrapper);
            this.wrapper.innerHTML = '';
            d.append(this.wrapper, this.text);
            d.classRemove(this.wrapper, 'error');
        }
        this._errorMsg = msg;
    }

}