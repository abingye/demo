/// <amd-module name="PermissionTreeItem"/>

import IComponentPara = G.IComponentPara;
import Component = G.Component;
import tools = G.tools;
import d = G.d;
import {CheckBox} from "../../form/checkbox/checkBox";

export interface ITreeNode extends IComponentPara {
    ELEMENTID?: string;
    TEXT?: string;
    PARENTID?: string;
    CHECKED?: string;
    CHILDREN?: ITreeNode[];
}

interface IPermissionTreeItem extends ITreeNode {
    parentNode?: PermissionTreeItem;
    textHeight?: number;
    maxDeep?: number;
}

export class PermissionTreeItem extends Component {
    private textWrapper: HTMLElement;
    private childrenWrapper: HTMLElement;

    protected wrapperInit(para: IPermissionTreeItem): HTMLElement {
        let className = para.PARENTID === 'root' ? 'root-item' : 'normal-item';
        return <div className={"permissionTreeItem " + className}>
            {this.textWrapper = <div className="permissionTreeItem-text-wrapper"/>}
            {this.childrenWrapper = <div className="permissionTreeItem-children-wrapper hide"/>}
        </div>;
    }

    constructor(private para: IPermissionTreeItem) {
        super(para);
        this.textHeight = tools.isNotEmpty(para.textHeight) ? para.textHeight : 50;
        this.parentNode = para.parentNode || null;
        this.createText(para);
        this.createChildren(para);
        if (tools.isNotEmptyArray(para.CHILDREN)) {
            this.wrapper.style.height = this.setHeight(para.CHILDREN) * this.textHeight + 'px';
        } else {
            this.textWrapper.style.height = this.textHeight + 'px';
            this.textWrapper.style.borderRight = '1px solid #e2e2e2';
        }
    }

    setTextWrapperWidth(width: number, isMaxDeep: boolean) {
        if (this.para.PARENTID === 'root') {
            this.textWrapper.style.width = width + 'px';
            if (!isMaxDeep) {
                width = width + 2;
            }
            setTextWrapperWidthChildren(this.children || [], width);
        }

        function setTextWrapperWidthChildren(nodes: PermissionTreeItem[], nodeWidth: number) {
            nodes.forEach(node => {
                let deep = node.para.ELEMENTID.split('.').length;
                if (deep < node.para.maxDeep && tools.isEmpty(node.children)){
                    node.textWrapper.style.width = (nodeWidth + 1) + 'px';
                }else{
                    node.textWrapper.style.width = nodeWidth + 'px';
                }
                if (tools.isNotEmpty(node.children)) {
                    setTextWrapperWidthChildren(node.children, nodeWidth);
                }
            })
        }
    }

    // 文本高度
    private _textHeight: number;
    set textHeight(th: number) {
        this._textHeight = th;
    }

    get textHeight() {
        if (this._textHeight <= 0) {
            this._textHeight = 40;
        }
        return this._textHeight;
    }

    private _parentNode: PermissionTreeItem;
    set parentNode(pn: PermissionTreeItem) {
        this._parentNode = pn;
    }

    get parentNode() {
        return this._parentNode;
    }


    private _isChecked: boolean;
    set isChecked(ic: boolean) {
        this._isChecked = ic;
        this.checkBox.checked = ic;
    }

    get isChecked() {
        return this._isChecked;
    }

    private checkBox: CheckBox = null;

    createText(para: IPermissionTreeItem) {
        this.checkBox = new CheckBox({
            text: para.TEXT || '',
            name: para.TEXT || '',
            value: para.ELEMENTID || '',
            container: this.textWrapper,
            onClick: (isChecked) => {
                if (isChecked) {
                    let parentNode = this.parentNode;
                    while (parentNode) {
                        parentNode.isChecked = true;
                        parentNode = parentNode.parentNode;
                    }
                } else {
                    this.setCheck(this.children);
                }
            }
        });
        this.isChecked = parseInt(para.CHECKED) === 0 ? false : true;
    }

    private setCheck(children: PermissionTreeItem[]) {
        children = children || [];
        children.forEach(child => {
            child.isChecked = false;
            if (tools.isNotEmptyArray(child.children)) {
                this.setCheck(child.children);
            }
        })
    }

    isChanged() {
        return this.checkBox.status !== parseInt(this.para.CHECKED);
    }

    private children: PermissionTreeItem[] = [];

    createChildren(para: IPermissionTreeItem) {
        let children = para.CHILDREN || [];
        if (tools.isNotEmptyArray(children)) {
            this.childrenWrapper.classList.remove('hide');
            children.forEach(child => {
                this.children.push(new PermissionTreeItem(Object.assign({}, child, {
                    container: this.childrenWrapper,
                    parentNode: this,
                    textHeight: this.textHeight,
                    maxDeep:this.para.maxDeep
                })));
            })
        } else {

        }
    }

    setHeight(items: IPermissionTreeItem[]) {
        let number = 0;
        items.forEach(item => {
            if (item.CHILDREN) {
                number += this.setHeight(item.CHILDREN)
            } else {
                number += 1;
            }
        });
        return number || items.length;
    }

    private getNode() {
        return {
            ELEMENTID: this.para.ELEMENTID,
            CHECKED: this.checkBox.status
        }
    }

    get() {
        let changedNodes = [];
        if (this.isChanged()) {
            changedNodes.push(this.getNode());
        }
        getChangedNode(this.children || []);

        function getChangedNode(children: PermissionTreeItem[]) {
            children.forEach(child => {
                if (child.isChanged()) {
                    changedNodes.push(child.getNode());
                }
                if (tools.isNotEmptyArray(child.children)) {
                    getChangedNode(child.children);
                }
            })
        }

        return changedNodes;
    }

    destroy() {
        d.remove(this.textWrapper);
        this.textWrapper = null;
        d.remove(this.childrenWrapper);
        this.childrenWrapper = null;
        this.checkBox.destroy();
        this.checkBox = null;
        this.parentNode = null;
        super.destroy();
    }
}