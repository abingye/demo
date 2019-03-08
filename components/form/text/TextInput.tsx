/// <amd-module name="TextInput1"/>
import {FormCom, IFormComPara} from "../basic";
import d = G.d;
import tools = G.tools;

export interface ITextInputPara extends IFormComPara{
    placeholder?: string;
    readonly?: boolean;
    type?: string; // inputtype text, password, number 等
    label?: string;
    labelWidth?:string | number;
    inputIcon?:string;
    leftIcons?: string;
    rightIcon?: ITextInputRightIcon[];
    autoHeight? : boolean
    maxHeight? : string
    // labelheight?:string | number
}
interface ITextInputRightIcon {
    icon: string,
    content?: any,
    onClick?(iconEL:HTMLElement):void
}

export class TextInput1 extends FormCom{

    constructor(para: ITextInputPara){
        super(para);
        this.placeholder = para.placeholder;
        this.type = para.type || 'text';
        this.readonly = para.readonly;
        this.label = para.label;
        this.value = para.value;
        this.labelWidth = para.labelWidth ;
        this.inputIcon = para.inputIcon;
        // this.wrapper = this.wrapperInit(this._wrapper);
    }


    protected wrapperInit(para: ITextInputPara): HTMLElement {
        let text =  d.create({tag: 'div', props:{className:'text-input1'}});

        // d.append(text, this.labelEl);
        if (this.labelWidth) {
            text.appendChild(this.labelEl);
        }
        this.inputWrapper.appendChild(this.inputEl);
        text.appendChild(this.inputWrapper);
        return text;
    }

    private _inputIcon : string;
    get inputIcon() {
      return  this._inputIcon;
    }
    set inputIcon(str :string) {

    }



    private _inputWrapper : HTMLElement;
    protected get inputWrapper() {
       if (!this._inputWrapper) {
         this._inputWrapper = <div className="input-wrapper"/>
       }
        return this._inputWrapper;
    }



    private _labelEl : HTMLLabelElement;
    protected get labelEl(){
        if (!this._labelEl && this.labelWidth !== 0) {
            // debugger;
           this._labelEl = <label/>;
        }
        return this._labelEl;
    }
    private _label: string;
    set label(str: string){
        this._label = str;
        this.labelEl.innerHTML = str;
    }
    get label(){
        return this._label;
    }

    private _labelWidth:string | number;
    set labelWidth ( value:string|number) {
        let parentWidth =  this.wrapper.offsetWidth;
        let percent =  5 / parentWidth + 1.8 + '%';
        // let rightValue = parseInt(this.labelEl.style.width = 'calc()');
        if (typeof value === 'string') {
            this._labelWidth = value;
            this.labelEl.style.width = value;
            this.inputWrapper.style.width =  `calc(100% - ${value})`;
        }else if (typeof value ==='number'&& value >= 0){
            this._labelWidth = value + 'px';
            this.labelEl.style.width = value + 'px';
            this.inputWrapper.style.width =  `calc(100% - ${value}px)`;
        }
    }

    get labelWidth (){
        return this._labelWidth;
    }



    private _inputEL: HTMLInputElement;
    get inputEl() {
        if(!this._inputEL) {
            this._inputEL = <input type="text"/>;
        }
        return this._inputEL;
    }

    private _type: string;
    set type(str:string) {
        let types = ['text','button', 'checkbox','password','radio','image','reset','file','submit','textarea','number'],
            type = types.indexOf(str) > -1 ? str : types[0];

        this.inputEl.type = this._type = type;
    }
    get type () {
        return this._type;
    }

    protected _placeholder: string;
    set placeholder(str:string){
        if (str && typeof str === 'string') {
            this._placeholder = str;
            this.inputEl.placeholder = str;
        }

    }
    get placeholder(){
        return this._placeholder;
    }

    protected _readonly: boolean;
    set readonly(readValue:boolean) {
        this.inputEl.readOnly = readValue;
        this._readonly = readValue;
    }
    get readonly(){
        return this._readonly;
    }


    onSet: (val) => void;
    get value():string {
        // return this.value;
        return this.inputEl.value;

    }
    set value(val) {
        // this.value = val;
        // this.inputEl.innerHTML = val;\
        if(tools.isNotEmpty(val)){
            this.inputEl.value = val;
        }
    }

    private _rightIcon: ITextInputRightIcon;
    public rightIconAdd(icon: ITextInputRightIcon) {

    }

    public rightIconDel(index?: number) {

    }

    private _leftIcons: string

    get(): any {
    }

    set(...any): void {
    }

}

export class TextAreaInput extends FormCom{
    private textarea : HTMLFormElement;
    private p : ITextInputPara;
     constructor (para:ITextInputPara) {
        super(para);
        this.p = para;
        this.autoHeight = para.autoHeight;
        this.maxHeight = para.maxHeight;
        this.value = para.value;
     }

     private _maxHeight : string;
     set maxHeight(maxHeight : string){
         this.textarea.style.maxHeight = maxHeight;
         this._maxHeight = maxHeight;
     }
     get maxHeight(){
         return this._maxHeight;
     }

     private _autoHeight : boolean;
     set autoHeight(autoHeight : boolean){
         if(autoHeight){
             this.textarea.classList.add('height-auto');
             d.on(this.textarea, 'input', this.even)
         }else {
             d.off(this.textarea, 'input', this.even)
         }
         this._autoHeight = autoHeight;
     }
     get autoHeight(){
         return this._autoHeight;
     }

     private even = () => {
         setTimeout(() => {
             this.textarea.style.height = this.textarea.scrollTop + this.textarea.scrollHeight + 'px';
         })
     };

    protected wrapperInit(para: ITextInputPara): HTMLElement {
        this.textarea = <textarea
            type = "textarea"
            readOnly={!!para.readonly}
            disabled={!!para.disabled}
            className= {para.className ? para.className : "textarea-input"}
            placeholder={para.placeholder}
        />;
        return this.textarea;
    }

    onSet: (val) => void;
    get value():string {
        return this.textarea.value;
    }
    set value(val) {
        this.textarea.value = val || '';
        this.autoHeight && this.even();
    }

    set disabled(disabled){
        this.textarea.disabled = tools.isNotEmpty(disabled) ? disabled : false;
        this.wrapper.classList.toggle('disabled', tools.isNotEmpty(disabled) ? disabled : false);
    }

    get(): any {
        return this.value;
    }

    set(any): void {
        this.value = any;
    }
}
