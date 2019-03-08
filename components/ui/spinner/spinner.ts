/// <amd-module name="Spinner"/>
import d = G.d;

interface SpinnerShowPara{
    el : HTMLElement;
    type : number;
    className? : string;
    size? : number;
    time? : number; //设置超时关闭
    onTimeout?: Function; // 超时事件
}
import tools = G.tools;
export class Spinner{
    protected spinnerDom : HTMLDivElement = null;
    protected visible : boolean = false;
    protected timer: number;
    protected time: number;
    protected onTimeout: Function;

    constructor(protected para : SpinnerShowPara){
        this.time = para.time || 20000; // 超时时间默认20秒；
        this.onTimeout = para.onTimeout;
        this.initSpinner();
    }

    private initSpinner(){
        let para = this.para;
        if(this.spinnerDom){
            d.remove(this.spinnerDom);
        }
        this.spinnerDom = createSpinner(para.className);

        function createSpinner(className : string){
            let style = para.size ? ` style="width: ${para.size}px;height: ${para.size}px"` : '';
            className = className ? ` class="${className}"` : '';
            return <HTMLDivElement>d.create(`<div${className} style="text-align: center"><span class="spinner"${style}></span></div>`);
        }
    }

    // public setPara(){
    //
    // }
    show(){
        let method = this.methods[this.para.type];
        if(method){
            method.show();
            this.visible = true;
            this.timer = setTimeout(() => {
                this.onTimeout && this.onTimeout();
                this.hide();
            }, this.time);
        }
    }

    hide(){
        let method = this.methods[this.para.type];
        if(method){
            method.hide();
            this.visible = false;
        }
        clearTimeout(this.timer);
        this.timer = null;
    }

    isVisible(){
        return this.visible;
    }

    private methods = (function (self) {
        let arr : {show():void, hide():void}[] = [],
            showType = Spinner.SHOW_TYPE;
        /**
         * 附加方法
         */
        arr[showType.append] = (function () {
            return {
                show() {
                    d.after(self.para.el, self.spinnerDom);
                    // self.para.el.parentNode.insertBefore(self.spinnerDom, self.para.el.nextSibling)
                },
                hide() {
                    d.remove(self.spinnerDom);
                }
            }
        }());

        /**
         * 替换方法
         */
        arr[showType.replace] = (function () {
            let tmpDom : HTMLElement = null;
            return {
                show(){
                    tmpDom = <HTMLElement>self.para.el.cloneNode();
                    tmpDom.innerHTML = '';
                    tmpDom.appendChild(self.spinnerDom);

                    d.replace(tmpDom, self.para.el)
                },

                hide(){
                    if(tmpDom){
                        d.replace(self.para.el, tmpDom);
                        tmpDom = null;
                    }
                }
            }
        }());

        /**
         * 覆盖方法
         */
         arr[showType.cover] = (function () {
            return {
                show(){
                    let parent = <HTMLElement>self.para.el.parentNode,
                        position = parent.style.position;
                    if(position !== 'relative | absolute | fixed'){
                        position = 'relative';
                    }
                    let spinnerDomStyle = self.spinnerDom.style,
                        elDom = self.para.el;
                    self.spinnerDom.classList.add('spinner-cover');
                    spinnerDomStyle.width = elDom.offsetWidth + 'px';
                    spinnerDomStyle.height = elDom.offsetHeight + 'px';
                    spinnerDomStyle.left = elDom.offsetLeft + 'px';
                    spinnerDomStyle.top = elDom.offsetTop + 'px';
                    spinnerDomStyle.zIndex = '1005';

                    parent.insertBefore(self.spinnerDom, self.para.el.nextSibling);
                },
                hide(){
                    if(self.spinnerDom.parentNode){
                        d.remove(self.spinnerDom);
                    }
                }
            }
        }());

        return arr;
    }(this));

    /**
     * 0 : 附加
     * 1 : 替换
     * 2 : 覆盖
     */
    static SHOW_TYPE = {
        append : 0,
        replace : 1,
        cover : 2
    }
}

