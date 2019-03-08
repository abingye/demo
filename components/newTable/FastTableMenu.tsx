/// <amd-module name="FastTableMenu"/>
import {FastTableCell} from "./FastTableCell";
import {FastTable} from "./FastTable";
import {IMenuPara, Menu} from "../navigation/menu/Menu";
import tools = G.tools;
import d = G.d;
import {INewPopMenuItem, NewPopMenu, NewPopMenuItem} from "../ui/popMenu/PopMenu";
import {FastTableColumn} from "./FastTabelColumn";
import {FastTableRow} from "./FastTableRow";

export interface IFastTableMenu {
    ftable: FastTable;
    items: IFastTableMenuItem[];
}

export interface IFastTableMenuItem extends INewPopMenuItem {
    rowMulti?: number; // 0 不用选择, 1 单选, 2 多选
    colMulti?: number; // 同上
    onClick?(cell: FastTableCell, rows: FastTableRow[], columns: FastTableColumn[], a?: any): void; // 有children时 不执行
    children?: IFastTableMenuItem[]
}

export class FastTableMenu {
    private ftable: FastTable;
    public ftableMenu: FastTablePCMenu | NewPopMenu;

    constructor(para: IFastTableMenu) {
        this.ftable = para.ftable;
        let items = [];
        if (tools.isNotEmpty(para.items)) {
            items = para.items.filter(item => {
                return tools.isNotEmpty(item);
            })
        }
        if (tools.isMb) {
            let popItems:INewPopMenuItem[] = [];
            items.forEach(item => {
                let content = {
                    rowMulti:0,
                    colMulti:0
                };
                if (tools.isNotEmpty(item.rowMulti)){
                    content.rowMulti = item.rowMulti;
                    delete item.rowMulti;
                }
                if (tools.isNotEmpty(item.colMulti)){
                    content.colMulti = item.colMulti;
                    delete item.colMulti;
                }
                let newItem = Object.assign(item,{content:content});
                popItems.push(item);
            });
            this.ftableMenu = new NewPopMenu({
                items: popItems,
                container: para.ftable.wrapper
            })
        } else {
            this.ftableMenu = new FastTablePCMenu({
                ftable: para.ftable,
                items: items
            })
        }
        // 右键菜单事件
        this.contextMenuEvent.on();
        this.ftableMenu.contextMenu.onOpen = (node) => {
            if (tools.isFunction(node.content.click)) {
                let a = {
                    set text(str) {
                        node.text = str;
                    }
                };
                if (tools.isMb) {
                    // 点击显示子菜单
                    if (tools.isNotEmpty(node.content.children)) {
                        (this.ftableMenu as NewPopMenu).splitItems(node.content.children);
                        (this.ftableMenu as NewPopMenu).setChildren();
                    } else {
                        node.content.click(this.cell, this.ftable.getSelectedRows(), this.ftable.getSelectedCols(), a);
                        this.ftableMenu.show = false;
                    }
                } else {
                    node.content.click(this.cell, this.ftable.getSelectedRows(), this.ftable.getSelectedCols(), a);
                    this.ftableMenu.show = false;
                }
            } else {
                this.ftableMenu.show = false;
            }
        };
        // 鼠标按下右键菜单消失
        this.mousedownEvent.on();

    }

    set show(show: boolean){
        this.ftableMenu && (this.ftableMenu.show = show);
    }

    private mousedownEvent = (() => {
        let mousedownHandler = (e) => {
            this.show = false;
        };
        return {
            on: () => d.on(document, 'click', mousedownHandler),
            off: () => d.off(document, 'click', mousedownHandler)
        }
    })();
    private cell: FastTableCell = null;
    private contextMenuEvent = (() => {
        let eventType = tools.isMb ? 'press' : 'contextmenu';
        let contextMenuHandler = (e) => {
            if (e.type === 'contextmenu') {
                e.preventDefault();
            }
            let fm = this.ftableMenu;
            fm = tools.isMb ? fm as NewPopMenu : fm as FastTablePCMenu;
            this.show = false;
            let tr = d.closest(e.target, 'tr'),
                td = d.closest(e.target, 'td, th'),
                isTh = d.matches(td, 'th'),
                rowIndex = parseInt(tr.dataset.index),
                cell = this.ftable.cellGet(td.dataset.name, rowIndex);
            // this.ftable.pseudoTable.setPresentSelected(rowIndex);
            if (isTh || tools.isMb) {
                if (cell && !cell.selected) {
                    this.ftable._clearAllSelectedCells();
                    cell.selected = true;
                    this.ftable._drawSelectedCells();
                }
            }
            this.cell = cell;
            let children = fm.contextMenu.children;
            this.updateMenu();
            this.show = true;
            let offsetLeft = tools.offset.left(this.ftable.wrapper),
                offsetTop = tools.offset.top(this.ftable.wrapper),
                scrollTop = tools.getScrollTop(this.ftable.wrapper);
            if (tools.isMb) {
                fm.contextMenu.setPosition(e.deltaX - offsetLeft, e.deltaY - offsetTop + scrollTop);
            } else {
                fm.contextMenu.setPosition(e.clientX, e.clientY);
            }
            // debugger;
        };
        let selector = '.section-inner-wrapper:not(.pseudo-table) tbody td, .section-inner-wrapper:not(.pseudo-table) thead th';
        return {
            on: () => d.on(this.ftable.wrapper, eventType, selector, contextMenuHandler),
            off: () => d.off(this.ftable.wrapper, eventType, selector, contextMenuHandler)
        }
    })();

    private updateMenu() {
        let children: any[] = this.ftableMenu.contextMenu.children;
        children = tools.isMb ? children as NewPopMenuItem[] : children as Menu[];
        children && children.forEach(node => {
            node.disabled = this.jageItemDisabled(node.content.rowMulti, node.content.colMulti);
            node.selected = false;
            if (tools.isNotEmpty(node.children) && !tools.isMb) {
                this.updatePCChildren(node.children);
            }
        });
    }

    private updatePCChildren(children: Menu[]) {
        children && children.forEach(node => {
            node.disabled = this.jageItemDisabled(node.content.rowMulti, node.content.colMulti);
            node.selected = false;
            if (tools.isNotEmpty(node.children) && !tools.isMb) {
                this.updatePCChildren(node.children);
            }
        });
    }

    // 判断是否可用
    private jageItemDisabled(rowMultiPara: number, colMultiPara: number): boolean {
        let selectRowsLen = this.ftable.getSelectedRows().length, // 当前选择了多少行
            selectColsLen = this.ftable.getSelectedCols().length, // 当前选择了多少列
            rowMulti = tools.isEmpty(rowMultiPara) ? 0 : rowMultiPara,
            colMulti = tools.isEmpty(colMultiPara) ? 0 : colMultiPara;
        if (rowMulti !== 0) {
            if (colMulti !== 0) {
                if (rowMulti === selectRowsLen && colMulti === selectColsLen) {
                    return false;
                } else {
                    return true;
                }
            } else {
                if (rowMulti === selectRowsLen) {
                    return false;
                } else {
                    return true;
                }
            }
        } else {
            if (colMulti !== 0) {
                if (colMulti === selectColsLen) {
                    return false;
                } else {
                    return true;
                }
            } else {
                return false;
            }
        }
    }


    destory() {
        this.ftable = null;
        this.ftableMenu.destory();
        this.contextMenuEvent.off();
        this.mousedownEvent.off();
    }
}

class FastTablePCMenu {
    private ftable: FastTable;
    private _contextMenu: Menu;
    set contextMenu(menu: Menu) {
        this._contextMenu = menu;
    }

    get contextMenu() {
        return this._contextMenu;
    }

    constructor(para: IFastTableMenu) {
        this.ftable = para.ftable;
        this.contextMenu = new Menu({
            container: para.ftable.wrapper,
            expand: true,
            isOutline: true,
            isHoverExpand: true,
            children: this.handlerMenuData(para.items)
        });
        this.contextMenu.wrapper.classList.add('ftable-context-menu');
    }

    private _show: boolean;
    set show(isShow: boolean) {
        this._show = isShow;
        if (isShow) {
            this.contextMenu.wrapper.style.display = 'block';
        } else {
            this.contextMenu.wrapper.style.display = 'none';
        }
    }


    // 处理选项转换为menuData
    private handlerMenuData(items: IFastTableMenuItem[]): IMenuPara[] {
        let menuData: IMenuPara[] = [];
        items.forEach((item) => {
            let menuObj = {};
            menuObj['text'] = item['title'];
            menuObj['icon'] = item['icon'];
            let rowMulti = tools.isNotEmpty(item.rowMulti) ? item.rowMulti : 0,
                colMulti = tools.isNotEmpty(item.colMulti) ? item.colMulti : 0;
            menuObj['content'] = {
                rowMulti: rowMulti,
                colMulti: colMulti,
                click: null
            };
            if (tools.isNotEmpty(item.children)) {
                menuObj['children'] = this.handlerMenuData(item.children);
            } else {
                menuObj['content'].click = item.onClick;
            }
            menuData.push(menuObj);
        });
        return menuData;
    }

    // 判断是否可用
    // private jageItemDisabled(rowMultiPara: number, colMultiPara: number): boolean {
    //     let selectRowsLen = this.ftable.getSelectedRows().length, // 当前选择了多少行
    //         selectColsLen = this.ftable.getSelectedCols().length, // 当前选择了多少列
    //         rowMulti = tools.isEmpty(rowMultiPara) ? 0 : rowMultiPara,
    //         colMulti = tools.isEmpty(colMultiPara) ? 0 : colMultiPara;
    //     if (rowMulti !== 0) {
    //         if (colMulti !== 0) {
    //             if (rowMulti === selectRowsLen && colMulti === selectColsLen) {
    //                 return false;
    //             } else {
    //                 return true;
    //             }
    //         } else {
    //             if (rowMulti === selectRowsLen) {
    //                 return false;
    //             } else {
    //                 return true;
    //             }
    //         }
    //     } else {
    //         if (colMulti !== 0) {
    //             if (colMulti === selectColsLen) {
    //                 return false;
    //             } else {
    //                 return true;
    //             }
    //         } else {
    //             return false;
    //         }
    //     }
    // }

    destory() {
        this.contextMenu.destroy();
    }
}

// class FastTableMBMenuItem {
//     public content: any;
//
//     constructor(para: IFastTableMenuItem) {
//         this.text = tools.isEmpty(para.title) ? '' : para.title;
//         this.icon = tools.isEmpty(para.icon) ? '' : para.icon;
//         this.content = {
//             rowMulti: tools.isEmpty(para.rowMulti) ? 0 : para.rowMulti,
//             colMulti: tools.isEmpty(para.colMulti) ? 0 : para.colMulti,
//             click: tools.isEmpty(para.onClick) ? function () {
//             } : para.onClick,
//             children: tools.isEmpty(para.children) ? [] : para.children
//         };
//     }
//
//     // 容器
//     protected _wrapper: HTMLElement;
//     get wrapper() {
//         if (!this._wrapper) {
//             this._wrapper = this.wrapperCreate();
//         }
//         return this._wrapper;
//     }
//
//     protected wrapperCreate() {
//         return d.create('<div class="ftable-mbmenu-item fmbitem"><div class="ftable-mbmenu-textwrapper"></div>');
//     }
//
//
//     // 是否可用
//     private _disabled: boolean;
//     set disabled(disabled: boolean) {
//         this._disabled = !!disabled;
//         this.wrapper.classList.toggle('nouse', this._disabled);
//     }
//
//     get disabled() {
//         return this._disabled;
//     }
//
//     private _selected: boolean;
//     set selected(selected: boolean) {
//         if (selected === this._selected) {
//             return;
//         }
//         this._selected = !!selected;
//         this.wrapper.classList.toggle('selected', this._selected);
//     }
//
//     get selected() {
//         return this._selected;
//     }
//
//     // 文本
//     private _text: string;
//     set text(text: string) {
//         this._text = text;
//         this.textEl && (this.textEl.innerText = text)
//     }
//
//     get text() {
//         return this._text;
//     }
//
//     private _textEl: HTMLElement;
//     private get textEl() {
//         if (!this._textEl) {
//             this._textEl = d.query('.ftable-mbmenu-textwrapper', this.wrapper);
//         }
//         return this._textEl;
//     }
//
//     // 图标
//     private _icon: string;
//     set icon(icon: string) {
//         if (icon) {
//             if (typeof icon === 'string') {
//                 this.iconEl.classList.add(...icon.split(' '));
//                 this._icon = icon;
//             }
//         } else {
//             this._icon && this.iconEl.classList.remove(...this._icon.split(' '));
//         }
//     }
//
//     get icon() {
//         return this._icon;
//     }
//
//     private _iconEl?: HTMLElement;
//     private get iconEl() {
//         if (!this._iconEl) {
//             this._iconEl = d.create('<i class="ftable-mbmenu-icon" data-role="icon"></i>');
//             d.before(this.textEl, this._iconEl);
//         }
//         return this._iconEl;
//     }
//
//     destory() {
//         d.remove(this._wrapper);
//         this._wrapper = null;
//         this._textEl = null;
//         this._iconEl = null;
//     }
// }
//
// class FastTableMBMenu extends FastTableMBMenuItem {
//     private ftable: FastTable;
//     private _contextMenu: FastTableMBMenu;
//     set contextMenu(menu: FastTableMBMenu) {
//         this._contextMenu = menu;
//     }
//
//     get contextMenu() {
//         return this._contextMenu;
//     }
//
//     private originChildren: IFastTableMenuItem[];
//
//     constructor(para: IFastTableMenu) {
//         super({
//             title: '', icon: '', rowMulti: 0, colMulti: 0, onClick: function () {
//             }, children: []
//         });
//         this.ftable = para.ftable;
//         this.contextMenu = this;
//         this.originChildren = para.items;
//         this.splitItems(para.items);
//         this.setChildren();
//         this.ftable.wrapper.appendChild(this.wrapper);
//         // document.body.appendChild(this.wrapper);
//         this.show = false;
//
//         d.on(this.wrapper, 'click', '.next-item', (event) => {
//             event.stopPropagation();
//             let itemWrappers = d.queryAll('.ftable-mbmenu-item', this.wrapper),
//                 index = parseInt(this.wrapper.dataset.index),
//                 nextIndex = index + 1 >= this.wrapperItemsArr.length ? this.wrapperItemsArr.length - 1 : index + 1;
//             if (index !== this.wrapperItemsArr.length - 1) {
//                 this.wrapper.dataset['index'] = nextIndex + '';
//                 this.setChildren(nextIndex);
//             }
//         });
//         d.on(this.wrapper, 'click', '.prev-item', (e) => {
//             e.stopPropagation();
//             let itemWrappers = d.queryAll('.ftable-mbmenu-item', this.wrapper),
//                 index = parseInt(this.wrapper.dataset.index),
//                 prevIndex = index - 1 < 0 ? 0 : index - 1;
//             this.wrapper.dataset['index'] = prevIndex + '';
//             this.setChildren(prevIndex);
//         });
//
//         d.on(this.wrapper, 'click', '.fmbitem', (event) => {
//             event.stopPropagation();
//             let fmbitem = d.closest(event.target as HTMLElement, '.fmbitem'),
//                 index = parseInt(fmbitem.dataset.index),
//                 item = this.allItems[index];
//             item.selected = true;
//             this.onOpen && this.onOpen(item);
//         });
//     }
//
//     protected wrapperCreate() {
//         return d.create('<div class="ftable-mbmenu-wrapper" data-index="0"></div>');
//     }
//
//     setChildren(index = 0) {
//         this.wrapper.innerHTML = '';
//         let items = this.wrapperItemsArr[index];
//         if (this.wrapperItemsArr.length === 1) {
//             items.forEach((item, i) => {
//                 i === 0 && item.wrapper.classList.add('leftBorderRadius');
//                 i === items.length - 1 && item.wrapper.classList.add('rightBorderRadius');
//                 this.wrapper.appendChild(item.wrapper);
//             });
//         } else {
//             if (index !== 0) {
//                 let firstPrevBtn = this.prevBtn;
//                 this.wrapper.appendChild(this.prevBtn);
//             }
//             items.forEach((item, i) => {
//                 (index === 0 && i === 0) && item.wrapper.classList.add('leftBorderRadius');
//                 this.wrapper.appendChild(item.wrapper);
//             });
//             let lastNextBtn = this.nextBtn;
//             if (index === this.wrapperItemsArr.length - 1) {
//                 lastNextBtn.classList.add('nouse');
//             }
//             this.wrapper.appendChild(lastNextBtn);
//         }
//         this.wrapper.appendChild(d.create('<div class="arrow"></div>'));
//         this.setArrowPostiton(this.x);
//     }
//
//     private _allItems: FastTableMBMenuItem[];
//     set allItems(items: FastTableMBMenuItem[]) {
//         this._allItems = items;
//     }
//
//     get allItems() {
//         if (!this._allItems) {
//             this._allItems = [];
//         }
//         return this._allItems;
//     }
//
//     private _show: boolean;
//     set show(isShow: boolean) {
//         this._show = isShow;
//         if (isShow === true) {
//             this.splitItems(this.originChildren);
//             this.wrapper.dataset['index'] = '0';
//             this.setChildren();
//             this.updateMenu(this.allItems);
//             this.wrapper.style.opacity = '1';
//             this.wrapper.style.display = 'flex';
//             this.wrapper.style.display = '-webkit-flex';
//         } else {
//             this.wrapper.style.opacity = '0';
//             this.wrapper.style.display = 'none';
//         }
//     }
//
//     get show() {
//         return this._show;
//     }
//
//     private updateMenu(children: FastTableMBMenuItem[]) {
//         children.forEach((node) => {
//             node.disabled = this.jageItemDisabled(node.content.rowMulti, node.content.colMulti);
//             node.selected = false;
//         });
//     }
//
//     // 判断是否可用
//     private jageItemDisabled(rowMultiPara: number, colMultiPara: number): boolean {
//         let selectRowsLen = this.ftable.getSelectedRows().length, // 当前选择了多少行
//             selectColsLen = this.ftable.getSelectedCols().length, // 当前选择了多少列
//             rowMulti = tools.isEmpty(rowMultiPara) ? 0 : rowMultiPara,
//             colMulti = tools.isEmpty(colMultiPara) ? 0 : colMultiPara;
//         if (rowMulti !== 0) {
//             if (colMulti !== 0) {
//                 if (rowMulti === selectRowsLen && colMulti === selectColsLen) {
//                     return false;
//                 } else {
//                     return true;
//                 }
//             } else {
//                 if (rowMulti === selectRowsLen) {
//                     return false;
//                 } else {
//                     return true;
//                 }
//             }
//         } else {
//             if (colMulti !== 0) {
//                 if (colMulti === selectColsLen) {
//                     return false;
//                 } else {
//                     return true;
//                 }
//             } else {
//                 return false;
//             }
//         }
//     }
//
//     private x: number;
//
//     setPosition(x: number, y: number) {
//         this.x = x;
//         this.wrapper.style.top = (y - 45) + 'px';
//         let x1 = x, width = parseInt(window.getComputedStyle(this.wrapper).width);
//         this.wrapperItemsArr.length === 1 ? x1 -= width / 2 : x1 -= 120;
//         if (x + 120 > window.innerWidth) {
//             x1 = window.innerWidth - width;
//             d.query('.arrow', this.wrapper).style.left = (x - x1 - 5) + 'px';
//         } else if (x1 < 0) {
//             x1 = 0;
//             d.query('.arrow', this.wrapper).style.left = (x - 5) + 'px';
//         } else {
//             d.query('.arrow', this.wrapper).style.left = 'calc(50% - 5px)';
//         }
//         this.wrapper.style.left = x1 + 'px';
//     }
//
//     private setArrowPostiton(x) {
//         let x1 = x;
//         this.wrapperItemsArr.length === 1 ? x1 -= 50 : x1 -= 120;
//         if (x + 120 > window.innerWidth) {
//             x1 = window.innerWidth - 240;
//             d.query('.arrow', this.wrapper).style.left = (x - x1 - 5) + 'px';
//         }
//         if (x1 < 0) {
//             x1 = 0;
//             d.query('.arrow', this.wrapper).style.left = (x - 5) + 'px';
//         }
//     }
//
//     private _prevBtn: HTMLElement;
//     get prevBtn() {
//         this._prevBtn = d.create('<div class="ftable-mbmenu-item prev-item">&lt;</div>');
//         return this._prevBtn;
//     }
//
//     private _nextBtn: HTMLElement;
//     get nextBtn() {
//         this._nextBtn = d.create('<div class="ftable-mbmenu-item next-item">&gt;</div>');
//         return this._nextBtn;
//     }
//
//     private _wrapperItemsArr: FastTableMBMenuItem[][];
//     get wrapperItemsArr() {
//         if (!this._wrapperItemsArr) {
//             this._wrapperItemsArr = [];
//         }
//         return this._wrapperItemsArr;
//     }
//
//     set wrapperItemsArr(itemArr: FastTableMBMenuItem[][]) {
//         this._wrapperItemsArr = itemArr;
//     }
//
//     splitItems(items) {
//         this.allItems = [];
//         this.wrapperItemsArr = [];
//         items.forEach((item, index) => {
//             let mbItem = new FastTableMBMenuItem(item);
//             mbItem.wrapper.dataset['index'] = index + '';
//             this.allItems.push(mbItem);
//         });
//         if (this.allItems.length <= 3) {
//             this.wrapperItemsArr.push(this.allItems);
//         } else {
//             this.wrapper.style.width = '240px';
//             let arr = this.allItems.slice(3, this.allItems.length),
//                 frontArr = this.allItems.slice(0, 3),
//                 len = Math.floor(arr.length / 2) + 1;
//             this.wrapperItemsArr.push(frontArr);
//             for (let i = 0; i < len - 1; i++) {
//                 let itemArr = arr.slice(i * 2, (i + 1) * 2);
//                 this.wrapperItemsArr.push(itemArr);
//             }
//         }
//     }
//
//     private _onOpen: (node: FastTableMBMenuItem) => void;
//     set onOpen(cb: (node: FastTableMBMenuItem) => void) {
//         this._onOpen = cb;
//     }
//
//     get onOpen(): (node: FastTableMBMenuItem) => void {
//         return this._onOpen;
//     }
//
//     destory() {
//         d.off(this.wrapper);
//         d.remove(this._wrapper);
//         this._wrapper = null;
//     }
// }

