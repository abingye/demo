/// <amd-module name="RichTextModal"/>
import {RichText} from "../richText/richText";
import {Modal} from "../../feedback/modal/Modal";

import {TextInput, ITextInputBasicPara, ITextInputPara} from "../text/text";
import tools = G.tools;
import {IFormComPara} from "../basic";
import {RichTextMb} from "../richText/richTextMb";

interface RichTextModalPara extends ITextInputBasicPara, IFormComPara{
    onClose?: (value: string) => void
}

export class RichTextModal extends TextInput{
    onSet: (val) => void;
    protected richText : RichText | RichTextMb;
    protected modal : Modal;

    constructor(para: RichTextModalPara){
        super(Object.assign({}, para, {
            readonly : true,
            icons : ['iconfont icon-arrow-down'],
            iconHandle: () => {
                if(this.modal === null){
                    this.initRichText();
                }
            }
        }) as ITextInputPara);

        this.onClose = para.onClose;
        this.initRichText();
    }

    protected initRichText(){
        let body = <div className="rich-text-modal-body"/>;
        this.modal = new Modal({
            container: document.body,
            header: '编辑',
            body,
            isOnceDestroy: true,
            isAdaptiveCenter: true,
            className: 'rich-text-modal',
            width: '750px',
            height: '425px',
            onClose: () => {
                this.input.value = tools.str.removeHtmlTags(this.richText.get());
                this._value = this.richText.get();
                typeof this.onSet === 'function' && this.onSet(this.get());
                this.modal = null;
            }
        });

        this.richText = new (tools.isMb ? RichTextMb : RichText)({container: body});
        this.richText.set(this._value);
    }

    protected _onClose: (value) => void;
    get onClose(){
        return this._onClose;
    }
    set onClose(onClose: (value) => void){
        this._onClose = onClose;
    }

    protected _value: string = '';
    get(){
        return this.richText.get();
    }
    set (str:string){
        this._value = str;
        this.input.value = tools.str.removeHtmlTags(str);
        this.richText.set(str);
    }

    destroy(){
        this.richText.destroy();
        super.destroy();
    }
}