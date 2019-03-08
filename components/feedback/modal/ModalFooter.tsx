/// <amd-module name="ModalFooter"/>
import d = G.d;
import tools = G.tools;
import IComponentPara = G.IComponentPara; import Component = G.Component;
import {InputBox} from "../../general/inputBox/InputBox";
import {Button, IButton} from "../../general/button/Button";

export interface IModalFooterPara extends IComponentPara{
    leftPanel ?: InputBox | HTMLElement | IButton[] //存放组件对象集合| 指定dom元素
    rightPanel?: InputBox | HTMLElement | IButton[] //未传参则生成取消|确定两个按钮 ，否则按传入生成
}

/**
 * 模态框尾部
 */
export class ModalFooter extends Component {

    protected wrapperInit(): HTMLElement {
        return <div className="modal-footer"></div>;
    }
    init(modalFooter?: IModalFooterPara) {
        let leftInputBox = this.createPanel(modalFooter && modalFooter.leftPanel),
            rightInputBox = this.createPanel(modalFooter && modalFooter.rightPanel);

        this.leftPanel = leftInputBox? leftInputBox : void 0;
        this.rightPanel =rightInputBox? rightInputBox : void 0;
    }

    private createPanel(panel) : InputBox{
        let newPanel;
        if(Array.isArray(panel)){
            newPanel = new InputBox({});
            panel.forEach((button : IButton) => {
                newPanel.addItem(new Button(button));
            })
        }else {
            newPanel = panel;
        }
        return newPanel;
    }

    /**
     * 左组件集合
     * 传参：传参：无 | InputBox 组件集合 | HTMLElement: dom元素
     */
    private _leftPanel?:  InputBox | HTMLElement ;
    set leftPanel(leftPanel:  InputBox | HTMLElement ) {
        if (tools.isEmpty(leftPanel)) {
            return;
        }
        let leftComsWrapper = d.query('.left-plane', this.wrapper);
        if (!leftComsWrapper) {
            leftComsWrapper = <div className="left-plane" style="display: inline-block;"></div>;
            this.wrapper.appendChild(leftComsWrapper);
            console.log(this.wrapper);

        } else {
            d.remove(leftComsWrapper);
            leftComsWrapper = <div className="left-plane" style="display: inline-block;"></div>;
            this.wrapper.appendChild(leftComsWrapper);
        }
        if (leftPanel instanceof InputBox) {
            leftPanel.container = leftComsWrapper;
            leftPanel.compactWidth = 8;
        } else {
            leftComsWrapper.appendChild(leftPanel);
        }
    }

    get leftPanel() {
        return this._leftPanel;
    }

    /**
     * 右组件集合
     * 传参：无:默认创建取消、确定按钮 | InputBox 组件集合 | HTMLElement: dom元素
     */
    private _rightPanel?:  InputBox | HTMLElement ;
    set rightPanel(rightPanel:  InputBox | HTMLElement ) {
        let rightPanelWrapper = d.query('.right-plane',this.wrapper);
        if (!rightPanelWrapper) {
            rightPanelWrapper = <div className="right-plane" style="display: inline-block;float: right;"></div>;
            this.wrapper.appendChild(rightPanelWrapper);
        } else {
            d.remove(rightPanelWrapper);
            rightPanelWrapper = <div className="right-plane" style="display: inline-block;float: right;"></div>;
            this.wrapper.appendChild(rightPanelWrapper);
        }

        if (tools.isEmpty(rightPanel)) {
            rightPanel = new InputBox({
                compactWidth:8
            });
            let cancelBtn = new Button({content: '取消', type: 'default',key:'cancelBtn'}),
                okBtn = new Button({content: '确认',  type: 'primary',key:'okBtn'});
            rightPanel.addItem(cancelBtn);
            rightPanel.addItem(okBtn);
            rightPanel.container = rightPanelWrapper;
        }
        else if (rightPanel instanceof InputBox) {
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

    constructor(private modalFooter?: IModalFooterPara) {
        super(modalFooter);
        if (tools.isEmpty(modalFooter))
            modalFooter = {};
        this.init(modalFooter);
    }
}