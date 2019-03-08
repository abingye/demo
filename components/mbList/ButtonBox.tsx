/// <amd-module name="ButtonBox"/>

import Component = G.Component;
import IComponentPara = G.IComponentPara;
import {Button} from "../general/button/Button";
import tools = G.tools;
import {DropDown} from "../ui/dropdown/dropdown";

interface IButtonBoxBtn {
    content: string,
    onClick: () => void;
}

interface IButtonBoxPara extends IComponentPara {
    children: Button[];
    limitCount?: number;
}

export class ButtonBox extends Component {
    protected wrapperInit(para: IButtonBoxPara): HTMLElement {
        return <div className="button-box"/>;
    }

    constructor(para: IButtonBoxPara) {
        super(para);
        this.initButtonBox(para);
    }

    private initButtonBox(para: IButtonBoxPara) {
        let limitNumer = tools.isNotEmpty(para.limitCount) ? para.limitCount : 0,
            buttons = para.children || [];
        if (tools.isEmpty(buttons)) {
            return;
        }
        if (limitNumer === 0) {
            buttons.forEach(btn => {
                new Button({
                    content: btn.content,
                    onClick: btn.onClick,
                    container:this.wrapper
                })
            });
        } else {
            if (buttons.length <= limitNumer){
                buttons.forEach((btn,index) => {
                    new Button({
                        content: btn.content,
                        onClick: btn.onClick || null,
                        container:this.wrapper,
                        className:index === 1 ? 'first-btn' : ''
                    })
                });
            }else{
                let showButtons = buttons.slice(0,limitNumer),
                    hideButtons = buttons.slice(limitNumer);
                showButtons.forEach((btn,index) => {
                    new Button({
                        content: btn.content,
                        onClick: btn.onClick || null,
                        container:this.wrapper,
                        className:index === 1 ? 'first-btn' : ''
                    })
                });
                let moreBtn = new Button({
                    content:'更多',
                    container:this.wrapper,
                    className:'more-button'
                });
                moreBtn.dropDown = new DropDown({
                    el: moreBtn.wrapper,
                    inline: false,
                    data: [],
                    multi: null,
                    className: "input-box-morebtn"
                });
                hideButtons.forEach((btn) => {
                    if (moreBtn.dropDown) {
                        let dropBtn = new Button({
                            content:btn.content,
                            onClick:btn.onClick || null
                        });
                        moreBtn.dropDown.getUlDom().appendChild(dropBtn.wrapper);
                    }
                });
            }
        }
    }
}