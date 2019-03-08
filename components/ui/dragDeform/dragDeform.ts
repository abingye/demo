/// <amd-module name="DragDeform"/>
import d = G.d;
import tools = G.tools;

interface DragDeformPara{
    container? : HTMLElement //相对定位,联动拉拽
    dom? : HTMLElement       //参照元素，联动拉拽
    dragDom : HTMLElement   //绝对定位，拉拽元素
    border : string[]
    maxHeight? : number
    minHeight? : number
    maxWidth? : number
    minWidth? : number
    top?: number //增加离顶部距离
}
interface ResizePara{
    oParent : HTMLElement,
    handle : HTMLElement,
    isLeft : boolean,
    isRight : boolean,
    isTop : boolean,
    lockX : boolean,
    lockY : boolean
}
interface HeightPara{
    minHeight : number
    maxHeight : number
}
export class DragDeform {
    private top : number;
    constructor(public para : DragDeformPara){
        para.dom && (this.top = para.dom.offsetHeight);
        para.border.forEach(obj => {
            let handle : HTMLElement, resize,
                isLeft = false,isRight = false, isTop = false,
                lockX = false, lockY = false;
            switch (obj){
                case 'top':
                    resize = 'resizeTop';
                    isTop = true;
                    lockX = true;
                    break;
                case 'left':
                    resize = 'resizeLeft';
                    isLeft = true;
                    lockY = true;
                    break;
                case 'right':
                    resize = 'resizeRight';
                    lockY = true;
                    isRight = true;
                    break;
                case 'bottom':
                    resize = 'resizeBottom';
                    lockX = true;
                    break;
            }
            handle = d.create(`<div class="${resize}"></div>`);
            para.dragDom.appendChild(handle);
            this.resize({
                oParent : para.dragDom,
                handle : handle,
                isLeft : isLeft,
                isRight : isRight,
                isTop : isTop,
                lockX : lockX,
                lockY : lockY,
            });
            this.scrollEven(handle);
        });
    }

    modify(data : HeightPara){
        this.para.maxHeight = data.maxHeight;
        this.para.minHeight = data.minHeight;
    }

    private scrollEven(handle : HTMLElement){
        d.on(this.para.dragDom,'scroll',() => {
            handle.style.top = this.para.dragDom.scrollTop + 'px';
        });
    }

    /**
     * 添加拉拽功能
     * @param data
     */
    private resize(data : ResizePara) {
        // console.log(data);
        let handle = data.handle,
            oParent = data.oParent,
            isLeft = data.isLeft,
            isRight = data.isRight,
            isTop = data.isTop;
        handle.onmousedown =  (event : any) =>{
            let dragMaxHeight,
                dragMinHeight,
                dragMinWidth = this.para.minWidth,
                dragMaxWidth = this.para.maxWidth;
            if(this.para.container){
                dragMaxHeight = this.para.container.offsetHeight - this.para.minHeight;
                dragMinHeight = this.para.container.offsetHeight - this.para.maxHeight;
            }
            //获取初始位置信息
            let dEvent = event || window.event,
                disX = dEvent.clientX - handle.offsetLeft,//边框（鼠标）到屏幕左侧的距离
                disY = dEvent.clientY - handle.offsetTop, //边框（鼠标）到屏幕高度的距离
                iParentTop = oParent.offsetTop,
                iParentLeft = oParent.offsetLeft,
                iParentWidth = oParent.offsetWidth,
                iParentHeight = oParent.offsetHeight;
            document.onmousemove =  (event:any) => {
                let mEvent = event || window.event,
                    iL = mEvent.clientX - disX,   //宽度位移的距离
                    iT = mEvent.clientY - disY,   //高度位移的距离
                    iW = isLeft ? iParentWidth - iL : handle.offsetWidth + iL,
                    iH = isTop ? iParentHeight - iT : handle.offsetHeight + iT;

                let top = iParentTop + iT,
                    left = iParentLeft + iL + 'px';
                if(isTop){
                    if(iH > dragMaxHeight){
                        top = this.para.minHeight;
                    }
                    if(iH < dragMinHeight){
                        top = this.para.container.offsetHeight - dragMinHeight;
                    }

                    oParent.style.top = top + 'px';
                    if(this.para.dom){
                        this.para.dom.style.height = top - (this.para.top? this.para.top : 0) + 'px';
                    }
                }
                if(isLeft){
                    oParent.style.left = left;
                }
                if(isRight){
                    // console.log(iW);
                    if(iW > dragMaxWidth){
                        iW = dragMaxWidth;
                    }
                    if(iW < dragMinWidth){
                        iW = dragMinWidth;
                    }
                }
                data.lockX || (oParent.style.width = iW + "px");
                data.lockY || (oParent.style.height = 'calc(100% - '+ top + 'px)');

                return false;
            };
            document.onmouseup =  () => {
                document.onmousemove = null;
                document.onmouseup = null;
            };
            return false;
        }
    };


}