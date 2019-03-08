/// <amd-module name="NumInput"/>
import {TextInput, ITextInputBasicPara, ITextInputPara} from "../text/text";
import tools = G.tools;
import {IFormComPara} from "../basic";

interface NumInputPara extends IFormComPara, ITextInputBasicPara{
    max? : number;
    min? : number;
    step? : number;
    defaultNum?: number;
    callback?() : void;
}

export class NumInput extends TextInput{
    protected para : NumInputPara;
    private num : number;
    constructor(p? : NumInputPara){

        super(<ITextInputPara>Object.assign({}, {
            step: 1,
            max: null,
            min: null,
            type : 'number'
        }, p, {
            icons : ['iconfont icon-jiahao' , 'iconfont icon-jianhao'],
            iconHandle :  (index) => {
                this.iconHandle(index);
            }
        }));

        let self = this;
        // 设置默认值
        if(tools.isNotEmpty(p.defaultNum)){
            this.set(p.defaultNum);
        }

        // 监听按键输入
        self.on('keyup',function(e:KeyboardEvent) {

            this.value = this.value.replace(/\D+/, '');
            self.isOverflow(p.max, p.min, self);

            if(self.para.callback && typeof self.para.callback() === 'function'){
                self.para.callback();
            }
        });
        // let scrollFunc =  (e : WheelEvent) => {
        //     if(e.deltaY > 0){ // 下滚
        //         this.iconHandle(1);
        //     }else{
        //         this.iconHandle(0);
        //     }
        // };
        // self.on('DOMMouseScroll', scrollFunc);
        // this.input.onmousewheel = scrollFunc
    }

    private iconHandle = (index) => {
        let p = this.para;
        if(index === 0){
            this.num = p.step || 1;
        }else if(index === 1){
            this.num = -p.step || -1;
        }

        this.set(this.get() + this.num);
        /*溢出判断*/
        this.isOverflow(p.max, p.min, this);
        if(this.para.callback && typeof this.para.callback() === 'function'){
            this.para.callback();
        }
    };

    protected keyHandle = (e : KeyboardEvent) => {
        let keyCode = e.keyCode || e.which || e.charCode;
        switch (keyCode){
            case 38: // Up
                this.iconHandle(0);
                break;
            case 40: // Down
                this.iconHandle(1);
                break;
        }
    };

    get() : number{
        return parseInt(this.input.value);
    }

    set(str: string | number): void {
        this.input.value = tools.str.toEmpty(str);
        if(this.para.callback && typeof this.para.callback() === 'function'){
            this.para.callback();
        }
    }
    /**
     *
     * @param max
     * @param min
     * @param self
     */
    private isOverflow(max:number,min:number,self){
        if(typeof max === 'number' && self.get() > max){
            self.set(max);
        }
        if(typeof min === 'number' && self.get() < min){
            self.set(min)
        }
    }


}