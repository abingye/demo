/// <amd-module name="SlideUp"/>
import d = G.d;
import tools = G.tools;
import {Button} from "../../general/button/Button";
import IComponentPara = G.IComponentPara;
import Component = G.Component;
interface ISlideUpPara extends IComponentPara{
    position?: string; // 不可更改
    width?: number; // 设置组件宽度
    height?: number;  // 设置内容高度，不包括title
    text?: string; // 固定条显示文字
    contentTitle?: string;
    contentEl?: HTMLElement | DocumentFragment;
    contentHasClose?: boolean // 默认false
    isShow?:boolean;
}
export class SlideUp extends Component{

    constructor(para : ISlideUpPara){
        super(para);
        let mergePara:ISlideUpPara = G.tools.obj.merge(true,{
            position : 'bottomRight',
            width : 280,
            // height : 200,
            className : '',
            text : '点击查看',
            contentHasClose : false,
            isShow : false,
        },para);

        let classList = this.wrapper.classList;
        classList.add(mergePara.position);
        classList.add(mergePara.className);
        this.init(mergePara);
    }

    protected wrapperInit(para): HTMLElement {
        let wrapper = d.create(`<div class="slide-up"></div>`);
        this._slideEl = d.create(`<div class="slide-up-slideEl"></div>`);
        this._fixedEl = d.create(`<div class="slide-up-fixedEl"></div>`);
        this._contentEl = d.create(`<div class="slide-up-content"></div>`);
        this._textEl = d.create(`<div class="slide-up-text"></div>`);
        this._iconEL = d.create(`<div class="slide-up-icon"></div>`);


        d.append(wrapper, this._slideEl);
        d.append(wrapper, this._fixedEl);
        d.append(this._slideEl, this._contentEl);
        d.append(this._fixedEl, this._textEl);
        d.append(this._fixedEl, this._iconEL);
        // d.append(para.container,this.wrapper);

        return wrapper;
    }

    private init(para){
        // this.initTpl(para);

        this.width = para.width;
        this.height = para.height;
        this.text = para.text;
        this.contentTitle = para.contentTitle;
        this.contentEl = para.contentEl;
        this.isShow = para.isShow;
        this.button = new Button({
            container : this._iconEL,
            type : 'link',
            icon : 'expanse',
            onClick : () => {
                this.isShow = !this._isShow;
            }
        });
        d.on(this._fixedEl,'click', () => {
            this.isShow = !this._isShow;
        })
    }

    // private initTpl(para){
    //     this.wrapper = d.create(`<div class="slide-up ${para.position} ${para.className}"></div>`);
    //     this._slideEl = d.create(`<div class="slide-up-slideEl"></div>`);
    //     this._fixedEl = d.create(`<div class="slide-up-fixedEl"></div>`);
    //     this._contentEl = d.create(`<div class="slide-up-content"></div>`);
    //     this._textEl = d.create(`<div class="slide-up-text"></div>`);
    //     this._iconEL = d.create(`<div class="slide-up-icon"></div>`);
    //
    //
    //     d.append(this.wrapper,this._slideEl);
    //     d.append(this.wrapper,this._fixedEl);
    //     d.append(this._slideEl,this._contentEl);
    //     d.append(this._fixedEl,this._textEl);
    //     d.append(this._fixedEl,this._iconEL);
    //     d.append(para.container,this.wrapper);
    //
    // }


    private _width: number;
    set width(width){
        if(tools.isEmpty(width)){
            return;
        }
        this.wrapper.style.width = width + 'px';
        this._width = width;
    }
    get width(){
        return this._width;
    }

    /**
     * contentEl高度
     */
    private _height: number;
    set height(height){
        if(tools.isEmpty(height)){
            return;
        }
        this._contentEl.style.height = height + 'px';
        this._height = height;
    }
    get height(){
        return this._height ? this._height : this._contentEl.offsetHeight;
    }

    private _text: string;
    set text(text){
        this._textEl.innerHTML = text;
        this._text = text;
    }
    get text(){
        return this._text;
    }

    private _contentTitle : string;
    set contentTitle(title){
        if(!title){
            return;
        }
        if(!this._contentTitleEl){
            this._contentTitleEl = d.create(`<div class="slide-up-title"></div>`);
            d.prepend(this._slideEl,this._contentTitleEl);
        }

        this._contentTitleEl.innerHTML = title;
        this._contentTitle = title;
    }
    get contentTitle(){
        return this._contentTitle;
    }

    private _contentEl : HTMLElement;
    set contentEl(contentEl){
        if(!contentEl){
            return;
        }
        this._contentEl.innerHTML = null;
        d.append(this._contentEl, contentEl);
    }
    get contentEl(){
        return this._contentEl;
    }

    private _slideEl : HTMLElement;  // 滑块
    private _fixedEl : HTMLElement;  // 固定块
    private _contentTitleEl:HTMLElement;
    // private wrapper:HTMLElement; // 组件容器
    private _textEl:HTMLElement;
    private _iconEL:HTMLElement;

    private _button : Button;
    set button(button : Button){
        if(this._button){
            this._button.destroy();
        }
        this._button = button;
    }
    get button(){
        return this._button;
    }

    private _isShow : boolean;
    set isShow(isShow){
        this._slideEl.style.height = isShow ? (this._contentTitleEl ? this.height + 30 : this.height) + 'px': '0';
        this._isShow = isShow;
    }
    get isShow(){
        return this._isShow;
    }

    // private _onToggle: (isShow:boolean) => void;
    // set onToggle(toggle) {
    //
    // }
    //
    // get onToggle(){
    //     return this._onToggle;
    // }

}
