/// <amd-module name="Tooltip"/>
import tools = G.tools;

interface TooltipPara{
    [any : string] : any;
    pos?: string,
    length?: string,
    visible?: boolean,
    errorMsg: string,
    el : HTMLElement;
  //  offset? : number;
}
export class Tooltip{
    private static defaultPara : TooltipPara = {
        pos:"up",
        length:"fit", //small, medium, large or fit
        visible:false,
        errorMsg: "",
        el : null
    };
    private userPara:TooltipPara = null;
    constructor(para: TooltipPara) {
        this.userPara = <TooltipPara>Object.assign({}, Tooltip.defaultPara, para);
        this.userPara.el.classList.add('tooltipiconfont');
        for(let key in this.userPara){
            if(this.userPara.hasOwnProperty(key)) {
                if(key!='el' && key!='offset') {
                    this.userPara.el.setAttribute(key != 'errorMsg' ? 'data-balloon-' + key : 'data-balloon', key != 'visible' ? this.userPara[key]:"");
                }
            }
        }
        !this.userPara.visible && this.userPara.el.removeAttribute("data-balloon-visible");
    }
    show(){

    };
    hide(){
        for(let key in this.userPara){
            if(this.userPara.hasOwnProperty(key))
            {
                if(key!='el' && key!='offset') {
                    this.userPara.el.removeAttribute(key != 'errorMsg' ? 'data-balloon-' + key : 'data-balloon');
                }
            }
        }
        this.userPara.visible && this.userPara.el.removeAttribute("data-balloon-visible");
    };

    static clear(el:HTMLElement){
        for(let key in el.dataset){
            if(key.indexOf('balloon') === 0){
                delete el.dataset[key] ;
            }
        }
    }
}
