/// <amd-module name="ModalHeader"/>
import d = G.d;
import tools = G.tools;
import IComponentPara = G.IComponentPara; import Component = G.Component;
import {Drag} from "components/ui/drag/drag";
import {InputBox} from "../../general/inputBox/InputBox";

export interface IModalHeaderPara extends IComponentPara{
    // container?: HTMLElement,
    title?: string;
    isDrag?: boolean;
    isClose?: boolean;
    dragEl? : HTMLElement;
    isFullScreen?: boolean;
    rightPanel?: InputBox | HTMLElement; // --
}

/**
 * 模态框头部
 */
export class ModalHeader extends Component {
    protected wrapperInit(): HTMLElement {
        return <div className="modal-header"></div>;
    }

    private drag: Drag; //头部拖拽，控制开关
    private _dragEl : HTMLElement; // 拖拽容器

    init(modalHeader: IModalHeaderPara) {
        // if(this.wrapper){
        //     d.remove(this.wrapper);
        // }
        // this.wrapper = d.create(`<div class="modal-header"></div>`);
        // d.append(modalHeader.container, this.wrapper);
        this.drag = null;
        this._dragEl = modalHeader.dragEl;
        // this.container = modalHeader.container;
        this.title = modalHeader.title;
        this.isDrag = modalHeader.isDrag;
        this.isClose = modalHeader.isClose; //增加...
        this.isFullScreen = modalHeader.isFullScreen;  //增加
        this.rightPanel = modalHeader.rightPanel;
        // this.color = modalHeader.color;



        // this.icon = modalHeader.icon;
    }

    /**
     * 头部标题 ****
     * 类型：string
     * 默认值：提示
     */

    private _title?: string;
    set title(title: string) {
        this._title = tools.isEmpty(title) ? '提示' : tools.str.toEmpty(title);
        let modalTitle = d.query('.modal-title', this.wrapper);
        if (!modalTitle) {
            modalTitle = <h1 className="modal-title"></h1>;
            this.wrapper.appendChild(modalTitle);
        }
        modalTitle.innerHTML = this._title;
    }

    get title() {
        return this._title;
    }

    /**
     * 是否可以拖拽，弹窗框默认在pc上可拖拽|在移动端上不可拖拽，浮出框默认在pc上可拖拉|在移动端上不可拖拉
     * 类型：Boolean
     * 默认值：true
     */
    private _isDrag?: boolean;
    set isDrag(isDrag: boolean) {
        //移动端不支持拖拽和拖拉
        if (tools.isMb) {
            return;
        }
        this._isDrag = tools.isEmpty(isDrag) ? true : isDrag;
        if (this._isDrag) {
            this.drag = new Drag({dom: this._dragEl, container: this._dragEl.parentElement, head: this.wrapper});
        }
        if (this.drag && !this._isDrag) {
            this.drag.pullEventOff();
            this.drag = null;
        }
    }

    get isDrag() {
        return this._isDrag;
    }

    /*
     * 是否可以关闭 ****
     * 类型:Boolean
     * 默认值:true
     * */
    private _modalCloseEl : HTMLElement;
    get modalCloseEl(){
        return this._modalCloseEl;
    }

    private _isClose?: boolean;
    set isClose(isClose: boolean) {
        this._isClose = isClose;
        this._modalCloseEl = d.query('.close', this.wrapper);
        if (!this._modalCloseEl && this._isClose) {
            this._modalCloseEl = <span className="close">×</span>;
            this.wrapper.appendChild(this._modalCloseEl);

        } else {
            d.remove(this._modalCloseEl);
            this._modalCloseEl = null;
        }
    }

    get isClose() {
        return this._isClose;
    }


    /**
     * 头部右边按钮集合 ----
     * 左组件集合
     * 传参：传参：无 | InputBox 组件集合 | HTMLElement: dom元素
     */
    private _rightPanel?: InputBox | HTMLElement;
    set rightPanel(rightPanel: InputBox | HTMLElement) {
        if (tools.isEmpty(rightPanel)) {
            return;
        }
        let rightPanelWrapper = d.query('.header-btn-right', this.wrapper);
        if (!rightPanelWrapper) {
            rightPanelWrapper = <div className="header-btn-right" style="display: inline-block;float: right;"></div>;
            this.wrapper.appendChild(rightPanelWrapper);
        } else {
            d.remove(rightPanelWrapper);
            rightPanelWrapper = <div className="header-btn-right" style="display: inline-block;float: right;"></div>;
            this.wrapper.appendChild(rightPanelWrapper);
        }

        if (rightPanel instanceof InputBox) {
            rightPanel.container = rightPanelWrapper;
            rightPanel.compactWidth = 8;
        } else {
            rightPanelWrapper.appendChild(rightPanel);
        }
        this._rightPanel = rightPanel;
    }

    get rightPanel() {
        return this._rightPanel;
    }


    /*
     * 是否需要全屏显示
     * 类型:Boolean
     * 默认值:false
     * */
    private _isFullScreen?: boolean;
    set isFullScreen(isFullScreen: boolean) {
        // 全屏时关闭拖拽
        if (this.drag && isFullScreen) {
            this.drag.pullEventOff();
            this.drag = null;
        }

        this._isFullScreen = tools.isEmpty(isFullScreen) ? false : isFullScreen;

        let modalEnlarge = d.query('.modal-enlarge', this.wrapper);
        if (!modalEnlarge && this._isFullScreen) {
            let modalEnlarge = <span data-fullscreen="enlarge" className="iconfont icon-maximize modal-enlarge"></span>;
            this.wrapper.appendChild(modalEnlarge);
        } else {
            d.remove(modalEnlarge); 
            modalEnlarge = null;
        }
    }

    get isFullScreen() {
        return this._isFullScreen;
    }

    /**
     * 头部颜色 ----
     * 类型：string
     * 默认值：蓝色背景 + 白色字体
     * 除指定白色时字体显示为黑色外，指定其他颜色字体都为白色
     */
    // private _color?: string;
    // set color(color: string) {
    //     let modalTitle = d.query('.modal-title', this.wrapper),
    //         modalClose = (<HTMLElement> this.wrapper.querySelector('.close')),
    //         modalEnlarge = (<HTMLElement> this.wrapper.querySelector('.modal-enlarge'));
    //
    //     color = tools.isEmpty(color) ? 'white' : color;
    //
    //     if (color === 'white' || color === '#fff' || color === '#ffffff' || color === 'rgb(255, 255, 255)') {
    //         this.wrapper.style.backgroundColor = '#fff';
    //         if (modalClose) {
    //             modalClose.style.color = '#000';
    //         }
    //         if (modalTitle) {
    //             modalTitle.style.color = '#000';
    //         }
    //         if (modalEnlarge) {
    //             modalEnlarge.style.color = '#000';
    //         }
    //     } else {
    //         this.wrapper.style.backgroundColor = color;
    //         modalTitle.style.color = '#fff';
    //         if (modalClose) {
    //             modalClose.style.color = '#fff';
    //             modalClose.style.opacity = '1';
    //         }
    //         if (modalEnlarge) {
    //             modalEnlarge.style.color = '#fff';
    //             modalEnlarge.style.opacity = '1';
    //         }
    //     }
    //     this._color = color;
    // }
    //
    // get color() {
    //     return this._color;
    // }

    /**
     * 标题图标
     * 类型：string
     * 默认值：空
    //  */
    // private _icon?: string;
    // set icon(icon: string) {
    //     this._icon = tools.isEmpty(icon) ? '' : icon;
    // }
    //
    // get icon() {
    //     return this._icon;
    // }

    constructor(private modalHeader?: IModalHeaderPara) {
        super(modalHeader);
        if (tools.isEmpty(modalHeader)) {
            modalHeader = {};
        }
        let defaultPara = {
            title: '',
            color: '',
            isClose: true,
            isDrag: true,
            isFullScreen: false,
        };
        this.init(tools.obj.merge(defaultPara,modalHeader));
    }
}