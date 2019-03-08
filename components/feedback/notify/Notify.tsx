/// <amd-module name="Notify"/>
import IComponentPara = G.IComponentPara; import Component = G.Component;
import d = G.d;
interface NotifyPara extends IComponentPara{
    title?:string;//标题
    // container?: HTMLElement;//容器
    // link?:string;//链接
    position?:string;//位置
    content?:string;//文本内容
    duration?:number;//持续时间 毫秒
    isNoHide?:boolean;//不自动关闭
    icon?:string;//图标
    background?:string;//背景色
    onClick? : () => void
}
export class Notify {
    private mainContainter : HTMLElement;
    private _wrapper: HTMLElement;
    constructor(private para : NotifyPara){
        // super(para);
        let defaultPara:NotifyPara = {
            title : "标题",
            container : document.body,
            // link : '#',
            position : 'bottomRight',
            content : '内容',
            duration : 5000,
            icon : '',
            isNoHide : false,
            background : 'white'
        };
        para = Object.assign(defaultPara, para);
        this.init(para);
    }
    private init(para : NotifyPara){
        let mainCon = d.query('.notify',this.para.container);
        if(mainCon){
            this.mainContainter = mainCon;
        }
        else{
            this.mainContainter = <div className="notify"></div>;
            para.container.appendChild(this.mainContainter);
        }
        this._wrapper = <a className="notifyItem"></a>;
        this.initClose();

        this.icon = para.icon;
        this.title = para.title;
        this.content = para.content;
        this.position = para.position;
        this.isNoHide =  para.isNoHide;
        this.duration =  para.duration;
        this.background = para.background;
        // this.link = para.link;
        this.onClick = para.onClick;
        this.mainContainter.appendChild(this._wrapper);
        setTimeout(()=>{
            this._wrapper.style.opacity = '1';
        },50)
    }

    private _title : string;
    set title(title: string){
        if(this._title){
            let titleSpan = d.query('span',this._wrapper);
            titleSpan.innerHTML = title;
        }
        else{
           this._wrapper.appendChild(<span className="title">{title}</span>);
        }
        this._title = title;
    }
    get title(){
        return this._title;
    }

    // private _link : string;
    // set link(link: string){
    //     if(!link){
    //         return;
    //     }
    //     if(!this._link){
    //         d.on(this._wrapper,'click',()=>{
    //             let tempUrl = conf.url.site + this.link;
    //             sys.window.open({url:tempUrl});
    //         })
    //     }
    //     this._link = link;
    // }
    // get link(){
    //     return this._link;
    // }

    private _position : string;
    set position(position: string){
        this._position = position;
        if(position === 'topLeft'){
            this.mainContainter.style.top = '20px';
            this.mainContainter.style.left = '40px';
        }
        else if(position === 'topRight'){
            this.mainContainter.style.top = '20px';
            this.mainContainter.style.right = '40px';
        }
        else if(position === 'bottomLeft'){
            this.mainContainter.style.bottom = '20px';
            this.mainContainter.style.left = '40px';
        }
        else{
            this.mainContainter.style.bottom = '20px';
            this.mainContainter.style.right = '40px';
        }
    }
    get position(){
        return this._position;
    }

    private _content : string;
    set content(content: string){
        if(this._content){
            let contentP = d.query('p',this._wrapper);
            contentP.innerHTML = content;
        }
        else{
            this._wrapper.appendChild(<p className="content">{content}</p>);
        }
        this._content = content;
    }
    get content(){
        return this._content;
    }

    private _isNoHide : boolean;
    set isNoHide(isNoHide : boolean){
        this._isNoHide = isNoHide;
    }
    get isNoHide(){
        return this._isNoHide;
    }

    private _duration : number;
    set duration(duration: number){
        this._duration = duration;
        setTimeout(()=>{
            if(this._wrapper && !this.isNoHide) {
                this._wrapper.style.opacity = '0';
                let par = this._wrapper.parentElement;
                setTimeout(() => {
                    this._wrapper && this._wrapper.remove();
                    if (par.children.length === 0) {
                        par.remove();
                    }
                }, 2000);
            }
        },duration);
    }
    get duration(){
        return this._duration;
    }

    private _icon : string;
    set icon(icon: string){
        if(this._icon){
            let myIcon = d.query('.myIcon',this._wrapper);
            myIcon.classList.remove('icon-' + this._icon);
            myIcon.classList.add('icon-' + icon);
        }
        else{
            if(icon !== ""){
                this._wrapper.appendChild(<i className={`iconfont icon-${icon} myIcon`}></i>);
                this._wrapper.style.paddingLeft = "50px";
            }
        }
        this._icon = icon;
    }
    get icon(){
        return this._icon;
    }

    private _background : string;
    set background(background: string){
        this._background = background;
        this._wrapper.style.background = background;
    }
    get background(){
        return this._background;
    }

    private _onClick : () => void ;
    set onClick(onClick){
        if(this._onClick){
            d.off( this._wrapper, 'click', this._onClick)
        }
        if(onClick){
            d.on( this._wrapper, 'click', onClick);
            this._onClick = onClick;
        }
    }
    get onClick (){
        return this._onClick;
    }

    private initClose(){
        let i = <i className="iconfont icon-close close"></i>;
        this._wrapper.appendChild(i);
        d.on(i,'click',(e)=>{
            e.stopPropagation();
            e.preventDefault();
            let par = this._wrapper.parentElement;
            d.remove(this._wrapper);
            this._wrapper = null;
            if (par.children.length === 0) {
                par.remove();
            }
        })
    }
}