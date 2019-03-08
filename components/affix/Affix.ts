/// <amd-module name="Affix"/>
import tools = G.tools;
import d = G.d;
interface AffixPara{
    el : HTMLElement;//需要固定的html节点
    target : HTMLElement;//含有纵向滚动框的html节点
    offsetTop? : number;//距离顶部的距离
    offsetBottom? : number;//距离底部的距离
    onChange? : Function;//固定或者解除固定时触发的函数
}
export class Affix {
    private conf: AffixPara;

    constructor(para: AffixPara) {
        let defaultConf: AffixPara = {
            el: document.body,
            target: document.body,
            offsetBottom: 0,
            onChange: () => {
            }
        };
        this.conf = <AffixPara>tools.obj.merge(defaultConf, para);//如果offsetBottom和offsetTop都没传 默认固定在最底部
        this.initStyle();
        this.initEvent();
    }

    private initStyle() {
        let elStyle = this.conf.el.style;
        elStyle.position = 'absolute';
        elStyle.zIndex = '999';
        this.initPos.init();
        this.initPos.setNewPos();
    }

    private initEvent() {
        //target大小变化调整事件
        let resizeEvent = () => {
            let element = this.conf.target;
            let lastWidth = element.offsetWidth;
            let lastHeight = element.offsetHeight;
            let lastInner = element.innerHTML;
            setInterval(() => {
                if (lastInner !== element.innerHTML) {
                    this.initPos.setNewPos();
                    lastInner = element.innerHTML;
                }
                if (lastWidth === element.offsetWidth && lastHeight === element.offsetHeight) {
                    return;
                }
                this.initPos.setNewPos();
                lastWidth = element.offsetWidth;
                lastHeight = element.offsetHeight;
            }, 100);
        };
        //滚动事件
        d.on(this.conf.target, 'scroll', () => {
            this.initPos.setNewPos();
        });
        d.on(window, 'resize', () => {
            this.initPos.init();
        });
        resizeEvent();
    }

    private initPos = (function (self) {
        let conf, marTop = 0;
        let init = function () {
            let relativePar = self.getRelativeParent(self.conf.el);
            marTop === 0 && (marTop = relativePar.getBoundingClientRect().top - self.conf.target.getBoundingClientRect().top);
            conf = self.conf;
        };
        let setNewPos = function () {
            let elTop;
            if (conf.offsetTop >= 0) {
                elTop = conf.target.scrollTop + conf.offsetTop;
            }
            else {
                elTop = conf.target.scrollTop + conf.target.offsetHeight - marTop - conf.el.offsetHeight - conf.offsetBottom;
            }
            conf.el.style.top = elTop + 'px';
        };
        return {init, setNewPos}
    })(this);

    private getRelativeParent(el: HTMLElement) {
        let elPar = <HTMLElement>el.parentNode;
        if (window.getComputedStyle(elPar, null).position !== 'static') {
            return elPar;
        }
        else {
            return this.getRelativeParent(elPar);
        }
    }
}