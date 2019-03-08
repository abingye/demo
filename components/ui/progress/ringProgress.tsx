///<amd-module name="RingProgress"/>

import tools = G.tools;
import d = G.d;
import Component = G.Component;
import IComponentPara = G.IComponentPara;


interface IRingProgressPara extends IComponentPara{
    strokeWidth?: number;
    progressColor?: string;
    ringColor?: string;
    textColor?: string;
    msg?: string;
}

export class RingProgress extends Component{

    protected wrapperInit(){
        return <div className="ring-progress-wrapper"/>
    }

    protected radius = 50;

    constructor(para: IRingProgressPara){
        super(para);
        let {
            strokeWidth,
            ringColor,
            progressColor,
            textColor,
            msg
        } = para;
        this.wrapper.innerHTML = RingProgress.getSvgTmp(
            strokeWidth,
            progressColor,
            ringColor,
            textColor,
            this.radius,
            msg
        );

    }

    protected _percent = 0;
    protected get percent(){
        return this._percent;
    }
    protected set percent(percent){
        this._percent = Math.min(100, percent);
        this._percent = Math.max(0, percent);
    }

    protected timer = null;

    format(percent: number, isError: boolean = false, time: number = 300){
        percent = Math.min(100, percent);
        percent = Math.max(0, percent);
        if(percent === this.percent){
            return
        }
        clearInterval(this.timer);

        let circle = this.wrapper.querySelector('.ring-progress-circle2'),
            text = this.wrapper.querySelector('.ring-progress-text'),
            circleLength = Math.floor(2 * Math.PI * this.radius),
            progress = percent / 100,
            diffVal = Math.abs(percent - this.percent),
            isAdd = percent > this.percent;

        circle.removeAttribute('style');
        circle.setAttribute('stroke', RingProgress.progressColor);
        circle.setAttribute('style', 'transition-duration: ' + time + 'ms');

        circle.setAttribute('stroke-dasharray', (circleLength * progress) + ",10000");

        isAdd ? this.percent ++ : this.percent --;
        text.innerHTML = this.percent + '%';
        this.timer = setInterval(() => {
            isAdd ? this.percent ++ : this.percent --;
            if(this.percent === percent){
                clearInterval(this.timer);
                circle.removeAttribute('style');
                if(progress >= 1){
                    circle.setAttribute('stroke', RingProgress.successColor);
                }
                if(isError){
                    circle.setAttribute('stroke', RingProgress.errorColor);
                }
            }
            text.innerHTML = this.percent + '%';
        }, (time - 10) / diffVal);
    }

    protected _isEnd: boolean = false;
    get isEnd(){
        return this._isEnd;
    }
    set isEnd(isEnd: boolean){
        this._isEnd = isEnd;
    }

    static errorColor = '#f04134';
    static successColor = '#00a854';
    static progressColor = '#108ee9';

    static getSvgTmp(strokeWidth: number = 10, progressColor = RingProgress.progressColor, ringColor = '#fff', textColor = "#000", radius = 50, msg?: string){
        let center = 60,
            w = 120,
            h = 120;

        if(msg){
            h += 25;
        }

        return `
        <svg class="ring-progress-svg" xmlns="http://www.w3.org/200/svg" height="${h}" width="${w}">
            <circle class="ring-progress-circle1" cx="${center}" cy="${center}" r="${radius}" 
            fill="none" stroke="${ringColor}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
            <circle class="ring-progress-circle2" cx="${center}" cy="${center}" r="${radius}" 
            fill="none" stroke="${progressColor}" stroke-width="${strokeWidth}" stroke-dasharray="0,10000"/>
            <text class="ring-progress-text" x="${center}" y="${center}" fill="${textColor}"
             text-anchor="middle" dominant-baseline="middle" font-size="18">0%</text>
             ${msg ? `
             <text class="ring-progress-msg"  x="${center}" y="${h - 5}" fill="${textColor}"
             text-anchor="middle" font-size="16">${msg}</text>
             ` : ''}
        </svg>
        `
    }
}
