/// <amd-module name="RichTextMb"/>
import {FormCom, IFormComPara} from "../basic";
import d = G.d;

export class RichTextMb extends FormCom{
    onSet: (val) => void;
    constructor(private para : IFormComPara){
        super(para);
    }
    get(): any {
        return  this.wrapper ?  this.wrapper.innerHTML : '';
    }
    set(html:string): void {
        this.wrapper && (this.wrapper.innerHTML = html);
    }

    get value(){
        return this.get();
    }
    set value(html:string) {
        this.wrapper && (this.wrapper.innerHTML = html);
    }

    protected wrapperInit(para: IFormComPara): HTMLElement {
        return <div className="rich-text-base" contentEditable="true"></div>;
    }
}
