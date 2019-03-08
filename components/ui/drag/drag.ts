/// <amd-module name="Drag"/>
import d = G.d;
import tools = G.tools;

interface DragPara {
    dom: HTMLElement;    //拖拽框
    head?: HTMLElement; //拖拽框允许被拖拽的部分，默认为整个拖拽框
    scale?: {   //是否拖拉，不传则无拖拉缩放效果
        position?: string;//如果传入值，则按照传入的方向拖拉缩放
        minWidth?: number;//拖拉是能缩放的最小宽度
        minHeight?: number;//拖拉是能缩放的最小高度
    },
    container?: HTMLElement; //拖拉时的相对父容器
}
export class Drag {
    protected panelInfo: any;		// 用于缓存外边框边界数据，提高移动效率
    protected dragState: any;		// 记录鼠标按下时，坐标信息，用于位移计算
    protected moveing: boolean = false;// 是否处于移动状态
    private dragWrapper;    //拖拉框
    private mouseDownPullHandle;
    private mouseDownScaleHandle;
    private _container; //父容器

    constructor(private para) {
        this.init();
        this.dragEvent();
        this._container = (tools.isEmpty(para.container) || !para.scale) ? document.body : para.container;
    }

    private init() {
        //初始化拖拽框允许被拖拽的部分
        this.para.head = this.para.head ? this.para.head : document.querySelector('body');
        let self = this;

        //初始化模态框拖拽时鼠标按下事件
        this.mouseDownPullHandle = (e) => {
            self.mousedownHandle(e);
        }

        this.mouseDownScaleHandle = (e) => {
            self.mousedownHandle(e);
        }

        //初始化拖拉缩放框（以拖拽框为父容器，在拖拽框拖拉缩放的方向创建对应的div）
        if (this.para.scale) {
            //设置拖拉缩放的元素，不需要拖拉效果时为空，需要时为对应位置的容器
            this.para.dom.classList.add('drag-container');
            switch (this.para.scale.position) {
                case 'top':
                    let topDragWrapper = d.create(`<div class="top-drag-wrapper"></div>`);
                    this.dragWrapper = topDragWrapper;
                    break;
                case 'right':
                    let rightDragWrapper = d.create(`<div class="right-drag-wrapper"></div>`);
                    this.dragWrapper = rightDragWrapper;
                    break;
                case 'bottom':
                    let bottomDragWrapper = d.create(`<div class="bottom-drag-wrapper"></div>`);
                    this.dragWrapper = bottomDragWrapper;
                    break;
                case 'left':
                    let leftDragWrapper = d.create(`<div class="left-drag-wrapper"></div>`);
                    this.dragWrapper = leftDragWrapper;
                    break;
            }
            if (this.dragWrapper) {
                this.para.dom.appendChild(this.dragWrapper);
            }
        }
    }

    /*
     * 关闭模态框拖拽事件
     * */
    public pullEventOff() {
        this.para.head.style.cursor = 'default';
        d.off(this.para.head, 'mousedown', this.mouseDownPullHandle);
    }

    /*
     * 关闭模态框拖拉事件
     * */
    public scaleEventOff() {
        this.dragWrapper.style.cursor = 'default';
        d.off(this.dragWrapper, 'mousedown', this.mouseDownScaleHandle);
    }

    /*
     * 模态框拖拽、拖拉事件
     * */
    private dragEvent() {
        //模态框拖拉时鼠标按下事件
        if (this.para.scale) {
            d.on(this.dragWrapper, 'mousedown', this.mouseDownScaleHandle);
        } else {
            this.para.head.style.cursor = 'move';
            d.on(this.para.head, 'mousedown', this.mouseDownPullHandle);
        }
    }


    /*
     * 获取拖拽边界
     * */

    private getPanelInfo(): any {
        let elRect = this.para.dom.getBoundingClientRect();
        return {
            top: -10,
            left: -elRect.width + 50,
            right: this._container.scrollWidth + elRect.width - 50,
            bottom: this._container.scrollHeight + elRect.height - 50,
        };
    }

    /*
     * 获取模态框坐标信息界
     * */
    private getDragState(event: any, elInfo, paInfo: any, type: boolean): any {
        if (!this.dragState || type) {
            return {
                startMouseTop: event.clientY,
                startMouseLeft: event.clientX,
                startTop: elInfo.top - paInfo.top,
                startRight: elInfo.left - paInfo.left + elInfo.width,
                startLeft: elInfo.left - paInfo.left,
                startBottom: elInfo.top - paInfo.top + elInfo.height,
                width: elInfo.width,
                height: elInfo.height
            };
        }
        else {
            return this.dragState;
        }
    }


    /*
     * 鼠标按下事件
     * */

    private mousedownHandle(event: any) {
        document.querySelector('body').style.userSelect = 'none';

        let self = this,
            _elInfo = this.para.dom.getBoundingClientRect(),
            _paInfo = this._container.getBoundingClientRect(),
            _event = event,
            _minTop: number = 0,
            _minLeft: number = 0,
            _maxTop: number = 0,
            _maxLeft: number = 0;

        this.moveing = true;
        this.panelInfo = this.getPanelInfo();
        this.dragState = this.getDragState(_event, _elInfo, _paInfo, true);
        _minTop = this.panelInfo.top;
        _maxTop = this.panelInfo.bottom - this.dragState.height;
        _minLeft = this.panelInfo.left;
        _maxLeft = this.panelInfo.right - this.dragState.width;
        if (this.para.scale) {
            this.para.dom.style.width = 'auto';
        }
        let isFirst = true;
        // 对话框移动主事件
        const mousemoveHandle = (_event: any) => {
            let event = _event, top, right, bottom, left;
            if (this.moveing) {
                //拖拉事件
                if (this.para.scale) {
                    switch (this.para.scale.position) {
                        case 'top' :
                            top = this.dragState.startTop + (event.pageY - this.dragState.startMouseTop);
                            if (top <= 0 || (this._container.clientHeight - top < this.para.scale.minHeight)) {
                                top = (top <= 0) ? 0 : this._container.clientHeight - this.para.scale.minHeight;
                            }
                            this.para.dom.style.top = top + 'px';
                            break;
                        case 'right':
                            right = (this._container.clientWidth - event.pageX);
                            if (right > this._container.clientWidth - this.para.scale.minWidth) {
                                right = this._container.clientWidth - this.para.minWidth;
                            }
                            this.para.dom.style.right = right + 'px';
                            this.para.dom.style.left = 0 + '';
                            break;
                        case 'bottom':
                            bottom = this._container.clientHeight - event.pageY;
                            if (bottom > this._container.clientHeight - this.para.scale.minHeight) {
                                bottom = this._container.clientHeight - this.para.scale.minHeight;
                            }
                            this.para.dom.style.bottom = bottom + 'px';
                            break;
                        case 'left':
                            left = this.dragState.startLeft + (event.pageX - this.dragState.startMouseLeft);
                            if (left > this._container.clientWidth - this.para.scale.minWidth) {
                                left = this._container.clientWidth - this.para.scale.minWidth;
                            }
                            this.para.dom.style.left = left + 'px';

                            break;
                    }
                }
                //拖拽事件
                else {
                    // 控制边界
                    let top = this.dragState.startTop + (event.pageY - this.dragState.startMouseTop),
                        left = this.dragState.startLeft + (event.pageX - this.dragState.startMouseLeft);
                    if (!self.para.isDragOverBound) {
                        // 上边界
                        top = top < _minTop ? _minTop : top;
                        // 下边界
                        top = top > _maxTop ? _maxTop : top;
                        // 左边界
                        left = left < _minLeft ? _minLeft : left;
                        // 右边界
                        left = left > _maxLeft ? _maxLeft : left;
                    }
                    if(isFirst){
                        isFirst = false;
                        this.para.dom.style.removeProperty('transform');
                    }

                    this.para.dom.style.top = top + 'px';
                    this.para.dom.style.left = left + 'px';
                }
            }
        }

        // 鼠标释放
        const mouseupHandle = (event: any) => {
            document.querySelector('body').style.userSelect = 'text';
            this.moveing = false;
            this.panelInfo = null;
            this.dragState = null;
            d.off(document, 'mousemove', mousemoveHandle);
            d.off(document, 'mouseup', mouseupHandle);
        }

        d.on(document, 'mousemove', mousemoveHandle);
        d.on(document, 'mouseup', mouseupHandle);
    }
}