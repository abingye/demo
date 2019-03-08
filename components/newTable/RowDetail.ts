/// <amd-module name="RowDetail"/>

import IComponentPara = G.IComponentPara; import Component = G.Component;
import d = G.d;
import tools = G.tools;
import {ITableCol} from "./base/TableBase";
import {FastTableCell} from "./FastTableCell";

export interface IRowDetailPara extends IComponentPara{
    detailCols:ITableCol[];
    detailCells?:FastTableCell[];
}
export class RowDetail extends Component {
    protected wrapperInit(): HTMLElement {
        return d.create('<div class="detail-container"></div>')
    }

    constructor(para: IRowDetailPara) {
        super(para);
        this.init(para);
    }

    private init(para: IRowDetailPara) {
        para.detailCols.forEach((col)=>{
            let nodeList:IVNode = {
                tag:'div',
                props:{
                    className:'detail-row'
                },
                children:[
                    {
                        tag:'div',
                        props:{
                            className:'detail-label'
                        },
                        children:[
                            col.title+' :'
                        ]
                    },
                    {
                        tag:'div',
                        props:{
                            className:'detail-content',
                            dataset:{
                                name:col.name
                            }
                        }
                    }
                ]
            };
            this.wrapper.appendChild(d.create(nodeList));
            if (tools.isNotEmpty(para.detailCells)){
                this.detailCells = para.detailCells;
            }
        })
    }

    private _detailCells:FastTableCell[];
    set detailCells(cells:FastTableCell[]){
        if (tools.isEmpty(cells)){
            cells = [];
        }
        this._detailCells = cells;
        let contents = d.queryAll('[data-name]',this.wrapper);
        contents.forEach((content)=>{
            for (let cell of this._detailCells){
                if (cell.name === content.dataset.name){
                    content.innerText = cell.text;
                    break;
                }
            }
        })
    }
    get detailCells(){
        return this._detailCells;
    }
}