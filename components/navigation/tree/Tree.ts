/// <amd-module name="Tree"/>
import d = G.d;
import tools = G.tools;
import {ElementTreeNode, IElementTreeAjax, IElementTreeNodePara} from "../elementTreeBase/ElementTreeNode";
import {CheckBox} from "../../form/checkbox/checkBox";
import {IMenuPara} from "../menu/Menu";
export interface ITreePara extends IElementTreeNodePara{
    isShowCheckBox? : boolean; //是否有checkBox  // 继承
    checked?: boolean; // 继承
    disableCheckBox?: boolean;
    dblclickOpen?: boolean;

    toggleSelect?:boolean; // 选中时是否切换

    // theme? : string;//主题
    children?: ITreePara[],
    ajax?:  IElementTreeAjax<Tree, ITreePara>; // 继承
}
/**
 * 树形组件对象
 */
export class Tree extends ElementTreeNode{
    protected toggleSelect; // 选中时是否切换
    constructor(para: ITreePara) {
        super(para);
    }

    protected init(para: ITreePara){
        super.init(para);

        this.textWrapper.style.paddingLeft = ((this.deep - (this.root.isVirtual ? 1 : 0)) * 20) + 'px';

        // this.theme = para.theme;
        this.isShowCheckBox = para.isShowCheckBox === void 0 ? this.inherit('_isShowCheckBox') : para.isShowCheckBox;
        this.checked = para.checked === void 0 ? this.inherit('checked') : para.checked;

        this.toggleSelect = para.toggleSelect === void 0 ? this.inherit('toggleSelect') : para.toggleSelect;

        // 为当前树节点添加单击事件
        d.on(this.textWrapper, 'mousedown', (e) => {
            e.stopPropagation();
            this.selected = this.toggleSelect ? !this.selected : true;
        });

        // 为当前树节点添加双击事件
        d.on(this.textWrapper, para.dblclickOpen === false ? 'mousedown' : 'dblclick', (e) => {
            e.stopPropagation();
            if (!this.isLeaf) {
                this.expand = !this.expand;
            }

            if (this.isLeaf || this.expand) {
                this.onOpen && this.onOpen(this);
            }
        });

        if(para.dblclickOpen !== false){
            d.on(this.textWrapper, 'mousedown', '.tree-open-icon',  (e) => {
                // debugger;
                e.stopPropagation();
                this.expand = !this.expand;
                if(this.expand) {
                    this.onOpen && this.onOpen(this);
                }
                // return false;
            });
        }

        if(para.container) {
            this.container = para.container;
            (para.width) && (this.wrapper.style.width = `${para.width}px`);
        }
    }

    protected _isShowCheckBox: boolean;
    protected _checkBox: CheckBox;
    set isShowCheckBox(isShow: boolean) {
        // debugger;
        if(isShow === this._isShowCheckBox){
            return;
        }

        if(isShow){
            if(!this._checkBox) {
                let container = document.createElement('span');
                container.classList.add('tree-check-box');
                d.after(this.expandIconEl, container);

                this._checkBox = new CheckBox({
                    container: container,
                    status: this._checkBoxStatus,
                    disabled: this._disableCheckBox,
                    size: 16,
                    onSet: (isChecked) => {
                        // debugger;
                        this.checked = isChecked;
                    }
                });
            }
        }

        this._checkBox && this._checkBox.wrapper.classList.toggle('hide', !isShow);
        this._isShowCheckBox = isShow;
    }
    get isShowCheckBox(){
        return this._isShowCheckBox
    }

    // 是否选择
    // private _checked:boolean = false;
    private _checkBoxStatus: number; // 0未选中 1选中 2半选中
    /**
     * 改变checkBox的状态
     * @param {number} status - 0未选中 1选中 2半选中
     * @param {string} relateType - 'parent' | 'children' 向上关联还是向下关联
     */
    private checkBoxStatus(status:number, relateType:string) {
        if(this._checkBox && this._checkBox.status !== status){
            this._checkBox.status = status;
        }
        this._checkBoxStatus = status;

        // 改变是否选中需同时改变子节点
        if (relateType === 'children' && (status === 0 || status === 1)) {
            this.children && this.children.forEach((tree: this) => {
                tree.checkBoxStatus(status, 'children')
            })
        } else if (relateType === 'parent') {
            // debugger;
            let parent = this.parent,
                sibs = parent ? parent.children : null,
                sibsLen = Array.isArray(sibs) ? sibs.length : 0;

            if (sibsLen) {
                let checkedLen = 0,
                    indeterminateLen = 0;

                // debugger;
                sibs.forEach((tree: this) => {
                    if(tree._checkBoxStatus === 1){
                        checkedLen ++;
                    }else if(tree._checkBoxStatus === 2){
                        indeterminateLen ++;
                    }
                });

                // let status = indeterminateLen > 0 ? 2 : (checkedLen === sibsLen ? 1 : checkedLen > sibsLen);
                let status = (() => {
                    if(indeterminateLen > 0){
                        return 2;
                    } else if(checkedLen === sibsLen){
                        return 1;
                    } else if(checkedLen === 0){
                        return 0;
                    } else {
                        return 2
                    }
                })();
                parent.checkBoxStatus(status, 'parent');
            }
        }
    }
    set checked(isChecked:boolean){
        let status = isChecked ? 1 : 0;
        if(this._checkBoxStatus === status){
            return;
        }

        // 先关联子元素checkbox状态
        this.checkBoxStatus(status, 'children');
        // 再关联父元素checkbox状态
        this.checkBoxStatus(status, 'parent');
    }
    get checked() {
        return this._checkBoxStatus === 1;
    }

    // 是否禁用checkBox
    private _disableCheckBox: boolean = false;
    set disableCheckBox(disabled: boolean){
        this._checkBox && (this._checkBox.disabled = disabled);
        this._disableCheckBox = disabled;
    }
    get disableCheckBox(){
        return this._disableCheckBox;
    }


    childrenAdd(para: this | ITreePara | (ITreePara | this)[]): this[]{
        let paras = tools.toArray(para);
            // isAllTree = false;

        if(this.checked && tools.isNotEmpty(para)) {
            paras.forEach(p => {
                if (!(p instanceof Tree)) {
                    p = p || {};
                    if (p.checked === undefined) {
                        p.checked = true;
                    }

                }
            })
        }

        let nodes = super.childrenAdd(para);
        Array.isArray(nodes) && nodes.forEach((node:this) => {
            node.container = this.childrenEl;
        });

        // let isFinal = isAllTree || (nodes.length < paras.length)

        // 改变父元素checkBox状态
        // debugger;
        // if(this.checked) {
        //     let aNode = nodes[0];
        //     aNode && aNode._checkBox && aNode.checkBoxStatus(aNode._checkBox.status, 'parent');
        // }

        return nodes;
    }

    /**
     * 设置tree主题 upDown(上下箭头) addMinus(加减号)
     * 默认值 upDown
     */
    // private _theme : string;
    // set theme(theme : string){
    //     // this._theme = tools.isEmpty(theme) ? 'upDown' : theme;
    //     // this._theme === 'upDown' ?
    //     //     (this.expandIcon = ['icon-zhankaishousuo-zhankai','icon-zhankaishousuo-shousuo']) :
    //     //     (this.expandIcon = ['icon-jianhao1','icon-jiahao1']);
    //     Tree.treeUtil.addOpenIcon(this,this.expandIcon[0],this.expandIcon[1]);
    // }
    // get theme(){
    //     return this._theme;
    // }
    protected wrapperCreate() {
        let wrapper = super.wrapperCreate();
        wrapper.classList.add('tree-node');

        return wrapper;
    }

    getCheckedNodes(){
        return this.find((node) => node.checked)
    }
}

