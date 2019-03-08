/// <amd-module name="ButtonGroup"/>
import tools = G.tools;
import d = G.d;
import {DropDown} from "../dropdown/dropdown";
interface BtnsRenderConf{
    container : HTMLElement;
    btnTpl? : string;
    btns : Btn[];
    clickHandle(btn : Btn, target? : HTMLElement);
    maxBtn? : number;//允许按钮显示的最大数量
}
export class ButtonGroup{
    private dropDown;
    private leftBtn : HTMLElement; //保存左侧节点的父节点
    constructor(private conf : BtnsRenderConf){
            this.leftBtn = conf.container;
        if(typeof conf.maxBtn === 'number' && conf.maxBtn > 0){
            if( (conf.btns.length > conf.maxBtn) && (conf.btns.length-1) != conf.maxBtn){
                this.initOverMaxBtn(conf);
            }
            else{
                this.initLessMaxBtn(conf);
            }
        }
        else{
            this.conf.maxBtn = 999;
            this.initLessMaxBtn(conf);
        }
    }
   /*
   * 生成超过允许按钮显示的最大数量的按钮组
   * */
    private initOverMaxBtn (conf : BtnsRenderConf){
        let tempBtns = [],
              num = 0,i,doc = document.createDocumentFragment(),dom,data = [],self = this;
        for(;num <= conf.maxBtn;num++){
            if(num === conf.maxBtn){
                tempBtns[num] = {title : '更多',icon : 'iconfont icon-sousuo',list:[]};
                dom = d.create(`<a class="dropdown-toggle moreBtn" data-toggle="dropdown"   title="查看更多">
                               <span class="moreBtn_text">更多</span><span class="iconfont icon-paixu iconPos"></span></a>`);
                dom.dataset['more'] = num.toString();
                doc.appendChild(dom);
            } else{
                tempBtns.push(conf.btns[num]);
                dom = d.create(tools.str.parseTpl(ButtonGroup.getBtnDom(conf.btns[num]), conf.btns[num]));
                dom.dataset['index'] = num.toString();
                doc.appendChild(dom);
            }
        }
        for(i = num-1;i < conf.btns.length;i++){
            tempBtns[num-1].list.push(conf.btns[i]);
            data.push({value : conf.btns[i].title,text : `<span class="${conf.btns[i].icon}"></span>${conf.btns[i].title}`});
        }
        this.dropDown = new DropDown({
            el : dom,
            inline : false,
            onSelect : function(item, index){
                    self.dropDown.toggle();
                    conf.clickHandle(conf.btns[num - 1 + index],  self.dropDown.getUlDom().getElementsByTagName('li')[index]);
            },
            data:data,
            multi : null,
            className : "moreButUl"
        });

        conf.container.appendChild(doc);
        d.on(conf.container, 'click', '[data-index]', function () {
                conf.clickHandle(conf.btns[parseInt(this.dataset.index)], this);
        });
        let el;
        d.on(conf.container, 'click', '[data-more]', function (e) {
            self.dropDown.toggle();
        });



    }
    /*
    * 初始化小于maxBtn大小的函数
    * */
    private initLessMaxBtn(conf){
        if(conf.btns) {
            let doc = document.createDocumentFragment();
            conf.btns.forEach(function (btn, i) {
                let dom = d.create(tools.str.parseTpl(ButtonGroup.getBtnDom(btn), btn));
                dom.dataset['index'] = i.toString();
                doc.appendChild(dom);
            });
            conf.container.appendChild(doc);
            d.on(conf.container, 'click', '[data-index]', function () {
                conf.clickHandle(conf.btns[parseInt(this.dataset.index)], this);
            });
        }
    }
    static getBtnDom(obj : obj){
        let content = `${obj.icon? '<span class="{{icon}}"></span>' : ''}${obj.title}`,
            tpl = `<a class="btn button-small button-default" title="${obj.title}">${content}</a>`;
        return tpl;
    }
    /*
    * 为其它地方函数调用相应的按钮节点
    * */
    public getEle(index){
         if(index < this.conf.maxBtn  || (this.conf.btns.length-1) === this.conf.maxBtn){
             return d.query('[data-index="'+index+'"]',this.leftBtn);
         }
         else {
             return d.query('[data-index="'+(index - this.conf.maxBtn)+'"]', this.dropDown.getUlDom());
         }
    }
}
