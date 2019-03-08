/// <amd-module name="Button"/>
import d = G.d;
import tools = G.tools;
import IComponentPara = G.IComponentPara; import Component = G.Component;
import {DropDown} from "../../ui/dropdown/dropdown";

export interface IButton extends IComponentPara{
    content?: string;
    icon?: string;
    iconPre?: string;
    isDisabled?: boolean;
    isLoading?: boolean;
    isShow?: boolean;
    color?: string;
    size?: string;
    type?: string;
    onClick?: EventListener;
    dropDown?: DropDown;
    key?: string;
    className?: string;
    tip?: string;
}
/**
 * 按钮组件对象
 */
export class Button extends Component implements IButton{

    private init(button: IButton){

        // if(button.className){
        //     this.wrapper.classList.add(button.className);
        // }

        this.iconPre = button.iconPre || 'iconfont';

        this.isLoading = button.isLoading;
        this.key = button.key;
        this.icon = button.icon;
        this.content = button.content;
        this.isShow = button.isShow;
        this.onClick = button.onClick;
        this.isDisabled = button.isDisabled;
        this.type = button.type;
        this.color = button.color;
        this.size = button.size;
        this.dropDown = button.dropDown;
        this.tip = button.tip;
    }

    public iconPre:string;

    protected wrapperInit(): HTMLElement {
        return <button type="button" className="btn"/>;
    }

    public key: string;

    protected _tip: string;
    get tip(){
        return this._tip;
    }
    set tip(tip: string){
        tip = tip || '';
        this._tip = tip;
        this.wrapper.title = tip;
    }

    /**
     * 按钮图标
     * 类型：string
     * 默认值：空
     */
    private _icon?:string;
    set icon(icon:string){
        if(tools.isEmpty(icon) || (tools.isNotEmpty(icon) && this._icon === icon)){
            return;
        }

        //移除原有icon
        this.iconEl && this._iconEl.parentElement.removeChild(this._iconEl);


        let iconStr = this.iconPre === 'iconfont' ? `icon-${icon}` : icon,
            className = `${this.iconPre} button-icon ${iconStr}`;

        if(icon === 'spinner'&& this._isLoading) {
            className = 'spinner';
        }

        this._iconEl = <i className={className}></i>;
        d.prepend(this.wrapper, this._iconEl);

        this._icon = icon;
    }
    get icon(){
        return this._icon;
    }

    //
    private _iconEl? : HTMLElement;
    get iconEl(){
        if(!this._iconEl){
            this._iconEl = d.query('i', this.wrapper);
        }
        return this._iconEl;
    }

    /**
     * 按钮颜色
     * primary|info|success|warning|error
     */
    private _color:string;
    set color(color:string){
        if(tools.isEmpty(color)){
            return;
        }
        this.wrapper.classList.remove("button-" + this._color);
        this.wrapper.classList.add("button-" + color);
        this._color = color;
    }
    get color(){
        return this._color;
    }

    /**
     * 按钮样式类型
     * 类型：string
     * 默认值：default|ghost|text|dashed
     */
    private _type?:string;
    set type(type:string){
        //若已经初始化过按钮类型，则删除之前添加的样式
        if(this._type) {
            this.wrapper.classList.remove(`button-type-${this._type}`);
        }
        this._type = tools.isEmpty(type)?'default':type;
        this.wrapper.classList.add("button-type-"+this._type);
    }
    get type(){
        return this._type;
    }

    /**
     * 按钮文本
     * 类型：string
     * 默认值：操作,如果icon不为空则默认值为''
     */
    private _content:string;
    set content(content:string){
        content = tools.isEmpty(content)? (tools.isEmpty(this._icon) ? '操作' : ''): content;
        if(!tools.isEmpty(content)) {
            let contentWrapper = d.query('span',this.wrapper);
            //不存在则创建容器存放之(放在容器的第一个节点处)
            if(!contentWrapper) {
                contentWrapper = <span>{content}</span>;
                this.wrapper.appendChild(contentWrapper);
            }
            //存在则替换原来的content
            else {
                contentWrapper.innerHTML = content;
            }
            this._content = content;
        }
    }
    get content(){
        return this._content;
    }

    /**
     * 下拉列表
     * */
    private _dropDown?:DropDown;
    set dropDown(dropDown:DropDown) {
        if(!tools.isEmpty(dropDown)) {
            let pos = <span className="iconfont icon-expanse iconPos"></span>;
            this.wrapper.classList.add('dropdown-toggle');
            this.wrapper.appendChild(pos);
            this.onClick = ()=>{
                this._dropDown.toggle();
            };
        }
        // else {
        //     let pos = d.query(`<span class="iconPos"></span>`,this.wrapper);
        //     if(pos) {
        //         d.remove(pos);
        //     }
        //     if(this._dropDown) {
        //         this.onClick = ()=>{};
        //     }
        // }
        this._dropDown = dropDown;
    }
    get dropDown() {
        return this._dropDown;
    }

    /**
     * 按钮尺寸
     * 类型：string
     * 默认值middle  |small|large
     */
    private _size?: string;
    set size(size:string){
        size = tools.isEmpty(size) ? 'middle' : size;
        //若已经初始化过按钮尺寸，则删除之前添加的样式
        if(this._size) {
            this.wrapper.classList.remove(`button-${this._size}`);
        }
        if(size) {
            this.wrapper.classList.add(`button-${size}`);
            this._size = size;
        }
    }
    get size(){
        return this._size;
    }

    /**
     * 按钮是否不可用状态
     * 类型：Boolean
     * 默认值：false
     */
    private _isDisabled?:boolean;
    set isDisabled(isDisabled:boolean){
        if(isDisabled)
            this.wrapper.classList.add('disabled');
        else
            this.wrapper.classList.remove('disabled');
        this._isDisabled = tools.isEmpty(isDisabled)?false:isDisabled;
    }
    get isDisabled(){
        return this._isDisabled;
    }

    /**
     * 按钮是否加载中状态
     * 类型：Boolean
     * 默认值：false
     */
    private _isLoading:boolean;
    set isLoading(isLoading:boolean){
        this._isLoading = tools.isEmpty(isLoading) ? false : isLoading;
        if(this._isLoading) {
            this.icon = 'spinner';
        }else{
            //移除原有icon
            this.iconEl && d.remove(this._iconEl);
            this._icon = null;
            this._iconEl = null;
        }
        this._isLoading = isLoading;
    }
    get isLoading(){
        return this._isLoading;
    }

    /**
     * 按钮是可见
     * 类型：Boolean
     * 默认值：true
     */
    private _isShow:boolean;
    set isShow(isShow:boolean){
        this._isShow = tools.isEmpty(isShow)?true:isShow;
        d.classToggle(this.wrapper, 'hide', !this._isShow);
    }
    get isShow(){
        return this._isShow;
    }

    /**
     * 按钮点击事件
     * 类型：EventListener
     * 默认值：无
     */
    private _onClick:EventListener;
    set onClick(callback:EventListener) {
        if(!tools.isEmpty(callback)) {
            d.off(this.wrapper, 'click', this._onClick);
            this._onClick = function(e: MouseEvent) {
                e && e.stopPropagation();
                callback.call(this, e)
            };
            d.on(this.wrapper, 'click', this._onClick);
        }
    }
    get onClick(){
        return this._onClick;
    }

    getDom() : HTMLElement{
        return this.wrapper;
    }
    constructor(private button?: IButton) {
        super(button);
        if(tools.isEmpty(button)){
            button = {};
        }

        this.init(button);
    }

    destroy(){
        this._dropDown && this._dropDown.destroy();
        super.destroy();
    }
}