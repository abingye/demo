/// <amd-module name="SlidePopover"/>

import d = G.d;
import tools = G.tools;
import Component = G.Component;
import IComponentPara = G.IComponentPara;
import {Button, IButton} from "../../general/button/Button";

interface ISlidePopoverModal extends IComponentPara {
    buttons?: IButton[];
}

export interface ISlidePopoverPara extends IComponentPara {
    buttons?: IButton[];
}

export class SlidePopover extends Component {

    protected wrapperInit() {
        return <div className="slide-popover-wrapper">
            <div className="slide-buttons"/>
            <div className="popover-toggle iconfont icon-arrow-down"/>
        </div>;
    }

    // 所有按钮
    private _buttons: IButton[] = [];
    get buttons() {
        return this._buttons;
    }

    set buttons(buttons: IButton[]) {
        this._buttons = buttons;
        if (tools.isNotEmpty(buttons)) {
            this.createButtons();
            this.modal = new SlidePopoverModal({
                container: this.wrapper,
                buttons: buttons
            });
        }
    }
    modal: SlidePopoverModal;
    constructor(para: ISlidePopoverPara) {
        super(para);
        this.buttons = para.buttons || [];
        this.initEvent.on();
    }

    // 创建按钮组
    private createButtons() {
        let wrapper = d.query('.slide-buttons', this.wrapper);
        this.buttons.forEach((button) => {
            new Button(Object.assign(button, {size: 'large',container:wrapper}));
        });
    }

    // 初始化事件
    private initEvent = (() => {
        let toggleClickHandler = (e) => {
            // 显示模态框
            e.stopPropagation();
            this.modal.isShow = true;
        };
        return {
            on: () => {
                d.on(this.wrapper, 'click', '.popover-toggle', toggleClickHandler);
            },
            off: () => {
                d.off(this.wrapper, 'click', '.popover-toggle', toggleClickHandler);
            }
        }
    })();

    // 销毁
    destroy() {
        this.initEvent.off();
        this.modal.destroy();
        super.destroy();
    }
}

class SlidePopoverModal extends Component {
    private buttonsWrapper: HTMLElement;

    protected wrapperInit(para: ISlidePopoverModal): HTMLElement {
        return <div className="slider-popover-modal-wrapper">
            <div className="slider-title">
                <span>选择按钮</span>
                <div className="slider-popover-modal-toggle iconfont icon-arrow-up"/>
            </div>
            {this.buttonsWrapper = <div className="buttons-wrapper"/>}
        </div>;
    }

    constructor(para: ISlidePopoverModal) {
        super(para);
        this.createButtons(para.buttons || []);
        this.initEvent.on();
    }

    private createButtons(buttons: IButton[]) {
        buttons.forEach(button => {
            this.buttonsWrapper.appendChild(<div className="btn-wrapper">
                <Button {...Object.assign({}, button, {size: 'small'})}/></div>);
        });
    }

    private _isShow: boolean;
    set isShow(isShow: boolean) {
        this._isShow = isShow;
        if (isShow) {
            this.wrapper.style.display = 'block';
            this.wrapper.classList.remove('slider-popover-animation-out');
            this.wrapper.classList.add('slider-popover-animation-in');
        } else {
            this.wrapper.classList.remove('slider-popover-animation-in');
            this.wrapper.classList.add('slider-popover-animation-out');
            setTimeout(()=>{
                this.wrapper.style.display = 'none';
            },300);
        }
    }

    get isShow() {
        return this._isShow;
    }

    private initEvent = (() => {
        let toggleClickHandler = (e) => {
            e.stopPropagation();
            this.isShow = false;
        };
        return {
            on: () => {
                d.on(this.wrapper, 'click', '.slider-popover-modal-toggle', toggleClickHandler);
            },
            off: () => {
                d.off(this.wrapper, 'click', '.slider-popover-modal-toggle', toggleClickHandler);
            }
        }
    })();

    destroy() {
        this.initEvent.off();
        super.destroy();
    }
}