/// <amd-module name="BasicTable"/>
import tools = G.tools;
import d = G.d;
import {CheckBox} from "../form/checkbox/checkBox";
interface TableEditInitPara {
    comInit(td:HTMLTableCellElement, trData:obj, col: COL);
    comDestroy(col: COL);
    validate?(td:HTMLTableCellElement, col:COL, data:obj, callback:Function);
    valGet(col:COL): obj;
    canInit(col: COL, type:number): boolean; // type 1:新增, 2:修改
    defData?: obj; //默认值,
    pasteExceptCols?: string[];
    canRowInit(data:obj) : boolean;
}

export interface MenuConfGetResult {
    /**
     * 列菜单默认配置获取
     */
    colConfGet(): BT_MenuConf;

    /**
     * 行菜单默认配置获取
     */
    rowConfGet(): BT_MenuConf;

    /**
     * 弹出菜单dom获取
     */
    popDomGet(): HTMLElement;

    /**
     * 弹出菜单中按钮列表获取
     * @param popMenu
     */
    listDomGet(popMenu: HTMLElement): HTMLElement;

    /**
     * 弹出菜单中单个按钮的html获取
     * @param btn
     */
    btnHtmlGet(btn: BT_Btn[]): string;

    /**
     * 显示弹出菜单
     */
    show(target?: HTMLElement): void;

    /**
     * 隐藏弹出菜单
     */
    hide(target?: HTMLElement): void;

    /**
     * 弹出菜单初始化，针对不同端做的不同的处理
     */
    init(): void;
}

export abstract class BasicTable {
    protected ssid: string; // 实例化后唯一标识
    protected timeOut: any; // 用于延迟执行
    protected conf: BT_Para; // 表格初始化参数
    protected table: HTMLTableElement; // 主表dom
    protected tableData: any[]; // 表数据
    // protected currentPage: number; // 当前页数

    protected tbodyLength = 0; // 当前页面显示多少条数据
    protected startIndex = 0; // 当前页面显示开始的index

    protected tableWrapper: HTMLDivElement; // 表格控件总dom
    protected tableContainer: HTMLDivElement; // 包含主表与锁表的dom
    protected tableMiddle: HTMLDivElement; // 包含滚动条的外框
    // protected ajaxData: any = null; // 上一次请求ajax的参数
    public trSelected: HTMLTableRowElement[] = []; //被选中的tr
    protected trMoveSelected: HTMLTableRowElement; //被选中待移动的tr
    // protected trMoveBtn: HTMLDivElement; // 行拖拽按钮dom
    protected popMenu: BT_PopMenu; // 弹出菜单操作对象
    protected popMenuDom: HTMLElement; // 弹出菜单dom
    protected draging: boolean = false; // 鼠标是否按下拖拽中
    protected styleList: obj = {}; // 鼠标是否按下拖拽中
    protected styleListReady: boolean = false; // 列宽度是否初始化缓存
    protected theadHeight: number = 0; // 当前表头高度
    protected menuEventName: string; // 显示菜单的事件名称

    protected cellHeight: number = 30; // 表格行高


    protected eventClickName: string; // 点击事件名称
    protected mousemoveName: string; // 鼠标悬浮事件名称
    protected mouseoutName: string; // 鼠标离开事件名称
    protected mousedownName: string; // 鼠标按下事件名称
    protected mouseupName: string; // 鼠标松开事件名称

    protected lockTable: HTMLTableElement; // 锁列表格
    protected lockCol = {
        table: <HTMLTableElement>null,             // 锁列表格
        Container: <HTMLElement>null          // 锁列外容器
    };
    protected lockRow = {
        table: <HTMLTableElement>null,            // 锁头表格
        fixed: null,            // 左上角锁头固定区
        Container: <HTMLElement>null,        // 锁行固定区container
        ContainInner: <HTMLElement>null,     // 锁行内容区
        fixedContainer: <HTMLElement>null,   // 左上角锁行固定区内容
        fixedTable: <HTMLTableElement>null,       // 左上角锁行表格
    };

    // 序列号
    protected indexCol: { width: number; show: boolean, col: HTMLElement } = {
        width: 0,    // 索引列宽
        show: true,  // 是否显示
        col: null
    };

    // 伪列
    protected pseudoCol = {
        width: 30,
        show: true,
        Container: null,
        fixedCol: null, // 左上角锁头序列号
        confList: []
    };

    // 列宽调整
    public colResize = {
        dragging: false,    // 是否拖拽中
        column: null,       // 拖拽中的列信息
        resizeProxy: null   // 拖拽辅助线
    };

    // 行列交换
    protected move = {
        col: null,          // 拖拽中的列信息
        hoverCol: null,     // 拖拽悬浮中的列信息
        hoverRow: null,     // 拖拽悬浮中的列信息
        moving: false,      // 是否拖拽中
        timeout: null
    };

    // 隐藏的列
    protected colHide = {
        ready: false,
        status: {}
    };

    // 行展开树
    protected treegrid = {
        data: []
    };

    protected movingColumn: HTMLElement = null;   // 拖拽中的列信息
    protected movingHoverColumn: HTMLElement = null;   // 拖拽悬浮中的列信息
    protected movingHoverRow: HTMLElement = null;   // 拖拽悬浮中的列信息
    public moving: boolean = false;        // 是否拖拽中

    // 拖拽选择
    protected dragSelect = {
        selected: {}       // 被选中的单元格对应的数据
    };

    // 拖拽行选中
    protected dragRows = {
        selected: {}
    };

    // 拖拽框
    protected dragControl = {
        dragging: false,    // 是否拖拽中: false,    // 是否拖拽中
    };

    // 行展开
    protected expand = {
        toggler: {},        // 独立展开缓存
        Container: null
    };


    //protected cellMaxStatus: boolean = false; // 单元格最大值是否设置过

    protected nameCol: { [name: string]: COL };

    protected tableStatus: boolean = true;       // 当前是否隐藏状态  [true: 显示, false: 隐藏]

    /**
     * 获取有关事件的配置
     */
    protected abstract getEventConf(): { menuName: string, clickName: string, mousemoveName: string, mouseoutName: string, mousedownName: string, mouseupName: string };

    protected abstract menuConfGet(): MenuConfGetResult;

    // 移动端拖拽锁屏
    protected abstract lockScreen(): void;


    /**
     * 构造函数
     * @param paraConf
     */
    constructor(paraConf: BT_Para) {
        let defaultConf: BT_Para = {
            Container: null,        // 表格容器，用于控制锁头置顶识别滚动条
            cols: [],
            // ajax: null,// function(mt, customer, callback){}
            // ajaxData: null,
            data: [],//直接传入数据
            table: null, //dom
            // length: 20, //
            // appendPage: false, // 分页方式 true是内容往下叠加, false为刷新表格
            sort: 1,
            move: false,
            indexColMulti: true,
            indexCol: null,
            pseudoCol: null,
            lockColNum: 0,
            lockRow: false,        // 是否锁行
            lockRowTop: 0,         // 锁行距离顶部距离
            colResize: false,      // 列宽是否可调整
         //   dragSelect: false,     // 拖拽选中数据
            dragRows: false,       // 拖拽选中行
            expand: {
                enabled: false,                         // 是否启用
                cache: false,                           // 是否缓存(是否每次展开都执行render)
                icon: ['arrow-right', 'arrow-down'],    // 未展开|展开 图标
                mode: 'toggler',                        // 展开方式  toggler(独立展开)|accordion(排他展开)
                render: (row, index, callback) => {
                    callback();
                }      // 展开行的回调填充函数
            },
            multi: {
                enabled: false,
                cols: []
            },
            treegrid: {
                enabled: false,                         // 是否启用
                cache: false,                           // 是否缓存(是否每次展开都执行render)
                icon: ['arrow-right', 'arrow-down'],    // 未展开|展开 图标
                expand: (nodeData, index) => {
                    return true;
                },
                render: (nodeData, index, callback) => {
                    callback([]);
                }      // 展开行的回调填充函数
            },
            thead: false,
            colMenu: [],
            rowMenu: [],
            colGroup: false,
            // click: null,
            // clickSelector : null,
            textFormat: null,
            beforeShow: null,// param : trData, colsData, return: { tr : {attrs : value, ...} , td : [{attrs : value, ...}, ...]}
            onComplete: function () {

            },
            cellWidth: 70,       // 设置最小可拖拽宽度
            cellMaxWidth: null       // 设置初始加载最大宽度
        };

        this.ssid = tools.getGuid('');

        paraConf.expand && (paraConf.expand = <BT_Expand>tools.obj.merge(defaultConf.expand, paraConf.expand));
        paraConf.treegrid && (paraConf.treegrid = <BT_Treegrid>tools.obj.merge(defaultConf.treegrid, paraConf.treegrid));
        this.conf = <BT_Para>tools.obj.merge(defaultConf, paraConf);

        let conf = this.conf;
        this.table = conf.table;
        this.tableData = [];
        // self.currentPage = 0;

        // self.ajaxData = paraConf.ajaxData;
        this.tableWrapper = null;
        this.lockCol.table = null;

        this.table.classList.add('mobileTable');

        if(!this.table.tBodies.item(0)){
            d.append(this.table, document.createElement('tbody'))
        }
        
        let eventConf = this.getEventConf();

        this.menuEventName = eventConf.menuName;
        this.eventClickName = eventConf.clickName;
        this.mousemoveName = eventConf.mousemoveName;
        this.mouseoutName = eventConf.mouseoutName;
        this.mousedownName = eventConf.mousedownName;
        this.mouseupName = eventConf.mouseupName;

        this.nameCol = {};

        // 多行表头
        if (tools.keysVal(conf, 'multi', 'enabled')) {
            conf.multi.cols.forEach((col) => {
                col.forEach((cell) => {
                    this.nameCol[cell.name] = cell;
                });
            });
            // conf.cols = conf.multi.colsIndex;
        } else {
            conf.cols.forEach( (col) => {
                this.nameCol[col.name] = col;
            });
        }


        // 生成表头
        if (conf.thead || this.table.tHead === null) {
            this.theadRender();
        }

        this.wrapperInit();

        if (conf.indexCol) {
            this.indexColFun.init();
        }

        // 拖拽选中行
       /* if (conf.dragRows) {
            this.dragRowsFunc.init();
        }*/
        // 展开行
        if (conf.expand.enabled) {
            this.expandFunc.init();
        }
        // 伪列
        if (conf.pseudoCol) {
            this.pseudoColFun.init();
        }

        // 树形展开行
        if (conf.treegrid.enabled) {
            this.treegridFunc.init();
        }

        // 排序初始化
        if (conf.sort && conf.sort !== 0) {
            this.theadSort.on();
        }

        // 锁列初始化
        if (conf.lockColNum > 0) {
            this.lock.init();
        }

        // 锁头初始化
        if (conf.lockRow) {
            this.theadLock.init();
        }

        // 列宽拖拽
        if (conf.colResize) {
            this.colResizeFun.init();
        }

        // 行列拖动
        if (this.conf.move) {
            this.moveOn();
        }


        // 拖拽选择
      /*  if (typeof conf.dragSelect === 'function') {
            this.dragSelectFunc.init();
        }*/

        // 弹出菜单初始化
        let colMenu = conf.colMenu,
            rowMenu = conf.rowMenu;

        if ((colMenu && colMenu[0]) || (rowMenu && rowMenu[0])) {

            this.menu.popInit();
            this.menu.col.init('col');
            if(!tools.isMb) {
                this.menu.row.init('row',  (target) => {
                    if (!this.trSelected[0] || !this.trSelected[1]) {
                        this.rowSelect(<HTMLTableRowElement>target);
                    }
                });
            }
        }


        if (Array.isArray(conf.data)  && conf.data[0]) {
            this.data.set(conf.data);
            this.render(0, conf.data.length);
        }

    }

    getVisibleCol() {
        let visibleCol:string[] = [],
            status = this.colHide.status;

        for (let col of this.conf.cols) {
            let name = col.name;
            if(name in status){
                status[name] && visibleCol.push(name)
            }else{
                visibleCol.push(name)
            }
        }
        return visibleCol;
    }

    // 树形展开行
    protected treegridFunc = (function (self) {
        let _style = {
            hitInfo(td) {
                let hit = d.query('.tree-hit', td),
                    icon = self.conf.treegrid.icon;
                return {
                    hit,
                    icon
                };
            },
            iconOpen(td) {
                let info = this.hitInfo(td);
                info.hit.classList.remove(_getIcon(false));
                info.hit.classList.add(_getIcon(true));
                info.hit.classList.remove(_getIcon('loading'));
            },
            iconClose(td) {
                let info = this.hitInfo(td);
                info.hit.classList.remove(_getIcon(true));
                info.hit.classList.add(_getIcon(false));
                info.hit.classList.remove(_getIcon('loading'));
            },
            iconLoading(td) {
                let info = this.hitInfo(td);
                info.hit.classList.remove(_getIcon(false));
                info.hit.classList.add(_getIcon('loading'));
            },
            sysOpen(index) {
                let trIndex = _treeDom.getRootIndex(index);

                if (trIndex != null) {
                    // 计算展开的子项总条数
                    let startTr = d.query(`tr[data-index="${trIndex}"]`, self.table),
                        endTr = d.query(`tr[data-index="${trIndex + 1}"]`, self.table),
                        startTop = startTr.offsetTop,
                        endTop,
                        expandHeight = 0;

                    if (endTr) {
                        endTop = endTr.offsetTop;
                    }
                    else {
                        endTop = self.table.offsetHeight;
                    }
                    expandHeight = endTop - startTop;
                    self.sysColOpen(trIndex, expandHeight);
                }
            },
            sysClose(index) {
                if (!/^\d+$/.test(index)) {
                    this.sysOpen(index);
                }
                else {
                    let trIndex = _treeDom.getRootIndex(index);
                    if (trIndex != null) {
                        self.sysColClose(trIndex);
                    }
                }

            }
        };
        // 缓存树
        let _tree = {
            /*
             * 节点缓存结构：
             * 1: {
             *      level: 0,
             *      children: [
             *          1:{ data: {'field1':1,'field2':2,...}, children: [...], open: false, level: 1},
             *          2:{ data: {'field1':1,'field2':2,...}, children: [...], open: false, level: 1},
             *          ...
             *      ]
             * }
             * */
            getNodeIndex(index: string) {
                let NodeIndex = index.split('-');

                function getNode(indexs, data) {
                    if (indexs.length === 1) {
                        return data[indexs[0]];
                    }
                    else {
                        let childIndex = indexs.shift();
                        if (!data[childIndex] || !data[childIndex].children) {
                            return null;
                        }
                        else {
                            return getNode(indexs, data[childIndex].children);
                        }
                    }
                }

                return getNode(NodeIndex, self.treegrid.data);
            },
            addNodes(parentNode, newNodes, level) {
                let newData = [];

                /*function setNode(indexs, data, newData) {
                    if(indexs.length === 1) {
                        data[indexs[0]] = data[indexs[0]] || {};
                        data[indexs[0]].children = newData;
                        data[indexs[0]].open = false;
                        data[indexs[0]].level = level;
                    }
                    else {
                        let childIndex = indexs.pop();
                        setNode(indexs, data[childIndex].children, newData);
                    }
                }*/

                // 添加缓存数据
                newNodes.forEach((item) => {
                    newData.push({
                        data: item,
                        level,
                        open: false
                    });
                });
                parentNode.children = newData;
            },
            init(data) {
                // 根结点数据初始化
                self.treegrid.data = [];
                data.forEach((item, i) => {
                    self.treegrid.data[i] = {
                        open: false,
                        level: 0,
                        data: item
                    };
                });
            }
        };
        let _treeDom = {
            // 添加表格子项
            addChilds(index, newData) {
                let tableTr = d.query(`tr[data-index="${index}"]`, self.table),
                    toInsert = tableTr.nextSibling ? tableTr.nextSibling : null,
                    lockTableTr,
                    toLockInsert;

                if (self.conf.lockColNum > 0) {
                    lockTableTr = d.query(`tr[data-index="${index}"]`, self.lockCol.table);
                    toLockInsert = lockTableTr.nextSibling ? lockTableTr.nextSibling : null;
                }

                // 表格主体
                newData.forEach((item, i) => {
                    let TR = self.rowCreate(item, `${index}-${i}`);

                    if (toInsert) {
                        self.table.tBodies[0].insertBefore(TR, toInsert);

                    }
                    else {
                        self.table.tBodies[0].appendChild(TR);
                    }

                    // 锁列
                    if (self.conf.lockColNum > 0) {
                        let lockTR = self.lock.rowCreate(TR);

                        if (toLockInsert) {
                            self.lockCol.table.tBodies[0].insertBefore(lockTR, toLockInsert);
                        }
                        else {
                            self.lockCol.table.tBodies[0].appendChild(lockTR);
                        }
                    }
                });
            },
            // 获取根级index
            getRootIndex(index) {
                let findIndex = index.indexOf('-'),
                    rootIndex;
                if (!!~findIndex) {
                    rootIndex = index.substring(0, findIndex);
                }
                else {
                    rootIndex = index;
                }
                return parseInt(rootIndex);
            },
            // 获取上一级index
            getParentIndex(index) {
                let findIndex = index.toString().lastIndexOf('-');
                if (!!~findIndex) {
                    return index.substring(0, findIndex);
                }
                else {
                    return index;
                }
            },
            // 获取下一个同级节点
            getNextIndex(index) {
                let findIndex = index.toString().match(/(.*)-(\d+)/),
                    nextIndex;
                if (findIndex) {
                    let parent = findIndex[1],
                        child = parseInt(findIndex[2]) + 1;
                    nextIndex = `${parent}-${child}`;
                }
                else {
                    nextIndex = parseInt(index) + 1;
                }

                // 检查是否最后一个元素
                if (d.query(`tr[data-index="${nextIndex}"]`, self.table)) {
                    return nextIndex;
                }
                else if (!findIndex) {
                    // 最外层结束
                    return '';
                }
                else {
                    // 当前是最后一个子项，重新定位到父节点下一级
                    let parentIndex = this.getParentIndex(nextIndex);
                    return this.getNextIndex(parentIndex);
                }
            },
            /*
             * 移除|隐藏行
             * @param   index   目标index
             * @param   cache   是否开启缓存(缓存开启，隐藏行/无缓存，删除行)
             * */
            hideChilds(index, cache = false) {
                if (index) {
                    let startTr = <HTMLElement>d.query(`tr[data-index="${index}"]`, self.table),
                        nextIndex = this.getNextIndex(index),
                        nextTr = startTr;
                    while (nextTr = cache ? <any>nextTr.nextSibling : <any>startTr.nextSibling) {

                        let nextSIndex = nextTr.dataset.index;
                        if (nextSIndex === nextIndex.toString()) {
                            break;
                        }

                        if (cache) {
                            nextTr.style.display = 'none';
                            // 锁列
                            if (self.conf.lockColNum > 0) {
                                let lockTr = d.query(`tr[data-index="${nextSIndex}"]`, self.lockCol.table);
                                lockTr.style.display = 'none';
                            }
                        }
                        else {
                            d.remove(nextTr);
                            // 锁列
                            if (self.conf.lockColNum > 0) {
                                let lockTr = d.query(`tr[data-index="${nextSIndex}"]`, self.lockCol.table);
                                d.remove(lockTr);
                            }
                        }
                    }
                }
            }
        };

        function open(td, index) {
            let nodeData = _tree.getNodeIndex(index);
            _style.iconLoading(td);
            self.conf.treegrid.render(nodeData, index, (childData) => {
                nodeData.open = true;
                if (childData && childData.length > 0) {
                    // 更新缓存
                    _tree.addNodes(nodeData, childData, nodeData.level + 1);
                    // 添加dom
                    _treeDom.addChilds(index, childData);
                    // 更新伪列、序号行高
                    _style.sysOpen(index);
                }
                _style.iconOpen(td);
            });
        }

        function close(td, index) {
            let nodeData = _tree.getNodeIndex(index),
                cache = self.conf.treegrid.cache;
            nodeData.open = false;
            _style.iconClose(td);
            // 移除|隐藏行
            _treeDom.hideChilds(index, cache);
            // 更新伪列、序号行高
            _style.sysClose(index);

        }

        function _addChildRow(tr, rowData, level) {

        }

        function _mousedownHandle(event) {
            let e = self.getEvent(event),
                tr = d.closest(e.target, 'tr'),
                index = tr.dataset.index;

            if (index) {
                let td = d.closest(e.target, 'td'),
                    nodeData = _tree.getNodeIndex(index);

                if (nodeData.open) {
                    // 折叠行
                    close(td, index);
                }
                else {
                    // 展开行
                    open(td, index);
                }
            }
        }

        function _getIcon(status) {
            let icon;
            switch (status) {
                case false:
                    icon = self.conf.treegrid.icon[0];
                    break;
                case true:
                    icon = self.conf.treegrid.icon[1];
                    break;
                case 'loading':
                    icon = 'shuaxin1';
                    break;
            }
            return `icon-${icon}`;
        }

        function _bindEvent() {
            d.on(self.tableContainer, self.mousedownName, '.treegrid', _mousedownHandle);
        }

        function init() {
            update();
            _bindEvent();
        }

        function exchangeTd(treeGridTd, td) {
            if (self.conf.treegrid.enabled && td && td.tagName === 'TD') {
                let tdContent = td.innerHTML,
                    temp = tdContent;

                td.innerHTML = treeGridTd.innerHTML;
                treeGridTd.innerHTML = td.querySelector('.tree-title').innerHTML;
                td.querySelector('.tree-title').innerHTML = temp;
            }
        }

        function addBtn(index, td) {
            if (self.conf.treegrid.enabled && td && td.tagName === 'TD') {
                let nodeData = _tree.getNodeIndex(index.toString());

                if (nodeData) {
                    let indent = '',
                        level = <number>parseInt(nodeData.level),
                        text = td.innerHTML,
                        icon = _getIcon(nodeData.open),
                        treeBtn = '';
                    for (let i = 0; i < level; i++) {
                        indent += `<span class="tree-indent"></span>`;
                    }
                    if (self.conf.treegrid.expand(nodeData, index)) {
                        treeBtn = `<i class="tree-hit iconfont ${icon}"></i>`;
                    }
                    else {
                        treeBtn = `<i class="tree-hit-blank"></i>`;
                    }

                    td.innerHTML = `<div class="treegrid">${indent}${treeBtn}<span class="tree-title">${text}</span></div>`;
                }
            }
        }

        function removeBtn(td) {
            if (self.conf.treegrid.enabled) {
                let treegrid = d.query('.treegrid', td);
                if (treegrid) {
                    let treetitle = d.query('.tree-title');
                    td.innerHTML = treetitle.innerHTML;
                }
            }
        }

        // 一列添加展开按钮
        function add(col) {
            if (self.conf.treegrid.enabled) {
                let added = col[1] && d.query('.treegrid', col[1]);
                if (!added) {
                    col.forEach((item, i) => {
                        addBtn(i, item);
                    });
                }
            }
        }

        // 一列移除展开按钮
        function remove(col) {
            if (self.conf.treegrid.enabled) {
                let added = col[1] && d.query('.treegrid', col[1]);
                if (added) {
                    col.forEach((item) => {
                        removeBtn(item);
                    });
                }
            }
        }

        // 数据初始化更新
        function update(data: any[] = self.tableData) {
            _tree.init(data);
        }

        return {
            init,
            addBtn,
            add,
            removeBtn,
            remove,
            update,
            exchangeTd
        };
    }(this));

    protected expandFunc = ((function (self) {
        let arrow = {
            right: 'icon-arrow-right',
            down: 'icon-arrow-down',
            loading: 'icon-shuaxin1'
        };

        let _style = {
            show(target) {
                target.classList.remove(arrow.right);
                target.classList.add(arrow.down);
                target.dataset.status = '1';
            },
            hide(pseudoIndex, index, target) {
                let Container = _getExpandContainer(index),
                    expendRow;
                if (!Container) {
                    return;
                }
                expendRow = _getExpandRow(index);
                Container.style.display = 'none';
                expendRow.forEach((item) => {
                    item.style.display = 'none';
                });
                target.classList.add(arrow.right);
                target.classList.remove(arrow.down);
                target.dataset.status = '0';
                self.sysColClose(index);
                _style.ContainerUpdate();
            },
            loading(target) {
                target.classList.remove(arrow.right, arrow.down);
                target.classList.add(arrow.loading);
            },
            unloading(target) {
                target.classList.remove(arrow.loading);
                target.classList.add(arrow.down);
            },
            // 展开行top位置同步更新
            ContainerUpdate() {
                let Container = d.queryAll('.tableExpandContainer');
                Container.forEach((item) => {
                    let index = item.dataset.expandIndex,
                        targetRow = d.query(`tr[data-index="${index}"]`, self.table),
                        top = tools.offset.top(targetRow) + targetRow.offsetHeight - tools.offset.top(self.tableContainer);
                    item.style.top = `${top}px`;
                });
            }
        };

        /**
         * 把TR节点DOM 插入到 index位置
         * @param TR
         * @param index
         * @param table
         */
        function _rowInsertTo(index: number, TR: HTMLTableRowElement, table = self.table) {
            let toInsert = self.rowGet(index + 1, table);
            if (toInsert) {
                table.tBodies[0].insertBefore(TR, toInsert);
            }
            else {
                table.tBodies[0].appendChild(TR);
            }
        }

        function _getExpandContainer(index) {
            return <any>d.query(`div[data-expand-index="${index}"]`, self.tableContainer);
        }

        function _getExpandRow(index) {
            return <any>d.queryAll(`tr[data-expand-index="${index}"]`, self.tableContainer);
        }

        // 创建扩展行dom
        function _createRow(pseudoIndex, index, html) {
            let expendRow = _getExpandRow(index),
                Container = _getExpandContainer(index),
                ContainerHeight,
                sysColHeight;

            // 表格占位
            if (expendRow.length > 0) {
                expendRow.forEach((item) => {
                    item.style.display = 'table-row';
                });
                Container.style.display = 'block';
            }
            else {
                let row = <HTMLTableRowElement>document.createElement('tr');
                row.setAttribute('data-expand-index', index);
                _rowInsertTo(index, row);
                Container = d.create(`<div class="tableExpandContainer" data-expand-index="${index}"></div>`);
                self.tableContainer.appendChild(Container);
                expendRow.push(row);
                if (self.conf.lockColNum > 0) {
                    let lockRow = <HTMLTableRowElement>row.cloneNode(true);
                    _rowInsertTo(index, lockRow, self.lockCol.table);
                    expendRow.push(lockRow);
                }
            }
            Container.innerHTML = html;
            self.expand.toggler[index] = html;

            // 更新 索引列跟伪劣高度
            ContainerHeight = Container.offsetHeight;
            sysColHeight = ContainerHeight + self.cellHeight;
            expendRow.forEach((item) => {
                item.style.height = `${ContainerHeight}px`;
            });
            self.sysColOpen(index, sysColHeight);
            _style.ContainerUpdate();

        }

        function _expandRender(html, renderType = 'dl') {
            function renderDl(html) {
                let resultArr = [];
                for (let item in html) {
                    if (html.hasOwnProperty(item)) {
                        resultArr.push(`<dl class="tableExpandDl"><dt>${item}</dt><dd>${html[item]}</dd></dl>`);

                    }
                }
                return resultArr.join('');
            }

            let result = 'null';
            switch (renderType) {
                case 'dl':
                    result = renderDl(html);
                    break;
            }
            return result;

        }

        // 添加扩展行
        function _addRow(pseudoIndex, index, target, callback) {
            let expand = self.conf.expand,
                data = self.tableData[index],
                html;
            // 读取缓存
            if (expand.cache) {
                html = self.expand.toggler[index];
            }

            // 首次加载|未使用缓存
            if (typeof html === 'undefined') {
                if (expand.render) {
                    _style.loading(target);
                    expand.render(data, index, (html, renderType) => {
                        if (!html) {
                            html = data;
                        }
                        if (typeof html === 'object') {
                            let result = _expandRender(html, renderType);
                            _createRow(pseudoIndex, index, result);
                        }
                        else {
                            _createRow(pseudoIndex, index, html);
                        }
                        callback();
                        _style.unloading(target);
                    });
                }
                else {
                    _createRow(pseudoIndex, index, 'error');
                }
            }
            else {
                _createRow(pseudoIndex, index, html);
                callback();
            }
        }

        // 显示
        function _show(pseudoIndex, index, target) {
            _addRow(pseudoIndex, index, target, () => {
                _style.show(target);
            });

        }

        // 隐藏
        function _hide(pseudoIndex, index, target) {
            _style.hide(pseudoIndex, index, target);
        }

        // 展开/关闭
        function expandToggle(pseudoIndex, index, event) {
            let status = event.target.dataset.status;
            if (status) {
                if (status === '0') {
                    _show(pseudoIndex, index, event.target);
                }
                else {
                    _hide(pseudoIndex, index, event.target);
                }
            }
        }

        // 展开/关闭
        function expandAccordion(pseudoIndex, index, event) {
            let status = event.target.dataset.status,
                pseudoCol = d.queryAll(`.pseudoCol[data-pseudo="${pseudoIndex}"] [data-status="1"]`, self.pseudoCol.Container);

            pseudoCol.forEach((item) => {
                let pseudo = d.closest(item, '.pseudoCol-item'),
                    itemIndex = parseInt(pseudo.dataset.index);

                if (itemIndex != index) {
                    if (pseudo) {
                        _hide(pseudoIndex, itemIndex, d.query('.tableExpand', pseudo));
                    }

                }
            });

            if (status) {
                if (status === '0') {
                    _show(pseudoIndex, index, event.target);
                }
                else {
                    _hide(pseudoIndex, index, event.target);
                }
            }
        }

        function clickHandle(index, event) {
            let e = self.getEvent(event),
                pseudoCol = d.closest(e.target, '.pseudoCol'),
                pseudoIndex;
            if (!pseudoCol) {
                return;
            }
            pseudoIndex = pseudoCol.dataset.pseudo;

            index = parseInt(index);
            switch (self.conf.expand.mode) {
                case 'toggler':
                    expandToggle(pseudoIndex, index, e);
                    break;
                case 'accordion':
                    expandAccordion(pseudoIndex, index, e);
                    break;
            }

        }

        function createPseudoCol() {
            let expand = self.conf.expand;
            self.pseudoColFun.init({
                render: index => `<i class="iconfont tableExpand icon-${expand.icon[0]}" data-status="0"></i>`,
                click: clickHandle
            });
        }


        function init() {
            createPseudoCol();
        }

        return {
            init
        }
    })(this));

    private sysColOpen(index, height) {
        let pseudoCol = d.queryAll(`div[data-index="${index}"]`, this.pseudoCol.Container);
        pseudoCol.forEach((item) => {
            item.style.height = `${height}px`;
        });

        if (this.conf.indexCol) {
            let indexCol = d.query(`div[data-index="${index}"]`, this.indexCol.col);
            if (indexCol) {
                indexCol.style.height = `${height}px`;
            }
        }
    }

    private sysColClose(index) {
        let pseudoCol = d.queryAll(`div[data-index="${index}"]`, this.pseudoCol.Container);
        pseudoCol.forEach((item) => {
            item.style.height = `${this.cellHeight}px`;
        });

        if (this.conf.indexCol) {
            let indexCol = d.query(`div[data-index="${index}"]`, this.indexCol.col);
            if (indexCol) {
                indexCol.style.height = `${this.cellHeight}px`;
            }
        }
    }


    public getEvent(event) {
        return event.changedTouches ? event.changedTouches[0] : event;
    }

    private checkHidden() {
        let self = this;
        self.tableStatus = self.table.offsetWidth !== 0;
        return self.tableStatus;
    }



    /**
     * 行列拖动
     * @protected
     * @author yrh
     */
    protected moveOn() {
        this.moveEvent.col();
        this.moveEvent.row();
    }

    public moveEvent = (function (self) {

        /**
         * 列拖动
         * @private
         * @author yrh
         */
        function col() {
            let mousedownHandle = function (event) {
                let target = event.target,
                    columnRect, moveTable, columnIndex,
                    docWidth = document.body.scrollWidth,
                    movingRect = null,
                    rectInfo = null,
                    show = false,
                    lastMoveIndex,
                    timeOut, scrollTime, delay = false,
                    boundaryLeft = 0,
                    boundaryRight = 0;

                if (event.which !== 1) {
                    // 只有左键单击触发
                    return;
                }


                function getRectInfo() {
                    let info = {locktable: [], table: []};
                    if (self.conf.lockColNum > 0) {
                        d.queryAll('th', self.lockCol.table.tHead).forEach(item => {
                            let rect = item.getBoundingClientRect();
                            info.locktable.push([rect.left, rect.right]);
                        })
                    }
                    d.queryAll('th', self.table.tHead).forEach(item => {
                        let rect = item.getBoundingClientRect();
                        info.table.push([rect.left, rect.right]);
                    });

                    return info;
                }

                /**
                 * 获取当前鼠标悬停的列（非起始列）
                 * @private
                 * @author yrh
                 */
                function getHoverCol(x, rect): null | number {
                    let lockRight = 0,
                        result = null,
                        index = null;
                    if (
                        (x > rect.left && x < rect.right) ||
                        !rectInfo ||
                        x < rectInfo.table[0][0] ||
                        x > rectInfo.table[rectInfo.table.length - 1][1] ||
                        x > docWidth
                    ) {
                        //console.log((x>rect.left && x<rect.right), !rectInfo, x<rectInfo.table[0][0], x>rectInfo.table[rectInfo.table.length-1][1], x>docWidth);
                        return result;
                    }
                    else {
                        for (let i = 0, l = rectInfo.locktable.length; i < l; i++) {
                            lockRight = rectInfo.locktable[i][1];
                            if (x > rectInfo.locktable[i][0] && x < rectInfo.locktable[i][1]) {
                                index = i;
                                return index;
                            }
                        }
                        if (index === null) {
                            index = 0;
                            for (let i = 0, l = rectInfo.table.length; i < l; i++) {
                                if (rectInfo.table[i][1] > lockRight) {
                                    if (x > rectInfo.table[i][0] && x < rectInfo.table[i][1]) {
                                        index = i;
                                        return index;
                                    }
                                }
                            }
                            if (index === 0) {
                                return result;
                            }
                        }
                    }
                    return index;
                    // console.log(x, rect.left, rect.right);

                }

                function scrollLeft() {
                    let left = self.tableMiddle.scrollLeft;
                    self.tableMiddle.scrollLeft = left > 0 ? (left - 5) : 0;
                    clearScroll();
                    scrollTime = setTimeout(scrollLeft);
                }

                function scrollRight() {
                    self.tableMiddle.scrollLeft += 5;
                    clearScroll();
                    scrollTime = setTimeout(scrollRight);
                }

                function clearScroll() {
                    scrollTime && clearTimeout(scrollTime);
                }

                // 超过边界，滚动条自动滑动
                function boundaryScroll(event) {
                    //console.log(event.clientX, boundaryLeft, boundaryRight);
                    if (event.clientX < boundaryLeft) {
                        //左边界
                        scrollLeft();
                    }
                    else if (event.clientX > boundaryRight) {
                        //右边界
                        scrollRight();
                    }
                    else {
                        clearScroll();
                    }
                }


                function mouseMove(event) {
                    event.preventDefault();
                    event = self.getEvent(event);
                    clearTimeout(self.move.timeout);
                    boundaryScroll(event);
                    let currentIndex,
                        left = (event.clientX - 10) - boundaryLeft,
                        index = parseInt(self.movingHoverColumn.dataset.index),
                        maxLeft = docWidth - movingRect.width - 10;

                    if (event.clientX > maxLeft) {
                        left = maxLeft;
                    }
                    currentIndex = getHoverCol(event.clientX, movingRect);
                    //self.movingHoverColumn.style.top = (event.pageY - 10) + 'px';
                    self.movingHoverColumn.style.top = '0px';
                    self.movingHoverColumn.style.left = left + 'px';
                    !show && (self.movingHoverColumn.style.display = 'block');
                    show = true;


                    // 延迟，解决抖动
                    if (index === null || currentIndex === null || (lastMoveIndex === currentIndex && delay)) {
                        return;
                    }
                    lastMoveIndex = index;
                    delay = true;
                    timeOut && clearTimeout(timeOut);
                    timeOut = setTimeout(() => {
                        delay = false;
                    }, 1000);

                    self.colInsertTo(index, currentIndex);
                    self.movingHoverColumn.dataset.index = currentIndex;
                    rectInfo = getRectInfo();
                    movingRect = {
                        left: rectInfo.table[currentIndex][0],
                        right: rectInfo.table[currentIndex][1]
                    };
                    movingRect.width = movingRect.right - movingRect.left;

                }


                const disabledCol = () => {
                    self.colGet(columnIndex, self.table).forEach(function (tr) {
                        tr.classList.add('col-disabled');
                    });
                    if (self.conf.lockColNum > 0) {
                        self.colGet(columnIndex, self.lockCol.table).forEach(function (tr) {
                            tr.classList.add('col-disabled');
                        });
                    }
                    if (self.conf.lockRow) {
                        self.colGet(columnIndex, self.lockRow.table).forEach(function (tr) {
                            tr.classList.add('col-disabled');
                        });
                    }
                    if (self.conf.lockColNum > 0 && self.conf.lockRow) {
                        self.colGet(columnIndex, self.lockRow.fixedTable).forEach(function (tr) {
                            tr.classList.add('col-disabled');
                        });
                    }

                };

                const mouseUp = () => {

                    d.queryAll('.col-disabled', this.tableWrapper).forEach(item => {
                        item.classList.remove('col-disabled');
                    });

                    clearScroll();
                    d.remove(self.movingHoverColumn);
                    d.off(document, self.mousemoveName, mouseMove);
                    d.off(document, self.mouseupName, mouseUp);
                    document.onselectstart = null;
                    document.ondragstart = null;
                    self.movingColumn = null;
                    self.moving = false;
                    movingRect = null;
                    rectInfo = null;
                    self.unlockScreen();

                    // 列分组事件重新绑定
                    if (self.conf.colGroup) {
                        self.colGroup.on();
                    }
                };

                const createMovingContainer = () => {
                    let thead = <Element>self.table.tHead.cloneNode(),
                        tbody = <Element>self.table.tBodies.item(0).cloneNode();
                    moveTable = <HTMLTableElement>self.table.cloneNode();
                    moveTable.removeAttribute('id');
                    moveTable.classList.remove('hideLock');
                    moveTable.appendChild(thead);
                    moveTable.appendChild(tbody);
                    self.movingHoverColumn.appendChild(moveTable);
                    self.tableWrapper.appendChild(self.movingHoverColumn);

                    //console.log(columnIndex);

                    self.colGet(columnIndex, self.table).forEach(function (item) {
                        let tr = document.createElement('tr'),
                            td = <Element>item.cloneNode(true);
                        td.classList.remove('col-disabled');
                        tr.appendChild(td);
                        if (item.tagName === 'TH') {
                            thead.appendChild(tr);
                        }
                        else if (item.tagName === 'TD') {
                            tbody.appendChild(tr);
                        }
                        if (!movingRect) {
                            movingRect = {};
                            movingRect.left = tools.offset.left(item);
                            movingRect.right = movingRect.left + item.offsetWidth;
                            movingRect.width = item.offsetWidth;
                        }

                        // PROFITRATIO
                        self.movingHoverColumn.setAttribute('data-index', self.colName2index(item.dataset.col) + '');
                        //console.log(item.dataset.col, self.colName2index(item.dataset.col));
                    });
                };

                if (self.conf.Container) {
                    boundaryLeft = tools.offset.left(self.conf.Container);
                    boundaryRight = boundaryLeft + self.conf.Container.offsetWidth;
                }
                else {
                    boundaryLeft = tools.offset.left(self.tableWrapper);
                    boundaryRight = boundaryLeft + self.tableWrapper.offsetWidth;
                }


                self.movingHoverColumn = d.query('.tableMovingContainer') || d.create('<div class="tableMovingContainer"></div>');
                self.lockScreen();
                document.onselectstart = function () {
                    return false;
                };
                document.ondragstart = function () {
                    return false;
                };
                self.timeOut = setTimeout(() => {
                    if (self.colResize.dragging) {
                        return;
                    }
                    while (target && target.tagName !== 'TH') {
                        target = target.parentNode;
                    }
                    self.movingColumn = target;

                    if (self.movingColumn) {
                        rectInfo = getRectInfo();
                        columnIndex = self.colName2index(self.movingColumn.dataset.col);
                        disabledCol();
                        createMovingContainer();
                        self.moving = true;
                        d.on(document, self.mousemoveName, mouseMove);
                        d.on(document, self.mouseupName, mouseUp);
                    }
                }, 300);

            };

            function mouseupHandle() {
                document.onselectstart = null;
                document.ondragstart = null;
                self.timeOut && clearTimeout(self.timeOut);
            }


            d.on(self.tableContainer, self.mousedownName, 'th', mousedownHandle);
            d.on(self.tableContainer, self.mouseupName, 'th', mouseupHandle);
        }

        /**
         * 行拖动
         * @private
         * @author yrh
         */
        function row() {
            let moveTable, movingRect, rectInfo,
                offsetTop, offsetLeft,
                maxTop = 0, lockLeft = 0, minTop = 0,
                docHeight,
                scrollTop = 0;


            /**
             * 行拖动事件
             * @private
             * @author yrh
             */
            let movedownHandle = function () {
                minTop = self.table.tHead.getBoundingClientRect().bottom;
                // 分组行
                if (self.conf.colGroup) {
                    minTop += 30;
                }
                if (self.conf.Container) {
                    // 表格内嵌容器，校正top
                    offsetTop = tools.offset.top(self.conf.Container);
                    minTop -= scrollTop;
                }
                else {
                    offsetTop = tools.offset.top(self.tableContainer);
                }

                self.lockScreen();
                offsetLeft = tools.offset.left(self.tableContainer);
                self.movingHoverRow = <HTMLDivElement>document.querySelector('.tableMovingContainer') || <HTMLDivElement>d.create('<div class="tableMovingContainer"></div>');

                function createMovingContainer() {
                    let tr = <HTMLElement>self.trMoveSelected.cloneNode(true),
                        tbody = <Element>self.table.tBodies.item(0).cloneNode();
                    tbody.appendChild(tr);
                    moveTable = <HTMLTableElement>self.table.cloneNode();
                    moveTable.removeAttribute('id');
                    moveTable.classList.remove('hideLock');
                    moveTable.appendChild(tbody);
                    self.movingHoverRow.appendChild(moveTable);
                    self.tableContainer.appendChild(self.movingHoverRow);
                    if (!movingRect) {
                        movingRect = {
                            top: tools.offset.top(self.trMoveSelected),
                            bottom: self.trMoveSelected.offsetHeight
                        }
                    }
                    self.movingHoverRow.setAttribute('data-index', tr.dataset.index);
                }

                function getRectInfo() {
                    let info = {locktable: [], table: []};
                    //scrollTop = self.conf.Container.scrollTop;
                    d.queryAll('tr', self.table.tBodies.item(0)).forEach( item => {
                        let top = tools.offset.top(item),
                            left = tools.offset.left(item);
                        info.table.push([top, top + item.offsetHeight]);
                        maxTop = top + scrollTop;
                        lockLeft = left;
                    });
                    return info;
                }

                /**
                 * 获取当前鼠标悬停的行（非起始列）
                 * @private
                 * @author yrh
                 */
                function getHoverRow(y, rect): null | number {
                    let lockBottom = 0,
                        result = null,
                        index = null,
                        deviation = self.conf.colGroup ? -1 : 0;
                    if (!rect) {
                        return;
                    }
                    if (
                        (y > rect.top && y < rect.bottom) ||
                        !rectInfo ||
                        y < rectInfo.table[0][0] ||
                        y > rectInfo.table[rectInfo.table.length - 1][1] ||
                        y > docHeight
                    ) {
                        return result;
                    }
                    else {
                        for (let i = 0, l = rectInfo.locktable.length; i < l; i++) {
                            lockBottom = rectInfo.locktable[i][1];
                            if (y > rectInfo.locktable[i][0] && y < rectInfo.locktable[i][1]) {
                                index = i;
                                return index + deviation;
                            }
                        }
                        if (index === null) {
                            index = 0;
                            for (let i = 0, l = rectInfo.table.length; i < l; i++) {
                                if (rectInfo.table[i][1] > lockBottom) {
                                    if (y > rectInfo.table[i][0] && y < rectInfo.table[i][1]) {
                                        index = i;
                                        return index + deviation;
                                    }
                                }
                            }
                            if (index === 0) {
                                return result;
                            }
                        }
                    }
                    return index + deviation;

                }

                function mouseMove(event) {
                    //event.preventDefault();
                    event = self.getEvent(event);
                    let currentIndex,
                        top = event.pageY - offsetTop - 15,
                        index = self.movingHoverRow.dataset.index;
                    scrollTop = 0;
                    clearTimeout(self.move.timeout);

                    if (self.conf.Container) {
                        // 表格内嵌容器，校正top
                        scrollTop = self.conf.Container.scrollTop;
                        top += scrollTop;
                    }

                    if (event.pageY > maxTop - scrollTop) {
                        top = maxTop - offsetTop - scrollTop;
                    }
                    //console.log(event.pageY, minTop, scrollTop, minTop-scrollTop);
                    if (event.pageY < minTop - scrollTop) {
                        top = minTop - offsetTop - scrollTop;
                    }

                    currentIndex = getHoverRow(event.pageY + scrollTop, movingRect);
                    self.movingHoverRow.style.left = (lockLeft - offsetLeft) + 'px';
                    self.movingHoverRow.style.top = top + 'px';
                    self.movingHoverRow.style.display = 'block';

                    if (currentIndex === null) {
                        return;
                    }
                    self.rowInsertTo(parseInt(index), currentIndex);
                    self.movingHoverRow.dataset.index = currentIndex;
                    movingRect = {
                        top: rectInfo.table[currentIndex][0],
                        bottom: rectInfo.table[currentIndex][1]
                    }
                }

                function mouseUp() {
                    self.unlockScreen();
                    d.queryAll('.col-disabled', self.tableWrapper).forEach(item => {
                        item.classList.remove('col-disabled');
                    });

                    d.remove(self.movingHoverRow);
                    d.off(document, self.mousemoveName, mouseMove);
                    d.off(document, self.mouseupName, mouseUp);
                    document.onselectstart = null;
                    document.ondragstart = null;
                    self.trMoveSelected = null;
                    movingRect = null;
                    rectInfo = null;

                    setTimeout(() => {
                        self.moving = false;
                    }, 10);
                }

                document.onselectstart = function () {
                    return false;
                };
                document.ondragstart = function () {
                    return false;
                };
                self.timeOut = setTimeout(() => {
                    let index = this.dataset.index ? parseInt(this.dataset.index) : -1;

                    self.trMoveSelected = self.rowGet(index);
                    docHeight = document.body.scrollHeight;
                    rectInfo = getRectInfo();
                    disabledRow();
                    createMovingContainer();
                    self.moving = true;
                    //rowMoveHide();
                    d.on(document, self.mousemoveName, mouseMove);
                    d.on(document, self.mouseupName, mouseUp);
                }, 300);
            };

            /**
             * disabled行样式
             * @private
             * @author yrh
             */
            const disabledRow = () => {
                let index = parseInt(self.trMoveSelected.dataset.index),
                    selectedRow;
                self.trMoveSelected.classList.add('col-disabled');
                selectedRow = self.rowGet(index, self.lockCol.table);
                selectedRow && selectedRow.classList.add('col-disabled');
                selectedRow = self.rowGet(index, self.lockRow.fixedTable);
                selectedRow && selectedRow.classList.add('col-disabled');
                selectedRow = self.rowGet(index, self.lockRow.table);
                selectedRow && selectedRow.classList.add('col-disabled');

            };

            function moveupHandle() {
                document.onselectstart = null;
                document.ondragstart = null;
                self.timeOut && clearTimeout(self.timeOut);
            }

            d.on(self.tableWrapper, self.mousedownName, 'div.indexCol-item', movedownHandle);
            d.on(self.tableWrapper, self.mouseupName, 'div.indexCol-item', moveupHandle);
        }

        return {col, row}
    })(this);


    protected unlockScreen = function () {
        let container = this.conf.Container,
            body = document.body;
        if (container) {
            container.style.overflowY = 'auto';
            //container.style.height = '';
        }

        this.tableMiddle.style.overflowX = 'auto';
        this.tableMiddle.style.width = '';
        body.style.overflow = '';
        body.style.height = '';
    };

    /**
     * 创建功能列
     * @param config
     * @returns {DocumentFragment}
     */
    private createSysCol(config: BT_SysCol) {
        let self = this,
            tmpDoc = document.createDocumentFragment();

        if (config.Container.firstElementChild === null) {
            let blankDiv = d.create('<div>全选</div>');
            if (self.theadHeight) {
                blankDiv.style.height = self.theadHeight + 'px';
                blankDiv.style.lineHeight = self.theadHeight + 'px';
            }
            tmpDoc.appendChild(blankDiv);

            if(this.conf.indexCol === 'select') {
                d.append(blankDiv, getCheckBox(self.ssid));
            }


            if (self.conf.colGroup) {
                tmpDoc.appendChild(document.createElement('div'));
            }
        }

        for (let i = 0; i < config.len; i++) {
            let index = i,
                textTemp;
            if (config.childNode) {
                index = index + config.start;
                if (typeof config.childNode === 'function') {
                    textTemp = config.childNode(index);
                }
                else {
                    let node = <string>config.childNode;
                    textTemp = node.toString();
                }

            }
            else {
                index = index + config.offset;
                textTemp = (index + 1).toString();
            }
            tmpDoc.appendChild(self.indexColDivGet(index, textTemp, config.colType));
        }
        return tmpDoc;
    }

    private indexColDivGet(index: number, text: any = '', colType = 'index') {
        let div = document.createElement('div');
        div.classList.add(`${colType}Col-item`);
        if (typeof text === 'string') {
            div.innerHTML = text;
            div.title = text;
        } else {
            div.appendChild(text);
        }

        div.dataset['index'] = index + '';
        return div;
    }

    public indexColFun = (function (self) {
        let lockFixedIndexCol: HTMLDivElement = null; // 左上角锁头序列号

        /**
        /**
         * 序号列渲染
         * @param len - 长度
         * @param refresh - 刷新还是外后附加
         */
        // function render(len : number, refresh : boolean){
        //     let tmpDoc,
        //         offset = 0, // 显示开始的数字
        //         plus = 0; // data-index开始的数字
        //     if(refresh){
        //         self.indexCol.col.innerHTML = '';
        //     }else{
        //         offset = self.tableData.length;
        //     }
        //     if(!refresh || self.bodyRenderRefresh) {
        //         plus = (self.currentPage - 1) * self.conf.length;
        //     }
        //     tmpDoc = createIndexCol(offset, len, plus);
        //     self.indexCol.col.appendChild(tmpDoc);
        // }

        let init = () => {
            let html = '<div class="indexCol"></div>';

            self.indexCol.col = <HTMLDivElement>d.create(html);
            self.tableWrapper.appendChild(self.indexCol.col);
            self.tableWrapper.classList.add('hasIndexCol');
            self.indexCol.width = self.indexCol.col.getBoundingClientRect().width;

            d.on(self.tableWrapper, self.eventClickName, 'div.indexCol > div', function () {
                let index = this.dataset.index ? parseInt(this.dataset.index) : -1,
                    allRow = self.rowGetAll();

                if (index === -1 && self.conf.indexColMulti) {
                    let isAllSelect = allRow.length === self.trSelected.length;
                    if (self.conf.indexCol === 'select') {
                        checkSelect(this, !isAllSelect);
                    }

                    allRow.forEach(tr => {
                        isAllSelect ? self.rowDeselect(tr) : self.rowSelect(tr, true);
                    });
                    this.innerHTML = isAllSelect ? '全选' : '取消';

                    return;
                    // self.rowSelect();
                }

                let tr = self.rowGet(index);

                if (self.conf.indexColMulti) {
                    self.rowToggle(tr);
                } else {
                    if (self.trSelected[0] === tr) {
                        self.rowDeselect(tr);
                    } else {
                        self.rowSelect(tr)
                    }
                }

                checkSelect(<HTMLElement>self.indexCol.col.firstChild, allRow.length === self.trSelected.length);

            });

            // self.on('page', function (e:CustomEvent) {
            //
            //     let start = (self.currentPage - 1 ) * self.conf.length;
            //     render(start, e.detail.len, e.detail.type ==='refresh' || !self.conf.appendPage);
            // });

            if (self.conf.indexCol === 'select') {

                self.on('rowSelect', (e: CustomEvent) => {
                    let detail = e.detail;
                    setTimeout(() => {
                        detail.indexes.forEach(index => {

                            checkSelect(d.query(`div[data-index="${index}"]`, self.indexCol.col), detail.select);

                            // let input = <HTMLInputElement>d.query(`div[data-index="${index}"] > .select-box input`, self.indexCol.col);
                            //
                            // input.checked = detail.select;
                        })
                    }, 10);

                });
            }

            function checkSelect(indexColDiv: HTMLElement, isSelect: boolean) {
                let input = <HTMLInputElement>d.query('.select-box input', indexColDiv);
                input && (input.checked = isSelect);

            }

        };

        /**
         * 序号列渲染
         * @param {number} start
         * @param {number} len
         * @param {boolean} refresh
         */
        function render(start: number, len: number, refresh: boolean) {
            let offset = start, colType = 'index';
            if (refresh) {
                self.indexCol.col.innerHTML = '';
                start = 0;
            }
            let childNode = self.conf.indexCol === 'select' ? () => getCheckBox(self.ssid) : null;

            let tmpDoc = self.createSysCol({
                Container: <HTMLDivElement>self.indexCol.col,
                offset,
                len,
                start,
                colType,
                childNode
            });
            if (self.table.tBodies.item(0).firstElementChild !== null) {
                self.indexCol.show = true;
            }
            self.indexCol.col.appendChild(tmpDoc);
        }


        /**
         * 固定行序号列渲染
         */
        function refreshIndex() {
            d.queryAll('div:not(.hide)', self.indexCol.col).forEach((div, i) => {
                div.innerHTML = i === 0 ? '' : i.toString();
            });
        }

        function show(flag:boolean){
            if (self.indexCol.col) {
                self.indexCol.show = flag;
                self.indexCol.col.classList[flag ? 'remove' : 'add']('hide');
                self.tableWrapper.classList[!flag ? 'remove' : 'add']('hasIndexCol');
                self.pseudoColFun.resize();
                self.resize();
            }
        }

        return {
            render,
            refreshIndex,
            init,
            show,
            fixedRender() {
                let _indexItem = d.create('<div>全选</div>');

                if (!lockFixedIndexCol) {
                    lockFixedIndexCol = <HTMLDivElement>self.indexCol.col.cloneNode();
                }
                lockFixedIndexCol.innerHTML = '';
                lockFixedIndexCol.appendChild(_indexItem);
                self.lockRow.fixed.querySelector('.Container').appendChild(lockFixedIndexCol);

            },
            divGet: self.indexColDivGet
        }
    })(this);


    protected pseudoColFun = (function (self) {

        /**
         * 序号列渲染
         * @param {number} start
         * @param {number} len
         * @param {boolean} refresh
         *
         */
        function render(start: number, len: number, refresh: boolean) {
            let offset = start, colType = 'pseudo';
            self.pseudoCol.confList.forEach((item) => {
                let childNode = item.render;
                if (refresh) {
                    item.col.innerHTML = '';
                    offset = 0;
                }

                let tmpDoc = self.createSysCol({
                    Container: item.col,
                    offset,
                    len,
                    start,
                    colType,
                    childNode
                });

                item.col.appendChild(tmpDoc);
            });


            resize();
        }

        /*function render(start: number, len: number, refresh: boolean) {
            let offset = start, colType = 'index';
            if(refresh) {
                self.indexCol.col.innerHTML = '';
                offset = 0;
            }
            let childNode = self.conf.indexCol === 'select' ? () => {
                let checkbox = CheckBox.initCom(self.ssid);
                checkbox.classList.add('circle');
                d.off(d.query('.check-span', checkbox));
                return checkbox;
            } : null;

            let tmpDoc = self.createSysCol({
                Container: <HTMLDivElement>self.indexCol.col,
                offset,
                len,
                colType,
                childNode
            });

            self.indexCol.col.appendChild(tmpDoc);
        }*/

        function width() {
            let indexWidth = 0,
                pseudoWidth = 0,
                tableLeft;

            if (self.indexCol.show && self.indexCol.col) {
                indexWidth = self.indexCol.col.offsetWidth;
            }
            if (self.pseudoCol.show && self.pseudoCol.Container) {
                pseudoWidth = self.pseudoCol.Container.offsetWidth;
            }
            tableLeft = indexWidth + pseudoWidth;
            return {
                indexWidth,
                pseudoWidth,
                tableLeft
            };
        }

        function resize() {

            let size = width();

            self.tableContainer.style.left = size.tableLeft === 0 ? '' : `${size.tableLeft}px`;
            self.tableContainer.style.width = size.tableLeft === 0 ? '' : `calc(100% - ${size.tableLeft}px)`;

            self.pseudoCol.Container ? self.pseudoCol.Container.style.left = `${size.indexWidth}px` : 0;
            if (self.lockRow.fixedTable && self.lockRow.Container) {
                let pseudoCol = d.query('.pseudoContainer', self.lockRow.Container);
                if (pseudoCol) {
                    pseudoCol.style.left = `${size.indexWidth}px`;
                }
            }
            if (self.lockRow.Container) {
                self.lockRow.Container.style.width = (self.tableContainer.offsetWidth - size.tableLeft) + 'px';
            }
        }

        function destroy() {
            d.remove(self.pseudoCol.fixedCol);
            self.pseudoCol.fixedCol = null;
        }

        return {
            init(config?) {
                let conf = self.conf;

                !config && (config = conf.pseudoCol);
                config.width || (config.width = self.pseudoCol.width);
                config.index = self.pseudoCol.confList.length;
                self.pseudoCol.confList.push(config);

                if (!self.pseudoCol.Container) {
                    self.pseudoCol.Container = <HTMLDivElement>d.create(`<div class="pseudoContainer"></div>`);
                    self.tableWrapper.appendChild(self.pseudoCol.Container);
                    self.tableWrapper.classList.add('hasPseudoCol');
                    d.on(self.tableWrapper, self.mousedownName, 'div.pseudoCol-item', function (event: any) {
                        let e = self.getEvent(event),
                            pseudoIndex = parseInt(d.closest(e.target, '.pseudoCol').dataset.pseudo),
                            clickHandle = self.pseudoCol.confList[pseudoIndex].click;
                        clickHandle && clickHandle(this.dataset.index, event);
                    });
                    // self.on('pseudoColPage', function (e:CustomEvent) {
                    //     let start = (self.currentPage -1 ) * self.conf.length;
                    //     render(start, start + e.detail.len, !self.conf.appendPage);
                    // });
                }

                config.col = <HTMLDivElement>d.create(`<div class="pseudoCol" data-pseudo="${config.index}"></div>`);
                config.col.style.width = config.width + 'px';
                self.pseudoCol.Container.appendChild(config.col);

                resize();

                this.fixedRender();
                self.theadSizeSync();

            },

            fixedRender() {
                if (!self.lockRow.fixed) {
                    return;
                }

                let len = self.pseudoCol.confList.length;
                if (!self.pseudoCol.fixedCol) {
                    self.pseudoCol.fixedCol = <HTMLDivElement>self.pseudoCol.Container.cloneNode();
                    self.lockRow.fixed.querySelector('.Container').appendChild(self.pseudoCol.fixedCol);
                }
                self.pseudoCol.fixedCol.innerHTML = '';

                for (let i = 0; i < len; i++) {
                    let _indexItem = d.create(`<div class="pseudoCol"><div></div></div>`);
                    self.pseudoCol.fixedCol.appendChild(_indexItem);
                }
            },
            width,
            render,
            destroy,
            resize
        }
    })(this);

    protected menu = (function (self) {

        let menuFun = self.menuConfGet();

        /**
         * 菜单弹出事件绑定
         * @param conf - 默认配置
         * @param clickCb - 显示菜单时的回调函数
         */
        function initMenu(conf: BT_MenuConf, clickCb?: (target: HTMLElement) => void) {
            let identifier: string = conf.identifier,
                btns = conf.btns,
                //点击菜单按钮后 返回的相应dom数组
                targets: HTMLElement[],
                target: HTMLElement;

            let menuHandler = function (e:Event) {
                clickCb(this);

                if ('eventHandle' in conf) {
                    conf.eventHandle(this, e);
                }

                targets = conf.targetGet(this);
                target = <HTMLElement>(e.target);

                if (self.popMenuDom.dataset.identifier === identifier) {
                    self.popMenu.show(identifier);
                } else {
                    self.popMenu.show(identifier, btns, (btn: BT_Btn, menuDom) => {
                        if (typeof btn.callback === 'function') {
                            btn.callback(btn, targets, target);
                        }
                    });
                    self.popMenuDom.dataset.identifier = identifier;
                }

            };
            return {
                on() {
                    d.on(self.tableWrapper, self.menuEventName, conf.targetSelector, menuHandler);
                },
                off() {
                    d.off(self.tableWrapper, self.menuEventName, conf.targetSelector, menuHandler);
                }
            }
        }

        let getFuns = function () {
            let on = () => {
                },
                off = () => {
                },
                init = function (type: string, clickCb = (target: HTMLElement) => {
                }) {

                    let menuConf = type === 'row' ? menuFun.rowConfGet() : menuFun.colConfGet();

                    if (!menuConf.btns[0]) {
                        return;
                    }

                    let fun = initMenu(menuConf, clickCb);
                    on = fun.on;
                    off = fun.off;

                    on();
                };

            return {on, off, init}

        };


        return {
            row: getFuns(),

            col: getFuns(),

            popInit: function () {

                let menuListDom: HTMLElement = null,
                    currentCallback: (btn: BT_Btn, target?: HTMLElement) => void,
                    currentBtns = [],
                    btnSelector = 'data-action="tableMenuBtn"';


                function setBtn(btns: BT_Btn[]) {
                    let itemHtml = menuFun.btnHtmlGet(btns);
                    menuListDom.innerHTML = itemHtml;
                }

                self.popMenuDom = menuFun.popDomGet();
                menuListDom = menuFun.listDomGet(self.popMenuDom);

                menuFun.init();


                let clickHandler = function () {
                    let index: number = parseInt(this.dataset.index),currentBtn : BT_Btn;
                    let rootArr = [];
                    function getRoot(curDom :HTMLElement){
                          let par = curDom.parentElement.parentElement;
                          if(par.classList.contains('listItem')){
                              rootArr.unshift(parseInt(par.dataset.index));
                              getRoot(par);
                          }
                    }
                    getRoot(this);
                    rootArr.push(index);
                    currentBtn = currentBtns[rootArr[0]]
                    for(let i = 1;i < rootArr.length;i++){
                            currentBtn.children && (currentBtn = currentBtn.children[rootArr[i]]);
                    }
                    if(!this.classList.contains('disabled')){
                        currentCallback(currentBtn, this);
                        menuFun.hide();
                    }

                    // self.rowDeselect();
                };

                let eventOn = function () {
                    d.on(menuListDom, self.eventClickName, `[${btnSelector}]`, clickHandler);
                };
                let eventOff = function () {
                    d.off(menuListDom, self.eventClickName, `[${btnSelector}]`, clickHandler);
                };

                eventOn();
                self.popMenu = {
                    show: function (identifier: string, btns: BT_Btn[] = null, btnHandle = null) {
                        //跟上次打开不一样的菜单时才需要重新生成菜单
                        if (Array.isArray(btns) && typeof btnHandle === 'function') {
                            setBtn(btns);
                            currentCallback = btnHandle;
                            currentBtns = btns;
                        }

                        // 多选单选按钮控制
                        let isMulti = self.trSelected[1];
                        currentBtns.forEach(function (btn, i) {
                            if (!btn.multi) {
                                let btnDom = menuListDom.querySelector(`[${btnSelector}][data-index="${i}"]`);
                                isMulti ? btnDom.classList.add('disabled') : btnDom.classList.remove('disabled');
                            }
                        });

                        menuFun.show();
                    },
                    hide: function () {
                        menuFun.hide();
                    }
                };
            }

        }
    }(this));

    /**
     * 渲染表格主体
     * @param dataArr
     * @param isRefresh
     * @param startIndex
     * @param highlight
     * @private
     */
    protected tbodyRender(dataArr:obj[], isRefresh: boolean, startIndex = 0, highlight = '') {
        let trArray = [],
            tmpDoc = document.createDocumentFragment();

        //是否刷新
        if (isRefresh) {
            this.table.tBodies[0].innerHTML = '';
        }

        // //
        // if(!isRefresh || this.bodyRenderRefresh) {
        //     startIndex = (this.currentPage - 1) * this.conf.length;
        // }

        //判断是否为数组
        dataArr = Array.isArray(dataArr) ? dataArr : [];


        dataArr.forEach((data, i) => {
            trArray.push(this.rowCreate(data, i + startIndex, highlight));

        });


        // 添加列分组
        if (this.conf.colGroup) {
            trArray.unshift(this.colGroup.rowCreate(dataArr));
        }

        //添加到tbody
        trArray.forEach((tr) => {
            tmpDoc.appendChild(tr)
        });

        let highIndex = 0;
        d.queryAll('td > span.red', tmpDoc).forEach(span => {
            let td = d.closest(span, 'td');
            if(td && !('highIndex' in td.dataset)){
                td.dataset.highIndex = highIndex + '';
                highIndex ++;
            }
        });


        this.table.tBodies[0].appendChild(tmpDoc);
        if(!tools.keysVal(this.conf, 'multi', 'enabled')) {
            if (this.conf.lockColNum > 0) {
                this.lock.render(trArray, isRefresh);
            }
            if (this.conf.lockRow) {
                // 锁头更新
                this.theadLock.render();
            }
        }

        // 为列分组添加事件
        if (this.conf.colGroup) {
            this.colGroup.on();
        }

        this.noData.isShow();
        this.theadSizeSync();

    }

    protected noData = (() => {
        let noDataEl: HTMLElement = null;

        let isShow = () => {
            if(this.table.tBodies.item(0).firstElementChild === null) {
                if (!noDataEl) {
                    noDataEl = createNoDataEl();
                    d.after(this.table, noDataEl);
                    isShowIndexCol(false);
                }
            } else {
                if (noDataEl) {
                    d.remove(noDataEl);
                    noDataEl = null;
                    isShowIndexCol(true);
                }
            }
        };

        let isShowIndexCol = (flag: boolean) => {
            if(!this.pseudoCol.show){
                return;
            }
            if (this.indexCol.col && this.pseudoCol.Container) {
                this.pseudoCol.Container.classList[flag ? 'remove' : 'add']('hide');
                this.tableWrapper.classList[flag ? 'add' : 'remove']('hasPseudoCol');
            }
            // if (this.pseudoCol.Container) {
            //     // this.pseudoCol.show = flag;
            //     this.pseudoCol.Container.classList[flag ? 'remove' : 'add']('hide');
            //     this.tableWrapper.classList[flag ? 'add' : 'remove']('hasPseudoCol');
            // }
        };

        function createNoDataEl (){
            return d.create('<div class="nodata no-padding"><span class="iconfont icon-gongyongwushuju"></span></div>');
        }

        return {isShow};
    })();

    /**
     * 初始化表格Wrapper
     * @private
     */
    private wrapperInit() {
        let t = this.table;

        let tableWrapper = <HTMLDivElement>d.create(
            `<div class="mobileTableWrapper" tabindex="${this.ssid}"><div class="tableContainer">` +
            '<div class="mobileTableMiddle"></div></div></div>');

        this.table.parentNode.replaceChild(tableWrapper, this.table);

        this.tableContainer = <HTMLDivElement>tableWrapper.querySelector('.tableContainer');
        this.tableMiddle = <HTMLDivElement>this.tableContainer.querySelector('.mobileTableMiddle');
        this.tableMiddle.appendChild(t);

        this.tableWrapper = tableWrapper;
    }

    protected colGroup = (() => {
        let colGroupFilter:obj = {}, // 已选分组过滤条件
            colGroupArr:objOf<any[]> = {}, // 用于缓存列分组下拉菜单信息
            colGroupData:obj[] = []; // 用于备份表格原始数据

        /**
         * 创建列分组功能行
         * @param data
         * @return {HTMLTableRowElement}
         */
        let rowCreate = (data: objOf<any[]>): HTMLTableRowElement  => {

            let trDom = document.createElement('tr');
            trDom.classList.add('colGroup');

            this.conf.cols.forEach(col => {
                let name = col.name;
                if (!this.colHide.ready || this.colHide.status[col.name]) { // 隐藏列
                    if (!(name in data)) {
                        data[name] = null;
                    }

                    let selectArr = data[name],
                        tdDom = document.createElement('td'),
                        tdContent = groupCreate(name, selectArr);

                    //td默认属性
                    tdDom.dataset.col = name;
                    tdDom.classList.add('td-select', this.cellClass(name));

                    tdContent && tdDom.appendChild(tdContent);

                    trDom.appendChild(tdDom);
                }
            });

            return trDom;
        };

        /**
         * 创建列分组select单元格
         * @param name   列name
         * @param arr    下拉选项
         */
        let groupCreate = (name: string, arr: any[]) => {

            if(!Array.isArray(arr)){
                return;
            }
            let selectHTML = document.createElement('select');


            arr.sort((a, b) => {
                return b - a;
            });

            // tdContent.classList.add('td-content', 'td-select', this.cellClass(name));
            selectHTML.appendChild(d.create('<option></option>'));

            arr.forEach(item => {
                if (item != '') {
                    let option = document.createElement('option'),
                        text = document.createTextNode(item);
                    option.appendChild(text);
                    option.setAttribute('value', item);
                    selectHTML.appendChild(option);
                }
            });
            selectHTML.setAttribute('data-col', name);
            // tdContent.appendChild(selectHTML);
            return selectHTML;
        };

        let on = () => {
            let selectList = <HTMLSelectElement[]>d.queryAll('.colGroup select', this.tableWrapper),
            self = this;

            function changeHandler() {
                let col = this.dataset.col,
                    result = [];

                colGroupFilter[col] = this.value;

                colGroupData.forEach((item) => {
                    let check = true;
                    for (let filter in colGroupFilter) {
                        if (item[filter] && colGroupFilter[filter] != '' && item[filter].toString() != colGroupFilter[filter]) {
                            check = false;
                        }
                    }
                    check && (result.push(tools.obj.merge({}, item)));
                });

                let length = result.length;
                self.tableData = result;
                self.indexColFun.render(0, length, true);
                self.pseudoColFun.render(0, length, true);
                self.tbodyRender(self.tableData, true);
            }

            selectList.forEach(sel => {
                let colName = sel.dataset.col;
                sel.selectedIndex = -1;
                d.off(sel, 'change', changeHandler);
                d.on(sel, 'change', changeHandler);

                // 设置默认选中
                if (colGroupFilter && colName in colGroupFilter) {
                    tools.selVal(sel, colGroupFilter[colName]);
                }
            });
        };

        let clear = () => {
            colGroupData = [];
            colGroupFilter = {};
            colGroupArr = {};
        };

        let dataCreate = (dataArr: obj[]) => {
            if (!colGroupData[0]) {

                dataArr.forEach(data => {

                    // 保存数据，用于列分组
                    for (let s in data) {
                        colGroupArr[s] = colGroupArr[s] || [];
                        if (!~colGroupArr[s].indexOf(data[s])) {
                            colGroupArr[s].push(data[s]);
                        }
                    }
                });

                colGroupData = dataArr;
            }
        };

        return{
            on,
            clear,
            rowCreate: (dataArr: obj[]) => {
                dataCreate(dataArr);
                return rowCreate(colGroupArr);
            }
        }

    })();

    // 列分组事件
    // protected colGroupEvent() {
    //     let self = this,
    //         selectList = d.queryAll('.colGroup select', self.tableWrapper);
    //
    //     function changeHandlefunction(event) {
    //         let val = this.value,
    //             col = this.dataset.col,
    //             result = [];
    //         debugger;
    //         self.colGroupFilter = self.colGroupFilter || {};
    //         self.colGroupFilter[col] = val;
    //         self.colGroupData.forEach((item) => {
    //             let check = true;
    //             for (let filter in self.colGroupFilter) {
    //                 if (self.colGroupFilter.hasOwnProperty(filter)) {
    //                     if (item[filter] && self.colGroupFilter[filter] != '' && item[filter].toString() != self.colGroupFilter[filter]) {
    //                         check = false;
    //                     }
    //                 }
    //             }
    //             check && (result.push(tools.obj.merge({}, item)));
    //         });
    //         self.tableData = result;
    //         self.indexColFun.render(0, self.tableData.length, true);
    //         self.pseudoColFun.render(0, self.tableData.length, true);
    //         self.tbodyRender(self.tableData, true);
    //     }
    //
    //     Array.prototype.forEach.call(selectList, function (sel) {
    //         let colName = sel.dataset.col;
    //         sel.selectedIndex = -1;
    //         d.off(sel, 'change', changeHandlefunction);
    //         d.on(sel, 'change', changeHandlefunction);
    //
    //         // 设置默认选中
    //         if (self.colGroupFilter && typeof self.colGroupFilter[colName] != 'undefined') {
    //             tools.selVal(sel, self.colGroupFilter[colName]);
    //         }
    //     });
    // }
    //
    // private clearColGroup() {
    //     let self = this;
    //     self.colGroupData = null;
    //     self.colGroupFilter = null;
    // }

    /**
     * 获取某一列的cells ，
     * @param index
     * @param table
     * @return {HTMLTableCellElement[]} //item(0) 为表头的cell
     *
     */
    protected colGet(index: number, table: HTMLTableElement = this.conf.table): HTMLTableCellElement[] {
        if (!table) {
            return null;
        } else {
            return <HTMLTableCellElement[]>d.queryAll(`tr > *:nth-child(${index + 1})`, table);
        }
    }


    /**
     * 删除一列 (只针对DOM操作，不删除conf.cols中的数据)
     * @param index
     * @param table
     * @return {HTMLTableCellElement[]} - 返回删除的col
     * @private
     */
    protected colDel(index: number, table = this.table): HTMLTableCellElement[] {
        let cells = this.colGet(index, table);
        for (let cell of cells) {
            d.remove(cell);
        }
        return cells;
    }

    /**
     * 添加一列 (只针对DOM操作，不删除conf.cols中的数据)
     * @param index 插入的位置
     * @param newCol 新的列
     * @param table 添加到哪个表(table, lockTable)
     * @private
     */
    private colAdd(index: number, newCol: HTMLTableCellElement[], table = this.table) {
        let toInsert = this.colGet(index + 1, table);
        if (toInsert[0]) {
            toInsert.forEach(function (insert, i) {
                insert.parentNode.insertBefore(insert.cloneNode(true), newCol[i]);
            });
        } else {
            Array.prototype.forEach.call(table.querySelectorAll('tr'), function (tr, i) {
                tr.appendChild(newCol[i].cloneNode(true));
            });
        }
    }


    /**
     * 把oldIndex 位置的列插入到 newIndex位置
     * @param oldIndex
     * @param newIndex
     * @return {HTMLTableCellElement[]}
     */
    public colInsertTo(oldIndex: number, newIndex: number, forLock = false): HTMLTableCellElement[] {
        let self = this,
            confCols = this.conf.cols, confColsLen = confCols.length;
        if (this.colHide.ready) {  // 隐藏列校正
            let len = 0,
                status = this.colHide.status;
            for (let i in status) {
                if (status.hasOwnProperty(i) && status[i]) {
                    len++;
                }
            }
            confColsLen = len;
        }
        if (!( oldIndex >= 0 && oldIndex < confColsLen && newIndex >= 0 && newIndex < confColsLen )) {
            return [];
        }

        let replaced = this.colGet(oldIndex);
        if (oldIndex == newIndex) {
            return replaced;
        }
        let lockRowreplaced = this.colGet(oldIndex, this.lockRow.table);

        //cols


        let toOldIndex = this.col.hideIndex2Index(oldIndex),
            toNewIndex = this.col.hideIndex2Index(newIndex),
            delCol = confCols.splice(toOldIndex, 1),
            treeGrigCol;

        if (self.conf.treegrid.enabled) {
            treeGrigCol = this.colGet(0);
        }

        confCols.splice(toNewIndex, 0, delCol[0]);

        //如果newIndex > oldIndex 则需要插入到 newIndex后一位的前面
        let toInsert = this.colGet(newIndex + (newIndex > oldIndex ? 1 : 0)),
            toRowInsert = this.colGet(newIndex + (newIndex > oldIndex ? 1 : 0), this.lockRow.table);

        if (newIndex === confColsLen - 1) {
            replaced.forEach(function (cell, i) {
                cell.parentNode.appendChild(cell);
                // 展开行，展开按钮交换
                if (self.conf.treegrid.enabled) {
                    if (oldIndex === 0 || newIndex === 0) {
                        self.treegridFunc.exchangeTd(treeGrigCol[i], cell.parentNode.firstChild);
                    }
                }
            });
            Array.isArray(lockRowreplaced) && lockRowreplaced.forEach(function (cell) {
                cell.parentNode.appendChild(cell);
            });
        } else {
            toInsert.forEach(function (cell, i) {
                cell.parentNode.insertBefore(replaced[i], cell);
                // 展开行，展开按钮交换
                if (self.conf.treegrid.enabled) {
                    if (oldIndex === 0 || newIndex === 0) {
                        self.treegridFunc.exchangeTd(treeGrigCol[i], cell.parentNode.firstChild);
                    }
                }
            });
            Array.isArray(toRowInsert) && toRowInsert.forEach(function (cell, i) {
                cell.parentNode.insertBefore(lockRowreplaced[i], cell);
            });
        }

        if(forLock){
            if (oldIndex < this.conf.lockColNum - 1 && newIndex < this.conf.lockColNum - 1) {
                this.lockColReplace(oldIndex, this.colGet(oldIndex));
                this.lockColReplace(newIndex, this.colGet(newIndex));
                this.theadSizeSync();
            }
        }else{
            //有锁列的情况，则把交换后的列替换给锁列的列
            if (oldIndex < this.conf.lockColNum) {
                this.lockColReplace(oldIndex, this.colGet(oldIndex));
            }
            if (newIndex < this.conf.lockColNum) {
                this.lockColReplace(newIndex, this.colGet(newIndex));
            }

            this.theadSizeSync();
        }




        //
        //
        // if (oldIndex < this.conf.lockColNum || newIndex < this.conf.lockColNum) {
        // }
        return replaced;
    }

    // 锁列替换
    protected lockColReplace(index, col) {
        let lockReplaced = this.colGet(index, this.lockCol.table),
            lockFixedReplaced = this.colGet(index, this.lockRow.fixedTable),
            lockToInsert = col;

        lockReplaced.forEach(function (cell, i) {
            cell.parentNode.replaceChild(lockToInsert[i].cloneNode(true), cell);
        });
        Array.isArray(lockFixedReplaced) && lockFixedReplaced.forEach(function (cell, i) {
            cell.parentNode.replaceChild(lockToInsert[i].cloneNode(true), cell);
        });
        this.theadSizeSync();
    }

    /**
     * 通过列获取序号
     * @param name
     * @return {number}
     */
    public colName2index(name: string): number {
        // 根据col.name找到index
        /*this.conf.cols.forEach(function (c, i) {
            if (c.name === name) {
                index = i;
            }
        });*/

        //console.log(index, name);
        return this.col.getHideIndex(name);
    }

    /**
     * 锁定/解锁某列
     * @param col - 列名或者index
     * @return {number}
     */
    public colToggleLock(col: number | string): number {
        let toggleFlag = this.lock.colToggle(col);
        this.theadLock.fixedTableRefresh();
        return toggleFlag;
    }

    /**
     * 锁定/解锁某行
     */
    public rowToggleLock() {
        this.theadLock.rowToggle();
    }

    // 设置指定列排序
    // private toggleColSort(col:string, sort:string) {
    //     let self = this, newSort, oldSort,
    //         tableTh = self.table.querySelector(`th[data-col="${col}"]`); // 主表
    //
    //     if (sort === 'desc') {
    //         newSort = 'sort-desc';
    //         oldSort = 'sort-asc';
    //     } else {
    //         newSort = 'sort-asc';
    //         oldSort = 'sort-desc';
    //     }
    //
    //     tableTh.classList.remove(oldSort);
    //     tableTh.classList.add(newSort);
    //     if(self.conf.lockColNum>0) { // 锁列
    //         let lockTh = <any>self.lockCol.table.querySelector(`th[data-col="${col}"]`);
    //         if(lockTh) {
    //             lockTh.classList.remove(oldSort);
    //             lockTh.classList.add(newSort);
    //         }
    //     }
    //     if(self.conf.lockRow) { // 锁行
    //         let lockRowTh = <any>self.lockRow.table.querySelector(`th[data-col="${col}"]`);
    //         lockRowTh.classList.remove(oldSort);
    //         lockRowTh.classList.add(newSort);
    //     }
    //     if(self.conf.lockColNum>0 && self.conf.lockRow) { // 锁行固定角
    //         let lockFixedTh = <any>self.lockRow.fixedTable.querySelector(`th[data-col="${col}"]`);
    //         if(lockFixedTh) {
    //             lockFixedTh.classList.remove(oldSort);
    //             lockFixedTh.classList.add(newSort);
    //         }
    //     }
    // }
    //
    // private clearSort() {
    //     let self = this,
    //         tableSort = self.table.querySelectorAll('.sort-desc,.sort-asc');
    //
    //     Array.prototype.forEach.call(tableSort, function (th, index) {
    //         th.classList.remove('sort-desc', 'sort-asc');
    //     });
    //     if(self.conf.lockColNum>0) {
    //         let lockColSort = self.lockCol.table.querySelectorAll('.sort-desc,.sort-asc');
    //         Array.prototype.forEach.call(lockColSort, function (th, index) {
    //             th.classList.remove('sort-desc', 'sort-asc');
    //         });
    //     }
    //     if(self.conf.lockRow) {
    //         let lockRowSort = self.lockRow.table.querySelectorAll('.sort-desc,.sort-asc');
    //         Array.prototype.forEach.call(lockRowSort, function (th, index) {
    //             th.classList.remove('sort-desc', 'sort-asc');
    //         });
    //     }
    //
    //     if(self.conf.lockColNum>0 && self.conf.lockRow) {
    //         let lockFixedSort = self.lockRow.fixedTable.querySelectorAll('.sort-desc,.sort-asc');
    //         Array.prototype.forEach.call(lockFixedSort, function (th, index) {
    //             th.classList.remove('sort-desc', 'sort-asc');
    //         });
    //     }
    //
    // }

    /**
     * 列排序
     * @type {(col:string, tr:HTMLElement)=>any}
     */
    protected colSort = (() => {
        let sortList = [],
            sortDic = {};

        function getVal(value) {
            let vType = typeof value;
            return (value || value === 0) ? value : (vType === 'number' ? -Infinity : '');
        }

        // 递归排序
        function getFlag(a, b, index = 0) {
            let flag;
            let v1 = getVal(a[sortList[index]]);
            let v2 = getVal(b[sortList[index]]);
            v1 = v1 === '--'? Number.NEGATIVE_INFINITY: v1;
            v2 = v2 === '--'? Number.NEGATIVE_INFINITY: v2;

            if (v1 > v2) {
                flag = 1;
            } else if (v1 === v2) {
                flag = 0;
            } else {
                flag = -1;
            }
            if (flag === 0 && index < sortList.length - 1) {
                return getFlag(a, b, ++index);
            }
            else {
                return sortDic[sortList[index]] === 'desc' ? -flag : flag;
            }
        }

        let toggleColSort = (col: string, sort: string) => {
            let self = this, newSort, oldSort,
                tableTh = self.table.querySelector(`th[data-col="${col}"]`); // 主表

            if (sort === 'desc') {
                newSort = 'sort-desc';
                oldSort = 'sort-asc';
            } else {
                newSort = 'sort-asc';
                oldSort = 'sort-desc';
            }

            tableTh.classList.remove(oldSort);
            tableTh.classList.add(newSort);
            if (self.conf.lockColNum > 0) { // 锁列
                let lockTh = <any>self.lockCol.table.querySelector(`th[data-col="${col}"]`);
                if (lockTh) {
                    lockTh.classList.remove(oldSort);
                    lockTh.classList.add(newSort);
                }
            }
            if (self.conf.lockRow) { // 锁行
                let lockRowTh = <any>self.lockRow.table.querySelector(`th[data-col="${col}"]`);
                lockRowTh.classList.remove(oldSort);
                lockRowTh.classList.add(newSort);
            }
            if(!tools.keysVal(this.conf, 'multi', 'enabled')) {
                if (self.conf.lockColNum > 0 && self.conf.lockRow) { // 锁行固定角
                    let lockFixedTh = <any>self.lockRow.fixedTable.querySelector(`th[data-col="${col}"]`);
                    if (lockFixedTh) {
                        lockFixedTh.classList.remove(oldSort);
                        lockFixedTh.classList.add(newSort);
                    }
                }
            }
        };

        let clearSort = () => {
            let classNames = '.sort-desc,.sort-asc';

            d.queryAll(classNames, this.table).forEach(function (th) {
                th.classList.remove('sort-desc', 'sort-asc');
            });
            if (this.conf.lockColNum > 0) {
                d.queryAll(classNames, this.lockCol.table).forEach(function (th) {
                    th.classList.remove('sort-desc', 'sort-asc');
                });
            }
            if (this.conf.lockRow) {
                d.queryAll(classNames, this.lockRow.table).forEach(function (th) {
                    th.classList.remove('sort-desc', 'sort-asc');
                });
            }
            if(!tools.keysVal(this.conf, 'multi', 'enabled')) {
                if (this.conf.lockColNum > 0 && this.conf.lockRow && this.lockRow.fixedTable) {
                    d.queryAll(classNames, this.lockRow.fixedTable).forEach(function (th) {
                        th.classList.remove('sort-desc', 'sort-asc');
                    });
                }
            }

        };

        // isMulti
        let sort = (isMulti: boolean, col: string) => {
            let self = this,
                sort = sortDic[col];
            if (!self.tableData[0]) {
                return;
            }
            if (sort) {
                sort = sort === 'desc' ? 'asc' : 'desc';
            }
            else {
                sort = 'desc';
            }


            if (isMulti) {
                sortDic[col] = sort;
                if (!~sortList.indexOf(col)) {
                    sortList.push(col);
                }
            }
            else {
                clearSort();
                sortDic = {
                    [col]: sort
                };
                sortList = [col];
            }
            toggleColSort(col, sort);
            if (self.conf.sort === 1) {

                self.tableData.sort(function (a, b) {
                    return getFlag(a, b);
                });
                self.render(this.startIndex, this.tbodyLength + this.startIndex, true);
                // self.tbodyRender(self.tableData, true);
            }
        };

        return {sort}
    })();

    // _columnExchange(index1: number, index2 : number) : void{
    //     //cols配置交换
    //     let cols = this._conf.cols;
    //     [cols[index1], cols[index2]] = [cols[index2], cols[index1]];
    //
    //     // DOM 交换-先隐藏再交换减少repaint和reflow
    //     this._tableWrapper.style.display = 'none';
    //     let lockCols1, lockCols2,
    //         cols1 = this._columnGet(index1),
    //         cols2 = this._columnGet(index2);
    //
    //
    //     for(let i = 0, c1, c2; c1 = cols1[i]; i++){
    //         c2 = cols2[i];
    //         let cTmp = c2.cloneNode(true);
    //         let parent = <Element>c1.parentNode;
    //         parent.replaceChild(cTmp, c1);
    //
    //         parent.replaceChild(c1, c2);
    //
    //         //对于锁列的交换
    //         // if(this._conf.lockColNum > 0){
    //         //     lockCols1 = this._getColumn(index1, this._lockTable);
    //         //     lockCols2 = this._getColumn(index2, this._lockTable);
    //         // }
    //     }
    //     // if(this._conf.lockColNum > 0){
    //     //     lockCols1 = this._getColumn(index1, this._lockTable);
    //     //     lockCols2 = this._getColumn(index2, this._lockTable);
    //     //
    //     //     for (let i = 0; )
    //     // }
    //
    //
    //     this._tableWrapper.style.display = 'block';
    // }


    /**
     * 确保锁列的宽度和高度与普通列宽度一致
     * @private
     */
    protected theadSizeSync() {
        let tableThs = d.queryAll('tr th', this.table.tHead),
            padding = getPadding(tableThs[0]),
            indexCol = this.indexCol,
            lockRow = this.lockRow,
            lockColTable = this.lockCol.table;

        this.initStyleList();
        this.updateStyle();
        this.theadSizeCache();

        // 调整序列号高度
        if(!tools.keysVal(this.conf, 'multi', 'enabled')) {
            if (indexCol.col && indexCol.show && indexCol.col.firstChild) {
                let blankDiv = <HTMLElement>indexCol.col.firstChild,
                    height = this.theadHeight + 1;
                blankDiv.style.height = height + 'px';
                blankDiv.style.lineHeight = height + 'px';

                if (this.conf.lockRow && lockRow.fixed) {
                    let indexFixedDiv = <HTMLElement>lockRow.fixed.querySelector('.indexCol').firstChild;
                    if (indexFixedDiv) {
                        indexFixedDiv.style.height = height + 'px';
                        indexFixedDiv.style.lineHeight = height + 'px';
                    }
                }
            }
        }
        // 调整伪列高度
        if (this.pseudoCol.confList.length > 0 && this.pseudoCol.show) {
            let height = this.theadHeight + 1;
            this.pseudoCol.confList.forEach((item) => {
                if (item.col.firstChild) {
                    item.col.firstChild.style.height = height + 'px';
                    item.col.firstChild.style.lineHeight = height + 'px';
                }
            });
            if (this.conf.lockRow && lockRow.fixed) {
                if (!lockRow.fixed.querySelector('.pseudoCol')) {
                    this.pseudoColFun.fixedRender();
                    this.theadSizeSync();
                }
                d.queryAll('.pseudoCol div', lockRow.fixed).forEach((item) => {
                    item.style.height = height + 'px';
                });
            }
        }
        // 锁头固定区占位符
        if ((indexCol.col || this.pseudoCol.Container) && lockRow.fixed) {
            let Container = d.query('.Container', lockRow.fixed),
                left = this.tableContainer.offsetLeft;

            Container.style.left = -1 * left + 'px';
            Container.style.paddingLeft = left + 'px';
        }

        //  调整表头换行，导致高度错位
        if(!tools.keysVal(this.conf, 'multi', 'enabled')) {
            if (this.conf.lockColNum > 0 && lockColTable) {
                let lockTheadThs = d.queryAll('tr th div', lockColTable.tHead);

                d.queryAll('tr th', this.table.tHead).forEach((th, index) => {
                    let lockTh = lockTheadThs[index];
                    if (!lockTh) {
                        return;
                    }
                    // lockTh.style.width = th.dataset['width'] + 'px';
                    lockTh.style.width = (th.offsetWidth - padding) + 'px';
                    if (this.theadHeight) {
                        lockTh.style.height = (this.theadHeight - 12) + 'px';
                    }
                });
                lockColTable.classList.remove('hide');

                // 横向滚动条被锁列遮挡
                //self.lockScrollBar();
            }
        }
        if (this.conf.lockRow) {
            // 锁头单元格宽度同步
            if (lockRow.table) {
                let lockTheadThs = d.queryAll('tr th div', lockRow.table.tHead);
                tableThs = tableThs || d.queryAll('tr th', this.table.tHead);

                tableThs.forEach((th, index) => {
                    let lockTh = lockTheadThs[index];
                    if (!lockTh) {
                        return;
                    }
                    lockTh.style.width = (th.offsetWidth - padding) + 'px';
                });
            }

            // 锁头固定区单元格宽度同步
            if (lockRow.fixedTable) {
                let fixedThead = lockRow.fixedTable.tHead,
                    th = d.query(`tr th`, fixedThead),
                    lockTheadThs = d.queryAll('tr th div', fixedThead);

                tableThs = tableThs || d.queryAll('tr th', this.table.tHead);
                th && (th.style.height = this.theadHeight + 'px');

                tableThs.forEach(function (th, index) {
                    let lockTh = lockTheadThs[index];
                    if (!lockTh) {
                        return;
                    }
                    lockTh.style.width = (th.offsetWidth - padding ) + 'px';
                });
            }

            let styleHeight = (this.theadHeight + 1) + 'px';
            lockRow.fixedContainer && (lockRow.fixedContainer.style.height = styleHeight);
            lockRow.ContainInner && (lockRow.ContainInner.style.height = styleHeight);
        }

    }

    // 滚动条被左侧锁列遮挡
    /*private lockScrollBar() {
        let self = this,
            time;
        function scrollBar() {
            if(self.table.offsetWidth > self.tableMiddle.offsetWidth) {
                self.lockCol.Container.style.height = (self.table.offsetHeight - 10) + 'px';
            }
            //console.log(self.table.offsetWidth, self.tableMiddle.offsetWidth);
            time && clearTimeout(time);
            time = setTimeout(()=>{
                self.lockCol.Container.style.height = '';
            }, 200);
        }
        d.on(self.tableMiddle, 'scroll', scrollBar);
    }*/


    /**
     * 将thead 中的th 缓存在dataset中, 默认个数为左边的conf.lockNum个
     * @param index - th的index
     */
    protected theadSizeCache(index = -1) {
        let self = this;
        self.theadHeight = self.table.tHead.offsetHeight;
    }

    protected theadSort = (function (self) {
        let sortHandle: EventListener = null;

        function eventBind() {
            if (sortHandle === null) {
                sortHandle = function (e: KeyboardEvent) {
                    if (!this.classList.contains('disabled') && !self.colResize.dragging && !self.moving) {
                        self.colSort.sort(e.ctrlKey || e.shiftKey, this.dataset.col);
                    }
                }
            }
            d.on(self.tableWrapper, self.eventClickName, 'th', sortHandle);
        }

        let on = function () {
            d.queryAll('tr th', self.table.tHead).forEach(th => {
                th.classList.add('sort');
            });
            eventBind();

            on = eventBind;
        };

        return {
            on,
            off: () => {
                if (sortHandle) {
                    d.off(self.tableWrapper, self.eventClickName, 'th', sortHandle);
                    sortHandle = null;
                }
            }
        }

    }(this));

    /**
     * 生成表头
     * update 2017-6-10 for yrh
     */
    protected theadRender(): void {
        let thead: HTMLElement,
            tmpDoc,
            self = this,
            conf = self.conf;


        // 设置标题
        thead = this.table.tHead;
        if (thead === null) {
            thead = d.create('<thead></thead>', 'table');
            this.table.insertBefore(thead, this.table.tBodies.item(0));
        }
        thead.innerHTML = '';

        // 多列表头
        if (tools.keysVal(conf, 'multi', 'enabled')) {
            let colsData = this.conf.multi.cols;
            colsData.forEach(function (row) {
                tmpDoc = document.createElement('tr');
                row.forEach((item) => {
                    tmpDoc.appendChild(self.col.theadCell(item));
                });
                thead.appendChild(tmpDoc);
            });
        }
        else {
            let colsData = this.conf.cols;
            tmpDoc = document.createElement('tr');
            colsData.forEach(function (col) {
                if (!self.colHide.ready || self.colHide.status[col.name]) { // 隐藏列
                    tmpDoc.appendChild(self.col.theadCell(col));
                    thead.appendChild(tmpDoc);
                }
            });
        }

        // }
        // else if (colsData[0] && 'title' in colsData[0]) {
        //
        //     let tmpDoc = document.createElement('tr');
        //     // 单行表头
        //     colsData.forEach(function (col) {
        //         let attr: any = {
        //                 'data-col': col.name
        //             };
        //         if (self.conf.sort) {
        //             attr['class'] = 'sort';
        //         }
        //
        //         tmpDoc.appendChild(
        //             d.createByHTML(`<th${tools.obj.toAttr(attr)}>${self.cellCreate(col.name, col.title).outerHTML}</th>`, 'tr'));
        //
        //         if(col.width && self.conf.colResize) {
        //             self.styleList[self.cellClass(col.name)] = col.width;
        //         }
        //     });
        //     thead.appendChild(tmpDoc);
        // }

    }


    protected lock = (function (self) {
        /**
         * 初始化锁列
         */
        let table: HTMLTableElement = null,
            lockTable: HTMLTableElement = null,
            lockTableContain: HTMLDivElement = null;

        function init() {
            table = self.table;
            lockTable = <HTMLTableElement>table.cloneNode();
            let lockThead = <Element>table.tHead.cloneNode(true),
                lockTheadTr = <Element>lockThead.querySelector('tr'),
                lockThs = d.queryAll('th', lockTheadTr),
                tbodyTr = d.queryAll('tr', table.tBodies.item(0)),
                lockThsLen = lockThs.length,
                lockColNum = self.conf.lockColNum;

            lockTable.classList.add('mobileTableLock', 'hide');
            lockTable.removeAttribute('id');

            for (let i = 0; i < lockThsLen; i++) {
                if (i >= lockColNum) {
                    d.remove(lockThs[i]);
                }
            }

            if (lockTable.tHead) {
                // android 4.4.2 bug  - cloneNode复制了子元素
                lockTable.replaceChild(lockThead, lockTable.tHead);
            } else {
                lockTable.appendChild(lockThead);
            }

            lockTable.appendChild((function () {
                let tbody = table.tBodies.item(0).cloneNode();
                for (let i = 0, tr = null; tr = tbodyTr[i]; i++) {
                    tbody.appendChild(tr.cloneNode());
                }
                return tbody;
            })());

            if (lockTableContain === null) {
                lockTableContain = <HTMLDivElement>d.create('<div class="mobileTableLeftLock"></div>');
                self.tableContainer.insertBefore(lockTableContain, self.tableContainer.firstElementChild);
            }
            else {
                lockTableContain.innerHTML = '';
            }

            lockTableContain.appendChild(lockTable);
            self.lockCol.table = lockTable;
            self.lockCol.Container = lockTableContain;
            table.dataset['lockNum'] = self.conf.lockColNum.toString();
        }

        /**
         * 加载所列表中数据
         * @param rows 正常表中tr，包含所有的 td
         * @param isRefresh 是刷新还是加载
         * @private
         */
        function render(rows: HTMLTableRowElement[], isRefresh: boolean) {
            // 创建lock列DOM前, 显示原来的列，隐藏lock
            if (!table || !lockTable) {
                return;
            }

            table.classList.remove('hideLock');
            lockTable.classList.add('hide');

            if (isRefresh) {
                lockTable.tBodies.item(0).innerHTML = '';
            }

            rows.forEach(function (tr) {
                lockTable.tBodies.item(0).appendChild(rowCreate(tr));
            });

            //创建完lock列DOM, 显示lock，隐藏原来的列
            lockTable && lockTable.classList.remove('hide');
            table.classList.add('hideLock');
        }

        /**
         * 生成锁列的行
         * @param tr
         * @return {HTMLTableRowElement}
         */
        function rowCreate(tr: HTMLTableRowElement): HTMLTableRowElement {

            let newTr = <HTMLTableRowElement>tr.cloneNode(true),
                tds = d.queryAll('td', newTr);

            tds.forEach(function (td, index) {
                if (index >= self.conf.lockColNum) {
                    d.remove(td);
                }
            });

            return newTr;
        }

        function colLock(index: number) {

            let newIndexCols = self.colInsertTo(index, self.conf.lockColNum, true);
            // console.log(newIndexCols);
            self.colAdd(self.conf.lockColNum, newIndexCols, lockTable);
            self.conf.lockColNum++;
            self.theadSizeSync();
            self.theadSizeCache(index);
        }

        function colUnlock(index: number) {
            //把此列移动到锁列的最后一列
            self.colInsertTo(index, self.conf.lockColNum - 1, true);
            //删除取消那列锁列
            self.colDel(index, lockTable);
            if(self.lockRow.fixedTable){
                self.colDel(index, self.lockRow.fixedTable);
            }
            self.theadSizeSync();
            self.theadSizeCache(index);

            self.conf.lockColNum--;
        }

        function colToggle(col: number | string): number {
            let index = -1, toggleFlag = -1;
            if (typeof col === 'string') {
                index = self.colName2index(col);
            } else {
                index = col;
            }
            if (index === -1) {
                return;
            }

            if (lockTable === null) {
                init();
                table.classList.add('hideLock');
                lockTable.classList.remove('hide');
            }

            if (index > self.conf.lockColNum - 1) {
                colLock(index);
                toggleFlag = 1;
            } else {
                colUnlock(index);
                toggleFlag = 0;
            }
            table.dataset['lockNum'] = self.conf.lockColNum.toString();

            return toggleFlag;
        }

        /**
         * 获取锁列的行
         * @param tr
         * @return {HTMLTableRowElement}
         */
        function rowGet(tr: HTMLTableRowElement): HTMLTableRowElement {
            if (lockTable) {
                return <HTMLTableRowElement>lockTable.querySelector(`tr[data-index="${tr.dataset.index}"]`);
            }
            return null;
        }

        function hide() {
            lockTableContain.classList.add('hide');
            table.dataset.lockNum = '0';
        }

        function show() {
            lockTableContain.classList.remove('hide');
            table.dataset.lockNum = self.conf.lockColNum + '';
        }

        function destroy() {
            d.remove(lockTableContain);
            lockTable = null;
            lockTableContain = null;
            table.dataset.lockNum = '0';
            //window.removeEventListener('resize', resizeHandle);
        }

        return {
            init, // 锁列初始化
            render, // 渲染锁表
            rowCreate, //生成锁表的行
            rowGet, // 获取锁表行
            hide, // 隐藏
            show, // 显示
            destroy, // 销毁
            colToggle, // 动态锁列、解锁
            colLock, // 动态锁列
            colUnlock // 动态解锁列
        }
    }(this));


    //
    // _initLockThead(){
    //
    // }
    //
    //
    // _createLockThead(thead : Element) : HTMLTableElement{
    //
    // }


    /**
     * 有锁列时，获取同一层的tr
     * @param tr
     * @return {Array}
     * @private
     */
    protected rowsGetWithLock(tr): HTMLTableRowElement[] {
        let wrapper = this.tableWrapper || this.table;
        return <HTMLTableRowElement[]>d.queryAll(`tr[data-index="${tr.dataset.index}"]`, wrapper);
    }

    /**
     * 选择行
     * @param {HTMLTableRowElement} tr
     * @param {boolean} [multi=false] - 是否多选
     */
    public rowSelect(tr: HTMLTableRowElement, multi: boolean = false) {
        if (!multi) {
            this.rowDeselect(null, true);
            // this.trSelected.forEach((tr2) => {
            //     this.lockRowApply(tr2, (t) => {
            //         t.classList.remove('selected')
            //     })
            // });
            // this.trSelected = [];
        }
        tr = this.getMainTr(tr);
        if(this.trSelected.indexOf(tr) > -1){
            return;
        }
        this.lockRowApply(tr, (t) => {
            t.classList.add('selected');
        });

        this.trSelected.push(tr);

        this.fire('rowSelect', {indexes: [parseInt(tr.dataset.index)], select: true});
    }

    protected getMainTr(tr: HTMLTableRowElement){
        if(this.table.contains(tr)){
            return tr;
        }else{
            return <HTMLTableRowElement>d.query(`tbody tr[data-index="${tr.dataset.index}"]`, this.table);
        }
    }

    public rowToggle(tr: HTMLTableRowElement) {
        tr = this.getMainTr(tr);
        if (this.trSelected.indexOf(tr) > -1) {
            this.rowDeselect(tr);
        } else {
            this.rowSelect(tr, true);
        }
    }

    /**
     * 删除选择行
     * @param tr
     * @param noEvent
     */
    public rowDeselect(tr: HTMLTableRowElement = null, noEvent = false) {
        let self = this;
        if (tr === null) {
            let indexes: number[] = [];

            self.trSelected.forEach((tr) => {
                self.lockRowApply(tr, t => {
                    t.classList.remove('selected')
                });
                indexes.push(parseInt(tr.dataset.index))
            });
            self.trSelected = [];

            if(!noEvent){
                this.fire('rowSelect', {indexes: indexes, select: false});
            }

        } else {
            tr = this.getMainTr(tr);
            self.lockRowApply(tr, (t) => {
                t.classList.remove('selected')
            });

            // 删除数组中的tr
            for (let i = 0, t = null; t = self.trSelected[i]; i++) {
                if (t === tr) {
                    self.trSelected.splice(i, 1);
                    break;
                }
            }
            if(!noEvent) {
                this.fire('rowSelect', {indexes: [parseInt(tr.dataset.index)], select: false});
            }
        }
        // this.fire('rowSelect', {indexes : parseInt(tr.dataset.index), select : true});
    }

    /**
     * 选择行数据获取
     * @return {Array}
     */
    public rowSelectDataGet(): obj[] {
        return this.trSelected.map((tr) => this.rowDataGet(parseInt(tr.dataset.index)))
    }

    public rowUnselectDataGet(): obj[] {
        let allTr = <HTMLTableRowElement[]>d.queryAll('tbody tr', this.table),
            unSelected = allTr.filter(tr => !this.trSelected.includes(tr));

        return unSelected.map((tr) =>
            this.rowDataGet(parseInt(tr.dataset.index))
        );
    }

    /**
     * 创建行
     * @param data
     * @param index
     * @param highlight
     * @return {HTMLTableRowElement}
     */
    protected rowCreate(data: any, index: any, highlight = ''): HTMLTableRowElement {
        let self = this,
            row: { tr: obj, td: obj[] };

        //展示前从外部获取 每行的html属性 与 数据
        if (typeof self.conf.beforeShow === 'function') {
            row = self.conf.beforeShow(data, self.conf.cols);
        } else {
            row = {tr: {}, td: []};
        }

        //tr默认属性
        row.tr['data-index'] = index;

        let trDom = document.createElement('tr');

        for (let attr in row.tr) {
            trDom.setAttribute(attr, row.tr[attr]);
        }

        let textFormat = typeof self.conf.textFormat === 'function' ? self.conf.textFormat : null;

        self.conf.cols.forEach(function (col, i) {
            if (!self.colHide.ready || self.colHide.status[col.name]) { // 隐藏列
                if (!(col.name in data)) {
                    data[col.name] = null;
                }

                let td = row.td[i] || {},
                    text = textFormat ? textFormat(data, col, index) : data[col.name],
                    tdDom = document.createElement('td');

                text = tools.highlight(text, highlight, 'red');
                // textNode = document.createTextNode(text);
                //td默认属性
                td['data-col'] = col.name;
                td['class'] = td['class'] ? `${td['class']} ${self.cellClass(col.name)}` : self.cellClass(col.name);

                for (let attr in td) {
                    tdDom.setAttribute(attr, td[attr]);
                }

                tdDom.innerHTML = text;
                // tdDom.appendChild(textNode);
                trDom.appendChild(tdDom);

                if (i === 0) {
                    // 树形展开
                    self.treegridFunc.addBtn(index, tdDom);
                }
            }
        });

        return trDom;
    }

    public rowHide(index:number){
        d.queryAll(`table tbody > tr[data-index="${index}"]`, this.tableWrapper)
            .forEach(table => table.classList.add('hide'));

        let col = this.indexCol.col;
        if(col) {
            d.query(`div[data-index="${index}"]`, col).classList.add('hide');
            if(this.conf.indexCol === 'number') {
                this.indexColFun.refreshIndex();
            }
        }
    }

    // public rowsDelete(indexes: number[]){
    //     indexes.forEach(index => {
    //         this.tableData.splice(index, 1);
    //
    //
    //     });
    // }

    /**
     * 创建列分组功能行
     * @param data
     * @return {HTMLTableRowElement}
     */
    // protected colGroupCreate(data: any): HTMLTableRowElement {
    //     let self = this;
    //
    //     let trDom = document.createElement('tr');
    //     trDom.classList.add('colGroup');
    //
    //     self.conf.cols.forEach(function (col,) {
    //
    //         if (!self.colHide.ready || self.colHide.status[col.name]) { // 隐藏列
    //             if (!(col.name in data)) {
    //                 data[col.name] = null;
    //             }
    //
    //             let td = {},
    //                 selectArr = data[col.name];
    //             //td默认属性
    //             td['data-col'] = col.name;
    //
    //             let tdDom = document.createElement('td'),
    //                 tdContent = self.groutCreate(col.name, selectArr);
    //
    //             for (let attr in td) {
    //                 if (!td.hasOwnProperty(attr)) {
    //                     continue;
    //                 }
    //                 tdDom.setAttribute(attr, td[attr]);
    //             }
    //             tdDom.appendChild(tdContent);
    //             trDom.appendChild(tdDom);
    //         }
    //
    //     });
    //
    //     return trDom;
    // }

    // 列隐藏
    public col = (function (self) {
        self.colHide.ready = false;

        function show(col: string) {
            _initColumn();
            if (_getStatus(col) === false) {
                _setStatus(col, true);
            }
        }

        function hide(col: string) {
            _initColumn();
            if (_getStatus(col) === true) {
                _setStatus(col, false);
            }
        }

        function _getStatus(col: string) {
            if (col in self.colHide.status) {
                return self.colHide.status[col];
            }
            else {
                return false;
            }
        }

        function _setStatus(col: string, status: boolean) {
            _colVisible(col, status);
            self.colHide.status[col] = status;
        }

        // 获取隐藏后的index
        function getHideIndex(col: string) {
            _initColumn();
            let index = 0,
                cols = self.conf.cols;
                for (let i = 0, l = cols.length; i < l; i++) {
                    let colName = cols[i].name;
                    if (col === colName) {
                        return index;
                    }
                    if (self.colHide.status[colName]) {
                        index++;
                    }
                }
            return -1;
        }

        // 获取未隐藏的conf.cols真实index
        function getIndex(name: string): number {
            // 根据col.name找到index

            for(let i = 0, col:COL; col = self.conf.cols[i]; i++){
                if (col.name === name) {
                    return i;
                }
            }

            return -1;
        }

        function _initColumn() {
            if (!self.colHide.ready) {
                self.conf.cols.forEach(function (c) {
                    self.colHide.status[c.name] = true;
                });
                self.colHide.ready = true;
            }
        }

        /*function clean() {
			self.colHide.ready = false;
			self.colHide.status = {};
			_initColumn();
        }*/


        function _colVisible(col: string, visible: boolean) {
            let index = getIndex(col),
                hideIndex = getHideIndex(col),
                tableCol;


            if (visible) {
                // 显示
                createCol(index);
            }
            else {
                // 隐藏
                self.colDel(hideIndex);
                if (self.conf.lockRow) {
                    self.colDel(hideIndex, self.lockRow.table);
                }
            }
            tableCol = self.colGet(0);
            if (tableCol > 0) {
                self.resize(true);
            }

            if (self.conf.lockColNum > 0) {
                if (hideIndex < self.conf.lockColNum) {

                    if (tableCol.length !== 0) {
                        let lockTableLen = self.lockCol.table.querySelectorAll('th').length;

                        if (lockTableLen === 0) {
                            for (let i = 0; i < self.conf.lockColNum; i++) {
                                let colDom = _getColDom(index);
                                _colAdd(hideIndex, colDom, self.lockCol.table);
                                if (self.lockRow.fixedTable) {
                                    _colAdd(hideIndex, colDom, self.lockRow.fixedTable);
                                }
                            }
                        }
                        else {
                            // 锁列重新渲染
                            self.lockColReplace(hideIndex, self.colGet(hideIndex));
                            return;
                        }

                    }
                    else {
                        self.colDel(hideIndex, self.lockCol.table);
                        if (self.lockRow.fixedTable) {
                            self.colDel(hideIndex, self.lockRow.fixedTable);
                        }
                        return;
                    }
                }
            }

            self.theadSizeSync();
        }

        // 读取列显/隐状态
        /*function getHide() {
            return self.colHide.status;
        }*/

        // 通过隐藏列index 获取对应this.conf.cols中的index
        function hideIndex2Index(hideIndex) {
            let index = 0,
                cols = self.conf.cols;
            for (let i = 0, l = cols.length; i < l; i++) {
                if (self.colHide.status[cols[i].name]) {
                    if (hideIndex === index) {
                        return i;
                    }
                    index++;
                }
            }
        }

        // 获取index对应的隐藏列index位置，用于隐藏列插入
        function _index2HideIndex(index) {
            let hideIndex = 0,
                cols = self.conf.cols;
            for (let i = 0; i <= index; i++) {
                if (self.colHide.status[cols[i].name]) {
                    hideIndex++;
                }
            }
            return hideIndex;
        }

        function _getColDom(index) {
            let colData = self.conf.cols[index],
                colDom = [];

            colDom.push(self.col.theadCell(colData));
            self.tableData.forEach((item, i) => {
                colDom.push(tbodyCell(item, colData, i));
            });
            return colDom;
        }

        // 创建一列 (创建隐藏列)
        function createCol(index: number) {
            let colDom = _getColDom(index),
                hideIndex = _index2HideIndex(index);
            //console.log(hideIndex);
            _colAdd(hideIndex, colDom);
            if (self.conf.lockRow) {
                _colAdd(hideIndex, colDom, self.lockRow.table);
            }

        }

        function _colAdd(index, newCol, table = self.table) {
            let toInsert = self.colGet(index === 0 ? 0 : index, table);
            if (toInsert[0]) {
                toInsert.forEach(function (insert, i) {
                    d.before(insert, newCol[i].cloneNode(true));
                    // insert.parentNode.insertBefore(newCol[i].cloneNode(true), insert);
                });
            } else {
                d.queryAll('tr', table).forEach(function (tr, i) {
                    tr.appendChild(newCol[i].cloneNode(true));
                });
            }
        }

        function tbodyCell(item, col, i: number) {
            let textFormat = typeof self.conf.textFormat === 'function' ? self.conf.textFormat : null,
                td = {},
                text = textFormat ? textFormat(item, col, i) : item[col.name],
                tdDom = document.createElement('td');

            //td默认属性
            td['data-col'] = col.name;
            td['class'] = td['class'] ? `${td['class']} ${self.cellClass(col.name)}` : self.cellClass(col.name);

            for (let attr in td) {
                if (!td.hasOwnProperty(attr)) {
                    continue;
                }
                tdDom.setAttribute(attr, td[attr]);
            }
            tdDom.innerHTML = text;
            return tdDom;
        }

        /**
         * 创建td-content单元格dom
         * @param name   列name
         * @param text   单元格内容
         * @param addClass
         */
        function _cellCreate(name: string, text: string, addClass = true) {
            let tdContent = document.createElement('div');
            if (addClass) {
                tdContent.classList.add('td-content', self.cellClass(name));
            }
            tdContent.innerHTML = tools.str.toEmpty(text);
            return tdContent;
        }

        function theadCell(item) {
            let className = self.cellClass(item.name),
                attr: any = {
                    'data-col': item.name
                };

            if (self.conf.sort) {
                attr['class'] = 'sort';
            }
            if (item.colspan) {
                attr.colspan = item.colspan;
                delete item.width;
                delete item.name;
            }
            if (item.rowspan) {
                attr.rowspan = item.rowspan;
            }

            if (!item.name) {
                item.name = (new Date().getTime()).toString();
            }

            if (!item.colspan && item.width && self.conf.colResize) {
                self.styleList[className] = item.width;
            }

            return d.create(`<th${tools.obj.toAttr(attr)}>${_cellCreate(item.name, item.title, !item.colspan).outerHTML}</th>`, 'tr');
        }

        let titleSet = (name: string, newTitle: string) => {
            d.queryAll('thead th[data-col="' + name + '"]').forEach(th => {
                th.querySelector('div').innerText = newTitle;
            });

            for (let i = 0, col: COL; col = self.conf.cols[i]; i++) {
                if (col.name === name) {
                    col.title = newTitle;
                    break;
                }
            }

            self.resize(true);
        };

        return {
            show,
            hide,
            //getHide,
            getIndex,
            getHideIndex,
            hideIndex2Index,
            theadCell,
            titleSet
        }
    }(this));

    /**
     * 创建单元格class
     * @param name   列name
     */
    protected cellClass(name: string) {
        return `td-${this.ssid}-${name}`;
    }


    /**
     * 创建列分组select单元格
     * @param name   列name
     * @param arr    下拉选项
     */
    protected groutCreate(name, arr) {
        let self = this,
            tdContent = document.createElement('div'),
            selectHTML = document.createElement('select');
        arr.sort((a, b) => {
            return b - a;
        });
        tdContent.classList.add('td-content', 'td-select', self.cellClass(name));
        selectHTML.appendChild(d.create('<option></option>'));

        arr.forEach(item => {
            if (item != '') {
                let option = document.createElement('option'),
                    text = document.createTextNode(item);
                option.appendChild(text);
                option.setAttribute('value', item);
                selectHTML.appendChild(option);
            }
        });
        selectHTML.setAttribute('data-col', name);
        tdContent.appendChild(selectHTML);
        return tdContent;
    }

    /**
     * 行替换
     * @param newRow
     * @param oldRow
     */
    protected rowReplace(newRow: HTMLTableRowElement, oldRow: HTMLTableRowElement) {
        if (this.lockCol.table) {
            this.lockCol.table.tBodies[0].replaceChild(this.lock.rowCreate(newRow), this.lock.rowGet(oldRow))
        }
        this.table.tBodies[0].replaceChild(newRow, oldRow);
    }

    /**
     * 行获取
     * @param index
     * @param table
     * @return {HTMLTableRowElement}
     */
    public rowGet(index: number, table: HTMLTableElement = this.table): HTMLTableRowElement {
        if (!table) {
            return null;
        }
        else {
            return <HTMLTableRowElement>table.tBodies.item(0).querySelector(`[data-index="${index}"]`);
        }
    }

    public rowGetAll(table: HTMLTableElement = this.table) {
        return <HTMLTableRowElement[]>d.queryAll('tbody > tr:not(.hide)', table);
    };

    /**
     * 返回表格数据
     * @param type='data'
     * @return {[]}
     */
    public dataGet(type = 'data'): any[] {
        let tData = null;
        switch (type) {
            case 'data':
                tData = this.tableData;
                break;
            case 'display':

                //
                tData = this.tableData;
                break;
        }
        return tData;
    }

    protected onLoad(isEnd: boolean) {

    };


    public lockRowApply(tr: HTMLTableRowElement, callback: (t: HTMLTableRowElement, i: number) => void) {
        let trs = this.rowsGetWithLock(tr);
        trs.forEach((t, i) => {
            callback(t, i);
        });
    }

    /**
     * 获取conf中的参数
     * @param name
     * @param value
     * @return {*}
     */
    public attr(name: string, value?) {
        if (typeof value === 'undefined') {
            return this.conf[name];
        } else {
            this.conf[name] = value;
        }
    }

    /**
     *
     * @return {HTMLDivElement}
     */
    public wrapperGet() {
        return this.tableWrapper;
    }


    // -------------- yrh update --------------


    /**
     * 更新表格样式
     * @private
     * @author yrh
     */
    protected updateStyle() {
        const self = this;
        if (!this.conf.colResize || !self.tableContainer || !self.checkHidden()) {
            return;
        }

        let styleArr = [],
            style = document.querySelector(`style[y-ui="table-${self.ssid}"]`);

        if (!style) {
            style = document.createElement('style');
            style.setAttribute('type', 'text/css');
            style.setAttribute('y-ui', `table-${self.ssid}`);
            self.tableContainer.appendChild(style);
        }


        for (let styleItem in self.styleList) {
            let width = self.styleList[styleItem];
            styleArr.push(`.${styleItem}{ width: ${width-1}px; max-width: ${width-1}px;}`);
        }
        //console.log('updateStyle');
        style.innerHTML = styleArr.join('');

    }

    /**
     * 设置表格临时样式
     * @private
     * @author yrh
     */
    protected tableStyle = (((self) => {
        let styleDom,
            styleName = 'tableTempStyle';

        function _addDom() {
            if (!styleDom) {
                styleDom = document.createElement('style');
                styleDom.setAttribute('type', 'text/css');
                self.tableContainer.classList.add(`${styleName}-${self.ssid}`);
                self.tableContainer.appendChild(styleDom);
            }
        }

        function add(styleArr) {
            let prefix = `.${styleName}-${self.ssid}`;
            _addDom();
            styleArr.forEach((item, i) => {
                styleArr[i] = `${prefix} ${item}`;
                styleArr[i] = styleArr[i].replace(/,/g, `,${prefix} `);
            });
            styleDom.innerHTML = styleArr.join('');
        }

        function del() {
            d.remove(styleDom);
            styleDom = null;
        }

        return {
            add,
            del
        }
    })(this));


    /**
     * 取Contianer 的 scrollTop
     * @return
     */
    private scrollTop() {
        if (this.conf.Container) {
            return this.conf.Container.scrollTop || window.scrollY;
        }
        else {
            return tools.scrollTop();
        }
    }


    /**
     * 开启表头拖拽宽度
     * @private
     * @author yrh
     */
    protected colResizeFun = (function (self) {

        function winCb(){
            // 清除列宽状态
            self.resize(true);
        }

        /**
         * 表格尺寸调整
         * @private
         * @author yrh
         * @param width 列调整后的宽
         * @param columnEl  待调整的列对象
         * @param deltaLeft 偏移量
         */
        function theadSizeRender(width, columnEl, deltaLeft) {
            let changeCellWidth = 0, siblingCol, siblingNewWidth = 0,
                colName = self.cellClass(columnEl.dataset.col);

            for (let item in self.styleList) {
                changeCellWidth += self.styleList[item] + 1;
            }

            // 防止表格破裂
            if (self.table.offsetWidth === self.tableContainer.offsetWidth) {
                // 单元格宽度小于表格宽度，调整相邻单元格宽度
                let index = self.colName2index(columnEl.dataset.col),
                    tableTh = <HTMLElement>self.table.tHead.querySelector(`tr > *:nth-child(${index + 1})`),
                    sibling = <HTMLTableRowElement>tableTh.nextElementSibling,
                    selfWidth = self.styleList[colName],
                    siblingWidth;

                tableTh.style.width = width + 'px';
                if (tableTh.offsetWidth > width) {
                    width = selfWidth;
                }
                tableTh.style.width = '';

                if (sibling) {
                    let siblingName,
                        siblingTH = <HTMLElement>self.table.tHead.querySelector(`tr th[data-col="${sibling.dataset.col}"]`);
                    siblingCol = sibling.dataset.col;
                    siblingName = self.cellClass(siblingCol);
                    siblingWidth = self.styleList[siblingName];
                    siblingNewWidth = siblingWidth + (selfWidth - width);
                    siblingTH.style.width = siblingNewWidth + 'px';


                    if (siblingTH.offsetWidth > siblingNewWidth + 1) {
                        siblingNewWidth = siblingWidth;
                    }
                    siblingTH.style.width = '';

                    self.styleList[siblingName] = siblingNewWidth;
                }
            }
            self.styleList[colName] = width;


            // 更新配置，用于保存宽度
            for (let i = 0, l = self.conf.cols.length; i < l; i++) {
                if (self.conf.cols[i]['name'] === columnEl.dataset.col) {
                    self.conf.cols[i]['width'] = width;
                    //break;
                }
                if (siblingCol && self.conf.cols[i]['name'] === siblingCol) {
                    self.conf.cols[i]['width'] = siblingNewWidth;
                }
            }
            //self.updateStyle();
        }

        function mousemoveHandle(event) {
            let target = event.target,
                columnRect;

            if (!self.styleListReady) {
                self.initStyleList();
            }

            d.queryAll('th', self.table.tHead).forEach(th => {
                self.styleList[self.cellClass(th.dataset.name)] = th.offsetWidth;
            });

            while (target && target.tagName !== 'TH') {
                target = target.parentNode;
            }
            columnRect = target.getBoundingClientRect();

            if (columnRect.width > 12 && columnRect.right - event.pageX < 15 && !self.colResize.dragging) {
                target.style.cursor = 'col-resize';
                self.colResize.column = target;
                self.colResize.column = target;
            }
            else if (!self.colResize.dragging) {
                target.style.cursor = '';
                self.colResize.column = null;
            }
        }

        function mousedownHandle(event) {
            let columnEl, columnRect, dragState,
                scrollLeft = self.tableMiddle.scrollLeft;
            const tableLeft = self.table.getBoundingClientRect().left + scrollLeft;

            // 拖动宽度改变
            const mouseMove = (event) => {
                const deltaLeft = event.clientX - dragState.startMouseLeft;
                const proxyLeft = dragState.startLeft - dragState.tableLeft + deltaLeft;
                const minLeft = columnRect.left - tableLeft + self.conf.cellWidth;
                const left = Math.max(minLeft, proxyLeft);
                const width = left - (columnRect.left - dragState.tableLeft)
                /* + self.indexCol.width*/
                self.colResize.resizeProxy.style.left = left + 'px';
                theadSizeRender(width, columnEl, deltaLeft);
                self.theadSizeSync();
            };

            const mouseUp = (event) => {
                self.colResize.resizeProxy.style.display = 'none';
                d.off(document, self.mousemoveName, mouseMove);
                d.off(document, self.mouseupName, mouseUp);
                //document.body.style.cursor = '';
                d.queryAll('th', self.table.tHead).forEach(function (th, i) {
                    th.style.cursor = '';
                });

                document.onselectstart = null;
                document.ondragstart = null;
                dragState = null;

                // 晚于排序点击事件执行
                setTimeout(() => {
                    self.colResize.dragging = false;
                }, 10);
            };

            if (self.colResize.column) {
                self.colResize.dragging = true;
                document.onselectstart = function () {
                    return false;
                };
                document.ondragstart = function () {
                    return false;
                };
                columnEl = self.colResize.column;
                columnRect = columnEl.getBoundingClientRect();
                dragState = {
                    startMouseLeft: event.clientX,                // 鼠标起始位置
                    startLeft: columnRect.right,      // 单元格右偏移
                    startColumnLeft: columnRect.left, // 单元格左偏移
                    tableLeft: tableLeft                          // 表格左偏移
                };

                self.colResize.resizeProxy.style.display = 'block';
                self.colResize.resizeProxy.style.left = (dragState.startLeft - dragState.tableLeft) + 'px';

                d.on(document, self.mousemoveName, mouseMove);
                d.on(document, self.mouseupName, mouseUp);
                // document.addEventListener(self.mousemoveName, mouseMove);
                // document.addEventListener(self.mouseupName, mouseUp);
            }
        }

        function colSize() {
            d.on(self.tableContainer, self.mousedownName, 'th', mousedownHandle);
            d.on(self.tableContainer, self.mousemoveName, 'th', mousemoveHandle);

            d.on(window, 'resize', winCb);
        }


        function init() {
            // 添加辅助线
            let resizeProxy = document.createElement('div');
            resizeProxy.classList.add('resize-proxy');
            self.tableContainer.appendChild(resizeProxy);
            self.colResize.resizeProxy = resizeProxy;
            colSize();
        }

        function off(){
            d.off(window,'resize',winCb);
        }

        return {
            init,off
        }
    })(this);

    private initStyleList() {
        let self = this;

        if (!self.styleListReady) {
            let ths: any = d.queryAll('th', self.table.tHead);

            if(!ths[0]){
                return;
            }

            let padding = getPadding(ths[0]);

            if (tools.keysVal(self.conf, 'multi', 'enabled')) {
                // 多列表头，移除多余列
                let filterTh = [];
                ths.forEach((th) => {
                    if (!th.getAttribute('colspan')) {
                        filterTh.push(th);
                    }
                });
                ths = filterTh;
            }

            if (self.conf.cellMaxWidth) {
                self.tableStyle.add([`table th, table td{width:$\{self.conf.cellMaxWidth - padding}px;max-width:${self.conf.cellMaxWidth - padding}px;}`]);
            }


            if (self.conf.cellMaxWidth && !self.conf.colResize) {
                // 只设置了 cellMaxWidth，且列数不足以支撑最大宽度(列太少，导致列宽必须超过cellMaxWidth)
                if (ths[0].offsetWidth > self.conf.cellMaxWidth) {
                    self.tableStyle.del();
                }
            }
            else if (self.conf.colResize) {
                // 设置了 colResize
                ths.forEach(function (th) {
                    self.styleList[self.cellClass(th.dataset.col)] = th.offsetWidth - padding;
                });

                if (self.conf.cellMaxWidth) {
                    self.tableStyle.del();
                }
            }
            self.styleListReady = true;
        }
    }

    public resize(type = false) {
        let self = this;

        function handle() {
            self.styleListReady = false;
            self.styleList = {};
            self.updateStyle();
            self.initStyleList();
            self.updateStyle();
            if (self.lockRow.Container) {
                self.lockRow.Container.style.width = self.tableContainer.offsetWidth + 'px';
            }
            self.theadSizeSync();
        }


        if (!self.tableStatus && !type) {
            handle();
        }
        else if (type) {
            self.checkHidden() && handle();
        }
    }

    private setTableWidth(width) {
        const self = this;
        self.table.style.width = width + 'px';
        self.lockRow.table.style.width = width + 'px';
        //self.lockRow.fixedTable.style.width = width + 'px';
    }


    /**
     * 锁头
     * @private
     * @author yrh
     */
    protected theadLock = (function (self) {
        /**
         * 初始化锁头
         */
        let table: HTMLTableElement = null,
            lockTable: HTMLTableElement = null,
            lockThead, lockTbody,
            scrollReset: boolean = false,    // 滚动后表头高度是否重置
            conf: BT_Para = null;

        function scrollHandle() {
            //setTimeout(()=> {
            if(self.lockRow.Container){
                let style = self.lockRow.Container.style,
                    offsetTop = tools.offset.top(self.tableWrapper),
                    containerScrollTop = self.scrollTop() + tools.offset.top(self.conf.Container),
                    scrollTop = containerScrollTop + self.theadHeight + self.conf.lockRowTop,
                    tableBottom = self.tableWrapper.offsetHeight + offsetTop;

                if (containerScrollTop > offsetTop) {
                    style.position = 'fixed';
                    style.width = self.tableContainer.offsetWidth + 'px';
                    if (!self.conf.Container) {
                        // 当表格嵌套在dom层中，不设置top，默认相对父窗口
                        style.top = conf.lockRowTop + 'px';
                    }
                    else {
                        if (conf.lockRowTop > 0) {
                            style.top = conf.lockRowTop + 'px';
                        }
                        else {
                            style.top = 'initial';
                        }
                    }
                    if (!self.indexCol.col && !self.pseudoCol.Container) {
                        style.overflow = 'hidden';
                    }
                    style.left = tools.offset.left(self.table) + 'px';
                }
                else {
                    style.position = 'absolute';
                    style.top = '';
                    style.left = '0px';
                }

                // 滚动条超过表格，隐藏表头
                if (scrollTop > tableBottom) {
                    let height = self.theadHeight - (scrollTop - tableBottom);
                    height = height < 0 ? 0 : height;
                    self.lockRow.fixedContainer && (self.lockRow.fixedContainer.style.height = (height + 1) + 'px');
                    self.lockRow.ContainInner.style.height = height + 'px';
                    scrollReset = true;
                }
                else if (scrollReset) {
                    self.lockRow.fixedContainer && (self.lockRow.fixedContainer.style.height = (self.theadHeight + 1) + 'px');
                    self.lockRow.ContainInner.style.height = self.theadHeight + 'px';
                    scrollReset = false;
                }
            }

            //}, 200);

        }

        function tableScrollHandle() {
            self.lockRow.ContainInner.scrollLeft = self.tableMiddle.scrollLeft;
        }

        function init() {
            table = self.table;
            conf = self.conf;
            lockTable = <HTMLTableElement>table.cloneNode();
            lockTable.removeAttribute('id');
            lockThead = table.tHead.cloneNode(true);
            lockTbody = table.tBodies.item(0).cloneNode();


            //lockTable.classList.add('mobileTableRowLock', 'hideLock');
            lockTable.classList.add('mobileTableRowLock');
            lockTable.classList.remove('hideLock');

            if (lockTable.tHead) {
                // android 4.4.2 bug  - cloneNode复制了子元素
                lockTable.replaceChild(lockThead, lockTable.tHead);
            } else {
                lockTable.appendChild(lockThead);
            }

            if (lockTable.tBodies.item(0)) {
                lockTable.replaceChild(lockTbody, lockTable.tBodies.item(0));
            } else {
                lockTable.appendChild(lockTbody);
            }

            if (self.lockRow.Container === null) {
                self.lockRow.Container = <HTMLDivElement>d.create('<div class="mobileTableTopLock"></div>');
                self.lockRow.ContainInner = <HTMLDivElement>d.create('<div class="mobileTableTopLock-inner"></div>');
                self.lockRow.Container.appendChild(self.lockRow.ContainInner);
            }

            self.lockRow.ContainInner.appendChild(lockTable);
            self.tableContainer.insertBefore(self.lockRow.Container, self.tableContainer.firstElementChild);
            self.lockRow.table = lockTable;
            d.on(window, 'scroll', scrollHandle);

            self.conf.Container && d.on(self.conf.Container, 'scroll', scrollHandle);
            d.on(self.tableMiddle, 'scroll', tableScrollHandle);
        }

        // 创建/更新 锁头固定区
        function createFixedBox() {
            if (!self.lockRow.fixed && self.lockRow.Container) {
                self.lockRow.fixedContainer = <HTMLDivElement>d.create('<div class="Container"></div>');
                self.lockRow.fixed = <HTMLDivElement>d.create('<div class="mobileTableTopFixedLock"></div>');
                self.lockRow.fixed.appendChild(self.lockRow.fixedContainer);
                self.lockRow.Container.insertBefore(self.lockRow.fixed, self.lockRow.Container.firstElementChild);
                fixedTableRefresh();
                if (self.indexCol.col) {
                    self.indexColFun.fixedRender();
                }
                if (self.pseudoCol.Container) {
                    self.pseudoColFun.fixedRender();
                }
                self.theadSizeSync();
            }


            /*if(!self.conf.lockRow || self.conf.lockColNum===0) {
                return;
            }*/
        }

        // 刷新锁头固定区表格
        function fixedTableRefresh() {
            if (self.lockCol.table) {
                if (self.lockRow.fixedTable) {
                    d.remove(self.lockRow.fixedTable);
                }

                if(self.lockRow && self.lockRow.fixedContainer){
                    self.lockRow.fixedTable = <HTMLTableElement>self.lockCol.table.cloneNode(true);
                    self.lockRow.fixedTable.removeAttribute('id');
                    // 拷贝锁列
                    self.lockRow.fixedContainer.appendChild(self.lockRow.fixedTable);
                    self.lockRow.fixedTable.tBodies.item(0).innerHTML = '';
                }

            }
        }

        /**
         * 加载所列表中数据
         * @private
         */
        function render() {
            if (!table) {
                return;
            }
            createFixedBox();
            resizeHeight();
        }

        /**
         * 计算锁头高度
         * @private
         */
        function resizeHeight() {
            self.lockRow.fixedContainer.style.height = (lockThead.offsetHeight + 1) + 'px';
        }

        /**
         * 生成锁列的行
         * @param tr
         * @return {HTMLTableRowElement}
         */
        function rowCreate(tr: HTMLTableRowElement): HTMLTableRowElement {
            let newTr = <HTMLTableRowElement>tr.cloneNode(true);
            return newTr;
        }

        function rowLock() {
            init();
            render();
        }

        function rowUnlock() {
            destroy();
        }

        // 锁行切换
        function rowToggle(): boolean {
            self.conf.lockRow = !self.conf.lockRow;
            if (self.conf.lockRow) {
                rowLock();
            }
            else {
                rowUnlock();
            }
            return self.conf.lockRow;
        }


        function hide() {
            self.lockRow.table.classList.add('hideLock');
        }

        function show() {
            self.lockRow.table.classList.remove('hideLock');
        }

        function destroy() {
            d.off(window, 'scroll', scrollHandle);
            // 伪列销毁
            self.pseudoColFun.destroy();
            self.conf.Container && d.off(self.conf.Container, 'scroll', scrollHandle);
            d.off(self.tableMiddle, 'scroll', tableScrollHandle);
            d.remove(self.lockRow.Container);
            d.remove(self.lockRow.fixed);
            lockTable = null;
            self.lockRow.Container = null;
            self.lockRow.fixed = null;
        }

        return {
            init,           // 锁头初始化
            render,         // 渲染锁头
            rowCreate,      // 生成锁表的行
            hide,           // 隐藏
            show,           // 显示
            destroy,        // 销毁
            rowToggle,      // 动态锁列、解锁
            rowLock,        // 动态锁列
            rowUnlock,      // 动态解锁列
            fixedTableRefresh    // 刷新锁头固定区

        }
    }(this));

    /**
     * 把oldIndex 位置的行插入到 newIndex位置
     * @param oldIndex
     * @param newIndex
     */
    protected rowInsertTo(oldIndex: number, newIndex: number) {
        let self = this,
            len = self.tbodyLength,
            index = 0;
        // if(self.conf.length>0) {
        //     len = len>self.conf.length? self.conf.length: len;
        // }

        if (!( oldIndex >= 0 && oldIndex < len && newIndex >= 0 && newIndex < len )) {
            return null;
        }

        let replaced = self.rowGet(oldIndex);
        if (oldIndex == newIndex) {
            return replaced;
        }
        let lockTablereplaced = self.rowGet(oldIndex, self.lockCol.table);


        //如果newIndex > oldIndex 则需要插入到 newIndex后一位的前面
        index = newIndex + (newIndex > oldIndex ? 1 : 0);
        let toInsert = self.rowGet(index),
            toLockInsert = self.rowGet(index, self.lockCol.table);

        if (newIndex === len - 1) {
            self.table.tBodies[0].appendChild(replaced);
            self.lockCol.table && self.lockCol.table.tBodies[0].appendChild(lockTablereplaced);
        } else {
            self.table.tBodies[0].insertBefore(replaced, toInsert);
            self.lockCol.table && self.lockCol.table.tBodies[0].insertBefore(lockTablereplaced, toLockInsert);
        }

        // 更新序号
        self.updateRowIndex(self.table);
        self.updateRowIndex(self.lockCol.table);
    }

    /**
     * 更新列序号
     */
    private updateRowIndex(table: HTMLElement) {
        let self = this;
        if (table) {
            d.queryAll('tbody tr', table).forEach((tr, i) => {
                if (self.conf.colGroup) {
                    tr.dataset.index = i > 0 ? (i - 1).toString() : '';
                } else {
                    tr.dataset.index = i.toString();
                }
            });
        }
    }

    /**
     *
     */
    public destroy() {
        this.theadLock.destroy();
        this.colResizeFun.off();
        d.remove(this.tableWrapper);
    }

    /**
     * 获取某列数据
     * @param index
     * @param type
     * @return {null}
     */
    public colDataGet(index: number | string, type = 'data') {
        let colData = null,
            self = this,
            col;

        if (typeof index === 'string') {

            index = this.col.getIndex(index);
        }
        col = self.conf.cols[index];

        if (col) {
            if (type === 'data') {
                colData = self.dataGet().map((data) => data[col.name]);
            } else if (type === 'display') {
                colData = self.colGet(index).map((cell) => tools.str.removeHtmlTags(cell.innerHTML));
            }
        }
        return colData;
    }

    public rowDataGet(index: number): obj {
        return tools.obj.copy(this.dataGet()[index]);
    }

    // public ajaxDataGet(): any {
    //     return this.ajaxData;
    // }
    //
    // public currentPageGet():number{
    //     return this.currentPage;
    // }

    public on(type: string, cb: EventListener) {
        d.on(this.tableWrapper, `bt.${type}`, cb);
    }

    private fire(type: string, detail?: obj) {
        tools.event.fire(`bt.${type}`, detail, this.tableWrapper);

    }

    public cell = (() => {
        let setText = (name: string, index: number, text) => {
            d.queryAll(`table tr[data-index="${index}"] td[data-col="${name}"]`, this.tableWrapper).forEach(td => {
                td.innerText = tools.str.toEmpty(text);
            })
        };
        return {
            setText
        }
    })();

    public getSearchData(val: string, dataArr: obj[] = this.tableData){
        let conf = this.conf,
            displayText:objOf<string>[] = [],
            visibleCol = this.getVisibleCol();

        // 清除查询
        if(tools.isEmpty(val)){
            this.render(0, this.tbodyLength);
            return ;
        }

        dataArr.forEach((trData:obj, index) => {
            displayText.push({});
            for (let name in trData) {

                let col = conf.cols[this.col.getIndex(name)];
                if(col && visibleCol.indexOf(name) > -1){
                    displayText[index][name] = conf.textFormat(trData, col, index);
                }
            }
        });


        return dataArr.filter((data, index) => {
            let trText = displayText[index];
            for(let name in trText){
                let tdText = tools.str.removeHtmlTags(trText[name] + '');
                if(tdText.toLowerCase().indexOf(val.toLowerCase()) > -1) {
                    return true;
                }
            }
            return false;
        });
    }

    public search(val: string, dataArr: obj[] = this.tableData){
        let filterData = this.getSearchData(val, dataArr);

        if(!tools.isEmpty(filterData)) {
            let dataLen = filterData.length,
                indexLen = dataLen < this.tbodyLength ? dataLen : this.tbodyLength;

            this.tbodyRender(filterData, true, 0, val);
            this.indexColFun.render(0, indexLen, true);
            this.pseudoColFun.render(0, indexLen, true);
            this.resize(true);
        }

    }

    public data = (() => {
        return {
            get: (start = 0, end?: number) => {
                return this.tableData.slice(start, end);
            },
            add: (data: obj[]) => {
                Array.isArray(data) && (this.tableData = this.tableData.concat(data));
            },
            set: (data: obj[]) => {
                Array.isArray(data) && (this.tableData = data);
            }
        }
    })();


    /**
     * 将表格的数据渲染到页面上, 参数start和end直接传入数组的slice方法
     * @param {number} start - 表格数据数组开始下标
     * @param {number} end - 表格数据数组结束下标
     * @param {boolean} isRefresh - 刷新还是附加数据
     */
    public render(start: number, end: number, isRefresh = true) {

        let data = this.tableData.slice(start, end),
            length = data.length;

        if (isRefresh) {
            this.trSelected = [];
            this.colGroup.clear();
        }

        this.tbodyRender(data, isRefresh, start);
        this.indexColFun.render(start, length, isRefresh);
        this.pseudoColFun.render(start, length, isRefresh);

        this.startIndex = isRefresh ? start : this.startIndex;
        this.tbodyLength = isRefresh ? length : this.tbodyLength + length;
        this.resize(true);

        this.fire('render');
    }

    public highlight(str:string){
        // let data = this.tableData.slice(this.startIndex, this.startIndex + this.tbodyLength);
        //
        //
        // this.tbodyRender(data, true, this.startIndex, str);
        let getSameTd = (td:HTMLElement) => {
            let trIndex = td.parentElement.dataset.index,
                tdCol = td.dataset.col;
            return d.queryAll(`tbody tr[data-index="${trIndex}"] td[data-col="${tdCol}"]`, this.tableWrapper)
        };

        let highIndex = 0;
        d.queryAll('tbody td', this.table).forEach(cell => {

            let has = false;
            getSameTd(cell).forEach(td => {
                if(td.dataset.highIndex){
                    delete td.dataset.highIndex;
                    td.innerHTML = tools.str.removeHtmlTags(td.innerHTML);
                }

                let tdText = td.innerHTML,
                    hlTdText = tools.highlight(tdText, str, 'red');

                if(tdText !== hlTdText){
                    td.innerHTML = hlTdText;
                    td.dataset.highIndex = highIndex + '';
                    has = true;
                }
            });

            has && highIndex ++;
        })

    }

    public clickEvent = (() => {
        let selectorHandlers: objOf<EventListener[]> = {}, //存放event事件
            isOn: boolean = false;                         //判断是否已经触发on事件

        /**
         * 添加事件数组
         *
         * 1.缓存handler
         * 2.判断当前是否为开启状态
         * 3.是 - 用d.on 添加监听
         * 4.否 - 不用处理
         *
         * @param {string} selector 代理对象
         * @param {EventListener} handler 事件函数
         */
        let add = (selector: string, handler: EventListener) => {
            if (!selectorHandlers[selector]) {
                selectorHandlers[selector] = [];
            }
            selectorHandlers[selector].push(handler);
            if (isOn) {
                d.on(this.tableContainer, 'click', selector, handler);
            }
        };
        /**
         * 删除事件数组
         *
         * 1.从缓存删除handler
         * 2.判断当前是否为开启状态
         * 3.是 - 用d.off 移除监听
         * 4.否 - 不用处理
         *
         * @param {string} selector 代理对象
         * @param [handler]
         */
        let remove = (selector: string, handler: EventListener) => {
            if (handler && selectorHandlers[selector]) {
                for (let i = 0; i < selectorHandlers[selector].length; i++) {
                    if (selectorHandlers[selector][i] === handler) {
                        selectorHandlers[selector].splice(i, 1);
                        break;
                    }
                }
                if (selectorHandlers[selector].length === 0) {
                    delete selectorHandlers[selector];
                }

                if(isOn){
                    d.off(this.tableContainer, 'click', selector, handler);
                }
            }
        };
        /**
         * 取消点击事件
         */
        let off = () => {
            isOn = false;
            for (let selector in selectorHandlers) {
                selectorHandlers[selector].forEach((handler) => {
                    d.off(this.tableContainer, 'click', selector, handler);
                })
            }
        };
        /**
         * 触发点击事件
         */
        let on = () => {
            off();

            isOn = true;
            for (let selector in selectorHandlers) {
                selectorHandlers[selector].forEach((handler) => {
                    d.on(this.tableContainer, 'click', selector, handler);
                })
            }
        };

        return {add, remove, off, on};
    })();

    /**
     * 复制数据, 目前只支持PC上的浏览器
     */
    public copy = (() => {

        let localHash = '__BasicTableCopyLocal__',
            localOriginHash = '__BasicTableCopyLocalOrigin__';

        function setLocal(copyText: string, originData: obj) {
            window.localStorage.setItem(localHash, copyText);
            window.localStorage.setItem(localOriginHash, JSON.stringify(originData));
        }

        /**
         * 与localStorage中的缓存匹配
         * @param {string} copyText
         * @return {obj[]}
         */
        let matchLocal = (copyText: string):obj[] => {
            if (copyText === window.localStorage.getItem(localHash)) {
                let originText = window.localStorage.getItem(localOriginHash);
                return JSON.parse(originText);
            }else{
                return null;
            }
        };

        /**
         * 根据复制内容的第一行的内容来匹配col的title
         * @param {string} copyText
         */
        let matchColTitle = (copyText: string):obj[] => {
            let cols = this.conf.cols,
                rows = copyText.split("\r\n").filter(row => !!row),
                // rows = copyText.split("\r\n").map(text => text.trim()).filter(row => !!row),
                colsNames: string[] = [];

            // 如果不足两行 直接return
            if (rows.length <= 1) {
                return null;
            }

            // 根据中文名称匹配col的name
            let first = <string>rows.shift();
            first.split("\t").forEach((title, i) => {
                for (let col of cols) {
                    if (col.title === title) {
                        colsNames[i] = col.name;
                        break;
                    }
                }
            });

            // 没有根据中文匹配到colName
            if (colsNames.length === 0) {
                return null;
            }

            return rows.map(row => {
                let dataObj: obj = {};
                row.split("\t").forEach((text, i) => {
                    let name = colsNames[i];
                    if (name) {
                        dataObj[name] = text;
                    }
                });
                return dataObj;
            });
        };

        return {
            col: (name: string, isReturn = false) => {
                let arr: string[] = this.colDataGet(name).map(text => tools.str.toEmpty(text));

                // 去重
                arr = (()=>{
                    let noRepeat:string[] = [],
                        hash = {};

                    arr.forEach(a => {
                        if(!hash[a]) {
                            hash[a] = true;
                            noRepeat.push(a);
                        }
                    });

                    return noRepeat;
                })();

                let text = Array.isArray(arr) ? arr.join("\r\n") : '';

                if (isReturn) {
                    return text;
                }
                tools.copy(text);

            },
            row: (indexes: number[] ,isReturn = false, colsName: string[] = null) => {

                let cols: COL[] = null;
                if(Array.isArray(colsName)){
                    cols = colsName.map(name => this.nameCol[name])
                }else{
                    cols = this.conf.cols;
                }

                let rowsData = indexes.map(index => this.rowDataGet(index)),
                    rowsArr: string[] = rowsData.map(rowData => {
                        return cols.map(col => tools.str.toEmpty(rowData[col.name])).join("\t");
                    });

                if (rowsArr[0]) {
                    rowsArr.unshift(cols.map(col => col.title).join("\t"));
                }

                let text = rowsArr.join("\r\n");

                setLocal(text, rowsData);

                if (isReturn) {
                    return text;
                }

                tools.copy(text);
            },
            selectedRow: (isReturn = false) => {
                let indexes = this.trSelected.map(tr => parseInt(tr.dataset.index));
                return this.copy.row(indexes, isReturn);
            },
            match: (copyText: string, except: string[] = []): obj[] => {
                let dataArr = matchLocal(copyText);

                if(dataArr === null){
                    dataArr = matchColTitle(copyText);
                }

                // 去掉为空的字段 或者 排除的字段
                Array.isArray(dataArr) && dataArr.forEach((data:obj) => {
                    for(let name in data){
                        // 判读是否是空的字段 或者 排除的字段
                        if(tools.isEmpty(data[name]) || except.indexOf(name) >= 0){
                            delete data[name];
                        }
                    }
                });
                return dataArr;
            }
        }
    })();

    public tableELGet() { return this.table}

    public edit = (() => {

        let modifyPara: TableEditInitPara = null,

            editing = getEditingInit(),

            deletedIndexes: number[] = [],
            addIndex = 0,
            editedData : obj[] = [];

        let clickEvent = (() => {
            let self = this;

            let clickHandle: EventListener = function () {
                let canInit = modifyPara.canInit,
                    canRowInit = modifyPara.canRowInit,
                    colConf = self.nameCol[this.dataset.col],
                    td = this,
                    tr = <HTMLTableRowElement>d.closest(td, 'tr'),
                    index = parseInt(tr.dataset.index),
                    rowData = self.rowDataGet(index);

                reshowEditing();
                if(typeof canRowInit === 'function' && !canRowInit(rowData)){
                    return false;
                }
                if (typeof canInit === 'function' && !canInit(colConf, tr.classList.contains('added') ? 1 : 0)) {
                    return;
                }

                let editingData = tools.obj.merge(rowData, editedData[index]);

                this.classList.add('editing');

                modifyPara.comInit(td, editingData, colConf);

                editing.td = td;
                editing.index = index;
                editing.col = colConf;
                editing.data = editingData;

            };



            return {
                on: () => {
                    d.on(this.tableWrapper, 'click', 'tr td:not(.editing)', clickHandle);
                    // window.addEventListener('click', reshowEditing, true);

                },
                off: () => {
                    d.off(this.tableWrapper, 'click', 'tr td:not(.editing)', clickHandle);
                    // window.removeEventListener('click', reshowEditing);
                }
            }
        })();

        /**
         * 初始化编辑 - 添加 删除
         */
        let init = () => {

            this.theadSort.off();

            if(this.conf.lockColNum){
                this.lock.destroy();
            }

            if(this.conf.lockRow) {
                this.theadLock.rowUnlock();
            }

            this.clickEvent.off();


            if(this.menu) {
                this.menu.col.off();
                this.menu.row.off();
            }

            this.fire('editChange', {status: 1});
            this.tableWrapper.classList.add('stand-text');
        };


        let cancel = ()=>{

            if(this.conf.lockRow) {
                this.theadLock.rowLock();
            }

            modifyPara = null;
            addIndex = 0;
            deletedIndexes = [];

            editedData = [];
            editing = getEditingInit();

            this.theadSort.on();

            if(this.conf.lockColNum) {
                this.lock.init();
                this.lock.render(<HTMLTableRowElement[]>d.queryAll('tbody tr', this.table), true);
            }
            //this.click.on();
            this.clickEvent.on();

            if(this.menu) {
                this.menu.col.on();
                this.menu.row.on();
            }
            ctrlIEvent.off();
            pasteEvent.off();

            this.theadSizeCache();
            this.theadSizeSync();

            this.tableWrapper.classList.remove('stand-text');

            clickEvent.off();

            this.render(this.startIndex, this.startIndex + this.tbodyLength, true);

        };
        /**
         * 初始化修改
         * @param para
         */
        let initModify = (para: TableEditInitPara) => {
            modifyPara = para;
            clickEvent.on();
            pasteEvent.on();
            ctrlIEvent.on();

            this.conf.cols.forEach((col, i) => {
                if(!modifyPara.canInit(col, 0)){
                    this.colGet(i).forEach((cell, j) => {
                        if (j > 0){
                            cellSetDisable(cell);
                        }
                    });
                }
            });

            this.colGet(0).forEach((cell, j) => {
                if(j !== 0) {
                    if(!modifyPara.canRowInit(this.rowDataGet(j-1))) {

                        cell.parentElement.classList.add('col-disabled');
                    } else {
                        cell.parentElement.classList.remove('col-disabled');
                    }
                }
            })
        };

        function cellSetDisable(cell:HTMLTableCellElement){
            cell && cell.classList.add('col-disabled');
        }

        function getEditingInit (){
            return {
                td : <HTMLTableCellElement>null,
                col : <COL> null,
                index : -1,
                data : <obj>null
            }
        }


        // 添加行
        let addRow = (rowData?: obj) => {
            let defData = modifyPara.defData;
            addIndex = addIndex > 0 ? addIndex : this.tableData.length;

            rowData = rowData ? tools.obj.merge(defData, rowData) : defData;

            let row = this.rowCreate(rowData, addIndex);
            row.classList.add('added');

            this.conf.cols.forEach((col) => {
                if(!modifyPara.canInit(col, 1)){
                    cellSetDisable(<HTMLTableCellElement>d.query(`td[data-col="${col.name}"]`, row));
                }
            });

            d.prepend(this.table.tBodies[0], row);

            //增加一条indexCol
            if(this.indexCol.col) {
                d.after(this.indexCol.col.firstElementChild, this.indexColFun.divGet(addIndex));

                this.indexColFun.refreshIndex();
            }
            editedData[addIndex] = rowData;
            addIndex ++;

            this.noData.isShow();

            if(addIndex === 1){
                this.resize(true);
            }
            // console.log(row);
        };
        let deleteRow = (canDel?: (data:obj) => boolean) => {
            let canRowInit = null;
            modifyPara && (canRowInit = modifyPara.canRowInit);
            this.trSelected.forEach((tr) => {
                // this.lockRowApply(tr, (t) => {
                // });
                let index = parseInt(tr.dataset.index);
                if(canDel && !canDel(this.rowDataGet(index))){
                    return false;
                }
                else if(canRowInit && !canRowInit(this.rowDataGet(index))){
                    return false;
                }
                this.rowHide(index);

                // 删除的如果是新增的行 就不需要加入此数组
                if(this.tableData[index]){
                    deletedIndexes.push(index);
                }

                delete editedData[index];
            });
        };

        let modifyTd = (td: HTMLTableCellElement, newVal) => {
            let tr = d.closest(td, 'tr'),
                name = td.dataset.col,
                index =  parseInt(tr.dataset.index),
                col = this.nameCol[name],
                textFormat = typeof this.conf.textFormat === 'function' ?  this.conf.textFormat : null,
                originRowData = this.rowDataGet(index),
                originTdVal = originRowData[name];
                // editedTdVal = tools.obj.merge(originRowData, editedData[index])[name];


            // 样式
            td.innerHTML = textFormat ? textFormat({[name] : newVal}, col, index) : newVal;
            td.classList.remove('editing');

            // 此处不使用全等，因为用户输入的类型皆为字符串
            if(tools.str.toEmpty(originTdVal) != tools.str.toEmpty(newVal)) {
                // 数据
                rowData(index, {[name]: newVal});

                td.classList.add('edited');
            } else {
                // editRowData[name] = tdVal;
                td.classList.remove('edited');
            }
        };

        let rowData = (index: number, data?: obj) => {
            let rowData = editedData[index] || {};
            if(data) {
                editedData[index] = tools.obj.merge(rowData, data);
            }else {
                return rowData;
            }
        };

        // 销毁输入控件，更新td数据
        let reshowEditing = () => {

            if(!editing.col){
                return ;
            }

            // debugger;
            let merge = tools.obj.merge,
                // editRowData =  {},
                // trIndex = editing.index,
                rowData = editing.data,
                newData = modifyPara.valGet(editing.col);
                // tr = d.closest(editing.td, 'tr');

            // validateResult = modifyPara.validate ? modifyPara.validate(editing.td, editing.col) : true;

            modifyPara.validate && modifyPara.validate(editing.td, editing.col, merge(rowData, newData), (td, noError:boolean) => {
                if(noError) {
                    td.classList.remove('error');
                }else{
                    td.classList.add('error');
                }
            });

            modifyPara.comDestroy(editing.col);

            modifyTd(editing.td, newData[editing.col.name]);

            // 清理正在编辑的状态
            editing = getEditingInit();
        };


        let errorLen = () => {
            return d.queryAll('td.edited.error', this.table).length;
        };

        let getData = ()=>{
            let tableLen = this.tableData.length,// 表格数据原始长度
                editData = {
                    update : <obj[]>[],
                    insert : <obj[]>[],
                    delete : <obj[]>[]
                };

            editedData.forEach((data, index) => {

                let rowData = this.tableData[index];
                if(tools.isEmpty(rowData) && tools.isEmpty(data)){
                    return;
                }

                if(index <= tableLen - 1){

                    // 修改
                    editData.update.push(tools.obj.merge(rowData, data));

                }else if(!tools.isEmpty(data)){

                    // 新增
                    editData.insert.push(tools.obj.merge(rowData, data));
                }
            });

            // 删除
            deletedIndexes.forEach(index => {
                editData.delete.push(this.tableData[index]);
            });

            return editData;
        };

        let pasteEvent = (() => {
            let pasteHandler = (e:ClipboardEvent) => {
                let copyText = e.clipboardData.getData('Text'),
                    rowsData = this.copy.match(copyText, modifyPara.pasteExceptCols);

                if(Array.isArray(rowsData)){
                    rowsData.forEach(data => {
                        addRow(data);
                    })
                }
            };

            return {
                on: () => d.on(this.tableWrapper, 'paste', pasteHandler),
                off: () => d.off(this.tableWrapper, 'paste', pasteHandler)
            }
        })();

        let ctrlIEvent = (() => {
            let handler = (e: KeyboardEvent) => {
                if(e.ctrlKey && String.fromCharCode(e.keyCode) === 'I'){
                    let selectData = this.rowSelectDataGet();
                    selectData[0] || (selectData = [modifyPara.defData]);
                    selectData.forEach(data => addRow(data));
                }
            };

            return {
                on: () => d.on(this.tableWrapper, 'keydown', handler),
                off: () => d.off(this.tableWrapper, 'keydown', handler)
            }
        })();

        return {
            errorLen,
            init,
            initModify,
            addRow,
            deleteRow,
            reshowEditing,
            cancel,
            getData,
            modifyTd,
            rowData,
            getEditing: () => editing
        }
    })();


}
/**
 * 取表格单元格内边距
 * @param dom
 * @return {number}
 */
function getPadding(dom:HTMLElement) {
    let style = getComputedStyle(dom, null),
        paddingLeft = parseInt(style.paddingLeft.replace('px', '')),
        paddingRight = parseInt(style.paddingRight.replace('px', ''));

    return paddingLeft + paddingRight;
}

function getCheckBox(ssid:string){
    let checkbox = CheckBox.initCom(ssid);
    checkbox.classList.add('circle');
    d.off(d.query('.check-span', checkbox));
    return checkbox;
}