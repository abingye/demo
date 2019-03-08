/// <amd-module name="ElementTreeNode"/>

import d = G.d;
import tools = G.tools;
import {
  IBasicTreePara,
  TreeNodeBase
} from "../../../dataStruct/tree/TreeNodeBase";
import IComponentPara = G.IComponentPara;

export interface IElementTreeNodePara extends IBasicTreePara {
  text?: string;
  children?: IElementTreeNodePara[];
  disabled?: boolean; // 继承

  selected?: boolean;
  multiSelect?: boolean; // 子项选中方式
  onlyLeafSelect?: boolean; // 只有叶子节点可以选中默认false

  isVirtual?: boolean;
  isAccordion?: boolean;
  icon?: string;
  expand?: boolean;
  isLeaf?: boolean; // 默认 false
  container?: HTMLElement;
  width?: number;
  ajax?: IElementTreeAjax<ElementTreeNode, IElementTreeNodePara>; // 继承
  expandIconArr?: string[];
  expandIconPre?: string;
}

interface IElementTreeAjaxHandler<T, K> {
  (tnode: T): Promise<K[]>;
}

export type IElementTreeAjax<
  T extends ElementTreeNode,
  K extends IElementTreeNodePara
  > = IElementTreeAjaxHandler<T, K> | false;

export class ElementTreeNode extends TreeNodeBase implements IComponentPara {
  protected _wrapper: HTMLElement;

  protected init(para?: IElementTreeNodePara) {
    super.init(para);
    this.expandIconArr = para.expandIconArr;
    this.expandIconPre = para.expandIconPre;
    this.isVirtualSet(
      para.isVirtual === undefined ? !this.parent : para.isVirtual
    );
    this.isLeaf =
      para.isLeaf === undefined ? tools.isEmpty(para.children) : para.isLeaf; // 默认判断是否有子节点
    this.ajax = para.ajax;
    this.expand = para.expand; //如果该节点为虚拟节点,则默认将该节点展开

    // debugger;

    this.text = para.text;
    this.isAccordion = para.isAccordion;
    this.multiSelect =
      para.multiSelect === undefined
        ? this.inherit("_multiSelect")
        : para.multiSelect;
    this.selected = para.selected;
    this.icon = para.icon;
    this.disabled = para.disabled;
  }

  private _expandIconArr: string[];
  set expandIconArr(arr: string[]) {
    this._expandIconArr = arr;
  }
  get expandIconArr() {
    return this._expandIconArr;
  }
  private _expandIconPre: string;
  set expandIconPre(pre: string) {
    this._expandIconPre = pre;
  }
  get expandIconPre() {
    return this._expandIconPre;
  }

  protected _ajax: IElementTreeAjax<this, IElementTreeNodePara>;
  set ajax(fun: IElementTreeAjax<this, IElementTreeNodePara>) {
    this._ajax = fun;
  }

  get ajax(): IElementTreeAjax<this, IElementTreeNodePara> {
    return this.inherit("_ajax");
  }

  protected get textWrapper() {
    return this.textEl && this.textEl.parentElement;
  }

  protected _expandIconEl: HTMLElement;
  protected get expandIconEl() {
    if (!this._expandIconEl) {
      let pre = tools.isNotEmpty(this.expandIconPre)
        ? this.expandIconPre
        : "iconfont";
      this._expandIconEl = d.create(
        `<i class="${pre} ${this.getCurrentExpandIcon()} tree-open-icon"></i>`
      );
      d.prepend(this.textWrapper, this._expandIconEl);
    }
    return this._expandIconEl;
  }

  protected expandIconElShow() {
    this.expandIconEl.classList.remove("invisible");
  }

  protected expandIconElHide() {
    this.expandIconEl.classList.add("invisible");
  }

  // 用来标识此节点是否是叶子节点，如果为否的话，此节点不一定有子元素，如果没有的话子元素的话点击会触发ajax参数
  protected _isLeaf: boolean;
  set isLeaf(flag: boolean) {
    // if(flag === undefined) {
    //     flag = tools.isEmpty(this.childrenGet());
    // }
    flag = !!flag;
    if (this._isLeaf === flag) {
      return;
    }

    this._isLeaf = flag;
    if (flag) {
      this.expandIconElHide();
    } else {
      this.expandIconElShow();
    }
  }

  get isLeaf() {
    return this._isLeaf || false;
  }

  protected _childrenEl?: HTMLElement;
  protected get childrenEl() {
    if (!this._childrenEl) {
      this._childrenEl = d.query('[data-role="children"]', this.wrapper);
    }
    return this._childrenEl;
  }

  protected _textEl?: HTMLElement;
  protected get textEl() {
    if (!this._textEl) {
      this._textEl = d.query('[data-role="text"]', this.wrapper);
    }
    return this._textEl;
  }

  protected _iconEl?: HTMLElement;
  protected get iconEl() {
    if (!this._iconEl) {
      this._iconEl = d.create('<i class="tree-icon" data-role="icon"></i>');
      d.before(this.textEl, this._iconEl);
      // = d.query('[data-role="icon"]', this.wrapper);
    }
    return this._iconEl;
  }

  //判断当前节点是否为虚拟节点
  protected _isVirtual: boolean;
  protected get isVirtual() {
    // debugger;
    // if (this._isVirtual === undefined) {
    //     this.isVirtualSet(!this.parentGet());
    // }
    return this._isVirtual;
  }

  protected isVirtualSet(flag: boolean) {
    this.wrapper.classList.toggle("tree-virtual", flag);
    this._isVirtual = flag;
  }

  protected _container?: HTMLElement;

  set container(el: HTMLElement) {
    this._container = el;
    d.append(el, this.wrapper);
  }

  get container() {
    return this._container;
  }

  protected _disabled?: boolean;

  set disabled(disabled: boolean) {
    this._disabled = !!disabled;
    this.wrapper.classList.toggle("disabled", this._disabled);
  }

  get disabled() {
    return this._disabled;
  }

  childrenAdd(
    para: this | IElementTreeNodePara | (IElementTreeNodePara | this)[]
  ): this[] {
    tools.toArray(para).forEach(p => {
      if (!(p instanceof ElementTreeNode) && tools.isNotEmpty(p)) {
        (<IElementTreeNodePara>p).isVirtual = false;
      }
    });

    return super.childrenAdd(para);
  }

  childrenRemove(tnode: this | this[]) {
    super.childrenRemove(tnode);
    tools.toArray(tnode).forEach(node => {
      node.destroy();
    });
  }

  //是否选中
  protected _selected: boolean;

  set selected(selected: boolean) {
    if (selected === this._selected) {
      return;
    }
    if (!this.multiSelect && selected) {
      let selectedNodes = this.getSelectedNodes(true);
      Array.isArray(selectedNodes) &&
        selectedNodes.forEach(node => {
          node.wrapper.classList.remove("selected");
          node._selected = false;
        });
    }

    this._selected = !!selected;
    this.wrapper.classList.toggle("selected", this._selected);
    this.onSelect && this.onSelect(this);
  }

  get selected() {
    return this._selected;
  }

  protected _onSelect: (node: ElementTreeNode) => void = null;
  set onSelect(handler: (node: ElementTreeNode) => void) {
    this._onSelect = handler;
  }

  get onSelect() {
    return this.inherit("_onSelect");
  }

  //节点展开关闭状态
  protected _expand: boolean;

  protected expandIcon() {
    let iconArr = tools.isNotEmpty(this.expandIconArr)
      ? this.expandIconArr
      : ["icon-zhankaishousuo-shousuo", "icon-zhankaishousuo-zhankai"];
    return iconArr;
  }

  set expand(expand: boolean) {
    // console.trace();
    if (this.isLeaf || expand == this._expand) {
      return;
    }

    //如果顶部菜单与子菜单的模式为纵向则需要修改当前打开按钮的样式 此处用expandIcon数量判断
    let expandIcon = this.expandIcon();
    if (expandIcon.length !== 1 && this.expandIconEl) {
      this.expandIconEl.classList.add(expand ? expandIcon[1] : expandIcon[0]);
      this.expandIconEl.classList.remove(
        expand ? expandIcon[0] : expandIcon[1]
      );
    }

    //如果为手风琴并且为打开状态，关闭同级节点,
    if (this.parent && this.parent.isAccordion && expand) {
      let sibs = this.siblings;
      sibs &&
        sibs.forEach(node => {
          node.expand && (node.expand = false);
        });
    }

    this._expand = expand;
    setTimeout(() => {
      // 当满足树的状态为打开 并且没有disabled类是动态加载数据，判断是否包含disabled目的是为了防止在加载过程中再次触发
      let isAjax =
        this.ajax && !this.disabled && expand && tools.isEmpty(this.children);

      Promise.resolve(
        (() => {
          if (isAjax) {
            this.childrenEl.classList.add("hide");
            return this.doAjax().then(() => {
              // 动画效果,所以延时
              setTimeout(() => {
                this.childrenEl.classList.remove("hide");
              }, 50);
            });
          }
        })()
      ).then(() => {
        this.childrenEl.classList.toggle("hide", !this._expand);
        this.onExpand && this.onExpand(this, this._expand);
      });
    }, 10);

    // this.childrenEl.classList.toggle('hide', !this._expand);
    //
    // setTimeout(() => {
    //     //当满足树的状态为打开 并且没有disabled类是动态加载数据，判断是否包含disabled目的是为了防止在加载过程中再次触发
    //     if (!this.disabled && expand && tools.isEmpty(this.children) && this.ajax) {
    //         this.childrenEl.classList.add('hide');
    //         this.doAjax().then(() => {
    //
    //             // 动画效果,所以延时
    //             setTimeout(() => {
    //                 this.childrenEl.classList.remove('hide');
    //             }, 50);
    //         }).catch(() => {
    //             this.expand = false;
    //         });
    //     }
    // }, 10);
  }

  get expand() {
    return this._expand;
  }

  protected _onExpand: (node: this, isExpand: boolean) => void = null;
  set onExpand(handler: (node: this, isExpand: boolean) => void) {
    this._onExpand = handler;
  }

  get onExpand() {
    return this.inherit("_onExpand");
  }

  //节点文本内容
  protected _text: string;
  set text(text: string) {
    this._text = tools.str.toEmpty(text);
    this.textEl.innerHTML = this._text;
    this.textWrapper.title = this._text;
  }

  get text() {
    return this._text;
  }

  //树节点图标
  protected _icon: string;
  set icon(icon: string) {
    if (icon) {
      if (typeof icon === "string") {
        this.iconEl.classList.add(...icon.split(" "));
        // !this._icon && this.iconEl.classList.add('tree-icon');
        this._icon = icon;
      }
    } else {
      this._icon && this.iconEl.classList.remove(...this._icon.split(" "));
    }
  }

  get icon() {
    return this._icon;
  }

  //是否手风琴
  protected _isAccordion: boolean;

  set isAccordion(isAccordion: boolean) {
    this._isAccordion = !!isAccordion;
    if (this._isAccordion) {
      let children = this.children,
        firstExpand = false;
      Array.isArray(children) &&
        children.forEach(child => {
          if (child.expand) {
            if (!firstExpand) {
              firstExpand = true;
            } else {
              child.expand = false;
            }
          }
        });
    }
  }

  get isAccordion() {
    return this._isAccordion;
  }

  //儿子节点选中状态
  protected _multiSelect: boolean;

  set multiSelect(multi: boolean) {
    this._multiSelect = !!multi;
  }

  get multiSelect() {
    return this._multiSelect;
  }

  protected _onOpen: (node: this) => void;
  set onOpen(cb: (node: this) => void) {
    this._onOpen = cb;
  }

  get onOpen(): (node: this) => void {
    return this.inherit("_onOpen");
  }

  protected doAjax() {
    this.disabled = true;

    let openIcon = this.expandIconEl,
      spinnerIconName = ["tree-rotate-icon", "icon-shuaxin"],
      currentExpandIcon = this.getCurrentExpandIcon();

    openIcon && openIcon.classList.remove(currentExpandIcon);
    openIcon && openIcon.classList.add(...spinnerIconName);

    let callback = (para: IElementTreeNodePara[]) => {
      // debugger;
      if (tools.isNotEmpty(para)) {
        this.childrenSet(para);
      }

      if (tools.isNotEmpty(this.children)) {
        openIcon && openIcon.classList.add(currentExpandIcon);
      }
      openIcon && openIcon.classList.remove(...spinnerIconName);
      this.disabled = false;
    };

    return new Promise((resolve, reject) => {
      if (this.ajax) {
        this.ajax(this)
          .then((para: IElementTreeNodePara[]) => {
            // debugger;
            callback(para);
            resolve();
          })
          .catch(() => {
            callback(null);
            reject();
          });
      } else {
        callback(null);
        reject();
      }
    });
  }

  refresh() {
    //ajax刷新
    if (!this.ajax && this.isLeaf) {
      return;
    }

    this.expand = false;
    this.childrenRemove(this.children);
    this.expand = true;
  }

  get wrapper() {
    if (!this._wrapper) {
      this._wrapper = this.wrapperCreate();
    }
    return this._wrapper;
  }

  protected wrapperCreate() {
    return d.create(
      `<div class="element-tree-node">
                <div class="tree-text-wrapper">
                    <span data-role="text" class="tree-text"></span>
                </div>
                <div data-role="children" class="tree-child-wrapper hide"></div>
            </div>`
    );
  }

  getSelectedNodes(fromRoot = false) {
    let root = fromRoot ? this.root : this;
    return root.find(node => {
      return node._selected;
    });
  }

  get isOnTop() {
    let parent = this.parent;
    return (!!parent && parent.isVirtual) || !parent;
  }

  protected getCurrentExpandIcon() {
    // if(this.isLeaf){
    //     return '';
    // } else {
    let expandIcon = this.expandIcon();
    if (expandIcon[1]) {
      return expandIcon[this.expand ? 1 : 0];
    } else {
      return expandIcon[0];
    }
    // }
  }

  protected inherit(name: string) {
    let node = this.backFind(node => {
      return tools.isNotEmpty(node[name]);
    });
    return node ? node[name] : null;
  }

  destroy() {
    this.each(node => {
      d.remove(node._wrapper);
      node._wrapper = null;
      node.ajax = null;
      node.onOpen = null;
      node._childrenEl = null;
      node._container = null;
      node._textEl = null;
      node._expandIconEl = null;
      node._children = null;
      node._parent = null;
    });
  }
}
