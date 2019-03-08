/// <amd-module name="PcTable"/>
import {BasicTable, MenuConfGetResult} from './basicTable';
import tools = G.tools;
import d = G.d;

export class PcTable extends BasicTable {
    protected conf: MT_Para;
    private wrapperRect : ClientRect = null;

    constructor(para: BT_Para) {
        super(para);
        let defaultConf = {
            colReorder: false,
        };


        // console.log(defaultConf, this.conf);
        this.conf = <MT_Para>tools.obj.merge(true, defaultConf, this.conf);

        if(!tools.keysVal(this.conf, 'multi', 'enabled')){
            this.hoverFun.col.on();
            this.hoverFun.row.on();
        }

        let self = this,
            handler = function (e: MouseEvent) {
            if(e.ctrlKey && self.conf.indexColMulti){
                self.rowToggle(this);
            }else{
                self.rowSelect(this);
            }
        };
        this.clickEvent.add('tbody tr', handler);


        this.on('editChange', (e:CustomEvent) => {
            if(e.detail.status === 1){
                this.hoverFun.row.off();
                this.hoverFun.col.off();
                this.dragSelectFunc.off();

            }else{
                this.hoverFun.row.on();
                this.hoverFun.col.on();
                this.dragSelectFunc.on();
            }
        });


        this.conf.onComplete && this.conf.onComplete();


        // this.conf.onComplete(this, false);
        //开启拖拽选择
        this.dragSelectFunc.on();
    }

    private hoverFun = (function (self) {
        let wrapper = self.tableWrapper,
            colHoverHandler = function () {
                colHoverToggle(this);
            },

            rowHoverHandler = function () {
                rowHoverToggle(this);
            },

            colHoverOn = function () {
                d.on(wrapper, 'mouseover', 'thead th', colHoverHandler);
                d.on(wrapper, 'mouseout', 'thead th', colHoverHandler);
            },

            colHoverOff = function () {
                d.off(wrapper, 'mouseover', 'thead th', colHoverHandler);
                d.off(wrapper, 'mouseout', 'thead th', colHoverHandler);
            },

            rowHoverOn = function () {
                d.on(wrapper, 'mouseover', 'tbody tr', rowHoverHandler);
                d.on(wrapper, 'mouseout', 'tbody tr', rowHoverHandler);
            },

            rowHoverOff = function () {
                d.off(wrapper, 'mouseover', 'tbody tr', rowHoverHandler);
                d.off(wrapper, 'mouseout', 'tbody tr', rowHoverHandler);
            };

        function colHoverToggle(th: HTMLTableCellElement) {
            let index = self.colName2index(th.dataset.col),
                isHover = th.classList.contains('col-hover'),
                table = d.closest(th, '.mobileTableLock') ? self.lockTable : self.table;

            d.queryAll('.col-hover', wrapper).forEach((item, i) => {
                item.classList.remove('col-hover');
            });

            self.colGet(index, table).forEach(function (tr) {
                isHover || tr.classList.add('col-hover');
            });

            if (self.conf.lockRow) {
                self.colGet(index, self.lockRow.table).forEach(function (tr) {
                    isHover || tr.classList.add('col-hover');
                });
            }

            if (self.conf.lockColNum > 0) {
                self.colGet(index, self.lockCol.table).forEach(function (tr) {
                    isHover || tr.classList.add('col-hover');
                });
            }


            if (d.closest(th, '.mobileTableTopFixedLock')) {
                self.colGet(index, self.lockRow.fixedTable).forEach(function (tr) {
                    isHover || tr.classList.add('col-hover');
                });
            }
        }

        function rowHoverToggle(row) {
            let isHover = row.classList.contains('col-hover');
            isHover ? row.classList.remove('col-hover') : row.classList.add('col-hover');
            self.lockRowApply(row, function (tr) {
                isHover ? tr.classList.remove('col-hover') : tr.classList.add('col-hover');
            })
        }

        return {
            row: {
                on: rowHoverOn,
                off: rowHoverOff
            },
            col: {
                on: colHoverOn,
                off: colHoverOff
            }
        }

    })(this);

    protected getEventConf(){
        return {
            menuName: 'contextmenu',
            clickName: 'click',
            mousemoveName: 'mousemove',
            mouseoutName: 'mouseout',
            mousedownName: 'mousedown',
            mouseupName: 'mouseup'
        };
    }
    private wrapperRectGet(){
        if(!this.wrapperRect){
            this.wrapperRect = this.tableWrapper.getBoundingClientRect()
        }
        return this.wrapperRect;
    }

    protected menuConfGet() : MenuConfGetResult {
        let self = this;
        return {
            colConfGet(): BT_MenuConf {

                // rect = self.wrapperRectGet();
                return {
                    identifier: 'col',
                    targetGet: (selector) => [selector],
                    targetSelector: 'thead tr th',
                    btns: self.conf.colMenu,
                    eventHandle: (target: HTMLElement, e) => {
                        e.preventDefault();
                        let rect: ClientRect = self.tableWrapper.getBoundingClientRect();
                        let pos = [e.clientX - rect.left, e.clientY - rect.top];
                        self.popMenuDom.style.left = `${pos[0]}px`;
                        self.popMenuDom.style.top = `${pos[1]}px`;
                    }
                };
            },

            rowConfGet(): BT_MenuConf {
                return {
                    identifier: 'row',
                    targetGet: (selector) => self.trSelected,
                    targetSelector: 'tbody tr',
                    btns: self.conf.rowMenu,
                    eventHandle: (target: HTMLElement, e) => {
                        e.preventDefault();
                        let rect: ClientRect = self.tableWrapper.getBoundingClientRect();

                        let pos = [e.clientX - rect.left, e.clientY - rect.top];
                        self.popMenuDom.style.left = `${pos[0]}px`;
                        self.popMenuDom.style.top = `${pos[1]}px`;
                    }
                }
            },

            popDomGet() {
                let popHtml = `<ul class="pcTableMenu list-group col-menu" style="position: absolute;z-index: 3"></ul>`;
                return <HTMLElement>d.create(popHtml);
            },

            listDomGet(popMenu: HTMLElement) {
                return <HTMLElement>popMenu;
            },

            btnHtmlGet(btns: BT_Btn[]) {
                let itemsHtml = {val : ""};
                let  btnSelector = 'data-action="tableMenuBtn"';
                function getChildDom(btns,itemsHtml){
                    if(btns && btns.length > 0) {
                        for (let i = 0; i < btns.length; i++) {
                            let attr = `data-index="${i}" ${btnSelector}`;
                            itemsHtml.val +=  `<li class="list-group-item listItem" ${attr}>${btns[i].title}`;
                            if (btns[i].children && (btns[i].children.length > 0)) {
                                itemsHtml.val += '<span style="position:absolute; top: 8px; right: 4px;">></span>';
                                itemsHtml.val += '<ul class="pcTableMenu list-group col-menu ul-list">';
                                getChildDom(btns[i].children, itemsHtml);
                                itemsHtml.val += '</ul>';
                            }
                            itemsHtml.val += '</li>'
                        }
                    }
                }
                getChildDom(btns,itemsHtml);
                return itemsHtml.val;
            },

            show() {
                self.popMenuDom.style.display = 'block';
            },

            hide() {
                self.popMenuDom.style.display = 'none';
            },

            init() {
                // document.body.appendChild(this.popMenuDom);

                self.tableWrapper.appendChild(self.popMenuDom);
                d.on(document,'click', function () {
                    self.popMenu.hide();
                    // self.rowDeselect();
                });
            }
        }
    }

    // private trClick = (() => {
    //     let self = this;
    //
    // })();


    // private rowEditInit(tr : HTMLTableRowElement){
    //     let self = this,
    //         rowData = self.rowDataGet(parseInt(tr.dataset.index)),
    //         confirm =  self.rowEditConfirmInit();
    //
    //     confirm.show(tr);
    //     self.editRow = tr;
    //     self.lockRowApply(tr, (t)=>{
    //
    //         let tds : NodeListOf<HTMLTableCellElement> = t.querySelectorAll('td');
    //         t.classList.add('edit');
    //         for(let i = 0, td:HTMLTableCellElement = null; td = tds.item(i); i++){
    //             // t.replaceChild(tools)
    //
    //             td.innerHTML = `<input data-col="${td.dataset.col}" value="${tools.str.htmlEncode(rowData[td.dataset.col])}">`;
    //         }
    //
    //         self.theadWidthCache();
    //         self.theadSizeSync();
    //     });
    // }
    //
    // private rowEditConfirmInit = (function(self){
    //     let dom = d.createByHTML('<ul class="pcTableConfirm list-group col-menu row">' +
    //         '<li class="col-xs-6 list-group-item" data-action="confirm"><span class="iconfont icon-dagou"></span></li>' +
    //         '<li class="col-xs-6 list-group-item" data-action="cancel"><span class="iconfont icon-close"></span></li></ul>');
    //
    //     document.body.appendChild(dom);
    //     $(dom).on('click', '[data-action]', function () {
    //         switch (this.dataset.action){
    //             case 'confirm':
    //                 let data :any = {},
    //                     inputs:NodeListOf<HTMLInputElement> = self.editRow.querySelectorAll('input');
    //                 for(let i = 0, input:HTMLInputElement = null; input = inputs.item(i); i++){
    //                     let value = input.value;
    //                     data[input.dataset.col] = value === '' ? null : value;
    //                 }
    //
    //                 let newRow = self.rowCreate(data, parseInt( self.editRow.dataset.index ) );
    //                 self.rowReplace(newRow, self.editRow);
    //
    //                 self.theadWidthCache();
    //                 self.theadSizeSync();
    //
    //                 hide();
    //
    //                 //
    //                 break;
    //             case 'cancel':
    //                 hide();
    //
    //                 break;
    //         }
    //     });
    //     let domHeight = 0;
    //
    //     function getHeight(){
    //         if(domHeight === 0){
    //             domHeight = dom.offsetHeight;
    //         }
    //         return domHeight;
    //     }
    //
    //     function hide(){
    //         dom.style.display = 'none';
    //         self.editBtn.classList.remove('hide');
    //     }
    //     return function () {
    //         return {
    //             show : function(tr:HTMLTableRowElement){
    //                 let rect = tr.getBoundingClientRect();
    //                 dom.style.left = rect.left + 'px';
    //                 dom.style.display= 'block';
    //                 dom.style.top = (rect.top  + document.body.scrollTop - getHeight() +1)+ 'px';
    //
    //                 self.editBtn.classList.add('hide');
    //             },
    //             hide: function(){
    //                 hide();
    //             }
    //         };
    //     };
    // }(this));


    protected lockScreen() {

    };

    // protected isShowNoData() {
    //     let noDataDom = this.table.nextElementSibling;
    //     noDataDom = noDataDom && noDataDom.classList.contains('nodata') ? noDataDom : null;
    //
    //     // 当前页没有tbody中没有tr
    //     if (this.table.tBodies.item(0).firstElementChild === null) {
    //         if (!noDataDom) {
    //             noDataDom = d.createByHTML('<div class="nodata no-padding"><span class="iconfont icon-gongyongwushuju"></span></div>');
    //             d.after(this.table, noDataDom);
    //
    //             if (this.indexCol.col) {
    //                 this.indexColFun.show(false);
    //             }
    //             if (this.pseudoCol.Container) {
    //                 this.pseudoCol.show = false;
    //                 this.pseudoCol.Container.classList.add('hide');
    //                 this.tableWrapper.classList.remove('hasPseudoCol');
    //             }
    //         }
    //     } else {
    //         if (noDataDom) {
    //             d.remove(noDataDom);
    //
    //             if (this.indexCol.col) {
    //                 this.indexColFun.show(true);
    //             }
    //             if (this.pseudoCol.Container) {
    //                 this.pseudoCol.show = true;
    //                 this.pseudoCol.Container.classList.remove('hide');
    //                 this.tableWrapper.classList.add('hasPseudoCol');
    //             }
    //         }
    //     }
    //
    // }

    // 拖拽框选
    public drag = (function (self) {
        let start_name: string, end_name: string, start_index, end_index,
            startTd, startCol,
            mouseStart, mouseEnd,
            shadeLayer,
            maxSize,
            outLayer = false,
            callbackQueue = []; // 回调函数队列

        function getPosition(e) {
            return {x: e.pageX, y: e.pageY};
        }

        // 创建遮罩
        function createLayer() {
            if (!shadeLayer) {
                shadeLayer = document.getElementById('tableDragSelect' + self.ssid);
                if (!shadeLayer) {
                    shadeLayer = document.createElement('div');
                    shadeLayer.classList.add('tableDragSelect');
                    shadeLayer.setAttribute('id', 'tableDragSelect' + self.ssid);

                    self.tableWrapper.appendChild(shadeLayer);
                }
            }
        }

        // 更新遮罩尺寸
        function updatePosition() {
            let left = mouseStart.x < mouseEnd.x ? mouseStart.x : mouseEnd.x,
                top = mouseStart.y < mouseEnd.y ? mouseStart.y : mouseEnd.y,
                width = Math.abs(mouseEnd.x - mouseStart.x),
                height = Math.abs(mouseEnd.y - mouseStart.y),
                offsetTop = G.tools.offset.top(self.tableWrapper), offsetLeft = G.tools.offset.left(self.tableWrapper),
                scrollTop = self.conf.Container ? self.conf.Container.scrollTop : 0;

            outLayer = false;
            // 边界限制
            if (left < maxSize.left) {
                left = maxSize.left;
                width = Math.abs(left - mouseStart.x);
                outLayer = true;
            }
            if (top < maxSize.top) {
                top = maxSize.top;
                height = Math.abs(top - mouseStart.y);
                outLayer = true;
            }
            if (left + width > maxSize.right) {
                width = maxSize.right - left;
                outLayer = true;
            }
            if (top + height > maxSize.bottom) {
                height = maxSize.bottom - top;
                outLayer = true;
            }

            shadeLayer.style.left = (left - offsetLeft) + 'px';
            shadeLayer.style.top = (top - offsetTop + scrollTop) + 'px';
            shadeLayer.style.width = width + 'px';
            shadeLayer.style.height = height + 'px';
        }

        // 拖拽
        function mouseMove(event) {
            event = self.getEvent(event);
            if (self.dragControl.dragging) {


                mouseEnd = getPosition(event);
                if (Math.abs(mouseEnd.x - mouseStart.x) > 10 || Math.abs(mouseEnd.y - mouseStart.y) > 10) {
                    createLayer();
                    updatePosition();
                }
                /*if(!outLayer && !event.target.classList.contains('tableDragSelect')) {
                    endTd = event.target;
                }*/
            }
        }

        // 获取边界
        function getMax() {
            let tableContainer = self.tableContainer,
                table = self.table.tBodies.item(0),
                top = tools.offset.top(table),
                left = tools.offset.left(tableContainer),
                colGroupHeight = self.conf.colGroup ? 30 : 0;
            return {
                top: top + colGroupHeight,
                left: left,
                right: left + tableContainer.offsetWidth,
                bottom: top + table.offsetHeight
            };
        }

        // 鼠标按下
        function mousedownHandle(event) {
            //event.preventDefault();
            if (d.closest(event.target, '.colGroup')) {
                return;
            }
            event = self.getEvent(event);
            startTd = d.closest(event.target, 'td');
            if (!startTd) {
                return;
            }
            startCol = startTd.dataset.col;
            mouseStart = getPosition(event);
            maxSize = getMax();
            //endTd = null;
            self.dragControl.dragging = true;
            document.onselectstart = function () {
                return false;
            };
            document.ondragstart = function () {
                return false;
            };
            d.on(document, self.mousemoveName, mouseMove);
            d.on(document, self.mouseupName, mouseupHandle);
        }

        // 鼠标松开
        function mouseupHandle(e) {
            document.onselectstart = null;
            document.ondragstart = null;
            d.off(document, self.mousemoveName, mouseMove);
            d.off(document, self.mouseupName, mouseupHandle);
            if (self.dragControl.dragging) {

                let startTr = d.closest(startTd, 'tr');
                if (!shadeLayer) {
                    start_name = end_name = startCol;
                    start_index = end_index = startTr.dataset.index;
                }
                else {
                    let event = e.changedTouches ? e.changedTouches[0] : e,
                        theadTh = d.queryAll('tr th', self.table.tHead),
                        thLen = theadTh.length,
                        end_col: number, end_td;

                    // 获取结束的单元格位置
                    if (theadTh[thLen - 1].getBoundingClientRect().right < event.clientX) {
                        let th = theadTh[thLen - 1];
                        end_name = th.dataset.col;
                        end_col = thLen - 1;
                    }
                    else {
                        for (let i = 0; i < thLen; i++) {
                            let right = theadTh[i].getBoundingClientRect().right;
                            if (right > event.clientX) {
                                let th = <HTMLElement>theadTh[i];
                                end_name = th.dataset.col;
                                end_col = i;
                                break;
                            }
                        }
                    }
                    end_td = self.colGet(end_col);
                    if (end_td[end_td.length - 1].getBoundingClientRect().bottom < event.clientY) {
                        end_index = end_td[end_td.length - 1].parentNode.dataset.index;
                    }
                    else {
                        for (let i = 0, l = end_td.length; i < l; i++) {
                            if (self.conf.colGroup && i < 2) {
                                continue;
                            }
                            let bottom = end_td[i].getBoundingClientRect().bottom;
                            if (bottom > event.clientY) {
                                end_index = end_td[i].parentNode.dataset.index;
                                break;
                            }
                        }
                    }


                    start_name = startCol;
                    start_index = parseInt(startTr.dataset.index);

                    // 顺序调整
                    if (start_index > end_index) {
                        let temp = start_index;
                        start_index = end_index;
                        end_index = temp;
                    }
                    if (start_name != end_name && mouseStart.x > mouseEnd.x) {
                        let temp = start_name;
                        start_name = end_name;
                        end_name = temp;
                    }
                }


                shadeLayer && d.remove(shadeLayer);
                shadeLayer = null;
                mouseStart = null;
                //endTd = null;
                startTd = null;
                startCol = null;
                self.dragControl.dragging = false;
                if((start_index === end_index) && e.button === 2)
                {
                    return ;
                }
                callbackQueue.forEach((callback) => {
                    callback(start_name, end_name, start_index, end_index);
                });
            }
        }


        function on(handle) {
            if (callbackQueue.length === 0) {
                d.on(self.tableContainer, self.mousedownName, mousedownHandle);
            }
            callbackQueue.push(handle);
        }
        function off(){
            d.off(self.tableContainer, self.mousedownName, mousedownHandle);
            callbackQueue = [];
            //移除有选中的单元格
            d.queryAll('td.cellSelect', self.tableContainer).forEach(td => {
                td.classList.remove('cellSelect');
                let classArr = ['topBorder','bottomBorder','leftBorder','rightBorder'];
                for(let i = 0,l = classArr.length;i < l;i++){
                    if(td.classList.contains(classArr[i])){
                        td.classList.remove(classArr[i]);
                    }
                }
            });
        }

        function getData(){
            return self.dragSelectFunc.getResult();
        }

        return {
            on,
            off,
            getData
        };
    }(this));

    // 拖拽选择
    protected dragSelectFunc = (function (self) {
        let selectData = {};
        // 添加选中样式
        function cellSelect(start_name, end_name, start_index, end_index) {

            let hasLock = false;
            d.queryAll('td.cellSelect', self.tableContainer).forEach(td => {
                td.classList.remove('cellSelect');
                let classArr = ['topBorder','bottomBorder','leftBorder','rightBorder'];
                for(let i = 0,l = classArr.length;i < l;i++){
                    if(td.classList.contains(classArr[i])){
                        td.classList.remove(classArr[i]);
                    }
                }
            });
            if (self.conf.lockColNum > 0) {
                // 锁列
                for (let arr of self.conf.cols) {
                    if (arr.name === start_name) {
                        hasLock = true;
                        break;
                    }
                }
            }

            for (let i = start_index; i <= end_index; i++) {
                let tr = self.rowGet(i),
                    isSelected = false;
                d.queryAll('td', tr).forEach(function (td) {
                    if (td.dataset.col === start_name) {
                        td.classList.add('leftBorder');
                        isSelected = true;
                    }
                    if (isSelected) {
                        td.classList.add('cellSelect');
                    }
                    if (isSelected && i == start_index) {
                        td.classList.add('topBorder');
                    }
                    if (isSelected && i == end_index) {
                        td.classList.add('bottomBorder');
                    }
                    if (td.dataset.col === end_name) {
                        td.classList.add('rightBorder');
                        isSelected = false;
                    }
                });

                if (self.conf.lockColNum > 0 && hasLock) {
                    let lockTr = self.rowGet(i, self.lockCol.table),
                        isLockSelected;
                    d.queryAll('td', lockTr).forEach(td => {
                        if (td.dataset.col === start_name) {
                            td.classList.add('leftBorder');
                            isSelected = true;
                        }
                        if (isSelected) {
                            td.classList.add('cellSelect');
                        }
                        if (isSelected && i == start_index) {
                            td.classList.add('topBorder');
                        }
                        if (isSelected && i == end_index) {
                            td.classList.add('bottomBorder');
                        }
                        if (td.dataset.col === end_name) {
                            td.classList.add('rightBorder');
                            isSelected = false;
                        }
                    });
                }
            }
        }

        // 筛选被框选的单元格
        function checkSelected(start_name, end_name, start_index, end_index) {

            if (!!~start_index.toString().indexOf('-') || !!~end_index.toString().indexOf('-')) {
                return;
            }

            cellSelect(start_name, end_name, start_index, end_index);

            // 构造数据
            let cols = [],
                data = [];
            //if(start_index) {
            for (let i = start_index; i <= end_index; i++) {
                let isdata = false,
                    row = {};
                for (let col of self.conf.cols) {
                    if (col.name === start_name) {
                        isdata = true;
                    }
                    if (isdata) {
                        if (i === start_index) {
                            cols.push(tools.obj.merge(col, {}));
                        }
                        row[col.name] = self.tableData[i][col.name];
                    }
                    if (col.name === end_name) {
                        isdata = false;
                    }
                }
                data.push(row);
            }
            //}

            let result = {cols, data};
            self.dragSelect.selected = result;
            let indexes = [parseInt(start_index), parseInt(end_index)];
            selectData = {
                indexes : indexes,
                cols : cols
            };
           // self.conf.dragSelect && self.conf.dragSelect(result);
        }


        function on() {
            self.dragSelect.selected = {};
            self.drag.on(checkSelected);
        }

        function off() {
            self.dragSelect.selected = {};
            self.drag.off();
        }

        function getResult(){
            return selectData;
        }
        return {
            on,off,getResult
        }
    })(this);

    protected dragRowsFunc = (function (self) {
        /*function checkboxHandle() {

        }*/
        function clickHandle(index: number, event) {
            let e = self.getEvent(event),
                checkbox = e.target,
                action = checkbox.checked ? 'add' : 'remove',
                result = [];

            if (checkbox.tagName !== 'INPUT') {
                return;
            }

            let tr = self.rowGet(index);
            tr.classList[action]('selected');
            if (self.conf.lockColNum > 0) {
                let lockTr = self.rowGet(index, self.lockCol.table);
                lockTr.classList[action]('selected');
            }

            // 更新选中值
            d.queryAll('input[name="checkedrows"]', self.pseudoCol.Container).forEach((item: HTMLInputElement) => {
                if (item.checked) {
                    let pseudoCol = <HTMLDivElement>item.parentNode,
                        val = pseudoCol.dataset.index;
                    result.push(self.tableData[val]);
                }
            });
            self.dragRows.selected = result;
            self.conf.dragRows && self.conf.dragRows(result);
        }

        function createPseudoCol() {
            self.pseudoColFun.init({
                render: index => '<input type="checkbox" name="checkedrows" class="checkedRows" />',
                click: clickHandle
            });
        }


        // 添加选中样式
        function cellSelect(start_name, end_name, start_index, end_index) {
            d.queryAll('tr.selected', self.tableContainer).forEach(function (td, i) {
                td.classList.remove('selected');
            });

            d.queryAll('input[type="checkbox"]', self.pseudoCol.Container).forEach((item: HTMLInputElement) => {
                item.checked = false;
            });


            for (let i = start_index; i <= end_index; i++) {
                let tr = self.rowGet(i);
                tr.classList.add('selected');
                if (self.conf.lockColNum > 0) {
                    let lockTr = self.rowGet(i, self.lockCol.table);
                    lockTr.classList.add('selected');
                }

                let pseudo = self.pseudoCol.Container.querySelector(`.pseudoCol-item[data-index="${i}"] input[type="checkbox"]`);
                pseudo && (pseudo.checked = true);
            }
        }

        // 筛选被框选的单元格
        function checkSelected(start_name, end_name, start_index, end_index) {

            if (!!~start_index.toString().indexOf('-') || !!~end_index.toString().indexOf('-')) {
                return;
            }
            cellSelect(start_name, end_name, start_index, end_index);

            // 构造数据
            let result = [];
            if (start_index) {
                for (let i = start_index; i <= end_index; i++) {
                    result.push(self.tableData[i]);
                }
            }

            self.dragRows.selected = result;
            self.conf.dragRows && self.conf.dragRows(result);
        }


        function init() {
            createPseudoCol();
            self.drag.on(checkSelected);
        }

        return {
            init
        };
    }(this));
    destroy(){
        super.destroy();
    }
}
