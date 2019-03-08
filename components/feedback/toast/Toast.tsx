/// <amd-module name="Toast"/>
import d = G.d;
import tools = G.tools;
import IComponentPara = G.IComponentPara; import Component = G.Component;

interface IToast extends IComponentPara {
    type?: string;
    content?: string;
    theme?: string;
    position?: string;
    isShow?: boolean;
    duration?: number;
    isClose?: boolean;
}
/**
 * 提醒Toast组件对象
 */
export class Toast extends Component {
    protected wrapperInit(): HTMLElement {
        return <div className="toast"></div>;
    }

    private _duration?: number;  //设置自动关闭延时，默认3s，为0则不自动关闭 |仅允许传参时设置
    private init(toast: IToast) {
        this.type = toast.type;
        this.position = toast.position;
        this.content = toast.content;
        // this.container = toast.container;
        this.isClose = toast.isClose;
        this._duration = tools.isEmpty(toast.duration) ? 3 : toast.duration;
        this.isShow = toast.isShow;
    }

    /**
     * toast右上方是否有关闭按钮
     * 默认：false
     * */
    private _isClose?: boolean;
    set isClose(isClose: boolean) {

        this._isClose = tools.isEmpty(isClose) ? false : isClose;
        let close = d.query('.toast-close', this.wrapper);
        if (!close && this._isClose) {
            close = <i className="toast-close" aria-hidden="true">x</i>;
            d.on(close, 'click', () => {
                this.isShow = false;
            });
            this.wrapper.appendChild(close);
        } else {
            d.remove(close);
            close = null;
        }
    }

    get isClose() {
        return this._isClose;
    }

    /**
     * toast延迟时长
     * 默认：simple | bar
     * */
    private _type?: string;
    set type(type: string) {
        if (this._type && this._type !== type) {
            this.wrapper.classList.remove(`toast-${this._type}`);
        }
        this._type = tools.isEmpty(type) ? 'simple' : type;
        if (this._type === 'simple' || this.type === 'bar') {
            this.wrapper.classList.add(`toast-${this._type}`);
        }
        this._type = type;
    }

    get type() {
        return this._type;
    }

    /**
     * toast内容
     * 默认：成功
     * */
    private _content?: string;
    set content(content: string) {
        this._content = tools.isEmpty(content) ? '成功' : content;
        let span = d.query('span', this.wrapper);
        if (!span) {
            span = <span></span>;
            this.wrapper.appendChild(span);
        }
        span.innerText = this._content;
    }

    get content() {
        return this._content;
    }

    /**
     * 提醒框是否显示
     * 类型：Boolean
     * 默认值：true
     */

    private _isShow: boolean;
    set isShow(isShow: boolean) {
        this._isShow = tools.isEmpty(isShow) ? true : isShow;
        if (this._isShow) {
            this.wrapper.classList.add('toast-in');
            this.wrapper.style.display = 'block';
        } else {
            if (this._onClose) {
                this._onClose();
            }
            this.wrapper.classList.remove('toast-in');
            this.wrapper.classList.add('toast-out');
            setTimeout(()=>{
                if(this.wrapper) {
                    this.wrapper.classList.remove('toast-out');
                    this.wrapper.style.display = 'none';
                }
            },0);
        }
        if (this._duration !== 0) {
            let self = this;
            //默认3秒后销毁
            setTimeout(function () {
                self.destroy();
            }, self._duration * 1000);
        }
    }

    get isShow() {
        return this._isShow;
    }


    /**
     * 销毁组件
     */
    // destroy() {
    //     if (this.wrapper) {
    //         this.isShow = false;
    //         this.remove();
    //         // this.wrapper = null;
    //     }
    // }

    /**
     * toast位置
     * 默认：PC端top，移动端mobile | bottom
     * */
    private _position?: string;
    set position(position: string) {
        if (this._position && this._position !== position) {
            this.wrapper.classList.remove(`toast-${this._position}`)
        }
        this._position = tools.isEmpty(position) ? (tools.isMb ? 'mobile' : 'top') : position;
        this.wrapper.classList.add(`toast-${this._position}`);
        this._type = position;
    }

    get position() {
        return this._position;
    }

    /**
     * 关闭模态框时触发事件
     * 类型：EventListener
     * 默认值：无
     */
    private _onClose ?(): void;

    set onClose(callback) {
        this._onClose = callback;
    }

    get onClose() {
        return this._onClose;
    }

    constructor(para: IToast = {}) {
        // debugger;
        super(Object.assign(para, {isMb: false}));
        this.init(para);
    }

}