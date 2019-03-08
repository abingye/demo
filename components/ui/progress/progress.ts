/// <amd-module name="Progress"/>
import d = G.d;
interface ProgressPara{
    container : HTMLElement,
    strokeWidth ? : number
    width? : number;
    showInfo? : boolean;
    percent? : number;
}
export class Progress{
    private dom : HTMLElement;
    private bgDom : HTMLElement;
    private textDom : HTMLElement;
    constructor(para : ProgressPara){
        this.init(para);

    }

    init(para : ProgressPara){
        this.dom = this.initTpl();
        para.container.appendChild(this.dom);
        this.bgDom = d.query('.progress-bg', this.dom);
        this.textDom = d.query('.progress-text', this.dom);
        //进度条线宽，默认10px
        if(para.strokeWidth){
            this.bgDom.style.height = para.strokeWidth + 'px';
        }
        //进度条宽度，默认100%
        if(para.width){
            this.dom.style.width = para.width + 'px';
        }
        //初始进度条百分比，默认0
        if(para.percent){
            this.format(para.percent);
        }
        //是否显示进度数值或状态图标,默认显示
        if(para.showInfo === false){
            this.textDom.classList.add('hide');
        }

    }

    format(width : number, isError : boolean = false){

        this.bgDom.style.width = width + '%';
        this.textDom.innerHTML = width + '%';
        if(width === 100){
            this.dom.classList.add('progress-status-success');
            this.textDom.innerHTML = '<span class="iconfont icon-check-circle"></span>';
        }else {
            this.dom.classList.remove('progress-status-success');
        }
        if(isError){
            this.textDom.innerHTML = '<span class="iconfont icon-cross-circle"></span>';
            this.dom.classList.add('progress-status-error');
        }else {
            this.dom.classList.remove('progress-status-error');
        }
    }

    initTpl(){
        return d.create(`<div class="bw-progress"><div class="progress-outer">
            <div class="progress-inner">
                <div class="progress-bg">
                
                </div>
            </div>
        </div>
        <span class="progress-text">0%</span>
        </div>`)
    }
}