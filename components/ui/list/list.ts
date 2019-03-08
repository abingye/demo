/// <amd-module name="List"/>
import tools = G.tools;
import d = G.d;
import {SelectBox} from "../../form/selectBox/selectBox";

interface ListPara {
    // tpl? : string, // html模板文件 {{var}} - 变量
    container : HTMLElement;
    select?: {
        multi : boolean,
        show : boolean,
        callback? (selected : number[], index: number)
    },
    data? : Array<ListItem | string | number>
}
export class List{
    private selectBox;
    private tpl : string;
    private listDom: HTMLElement[] = [];
    constructor(private para : ListPara){
        para.container.classList.add('list');
        if(this.para.select){

            this.selectBox = new SelectBox({
                 select:{
                    multi:this.para.select.multi,
                    callback: (index) => {
                        this.para.select.callback(this.selectBox.get(), index)
                    }
                },
                container:this.para.container,
            });
        }
        if(this.para.select && this.para.select.show) {
            this.showSelect();
        }
    }

    setTpl(tpl : string){
        this.tpl = tpl;
    }
    showSelect(){
        this.para.container.classList.add('has-select');
    }
    hideSelect(){
        this.para.container.classList.remove('has-select');
    }

    // removeAll
    removeAllDom(){
        this.listDom.forEach(dom => {
            d.remove(dom);
        });
        this.listDom = [];
    }

    removeDom(index){
        d.remove(this.listDom[index]);
        let select =  this.selectBox.get();
        if(select.indexOf(parseInt(index)) > -1){
            select.splice(index , 1);
        }
        delete this.listDom[index]
    }

    addByTpl(data : obj[]) {
        if (!this.tpl) {
            return;
        }
        let arr : HTMLElement[] = [];
        data && data[0] && data.forEach((d, i) => {
            let html = tools.str.parseTpl(this.tpl, d, false);
            let el = G.d.create(html);
            arr.push(el);
        });
        this.addByDom(arr);

        return arr;
    }

    addByDom( el:HTMLElement[]){
        el.forEach((d,i)=>{
            d.classList.add('list-item');
            //若有index, 不另外添加index
            d.dataset.index = d.dataset.index ? d.dataset.index : i.toString();
            if(this.para.select && this.para.select.multi !== undefined){
                this.selectBox.addByItem(d);
            }
            this.listDom.push(d);
            this.para.container.appendChild(d);
        })
    }

    get() : number[]{
        if(this.selectBox){
            return this.selectBox.get();
        }

    }

    addSelected(index : Array<number>) {
        if(this.selectBox){
           this.selectBox.addSelected(index);
        }
    }

    setAll (){
        if(this.selectBox){
            this.selectBox.setAll();
        }
    }

    set(index : Array<number>){
        if(this.selectBox){
            this.selectBox.set(index);
        }
    }

    unSet(index : Array<number>) {
        if(this.selectBox){
        this.selectBox.unSet(index);
        }
    }
}