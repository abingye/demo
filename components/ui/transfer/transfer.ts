/// <amd-module name="Transfer"/>


import tools = G.tools;
import {DropDown} from "../dropdown/dropdown";
import d = G.d;

interface ListData extends Array<ListItem | string | number>{}
interface TransferPara {
    container:HTMLElement,
    dataLeft : ListData
    dataRight? : ListData;
    isToRight?:boolean;
    isToLeft?:boolean;
}
export class Transfer{
    private dropLeft:DropDown;
    private dropRight:DropDown;
    private toRightBtn:HTMLElement;
    private toLeftBtn:HTMLElement;
    private leftContainer:HTMLElement;
    private rightContainer:HTMLElement;
    constructor(private para : TransferPara){
        para.container.classList.add('drop-wrapper');
        this.initTransfer();
        if(!para.dataRight){
            para.dataRight = [];
        }
        this.addBtn();
        this.addEvent();
    }
   //初始化左右弹框
   private initTransfer(){
       let leftContainer = d.create(`<div></div>`),
           rightContainer = d.create(`<div></div>`);
       this.para.container.appendChild(leftContainer);
       this.para.container.appendChild(rightContainer);
       let self = this;
       self.dropLeft = new DropDown({
           el:leftContainer,
           data:this.para.dataLeft,
           onSelect:function(data,index){
               self.dropRight.dataAdd([data]);
               self.dropLeft.dataDel(index);
           },
           inline:true
       })
       self.dropRight = new DropDown({
           el:rightContainer,
           data:this.para.dataRight,
           onSelect:function(data, index){
               self.dropLeft.dataAdd([data]);
               self.dropRight.dataDel(index);
           },
           inline:true
       })
   }
   //添加左右移动按钮
   private addBtn(){
       if(this.para.isToRight){
           this.toRightBtn = <HTMLElement>d.create(`<button class = 'btn-toright'></button>`);
           this.para.container.appendChild(this.toRightBtn);
       }
       if(this.para.isToLeft){
           this.toLeftBtn = <HTMLElement>d.create(`<button class = 'btn-toleft'></button>`)
           this.para.container.appendChild(this.toLeftBtn);
       }
   }
   private addEvent(){
       if(this.toLeftBtn){
           d.on(this.toLeftBtn, 'click', () => {
               this.switchAll(this.dropRight,this.dropLeft);
           });
       }
       if(this.toRightBtn){
               d.on(this.toRightBtn, 'click', () => {
                   this.switchAll(this.dropLeft,this.dropRight);
               });
       }
   }
   //将源dropDown里的所有项转移到目标dropDown中
    private switchAll(src:DropDown, target:DropDown){
        let data = <ListData>src.getData();

        target.dataAdd(data);
        src.dataDelAll();
    }
    public getData(type:string){
        if(type === 'left'){
            return this.dropLeft.getData();
        }
        if(type === 'right'){

            return this.dropRight.getData();
        }
    }
}