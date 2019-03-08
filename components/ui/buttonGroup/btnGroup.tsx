/// <amd-module name="BtnGroup"/>
import { DropDown, ListData } from "../dropdown/dropdown";
import Component = G.Component;
import IComponentPara = G.IComponentPara;
import { Button, IButton } from "../../general/button/Button";

interface IBtnGroupPara extends IComponentPara {
    container: HTMLElement;
    buttons: IButton[];
    maxBtn?: number;//允许按钮显示的最大数量
}
export class BtnGroup extends Component {
    private dropDown: DropDown;
    constructor(para: IBtnGroupPara) {
        super(para);
        this._buttons = para.buttons;
        this.maxBtn = para.maxBtn ? para.maxBtn : 999;
    }
    private _buttons: IButton[];
    private _maxBtn: number;
    get maxBtn() {
        return this._maxBtn;
    }
    set maxBtn(maxBtn: number) {
        this.wrapper.innerHTML = '';
        let len = this._buttons.length;
        this._buttons.forEach((btn, i) => {
            if (maxBtn > i) {
                new Button(Object.assign(btn, {
                    container: this.wrapper,
                }))
            }
        });
        if (len > maxBtn) {
            let moreBtn = this._buttons.slice(maxBtn, len);
            let data = moreBtn.map(item => {
                return {
                    text: item.content, click: item.onClick
                }
            });
            let more = new Button(Object.assign({ content: "更多" }, {
                container: this.wrapper,
                onClick: () => {
                    if (!this.dropDown) {
                        this.dropDown = new DropDown({
                            el: more.wrapper,
                            inline: false,
                            onSelect: (item) => {

                                let click = item.click;
                                typeof click === 'function' && click();
                            },
                            data: data,
                            multi: false,
                            className: "more-btn"
                        });
                        this.dropDown.toggle();
                    } else {
                        this.dropDown.toggle()
                    }
                }
            }))
        }
    }
    wrapperInit(para: IBtnGroupPara) {
        return <div className="btn-group-container" />
    }
}