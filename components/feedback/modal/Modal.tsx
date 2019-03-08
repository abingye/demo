/// <amd-module name="Modal"/>
import d = G.d;
import tools = G.tools;
import IComponentPara = G.IComponentPara;
import Component = G.Component;
import {IModalHeaderPara, ModalHeader} from "global/components/feedback/modal/ModalHeader";
import {IModalFooterPara, ModalFooter} from "global/components/feedback/modal/ModalFooter";
import {Button} from "../../general/button/Button";
import {Drag} from "components/ui/drag/drag";
import {InputBox} from "../../general/inputBox/InputBox";

export interface IModal extends IComponentPara {
    header?: IModalHeaderPara | string;
    body?: Node | DocumentFragment;
    footer?: IModalFooterPara;
    height?: string;
    width?: string;
    zIndex?: number;
    isShow?: boolean;
    isBackground?: boolean;
    isAdaptiveCenter?: boolean;     // 自适应居中，当position设置为'center', 'default'时有效，默认false，设置为true时动画失效
    isOnceDestroy?: boolean;    //是否创建完后立即销毁
    isAnimate?: boolean;    //是否加载动画，默认true，仅支持传参，不支持属性修改
    position?: string;
    fullPosition?: string;
    isDrag?: boolean;
    top?: number;
    size?: string;
    className?: string;
    opacity?: number;
    onOk    ?: EventListener;
    onCancel?: EventListener;
    escKey?: boolean;
    isMb?: boolean;
    isModal?: boolean; //移动端是否模态弹出
    isQuery?: boolean; // 是否查询器使用

    onClose  ?(): void;

    closeMsg?: string;

    onLarge ?(): void;

    alert   ?(): void;

    confirm ?(): void;

    toast ?(): void

    destroy ?(): void;

    keyDownHandle? (e): void
}

interface IConfirm {
    msg: any,
    title?: string,
    btns?: string[],
    callback?: (flag: boolean) => void;
    noHide?: boolean // 点击确认不主动关闭模态框
}

let allModalArr: Modal[] = [];

/**
 * 模态框
 */
export class Modal extends Component {
    private _isAnimate: boolean;    //是否加载动画，默认true，仅支持传参，不支持属性修改
    private modalScreen: HTMLElement;   //模态框背景层
    private drag: Drag; //控制拖拉开关
    private _modalHeader: ModalHeader; // 模态框头部
    private _closeMsg: string;
    get closeMsg() {
        return this._closeMsg;
    }

    set closeMsg(closeMsg: string) {
        this._closeMsg = closeMsg;
    }

    get modalHeader() {
        return this._modalHeader
    }

    private _modalFooter: ModalFooter; // 模态框脚部
    get modalFooter() {
        return this._modalFooter
    }

    static get count() {
        return allModalArr.length;
    }

    protected wrapperInit(para: IModal): HTMLElement {
        let isMb = tools.isUndefined(para.isMb) ? tools.isMb : !!para.isMb,
            defaultClass = typeof para.className === 'string' ? para.className : 'modal-default',
            className = `modal-wrapper ${defaultClass} ${isMb ? ' modal-mobile' : ''}`;

        return <div tabIndex={parseInt(tools.getGuid(''))} className={className}></div>;
    }

    private _isEsc: boolean;
    private escKeyDown = (e: KeyboardEvent) => {
        e.stopPropagation();
        let keyCode = e.keyCode || e.which || e.charCode;

        if (keyCode === 27) {
            this.modalHidden();
        }
    };

    set escKey(isEsc: boolean) {
        if (tools.isMb) {
            return;
        }
        if (isEsc && !this._isEsc) {
            d.on(this.wrapper, 'keydown', this.escKeyDown)
        } else if (!isEsc && this._isEsc) {
            d.off(this.wrapper, 'keydown', this.escKeyDown)
        }
        this._isEsc = isEsc;
    }

    get escKey() {
        return this._isEsc;
    }

    init(modal: IModal) {
        // this.container = modal.container;
        this.container.classList.add('modal-box');
        // this._wrapper = d.create(`<div class="modal-wrapper"></div>`);
        if (modal.isQuery !== true) {
            this.isModal = modal.isModal;
        }
        this.closeMsg = modal.closeMsg;
        this._isAdaptiveCenter = tools.isEmpty(modal.isAdaptiveCenter) ? false : modal.isAdaptiveCenter;
        this._isAnimate = this.isAdaptiveCenter ? false : (tools.isEmpty(modal.isAnimate) ? true : modal.isAnimate);
        // this.className = modal.className;
        // this.container.appendChild(this._wrapper);
        this.header = modal.header;
        this.body = modal.body;
        this.footer = modal.footer;
        this.width = modal.width;
        this._isOnceDestroy = modal.isOnceDestroy;
        this.isBackground = modal.isBackground;
        this.position = modal.position;
        this.fullPosition = modal.fullPosition;
        this.isShow = modal.isShow;
        if (modal.isQuery === true) {
            this.isModal = modal.isModal;
        }
        this.height = modal.height;
        this.isDrag = modal.isDrag;
        this.size = modal.size;
        this.opacity = modal.opacity;
        this.onOk = modal.onOk;
        this.onCancel = modal.onCancel;
        this.onClose = modal.onClose;
        this.onLarge = modal.onLarge;
        this.top = modal.top;
        this.zIndex = modal.zIndex || 1001;
        if (modal.keyDownHandle) {
            d.on(this.wrapper, 'keydown', modal.keyDownHandle)
        }
        this.escKey = tools.isEmpty(modal.escKey) ? true : modal.escKey;

        allModalArr.push(this);

    }

    protected _isModal: boolean = false;
    set isModal(isModal: boolean) {
        this._isModal = isModal;
    }

    get isModal() {
        return this._isModal;
    }

    protected _zIndex: number = 1001;
    set zIndex(zIndex: number) {
        if (typeof zIndex === 'number') {
            this._zIndex = zIndex;
            this.wrapper && (this.wrapper.style.zIndex = zIndex + '');
            this.modalScreen && (this.modalScreen.style.zIndex = zIndex - 1 + '');
        }
    }

    get zIndex() {
        return this._zIndex;
    }

    private _headWrapper: HTMLElement = null;
    get headWrapper() {
        if (this._headWrapper === null) {
            this._headWrapper = this._headWrapper ? this._headWrapper : <div className='head-wrapper'></div>;
            this.wrapper.appendChild(this._headWrapper);
        }
        return this._headWrapper;
    }

    /**
     * 模态框头部
     * 类型：ModalHeader
     */
    private _header: IModalHeaderPara | string;
    private set header(header: IModalHeaderPara | string) {
        // 头部容器
        // if(this._headWrapper){
        //     this._headWrapper.remove();
        //     this._headWrapper = null;
        // }
        if (!header) {
            return;
        }

        this._modalHeader = new ModalHeader(Object.assign({
            container: this.headWrapper,
            dragEl: this.wrapper,
            isClose: true,
        }, typeof header === 'string' ? {title: header} : header));

        // 为头部关闭按钮绑定事件
        let close = this._modalHeader.modalCloseEl;
        close && d.on(close, 'click', () => {
            this.modalHidden();
        });
        this._header = header;
    }

    modalHidden() {
        if (this.closeMsg) {
            Modal.confirm({
                msg: this.closeMsg,
                callback: (flag) => {
                    flag && (this.isShow = false);
                }
            })
        } else {
            this.isShow = false;
        }
    }

    // private get header() {
    //     return this._header;
    // }

    private _bodyWrapper: HTMLElement = null;
    get bodyWrapper() {
        if (!this._bodyWrapper) {
            this._bodyWrapper = <div className={`modal-body${tools.isMb ? ' modal-body-mobile' : ''}`}/>;
            tools.isNotEmpty(this.headWrapper) ? d.after(this.headWrapper, this._bodyWrapper) : d.prepend(this.wrapper, this._bodyWrapper);
        }
        return this._bodyWrapper;
    }

    /**
     * 模态框中间内容
     * 类型：HTMLElement
     * 默认值：
     */
    private _body: Node;
    set body(body: Node) {
        if (!body) {
            return;
        }
        //生成身体元素，仅一次
        let bodyWrapper = this.bodyWrapper;
        //删除掉原来挂载的身体
        if (this._body) {
            bodyWrapper.removeChild(this._body);
            this._body = null;
        }
        d.append(bodyWrapper, body);
        this._body = body;
    }

    get body() {
        return this._body;
    }

    private _footWrapper: HTMLElement;

    /**
     * 模态框尾部
     * 类型：ModalFooter
     */
    private _footer: IModalFooterPara;
    set footer(footer: IModalFooterPara) {
        if (footer === undefined) {
            return;
        }
        //生成尾部元素，仅一次
        if (!this._footWrapper) {
            this._footWrapper = <div className="foot-wrapper"></div>;
            this.wrapper.appendChild(this._footWrapper);
        }
        //删除掉原来挂载的尾部
        if (this._footer) {
            d.remove(this._footWrapper);
        }
        // if (footer === undefined) {
        this._modalFooter = new ModalFooter(footer);
        // }
        this._footer = footer;
        //挂载新的尾部
        this._footWrapper.appendChild(this._modalFooter.wrapper);
    }

    get footer() {
        return this._footer;
    }

    /**
     * 模态框高度
     * 类型：string
     * 默认值：auto
     */
    // private _height?: string;
    set height(height: string) {
        // this._height = tools.isEmpty(height) ? '' : height;
        this.wrapper.style.height = height;
        let otherHeight = this.headWrapper ? this.headWrapper.offsetHeight : 0;
        otherHeight = otherHeight + (this._footWrapper ? this._footWrapper.offsetHeight : 0);
        this.bodyWrapper.style.height = `calc(100% - ${otherHeight}px)`;
    }

    get height() {
        return this.wrapper.style.height;
    }

    /**
     * 模态框宽度
     * 类型：string
     * 默认值：auto
     */
    // private _width?: string;
    set width(width: string) {
        // this._width = tools.isEmpty(width) ? '' : width;
        this.wrapper.style.width = width;
        //设置模态框最大高度，超出部分滚动条...
        // this.wrapper.classList.add('width-out-scroll');
    }

    get width() {
        return this.wrapper.style.width;
    }

    /**
     * 模态框位置(相对于body)
     * position为:up,right,down,left时为模态框绑定拖拉事件，并取消模态框头部的拖拽事件
     * 类型：string
     * 默认值：default：左右居中，距离顶部40px
     * center：左右上下居中
     * left：上下铺满，左边占160px
     * right：上下铺满，右边占160px
     * up：左右铺满，置顶占120高度
     * down：左右铺满，底部占120高度
     * full：上下左右铺满
     * isShow,isDrag 属性依赖于position，当position属性更改后，默认改变isShow,isDrag的状态。
     */
    private _position?: string;
    set position(position: string) {
        //移动端默认为center,PC端默认为default
        this._position = tools.isEmpty(position) ? 'default' : position;
        let elWidth,
            elHeight,
            paWidth = parseInt(getComputedStyle(document.body)['width']),
            paHeight = parseInt(getComputedStyle(document.body)['height']),
            wrapper = this.wrapper,
            computedStyle = getComputedStyle(wrapper);

        //避免模态框显示为display:none时无法获取元素宽高
        if (computedStyle.display === 'none' && (this._position === 'center' || this._position === 'default')) {
            wrapper.style.display = 'block';
            elWidth = parseInt(computedStyle.width);
            elHeight = parseInt(computedStyle.height);
            wrapper.style.display = 'none';
        } else {
            elWidth = parseInt(computedStyle.width);
            elHeight = parseInt(computedStyle.height);
        }
        //让移动端父元素高度为当前移动端屏幕高度（居中时）
        if (tools.isMb && this._position === 'center') {
            paWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || screen.height;
            paHeight = window.innerHeight | document.documentElement.clientHeight || document.body.clientHeight || screen.height;
        }
        // debugger;
        let isAdaptiveCenter = this.isAdaptiveCenter;
        switch (this._position) {
            //左右居中，距离顶部40px;
            case 'default' :
                if (isAdaptiveCenter) {
                    wrapper.style.left = '50%';
                    wrapper.style.transform = 'translateX(-50%)';
                    wrapper.style.webkitTransform = 'translateX(-50%)';
                } else {
                    wrapper.style.left = (paWidth - elWidth) / 2 + 'px';
                }
                // wrapper.style.marginLeft = '-' + (elWidth / 2) + 'px';
                wrapper.style.top = `${tools.isMb ? 0 : 40}px`;
                // wrapper.style.minWidth = elWidth + 'px';
                break;
            //左右上下居中
            case 'center':
                if (isAdaptiveCenter) {
                    wrapper.style.left = '50%';
                    wrapper.style.top = '50%';
                    wrapper.style.transform = 'translateX(-50%) translateY(-50%)';
                    wrapper.style.webkitTransform = 'translateX(-50%) translateY(-50%)';
                } else {
                    wrapper.style.left = (paWidth - elWidth) / 2 + 'px';
                    wrapper.style.top = (paHeight - elHeight) / 2 + 'px';
                }
                // wrapper.style.marginLeft = '-' + (elWidth / 2) + 'px';
                // wrapper.style.minWidth = elWidth + 'px';
                break;
            //上下铺满,左边占最多160px
            case 'left':
                wrapper.style.left = '0';
                wrapper.style.top = '0';
                wrapper.style.bottom = '0';
                wrapper.style.right = 'auto';
                wrapper.style.borderRadius = '0';
                wrapper.style.minWidth = 160 + 'px';
                if (!this.isDrag && !tools.isMb) {
                    this.isDrag = true;
                }
                break;
            //上下铺满,右边占最多160px
            case 'right':
                wrapper.style.right = '0';
                wrapper.style.top = '0';
                wrapper.style.bottom = '0';
                wrapper.style.left = 'auto';
                wrapper.style.borderRadius = '0';
                wrapper.style.minWidth = 160 + 'px';
                if (!this.isDrag && !tools.isMb) {
                    this.isDrag = true;
                }
                break;
            //左右铺满，置顶占最大140px
            case 'up':
                wrapper.style.right = '0';
                wrapper.style.left = '0';
                wrapper.style.top = '0';
                wrapper.style.bottom = 'auto';
                wrapper.style.borderRadius = '0';
                if (!this.isDrag && !tools.isMb) {
                    this.isDrag = true;
                }
                break;
            //左右铺满，底部占最大140px
            case 'down':
                wrapper.style.right = '0';
                wrapper.style.left = '0';
                wrapper.style.bottom = '0';
                wrapper.style.top = 'auto';
                wrapper.style.borderRadius = '0';
                if (!this.isDrag && !tools.isMb) {
                    this.isDrag = true;
                }
                break;
            //上下左右铺满
            case 'full':
                wrapper.style.right = '0';
                wrapper.style.left = '0';
                wrapper.style.bottom = '0';
                wrapper.style.top = '0';
                wrapper.style.borderRadius = '0';
                break;
        }
        //模态框的出现方式依赖于position，因而position改变必须置于isShow之前\
        if (!this.isShow) {
            this.isShow = true;
        }

    }

    get position() {
        return this._position;
    }

    private _isAdaptiveCenter: boolean;
    get isAdaptiveCenter() {
        return this._isAdaptiveCenter
    }

    /**
     * 模态框是否显示
     * 类型：Boolean
     * 默认值：true
     */
    private _isOnceDestroy?: boolean;    //是否立即销毁
    private _isShow: boolean;
    set isShow(isShow: boolean) {
        this._isShow = tools.isEmpty(isShow) ? true : isShow;
        if (this._isShow) {
            this.wrapper.focus();

            this.wrapper.style.display = 'block';
            //在模态框动画加载出来前，禁用模态框的鼠标事件
            this.wrapper.style.pointerEvents = 'none';
            if (this.modalScreen) {
                this.modalScreen.style.pointerEvents = 'none';
            }
            setTimeout(() => {
                if (this.wrapper) {
                    this.wrapper.style.pointerEvents = 'auto';
                }
                if (this.modalScreen) {
                    this.modalScreen.style.pointerEvents = 'auto';
                }
                if (tools.isMb && this.isModal) {
                    this.wrapper.classList.remove('modal-animate-up-mb');
                }
            }, 300);
            if (this._isAnimate) {
                if (tools.isMb && this.isModal) {
                    d.classAdd(this.wrapper, `modal-animate-up-mb`);
                } else {
                    d.classAdd(this.wrapper, `modal-animate-${this._position || 'default'} animate-in`);
                }
                // this.wrapper.classList.add('modal-animate-full');
                // switch (this._position) {
                //     //设置浮动框出现动画
                //     case 'full' :
                //         this.wrapper.classList.add('modal-animate-full');
                //         break;
                //     case 'up':
                //         this.wrapper.classList.add('modal-animate-up');
                //         break;
                //     case 'right':
                //         this.wrapper.classList.add('modal-animate-right');
                //         break;
                //     case 'down':
                //         this.wrapper.classList.add('modal-animate-down');
                //         break;
                //     case 'left':
                //         this.wrapper.classList.add('modal-animate-left');
                //         break;
                //     case 'center':
                //         this.wrapper.classList.add('modal-animate-center');
                //         break;
                //     default:
                //         this.wrapper.classList.add('modal-animate-default');
                //         break;
                // }
                // this.wrapper.classList.add('animate-in');
            }


            //设置遮罩层出现动画
            if (this._isBackground) {
                this.modalScreen.style.display = 'block';
                this._container.classList.add('overflow-hidden');
                this.modalScreen.classList.add('lock-screen');
                this.modalScreen.classList.remove('lock-active-out');
                this.modalScreen.classList.add('lock-active-in');
            }
        } else {
            this.wrapper && this.wrapper.blur();

            if (this._onClose) {
                this._onClose();
            }
            if (this.wrapper) {
                if (this._isAnimate) {
                    if (tools.isMb && this.isModal) {
                        this.wrapper.classList.add('modal-animate-down-mb');
                    } else {
                        this.wrapper.classList.remove('animate-in');
                    }
                }
                if (tools.isMb && this.isModal) {
                    setTimeout(() => {
                        this.wrapper.classList.remove('modal-animate-down-mb');
                        this.wrapper.style.display = 'none';
                        this.wrapper.style['display'] = 'none';
                    }, 300);
                } else {
                    this.wrapper.style.display = 'none';
                    this.wrapper.style['display'] = 'none';
                }
            }
            //若_isOnceDestroy为真，即创建后立即销毁，则直接调用destroy()后返回；
            if (this._isOnceDestroy) {
                if (tools.isMb && this.isModal) {
                    setTimeout(() => {
                        this.destroy();
                        return;
                    }, 300)
                } else {
                    this.destroy();
                    return;
                }
            }
            if (this._isBackground) {
                this.modalScreen && (
                    this.modalScreen.classList.remove('lock-active-in'),
                        this.modalScreen.classList.add('lock-active-out'),
                        //     d.once(this.modalScreen, 'animationend', () => {
                        //         this.modalScreen.style.display = 'none';
                        //         this.modalScreen.classList.remove('lock-screen');

                        this.modalScreen.style.display = 'none',
                        this.modalScreen.classList.remove('lock-screen')
                );

                this._container && this._container.classList.remove('overflow-hidden');
            }
        }
    }

    get isShow() {
        return this._isShow;
    }

    /*
     * 模态框是否加载缩放
     * */
    private _isDrag: boolean;
    set isDrag(isDrag) {
        let elWidth = parseInt(getComputedStyle(this.wrapper)['width']),
            elHeight = parseInt(getComputedStyle(this.wrapper)['height']),
            minWidth = isNaN(elWidth) || elWidth > 160 ? 160 : elWidth,
            minHeight = isNaN(elHeight) || elHeight > 140 ? 140 : elHeight;
        //默认false
        this._isDrag = tools.isEmpty(isDrag) ? false : isDrag;
        if (this._isDrag) {
            //关闭头部拖拽
            this._modalHeader && (this._modalHeader.isDrag = false);
            let pos = '';
            switch (this._position) {
                case 'left':
                    pos = 'right';
                    // this.wrapper.style.position = 'absolute';
                    // this.container.style.position = 'relative';
                    break;
                case 'right':
                    pos = 'left';
                    // this.wrapper.style.position = 'absolute';
                    // this.container.style.position = 'relative';
                    break;
                case 'up':
                    pos = 'bottom';
                    // this.wrapper.style.position = 'absolute';
                    // this.container.style.position = 'relative';
                    break;
                case 'down':
                    pos = 'top';
            }
            this.wrapper.style.position = 'absolute';
            this.container.style.position = 'relative';
            this.drag = new Drag({
                dom: this.wrapper,
                head: this.wrapper,
                scale: {
                    position: pos,
                    minWidth: minWidth,
                    minHeight: minHeight
                },
                container: this.container
            });
        } else if (this.drag) {
            this.drag.scaleEventOff();
            this.drag = null;
        }
    }

    get isDrag() {
        return this._isDrag;
    }

    /**
     * 模态框是否加载状态
     * 类型：Boolean
     * 默认值：false
     */
    // private _isLoading: boolean;
    // set isLoading(isLoading: boolean) {
    //     this._isLoading = isLoading;
    // }
    //
    // get isLoading() {
    //     return this._isLoading;
    // }

    /**
     * 模态框是否有遮罩层
     * 类型：Boolean
     * 默认值：true
     */
    private _isBackground: boolean;
    set isBackground(isBackground: boolean) {
        this._isBackground = tools.isEmpty(isBackground) ? true : isBackground;
        //初始化遮罩层
        if (!this.modalScreen && this._isBackground) {
            this.modalScreen = <div className="modal-screen lock-screen"></div>;
            this._container.appendChild(this.modalScreen);
        } else {
            d.remove(this.modalScreen);
            this.modalScreen = null;
        }
        //为遮罩层设置点击后的关闭事件，如果没有遮罩层，则不关闭
        if (this._isBackground) {
            d.on(this.modalScreen, 'click', () => {
                this.modalHidden();
            });
        }
    }

    get isBackground() {
        return this._isBackground;
    }


    /**
     * 模态框距离顶部的高度
     * 类型：number
     * 默认值：unset
     */
    private _top?: number;
    set top(top: number) {
        if (tools.isEmpty(top)) {
            return;
        }
        this.wrapper.style.top = top + 'px';
        this._top = top;
    }

    get top() {
        return this._top;
    }

    /**
     * 模态框大小
     * 类型：string
     * 默认值：default|small|large
     */
    private _size?: string;
    set size(size: string) {
        this._size = tools.isEmpty(size) ? '' : size;
    }

    get size() {
        return this._size;
    }

    /**
     * 透明度
     * 类型：number
     * 默认值：100
     */
    private _opacity?: number;
    set opacity(opacity: number) {
        this._opacity = tools.isEmpty(opacity) ? 100 : opacity;
        this.wrapper.style.opacity = this._opacity / 100 + '';
    }

    get opacity() {
        return this._opacity;
    }


    /**
     * 确认按钮绑定点击事件
     * 类型：EventListener
     * 默认值：点击关闭，注意：当该按钮被用户指定为'undefined'时不绑定点击事件
     */
    private _onOk: EventListener;
    set onOk(callback: EventListener) {
        if (!this._modalFooter || !this._modalFooter.rightPanel || !(this._modalFooter.rightPanel instanceof InputBox) || !(this._modalFooter.rightPanel as InputBox).getItem('okBtn')) {
            return;
        }
        if (callback) {
            let okBtn = (this._modalFooter.rightPanel as InputBox).getItem('okBtn') as Button;
            okBtn.onClick = callback;
        }
        // else if (this._modalFooter.rightBtns.okBtn.onClick) {
        //     return;
        // } else {
        //     this._modalFooter.rightBtns.okBtn.onClick = () => {
        //         this.isShow = false;
        //     };
        // }
        this._onOk = callback;
    }

    get onOk() {
        return this._onOk;
    }

    /**
     * 取消按钮绑定点击事件
     * 类型：EventListener
     * 默认值：点击关闭，注意：当该按钮被用户指定为'undefined'时不绑定点击事件
     */
    private _onCancel: EventListener;
    set onCancel(callback: EventListener) {
        if (!this._modalFooter || !this._modalFooter.rightPanel || !(this._modalFooter.rightPanel instanceof InputBox) || !this._modalFooter.rightPanel.getItem('cancelBtn')) {
            return;
        }
        let cancelBtn = this._modalFooter.rightPanel.getItem('cancelBtn') as Button;
        if (callback) {
            cancelBtn.onClick = callback;
        } else {
            cancelBtn.onClick = () => {
                this.modalHidden()
            };
        }
        this._onCancel = callback;
    }

    get onCancel() {
        return this._onCancel;
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

    /**
     * 放大模态框时触发事件
     */
    private _onLarge ?(): void;

    fullPosition: string;

    set onLarge(callback) {
        let modalEnlarge = d.query(`.modal-enlarge`, this.wrapper);
        if (modalEnlarge) {
            d.on(modalEnlarge, 'click', () => {
                let className = 'full-screen';
                if (this.fullPosition) {
                    className = 'full-screen-fixed';
                }
                d.classToggle(this.wrapper, className);

                if (callback) {
                    callback();
                }
            });
        }
        this._onLarge = callback;
    }

    get onLarge() {
        return this._onLarge;
    }

    /**
     *静态方式创建alert框，使用后立即销毁
     */
    static alert(msg: any = '', title?: string, onClick?: Function): Modal {
        //将msg转为json字符串
        if (msg instanceof Object || Array.isArray(msg)) {
            msg = JSON.stringify(msg);
            //去掉json字符串头尾的引号
            if (msg[0] && msg[0] === '"' && msg[msg.length - 1] && msg[msg.length - 1] === '"') {
                msg = msg.slice(1, msg.length - 1);
            }
        }
        // msg = tools.isEmpty(msg) ? '空' : msg;

        let inputBox = new InputBox({}),
            okBtn = new Button({content: '确定', type: 'default', key: 'okBtn'});

        if (onClick) {
            okBtn.onClick = () => onClick();
        }

        inputBox.addItem(okBtn);
        let m = new Modal({
            isOnceDestroy: true,
            header: !title ? '提示' : tools.str.htmlEncode(title),
            width: '270px',
            position: 'center',
            className: 'modal-prompt',
            body: document.createTextNode(msg),
            isMb: false,
            footer: {
                rightPanel: inputBox
            }
        });
        m.modalScreen.style.zIndex = '1001';
        m.onOk = () => {
            m.isShow = false;
            onClick && onClick();
        };
        return m;
    }

    /**
     *静态方式创建confirm框，使用后立即销毁
     */
    static confirm(confirm: IConfirm) {
        let leftContent, rightContent, msg;
        if (!confirm || !confirm.msg || tools.isEmpty(confirm.msg)) {
            msg = '成功';
        } else {
            //将msg转为json字符串
            if (confirm.msg instanceof Object || Array.isArray(confirm.msg)) {
                msg = JSON.stringify(confirm.msg);
                //去掉json字符串头尾的引号
                if (msg[0] && msg[0] === '"' && msg[msg.length - 1] && msg[msg.length - 1] === '"') {
                    msg = msg.slice(1, msg.length - 1);
                }
            } else {
                msg = confirm.msg;
            }
        }
        if (!confirm || !confirm.btns) {
            leftContent = '取消';
            rightContent = '确定';
        } else {
            leftContent = tools.isEmpty(confirm.btns[0]) ? '取消' : confirm.btns[0];
            rightContent = tools.isEmpty(confirm.btns[1]) ? '确定' : confirm.btns[1];
        }
        let inputBox = new InputBox();
        inputBox.addItem(new Button({
            content: leftContent,
            onClick: (index) => {
                if (confirm && confirm.callback && typeof  confirm.callback === 'function') {
                    confirm.callback(false);
                }
                m.isShow = false;
            }
        }));
        inputBox.addItem(new Button({
            content: rightContent,
            onClick: (index) => {
                if (confirm && confirm.callback && typeof  confirm.callback === 'function') {
                    confirm.callback(true);
                }
                if (!(confirm && confirm.noHide)) {
                    m.isShow = false
                }
            }
        }));

        let m = new Modal({
            isOnceDestroy: true,
            isMb: false,
            width: '270px',
            position: 'center',
            header: (!confirm || !confirm.title) ? '提示' : tools.str.htmlEncode(confirm.title),
            className: 'modal-prompt',
            body: document.createTextNode(msg),
            footer: {
                rightPanel: inputBox
            },
        });
        m.modalScreen.style.zIndex = '1001';
        return m;
    }

    //记录上次创建的toast，在下一次构造新toast销毁之...(解决toast延迟销毁3s，下一次构造时未能及时销毁的问题)
    // private static toastModal :Modal;
    /*
     *静态方式创建toast框，使用后立即销毁
     * */
    static toast(msg: any) {
        //将msg转为json字符串
        if (msg instanceof Object || Array.isArray(msg)) {
            msg = JSON.stringify(msg);
            //去掉json字符串头尾的引号
            if (msg[0] && msg[0] === '"' && msg[msg.length - 1] && msg[msg.length - 1] === '"') {
                msg = msg.slice(1, msg.length - 1);
            }
        }
        msg = tools.isEmpty(msg) ? '成功' : msg;
        // if(Modal.toastModal) {
        //     Modal.toastModal.destroy();
        // }

        let m = new Modal({
            isMb: false,
            isBackground: false,
            body: <div style="padding: 4px 15px;">{msg}</div>,
            className: 'modal-toast'
        });
        // Modal.toastModal = m;
        //非移动端的toast从顶部往下掉落，移动端的toast出现于底部且有最大高度
        if (tools.isMb) {
            d.classAdd(m.wrapper, 'toast-mobile');
        } else {
            d.classRemove(m.wrapper, 'modal-animate-default');
            d.classAdd(m.wrapper, 'from-top');
        }
        // 3秒后销毁
        setTimeout(function () {
            m.destroy();
        }, 3000);
    }

    /**
     * 销毁组件
     */
    destroy(cb?) {
        // if (this._isAnimate) {
        //     this.wrapper.classList.remove('animate-in');
        // }
        this._container && this._container.classList.remove('overflow-hidden');
        if (this._isBackground && this.modalScreen) {
            this.modalScreen.classList.remove('lock-active-in');
            this.modalScreen.classList.add('lock-active-out');
            d.once(this.modalScreen, 'animationend', () => {
                this.modalScreen.classList.remove('lock-screen');
            });
            d.remove(this.modalScreen);
            this.modalScreen = null;
        }
        // this.remove();

        if (typeof cb === 'function') {
            cb();
        }
        super.destroy();

        allModalArr = allModalArr.filter(km => km !== this);
        let last = allModalArr[allModalArr.length - 1];
        last && last.wrapper.focus();
    }

    // protected _className: string;
    // set className(className: string) {
    //     this._className = tools.isEmpty(className) ? 'modal-default' : className;
    //     this.wrapper.classList.add(this._className);
    //     //如果为移动端模态框（即包含类modal-mobile，在body包含ios-top的情况下添加样式ios-top-header）
    //     if (this.wrapper.classList.contains('modal-mobile') && document.body.classList.contains('ios-top')) {
    //         this.wrapper.classList.add('ios-top-header');
    //     }
    // }
    //
    // get className() {
    //     return this._className;
    // }

    constructor(para: IModal = {}) {
        super(para);
        this.init(para);
    }
}