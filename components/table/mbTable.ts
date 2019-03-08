/// <amd-module name="MbTable"/>
import {BasicTable, MenuConfGetResult} from 'basicTable';
import d = G.d;

export class MbTable extends BasicTable{
    protected conf : MT_Para;
    private reorderPanel : HTMLDivElement = null;
    private isPanelShowed : boolean = false;
    private allCol: HTMLElement[] = null;

    protected cellHeight: number = 40; // 表格行高

    constructor(para : MT_Para){
        super(para);

        this.conf.onComplete && this.conf.onComplete();
    }

    protected getEventConf(){
        return {
            menuName:'longtap',
            clickName:'tap',
            mousemoveName: 'touchmove',
            mouseoutName: '',
            mousedownName: 'touchstart',
            mouseupName: 'touchend'
        };
    }

    protected menuConfGet() : MenuConfGetResult {

        let self = this;

        return {
            colConfGet(): BT_MenuConf {
                return {
                    identifier: 'col',
                    targetGet: (selector) => [selector],
                    targetSelector: 'thead tr th',
                    btns: self.conf.colMenu
                };
            },

            rowConfGet(): BT_MenuConf {

                return {
                    identifier: 'row',
                    targetGet: (selector) => self.trSelected,
                    targetSelector: 'tbody tr',
                    btns: self.conf.rowMenu,
                    eventHandle: (target) => {
                        // self.rowSelect(<HTMLTableRowElement>target)
                    }
                };
            },

            popDomGet() {
                let timestamp = (new Date()).getTime(),
                    popHtml = `<div id="mobileTable_popMenu_${timestamp}" class="mui-popover mui-popover-bottom mui-popover-action">` +
                        '<ul class="mui-table-view"></ul>' +
                        '<ul class="mui-table-view">' +
                        `<li class="mui-table-view-cell"><a data-action="cancel" href="#mobileTable_popMenu_${timestamp}" style="color: red">取消</a>` +
                        '</li></ul></div>';

                return <HTMLElement>G.d.create(popHtml);
            },

            listDomGet(popMenu: HTMLElement) {
                return <HTMLElement>popMenu.firstElementChild;
            },

            btnHtmlGet(btns: BT_Btn[]) {
                let  btnSelector = 'data-action="tableMenuBtn"';
                let itemHtml = "";
                btns.forEach(function (btn, i) {
                    if (btn) {
                        let attr = `data-index="${i}" ${btnSelector}`;
                        itemHtml +=`<li class="mui-table-view-cell" ${attr}>${btn.title}</li>`;
                    }
                });
                return itemHtml;
            },


            show(row: HTMLTableRowElement) {
                mui(self.popMenuDom).popover('toggle');
            },

            hide(row: HTMLTableRowElement) {
                mui(self.popMenuDom).popover('toggle');
            },

            init() {

                document.body.appendChild(self.popMenuDom);
                self.popMenuDom.querySelector('[data-action]').addEventListener('tap', function () {
                    self.rowDeselect();
                });
            }
        }
    }


    private initColReorder(){
        //  console.log(234);
        let reorderPanel = <HTMLDivElement>G.d.create('<div class="mobileTableReorderPanel"><div class="buttons">' +
                '<button class="mui-btn mui-btn-link cancel" data-action="cancel">取消</button>' +
                '<button class="mui-pull-right mui-btn-link mui-btn" data-action="sure">确定</button></div></div>'),
            colList = <HTMLUListElement>G.d.create('<ul class="colList"></ul>');

        reorderPanel.appendChild(colList);

        document.body.appendChild(reorderPanel);

        this.initColReorderDragEvent(reorderPanel);

        this.reorderPanel = reorderPanel;
    }

    private initColReorderDragEvent (reorderPanel){
        let dragingDom:HTMLElement = null,
            colListDom = <HTMLDivElement>reorderPanel.querySelector('.colList'),
            commonHeight : number = 0,
            insertBeforeCol = null,
            self = this,
            colListDomPaddingTop = 10,
            colListDomPaddingLeft = 10,
            colListDomTop = colListDom.offsetTop + colListDomPaddingTop,
            startTop = 0,
            startLeft = 0; //padding top 10

        mui(reorderPanel).on('dragstart', '.colList>li', function (e:CustomEvent) {
            if(commonHeight === 0){
                commonHeight = this.offsetHeight;
            }

            let touch:Touch = e.detail.touches[0],
                rect = this.getBoundingClientRect();

            // debugger;
            startLeft= rect.width - (touch.clientX - rect.left);
            startTop = rect.height- (touch.clientY - rect.top);

            dragingDom = this.cloneNode(true);
            dragingDom.classList.add('draging');
            colListDom.appendChild(dragingDom);

            this.classList.add('placeholder');
        });

        mui(reorderPanel).on('drag', '.colList>li', function (e) {
            if(!dragingDom) { return; }

            // console.log(e);
            let lastColHalfWidth = 0,
                thisPos: Touch = e.detail.touches[0],
                thisWidth = parseInt(this.dataset.width),
                thisTop = thisPos.clientY - colListDomTop - startTop,
                thisLeftX = thisPos.clientX - colListDomPaddingLeft - startLeft;
// thisTop = thisPos.y - colListDomTop - (commonHeight * 0.8),
//                 thisLeftX = thisPos.x - colListDomPaddingLeft - (thisWidth * 0.8);

            if(insertBeforeCol){
                insertBeforeCol.classList.remove('before');
                insertBeforeCol = null;
            }

            dragingDom.style.left = `${thisLeftX}px`;
            dragingDom.style.top = `${thisTop}px`;

            for(let i = 0, col; col = self.allCol[i]; i++){

                let colHalfWidth = parseInt(col.dataset.width) / 2,
                    colTop = parseInt(col.dataset.top);

                // 判断在不在此行
                // console.log(`${colTop} + ${commonHeight} < ${thisTop} + ${commonHeight / 2}`);
                if( colTop + commonHeight < thisTop + (commonHeight / 2) ){
                    lastColHalfWidth = colHalfWidth;
                    continue ;
                }

                let colLeftX = parseInt(col.dataset.left),
                    colCenterX = colLeftX + colHalfWidth;

                // 确认行之后判断此行的具体项
                if(colTop > thisTop || (thisLeftX >= colLeftX - lastColHalfWidth && thisLeftX <= colCenterX) ){
                    insertBeforeCol = col;
                    insertBeforeCol.classList.add('before');
                    break;
                }

                lastColHalfWidth = colHalfWidth;
            }

        });

        mui(reorderPanel).on('dragend', '.colList>li', function () {

            colListDom.removeChild(dragingDom);
            dragingDom = null;
            this.classList.remove('placeholder');
            colListDom.insertBefore(this, insertBeforeCol);
            if(insertBeforeCol){
                insertBeforeCol.classList.remove('before');
            }
            MbTable.calcReorderColsPos(self.allCol, null, true);

        });

        // reorderPanel.querySelector('.buttons').addEventListener('tap', G.tools.event.delegate('.mui-btn', function () {
        d.on(d.query('.buttons', reorderPanel), 'click', '.mui-btn', function (e) {
            e.stopPropagation();
            switch (this.dataset.action){
                case 'cancel':
                    reorderPanel.style.display = 'none';
                    break;
                case 'sure':
                    // debugger;
                    reorderPanel.style.display = 'none';
                    let newOrderCols = [],
                        allCols = d.queryAll('.colList li', reorderPanel);

                    for(let i = 0, col:HTMLElement; col = allCols[i]; i ++){
                        newOrderCols.push( self.conf.cols[ parseInt( col.dataset.colIndex ) ] );
                    }

                    self.conf.cols = newOrderCols;
                    self.theadRender();
                    self.lock.destroy();
                    self.lock.init();
                    self.render(self.startIndex, self.tbodyLength + self.startIndex, true);
                    break;
            }
        });
    }

    private static calcReorderColsPos(allCol:HTMLElement[], stopCol: HTMLLIElement = null, noWidth:boolean = false){
        for(let i = 0, col:HTMLElement; col = allCol[i]; i++){

            if(col.isEqualNode(stopCol)){
                break;
            }

            if(!noWidth){
                col.dataset['width'] = col.offsetWidth.toString();
                col.style.width = col.offsetWidth + 'px';
            }

            col.dataset['top'] = col.offsetTop.toString();
            col.dataset['left'] = col.offsetLeft.toString();
        }
    }



    public showColReorder() : void{

        if(!this.isPanelShowed){
            this.initColReorder();
            this.isPanelShowed = true;
        }

        let colListDom = this.reorderPanel.querySelector('.colList');

        colListDom.innerHTML = '';

        this.allCol = [];

        this.conf.cols.forEach((col, i) => {
            let li = G.d.create(`<li data-col-index="${i}"><span>${col.title}</span></li>`);
            this.allCol.push(li);
            colListDom.appendChild(li);
        });

        this.reorderPanel.style.display = 'block';

        MbTable.calcReorderColsPos(d.queryAll('li', colListDom));
    }
    public colReorder = (() => {
        let reorderPanel: HTMLElement = null,
            allCol: HTMLElement[] = null,
            isPanelShowed = false;

        let init = () => {
            //  console.log(234);
            reorderPanel = <HTMLDivElement>G.d.create('<div class="mobileTableReorderPanel"><div class="buttons">' +
                '<button class="mui-btn mui-btn-link cancel" data-action="cancel">取消</button>' +
                '<button class="mui-pull-right mui-btn-link mui-btn" data-action="sure">确定</button></div></div>');

            let colList = <HTMLUListElement>G.d.create('<ul class="colList"></ul>');

            reorderPanel.appendChild(colList);

            document.body.appendChild(reorderPanel);

            initEvent();
        };

        let show = () => {
            if(!isPanelShowed){
                init();
                isPanelShowed = true;
            }

            let colListDom = reorderPanel.querySelector('.colList');

            colListDom.innerHTML = '';
            allCol = [];

            this.conf.cols.forEach(function (col, i) {
                let li = G.d.create(`<li data-col-index="${i}"><span>${col.title}</span></li>`);
                allCol.push(li);
                colListDom.appendChild(li);
            });

            reorderPanel.style.display = 'block';

            calcReorderColsPos(allCol);
        };

        let initEvent = () => {
            let dragingDom:HTMLElement = null,
                colListDom = <HTMLDivElement>reorderPanel.querySelector('.colList'),
                commonHeight : number = 0,
                insertBeforeCol = null,
                self = this,
                colListDomPaddingTop = 10,
                colListDomPaddingLeft = 10,
                colListDomTop = colListDom.offsetTop + colListDomPaddingTop,
                startTop = 0,
                startLeft = 0; //padding top 10

            mui(reorderPanel).on('dragstart', '.colList>li', function (e:CustomEvent) {
                if(commonHeight === 0){
                    commonHeight = this.offsetHeight;
                }

                let touch:Touch = e.detail.touches[0],
                    rect = this.getBoundingClientRect();

                // debugger;
                startLeft= rect.width - (touch.clientX - rect.left);
                startTop = rect.height- (touch.clientY - rect.top);

                dragingDom = this.cloneNode(true);
                dragingDom.classList.add('draging');
                colListDom.appendChild(dragingDom);

                this.classList.add('placeholder');
            });

            mui(reorderPanel).on('drag', '.colList>li', function (e) {
                if(!dragingDom) { return; }

                // console.log(e);
                let lastColHalfWidth = 0,
                    thisPos: Touch = e.detail.touches[0],
                    thisWidth = parseInt(this.dataset.width),
                    thisTop = thisPos.clientY - colListDomTop - startTop,
                    thisLeftX = thisPos.clientX - colListDomPaddingLeft - startLeft;
// thisTop = thisPos.y - colListDomTop - (commonHeight * 0.8),
//                 thisLeftX = thisPos.x - colListDomPaddingLeft - (thisWidth * 0.8);

                if(insertBeforeCol){
                    insertBeforeCol.classList.remove('before');
                    insertBeforeCol = null;
                }

                dragingDom.style.left = `${thisLeftX}px`;
                dragingDom.style.top = `${thisTop}px`;

                for(let i = 0, col; col = allCol[i]; i++){

                    let colHalfWidth = parseInt(col.dataset.width) / 2,
                        colTop = parseInt(col.dataset.top);

                    // 判断在不在此行
                    // console.log(`${colTop} + ${commonHeight} < ${thisTop} + ${commonHeight / 2}`);
                    if( colTop + commonHeight < thisTop + (commonHeight / 2) ){
                        lastColHalfWidth = colHalfWidth;
                        continue ;
                    }

                    let colLeftX = parseInt(col.dataset.left),
                        colCenterX = colLeftX + colHalfWidth;

                    // 确认行之后判断此行的具体项
                    if(colTop > thisTop || (thisLeftX >= colLeftX - lastColHalfWidth && thisLeftX <= colCenterX) ){
                        insertBeforeCol = col;
                        insertBeforeCol.classList.add('before');
                        break;
                    }

                    lastColHalfWidth = colHalfWidth;
                }

            });

            mui(reorderPanel).on('dragend', '.colList>li', function () {

                colListDom.removeChild(dragingDom);
                dragingDom = null;
                this.classList.remove('placeholder');
                colListDom.insertBefore(this, insertBeforeCol);
                if(insertBeforeCol){
                    insertBeforeCol.classList.remove('before');
                }
                calcReorderColsPos(allCol, null, true);

            });

            // reorderPanel.querySelector('.buttons').addEventListener('tap', G.tools.event.delegate('.mui-btn', function () {
            d.on(d.query('.buttons', reorderPanel), 'tap', '.mui-btn', function () {
                switch (this.dataset.action){
                    case 'cancel':
                        reorderPanel.style.display = 'none';
                        break;
                    case 'sure':
                        reorderPanel.style.display = 'none';
                        // debugger;
                        let newOrderCols = [];

                        for(let i = 0, col:HTMLElement; col = allCol[i]; i ++){
                            newOrderCols.push( self.conf.cols[ parseInt( col.dataset.colIndex ) ] );
                        }

                        self.conf.cols = newOrderCols;
                        self.theadRender();
                        self.render(self.startIndex, self.tbodyLength + self.startIndex, true);
                        break;
                }
            });
        };

        function calcReorderColsPos(allCol:HTMLElement[], stopCol: HTMLLIElement = null, noWidth:boolean = false){
            for(let i = 0, col:HTMLElement; col = allCol[i]; i++){

                //
                if(col.isEqualNode(stopCol)){
                    break;
                }

                if(!noWidth){
                    col.dataset['width'] = col.offsetWidth.toString();
                    col.style.width = col.offsetWidth + 'px';
                }

                col.dataset['top'] = col.offsetTop.toString();
                col.dataset['left'] = col.offsetLeft.toString();
            }
        }

        return {show}
    })();
    protected lockScreen() {
        let container = this.conf.Container,
            body = document.body;

        if(container) {
            container.style.overflowY = 'hidden';
            //container.style.height = '100%';
        }
        this.tableMiddle.style.overflowX = 'hidden';
        this.tableMiddle.style.width = '100%';
        body.style.overflow = 'hidden';
        body.style.height = '100%';
        this.move.timeout = setTimeout(()=>{this.unlockScreen();}, 1000);
    };

    destroy(){
        super.destroy();
    }
}

