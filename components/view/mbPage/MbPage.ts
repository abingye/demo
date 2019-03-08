/// <amd-module name="MbPage"/>
import IComponentPara = G.IComponentPara; import Component = G.Component;
import {Tab, TabPara} from "../../ui/tab/tab";
import {Button, IButton} from "../../general/button/Button";
import d = G.d;
import tools = G.tools;
interface IMbPagePara extends IComponentPara{
    headerHeight?: string;
    body ? : Node | TabPara; // Tab时覆盖title
    left ? : IButton[] | HTMLElement;
    right ? : IButton[] | HTMLElement;
    title ? : string;
    className?: string;
}
export class MbPage extends Component{

    constructor(private para : IMbPagePara){
        super(para);
        let defaultPara : IMbPagePara = {
            container : document.body,
            className : ''
        };
        this.init(G.tools.obj.merge(true,defaultPara,para));

    }
    private _headerEl : HTMLElement; // 头部容器
    bodyEl : HTMLElement; // 内容容器
    private _leftEl : HTMLElement;
    private _rightEl : HTMLElement;
    private _titleEl : HTMLElement;

    private init(para: IMbPagePara){
        // this.initTpl(para);
        this.headerHeight = para.headerHeight;
        this.body = para.body;
        this.left = para.left;
        this.right = para.right;
        this.title = para.title;
    }
    protected wrapperInit(): HTMLElement {
        let wrapper = d.create(`<div class="mbPage"></div>`);
        this._headerEl = d.create(`<header class="mbPage-header"></header>`);
        this.bodyEl = d.create(`<div class="mbPage-body"></div>`);
        this._leftEl = d.create(`<div class="mbPage-left"></div>`);
        this._rightEl = d.create(`<div class="mbPage-right"></div>`);
        this._titleEl = d.create(`<div class="mbPage-title"></div>`);
        d.append(wrapper, this._headerEl);
        d.append(wrapper, this.bodyEl);
        d.append(this._headerEl, this._leftEl);
        d.append(this._headerEl, this._titleEl);
        d.append(this._headerEl, this._rightEl);
        return wrapper;
    }

    // private _headerHeight: string;
    set headerHeight(height: string){
        if(tools.isEmpty(height)){
            return;
        }

        this._headerEl.style.height = height;
        this.bodyEl.style.paddingTop = height;
        this._titleEl.style.lineHeight = height;
    }
    // private initTpl(para : IMbPagePara){
    //
    // }

    private tab : Tab;
    private _body : Node | TabPara;
    set body(body : Node | TabPara ){
        if(!body) {
            return;
        }
        let tabs = (<TabPara>body).tabs;
        if(tabs){
            this._titleEl.innerHTML = null;
            this.bodyEl.innerHTML = null;
            this.tab = new Tab({
                tabParent: this._titleEl,
                panelParent: this.bodyEl,
                tabs: tabs
            })
        }else {
            this.bodyEl.innerHTML = null;
            d.append(this.bodyEl, <HTMLElement>body);
        }

    }
    get body(){
        return this._body;
    }

    private _left : IButton[] | HTMLElement;
    set left(left : IButton[] | HTMLElement){
        if(!left){
            return;
        }
        if( Array.isArray(left)) {
            left.forEach(obj => {
                new Button(tools.obj.merge({
                    container: this._leftEl,
                },obj))
            });
        }else {
            this._leftEl.innerHTML = null;
            d.append(this._leftEl, <HTMLElement>left);
        }
    }
    get left(){
        return this._left;
    }

    private _right : IButton[] | HTMLElement;
    set right(right : IButton[] | HTMLElement){
        if(!right){
            return;
        }
        if( Array.isArray(right)) {
            right.forEach(obj => {
                new Button(tools.obj.merge({
                    container: this._rightEl,
                },obj))
            });
        }else {
            this._rightEl.innerHTML = null;
            d.append(this._rightEl, <HTMLElement>right);
        }
    }
    get right(){
        return this._right;
    }

    private _title : string;
    set title(title : string){
        if(!this.tab){
            this._titleEl.innerHTML = `<div class="text-title">${tools.str.toEmpty(title)}</div>`;
            this._title = title;
        }
    } 
    get title(){
        return this._title;
    }
}