/// <amd-module name="Toggle"/>
import {FormCom, IFormComPara} from "../basic";
import d = G.d;
import tools = G.tools;

interface ITogglePara extends IFormComPara{
    checked?: boolean;
    customStyle?: ICustom;
    size?: number;
    onClick?(isChecked: boolean): void;
    onSet?(isChecked: boolean): void;
    values?: {
        true?: any,
        false?: any
    }
}
interface ICustom {
    check?: string;
    noCheck?: string;
}

// let checkBoxEvent = (() => {
//     let count = 0;
//     function checkEvent(ev) {
//         let el = d.closest(ev.target, '.toggle-wrapper');
//         if (el !== null && !el.classList.contains('disabled')) {
//             let checkBox: NewToggle = d.data(el);
//             ev.stopPropagation();
//             checkBox.checked = !checkBox.checked;
//             tools.isFunction(checkBox.onClick) && checkBox.onClick(checkBox.checked);
//         }
//     }
//     return {
//         plus() {
//             count++;
//             if (count === 1) {
//                 document.body.addEventListener('click', checkEvent, true);
//                 // d.on(document.body, 'click', '.new-select-box',checkEvent);
//             }
//         },
//         minus() {
//             count--;
//             if (count === 0) {
//                 document.body.removeEventListener('click', checkEvent, true);
//                 // d.off(document.body, 'click', '.new-select-box',checkEvent);
//             }
//         },
//     }
// })();

export class Toggle extends FormCom{
    onSet: (val) => void;
    protected ball: HTMLElement;
    protected offset: number;
    protected ballWidth: number;
    protected currentWidth: number;
    protected  values: {
        true?: any,
        false?: any
    };

    protected wrapperInit(): HTMLElement {
        let wrapper = <div className="toggle-wrapper">
            <input type="checkbox" hidden />
            <span className="toggle-text toggle-checked"></span>
            <span className="toggle-text toggle-no-checked"></span>
            {this.ball = <div className="toggle-ball"></div>}
        </div>;
        d.data(wrapper, this);
        return wrapper
    }

    constructor(para: ITogglePara){
        super(para);

        this.values = para.values || {};
        this.customStyle = para.customStyle;
        this.checked = para.checked;
        this.onClick = para.onClick;
        this.onSet = para.onSet;
        this.size = para.size;

        this.event.on();
    }

    protected change(){
        let input = this.wrapper.querySelector('input'),
            check: HTMLElement = this.wrapper.querySelector('.toggle-checked'),
            noCheck: HTMLElement = this.wrapper.querySelector('.toggle-no-checked');
        input.checked = this.checked;
        if(this.checked){
            this.ball.style.transform = 'translate('+ (this.currentWidth > this.ballWidth
                ? this.offset - Math.ceil(this.ballWidth / 3) : this.offset) +'px, 0px)';
            check.style.display = 'block';
            noCheck.style.display = 'none';
        }else{
            this.ball.style.transform = 'translate(0px, 0px)';
            check.style.display = 'none';
            noCheck.style.display = 'block';
        }
        this.wrapper.classList.toggle('toggle-active', this.checked);
    }

    protected event = (() => {
        let disX, isChange = false, self = this;
        let start = (ev: TouchEvent) => {
            this.wrapper.classList.add('toggle-dragging');
            let add = Math.ceil(this.ballWidth / 3);
            if(this.checked){
                this.ball.style.transform = 'translate('+ (this.offset - add) +'px, 0)';
            }
            this.currentWidth =  (this.ballWidth + add);
            this.ball.style.width = this.currentWidth + 'px';
            isChange = false;
            disX = ev.targetTouches[0].clientX;
            d.on(document, 'touchmove', move);
            d.on(document, 'touchend', end);
        };
        let move = (ev: TouchEvent) => {
            let currentX = ev.targetTouches[0].clientX;
            if(disX > currentX){
                isChange = true;
                if(this.checked){
                    disX = currentX
                }
                this.checked = false;
            }else if(disX < currentX){
                if(!this.checked){
                    disX = currentX
                }
                isChange = true;
                this.checked = true;
            }
        };
        let end = () => {
            this.wrapper.classList.remove('toggle-dragging');
            d.off(document, 'touchmove', move);
            d.off(document, 'touchend', end);
            if(!isChange){
                this.checked = !this.checked;
            }
            if(this.checked){
                this.ball.style.transform = 'translate('+ this.offset +'px, 0px)';
            }
            this.currentWidth = this.ballWidth;
            this.ball.style.width = this.currentWidth + 'px';
            tools.isFunction(this.onClick) && this.onClick(this.checked);
        };
        return {
            on(){
                d.on(self.wrapper, 'touchstart', start);
            },
            off(){
                d.off(self.wrapper, 'touchstart', start);
            }
        };
    })();

    protected _checked:boolean = false;
    set checked(e: boolean){
        if(this._checked !== e && tools.isNotEmpty(e)){
            this._checked = e;
            this.change();

            if (typeof this.onSet === 'function') {
                this.onSet(this._checked);
            }
        }
    }
    get checked(){
        return this._checked;
    }

    protected _disabled: boolean = false;
    set disabled(e: boolean){
        if(this._disabled !== e && tools.isNotEmpty(e)){
            this._disabled = e;
            this.wrapper.classList.toggle('disabled', this._disabled);
        }
    }
    get disabled(){
        return this._disabled;
    }

    protected _customStyle: ICustom;
    set customStyle(obj: ICustom){
        if(tools.isNotEmpty(obj) && this.wrapper){
            this._customStyle = obj;
            //debugger;
            let check = this.wrapper.querySelector('.toggle-checked'),
                noCheck = this.wrapper.querySelector('.toggle-no-checked');
            check.innerHTML = tools.str.toEmpty(this.customStyle.check);
            noCheck.innerHTML = tools.str.toEmpty(this.customStyle.noCheck);
        }
    }
    get customStyle(){
        return this._customStyle;
    }

    protected _onClick: (isChecked: boolean) => void;
    set onClick(e: (isChecked: boolean) => void){
        this._onClick = e;
    }
    get onClick(){
        return this._onClick;
    }

    protected _size: number = 30;
    set size(num: number){
        if(num !== this._size && tools.isNotEmpty(num)){
            this._size = num;
            this.wrapper.style.height = num + 'px';
            this.wrapper.style.width = Math.round(num * 7 /3) + 4 + 'px';
            this.wrapper.style.borderRadius = Math.ceil(num / 2) + 'px';
            this.wrapper.style.fontSize = Math.round(num * 2 / 5) + 'px';
            this.ball.style.width = num - 2 + 'px';
            this.ball.style.height = num - 2 + 'px';
            this.ball.style.borderRadius = Math.ceil((num - 2) / 2) + 'px';
            this.wrapper.style.lineHeight = this.size + 'px';
        }
        this.currentWidth = this._size - 2;
        this.ballWidth = this._size - 2;
        this.offset = this.wrapper.offsetWidth - this.ballWidth - 3;
        this.change();
    }
    get size(){
        return this._size;
    }

    destroy(){
        super.destroy();
        this.event.off();
        this.ballWidth = null;

    }

    get(): any {
        return this.value;
    }

    set(flag: number | boolean = 0): void {
        this.value = flag
    }

    get value() {
        let trueVal = this.values && this.values.true,
            falseVal = this.values && this.values.false;

        return this.checked
            ? (tools.isEmpty(trueVal) ? true : trueVal)
            : (tools.isEmpty(falseVal) ? false : falseVal);
    }

    set value(flag: number | boolean | string){
        let trueVal = this.values && this.values.true,
            falseVal = this.values && this.values.false;
        if(flag === trueVal){
            flag = true;
        }else if(flag === falseVal){
            flag = false;
        }
        this.checked = !!flag;
    }
}