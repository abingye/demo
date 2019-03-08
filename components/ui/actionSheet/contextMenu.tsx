/// <amd-module name="ContextMenu"/>

import Component = G.Component;
import IComponentPara = G.IComponentPara;
import {IActionSheetButton} from "./actionSheet";
import tools = G.tools;
import d = G.d;

interface point{
    x:number;
    y:number;
}

interface IContextMenu extends IComponentPara {
    buttons: IActionSheetButton[]; // 按钮数组
}

export class ContextMenu extends Component {
    protected wrapperInit(para: G.IComponentPara): HTMLElement {
        return <div className="g-context-menu"/>;
    }

    private buttons: IActionSheetButton[] = [];

    constructor(para: IContextMenu) {
        super(para);
        this.buttons = para.buttons || [];
        this.initContextMenu(para);
        this.initEvents.on();
        this.isShow = false;
    }

    private initContextMenu(para: IContextMenu) {
        if (tools.isNotEmptyArray(para.buttons)) {
            para.buttons.forEach((item, index) => {
                let btnWrapper = <div className="btn-wrapper" data-index={index}>
                    <i className={item.icon || 'appcommon app-morenicon'}/>
                    <div className="btn-content">{item.content || ''}</div>
                </div>;
                d.append(this.wrapper, btnWrapper);
            });
        }
    }

    private _isShow: boolean;
    set isShow(isShow: boolean) {
        this._isShow = isShow;
        this.wrapper.classList.toggle('hide', !this._isShow);
    }

    get isShow() {
        return this._isShow;
    }

    setPosition({x,y}:point) {
        this.wrapper.style.left = x + 'px';
        this.wrapper.style.top = y + 'px';
        this.isShow = true;
    }

    private initEvents = (() => {
        let buttonClick = (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            let index = parseInt(d.closest(e.target, '.btn-wrapper').dataset.index),
                onClick = this.buttons[index].onClick;
            if (onClick && typeof onClick === 'function') {
                onClick();
            }
            this.isShow = false;
        };
        let cancel = () => {
            this.isShow = false;
        };
        return {
            on: () => {
                d.on(this.wrapper, 'click', '.btn-wrapper', buttonClick);
                d.on(document.body, 'click', cancel);
            },
            off: () => {
                d.off(this.wrapper, 'click', '.btn-wrapper', buttonClick);
                d.off(document.body, 'click', cancel);
            }
        }
    })();

    destroy() {
        this.initEvents.off();
        super.destroy();
    }

}