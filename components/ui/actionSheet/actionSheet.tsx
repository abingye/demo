/// <amd-module name="ActionSheet"/>
import tools = G.tools;
import d = G.d;
import {Modal} from "../../feedback/modal/Modal";
import {IButton} from "../../general/button/Button";


export interface IActionSheetButton extends IButton {
    content: string;        // 内容（必须）
    icon?: string;           // 图标
    onClick: () => void; // 点击事件（必须）
}

interface IActionSheet {
    buttons: IActionSheetButton[]; // 按钮数组
    zIndex?: number
}

export class ActionSheet extends Modal {
    private actionSheetWrapper: HTMLElement;
    private buttons: IActionSheetButton[] = [];

    constructor(para: IActionSheet) {
        super({
            width: '100%',
            position: 'down',
            isBackground: true,
            isShow: false,
            zIndex: para.zIndex
        });
        // 要给Modal.wrapper的的top属性设置important才能从下方弹出
        this.buttons = para.buttons;
        tools.isMb && this.wrapper.style.setProperty('top', 'auto', 'important');
        this.createActionSheet(para);
        this.initEvents.on();
    }

    //  创建ActionSheet
    private createActionSheet(para: IActionSheet) {
        this.actionSheetWrapper = tools.isMb ? <div className="action-sheet-wrapper"/> : <div className="action-sheet-wrapper-pc"/>;
        let line = 1;
        if (tools.isNotEmptyArray(para.buttons)) {
            let buttonsWrapper = <div className="action-sheet-buttons"/>;
            d.append(this.actionSheetWrapper, buttonsWrapper);
            if (para.buttons.length > 9) {
                // 如果按钮大于9个 则单行滑动显示
                buttonsWrapper.classList.add('single-line');
            }else{
                line = Math.ceil(para.buttons.length/3);
            }
            // 将各个按钮添加到action-sheet-buttons中
            para.buttons.forEach((item, index) => {
                let btnWrapper = <div className="btn-wrapper" data-index={index}>
                    <i className={item.icon || 'appcommon app-morenicon'}/>
                    <div className="btn-content">{item.content || ''}</div>
                </div>;
                d.append(buttonsWrapper, btnWrapper);
            });
        }
        d.append(this.actionSheetWrapper, <div className="action-sheet-cancel">取消</div>);
        this.bodyWrapper.appendChild(this.actionSheetWrapper);
        tools.isMb && this.wrapper.style.setProperty('height',(line * 95 + 20 + 44) + 'px','important');
    }
    private initEvents = (() => {
        let buttonClick = (e) => {
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
                d.on(this.actionSheetWrapper, 'click', '.btn-wrapper', buttonClick);
                d.on(this.actionSheetWrapper, 'click', '.action-sheet-cancel', cancel);
            },
            off: () => {
                d.off(this.actionSheetWrapper, 'click', '.btn-wrapper', buttonClick);
                d.off(this.actionSheetWrapper, 'click', '.action-sheet-cancel', cancel);
            }
        }
    })();

    destroy() {
        this.actionSheetWrapper = null;
        this.initEvents.off();
        super.destroy();
    }
}