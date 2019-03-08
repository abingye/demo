/// <amd-module name="RichText"/>
import {FormCom, IFormComPara} from "../basic";
import d = G.d;
import IComponentPara = G.IComponentPara;
import {Modal} from "../../feedback/modal/Modal";
import {DropDown} from "../../ui/dropdown/dropdown";

export class RichText extends FormCom {
    public com: JQuery;

    constructor(protected para: IFormComPara) {
        super(para);

        let div = d.create('<div class="summernote"></div>');
        this.para.container.appendChild(div);

        this.com = $(div);

        require(['summernote'], () => {
            this.com.summernote({
                lang: 'zh-CN',                // 设置中文
                height: 300,                  // set editor height
                minHeight: null,             // set minimum height of editor
                maxHeight: null,             // set maximum height of editor
                focus: false,                 // set focus to editable area after initializing summernote
                toolbar: [
                    ['style', ['bold', 'italic', 'underline', 'clear']],
                    ['font', ['strikethrough', 'superscript', 'subscript']],
                    ['fontsize', ['fontsize']],
                    ['color', ['color']],
                    ['para', ['ul', 'ol', 'paragraph']],
                    ['height', ['height']]
                ]
            });

            console.log(this.para.container);
            this.set(this._value);
            this.initCom(para);
        });

        // this.para.dom.contentEditable = 'true';
    }

    protected initCom(para: IFormComPara) {

    }

    get(): any {
        return this.com.summernote ? this.com.summernote('code') : this._value;
    }

    set(html: string): void {
        this.com.summernote && this.com.summernote('code', html);
        this._value = html;
    }

    destroy() {
        super.destroy();
        this.com.summernote('reset');
        this.com.summernote('destroy');
    }

    get value() {
        return this.com.summernote ? this.com.summernote('code') : this._value;
    }

    set value(html) {
        this.com.summernote && this.com.summernote('code', html);
        this._value = html;
    }

    protected wrapperInit(para: IComponentPara): HTMLElement {
        return <div class="summernote"></div>;
    }

    onSet: (val) => void;
}

interface IRichTextPara extends IFormComPara {
    icon?: (string | string[])[][]
    width: number
    height: number

}

export class RichText1 extends FormCom {
    constructor(para: IRichTextPara) {
        super(para);
        this.bindIconEvent();
        //this.bindIconUl();
        this.dropDonwInit(para.icon);
        this.width = para.width;
        this.height = para.height;

    }


    onSet: (val) => void;

    get value() {
        return this._value
    }

    set value(val) {

    }

    protected wrapperInit(para: IRichTextPara): HTMLElement {
        //如果para为空 就全部加载，否则传什么参数 配置什么参数
        let allIcon;
        if (G.tools.isEmpty(para.icon)) {
            allIcon = [
                ['style', ['bold', 'italic', 'underline', 'strikeThrough']],
                ['font', ['Arial,Helvetica', 'Georgia', 'Sans-serif', '楷体']],
                ['fontsize', ['1', '2', '3', '4', '5', '6', '7']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['array', ['justifyLeft', 'justifyCenter', 'justifyRight', 'undo', 'redo']],
            ]
        } else {
            allIcon = para.icon;
        }
        return <div className="richText-content">
            <div className="editparent">
                {

                    allIcon.map((value) => {
                        // value = value[1];
                        let Icon = value[1];
                        if (value[0] === 'font' || value[0] === 'fontsize') {
                            return <div class={"richIcon-ul appcommon " + "app-" + value[0]} data-role={value[0]}>
                                {
                                    //
                                    // Array.isArray(Icon) ? Icon.map((val)=>{
                                    //     return <a data-role={val} href="#"><li>{val}</li></a>;
                                    // }): ""
                                }

                            </div>
                        } else {
                            return <div className="rfichIcon-group">
                                {
                                    Array.isArray(Icon) ? Icon.map((val) => {

                                        return <a data-role={val} href="#" class={"appcommon " + "app-" + val}></a>;
                                    }) : value
                                }
                            </div>
                        }
                    })
                }
            </div>
            <div contentEditable className="edit-div">
                <h1>请您编辑</h1>
            </div>
        </div>;
    }

    private colorCreate: boolean = false;
    private methods = (() => {
        let bold = () => {
                document.execCommand('bold', false,
                    null);
            },
            italic = () => {
                document.execCommand('italic', false, null);

            },
            underline = () => {
                document.execCommand('underline', false, null);
            },
            strikeThrough = () => {
                document.execCommand('strikeThrough', false, null);
            },
            undo = () => {
                document.execCommand('undo', false,
                    null);
            },
            redo = () => {
                document.execCommand('redo', false,
                    null);
            },
            fontsize = (e) => {
                let fontSize = e.target.dataset.role;
                document.execCommand("fontSize", false, fontSize);
            },
            ul = () => {
                document.execCommand("insertUnorderedList", false, null);
                console.log(ul)
            },
            ol = () => {

                document.execCommand("insertOrderedList", false, null);
            },
            paragraph = () => {
                //document.execCommand("insertParagraph", false, null);
                document.execCommand('indent');
            },
            justifyLeft = () => {
                document.execCommand('justifyLeft');
            },
            justifyCenter = () => {
                document.execCommand('justifyCenter');
            },
            justifyRight = () => {
                document.execCommand('justifyRight');
            },
            color = () => {

                event.stopPropagation();
                let colorDom = d.query('.rfichIcon-group>.app-color>.selectColor', this.wrapper);

                colorDom.style.display = "block";


            }


        return {
            bold,
            italic,
            underline,
            redo,
            undo,
            strikeThrough,
            fontsize,
            ul,
            ol,
            paragraph,
            justifyLeft,
            justifyCenter,
            justifyRight,
            color
        }
    })();

    private methodsTwo = (() => {
        let font = (res) => {
                document.execCommand("fontname", false, res + "");
            },
            fontsize = (res) => {
                document.execCommand("fontSize", false, parseInt(res) + "px");
            }
        // TrebuchetMS = ()=>{
        //     document.execCommand("fontname", false, "Trebuchet MS");
        // },
        // Regular = () =>{
        //     document.execCommand("fontname", false, "楷体");
        // }
        return {font, fontsize}
    })();


    //绑定事件
    private bindIconEvent() {
        let dom = d.queryAll('.rfichIcon-group>a', this.wrapper),
            icon = this.methods;
        for (let i of dom) {
            d.on(i, 'click', function (e) {
                if (icon[this.dataset.role]) {
                    icon[this.dataset.role]();
                } else {
                    alert('未添加功能');
                }
            })
        }
        let dragDiv = document.createDocumentFragment(),
            colorDom = d.query('.rfichIcon-group>.app-color', this.wrapper);
        if (!this.colorCreate) {
            dragDiv = <div className="selectColor">

                <div data-value="#E33737" className="font-color " style="background:#E33737"></div>
                <div data-value="#e28b41" className="font-color" style="background:#e28b41"></div>
                <div data-value="#c8a732" className="font-color " style="background:#c8a732"></div>
                <div data-value="#209361" className="font-color " style="background:#209361"></div>
                <div data-value="#418caf" className="font-color " style="background:#418caf"></div>
                <div data-value="#aa8773" className="font-color " style="background:#aa8773"></div>
                <div data-value="#999999" className="font-color " style="background:#999999"></div>
                <div data-value="#333333" className="font-color " style="background:#333333"></div>


            </div>
            d.append(colorDom, dragDiv);
            this.colorCreate = true;
        }
        let color = d.query('.selectColor', colorDom);

        //绑定事件
        let colorSelet = d.queryAll('.font-color', color)
        for (let i of colorSelet) {
            let val = i.dataset.value;
            d.on(i, 'click', () => {

               event.stopPropagation();
                color.style.display = "none";
                document.execCommand("forecolor", false, val);
                console.log(color)

            })
        }

    }

    //下拉框弹出初始化

    private dropDonwInit(icon) {

        let list = d.queryAll('.richIcon-ul', this.wrapper);


        if (G.tools.isEmpty(list)) {
            return;
        }

        if (G.tools.isEmpty(icon)) {
            icon = [
                ['style', ['bold', 'italic', 'underline', 'strikeThrough']],
                ['font', ['Arial,Helvetica', 'Georgia', 'Sans-serif', '楷体']],
                ['fontsize', ['1', '2', '3', '4', '5', '6', '7']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['array', ['justifyLeft', 'justifyCenter', 'justifyRight', 'undo', 'redo']],
            ]
        }

        for (let i = 0, node; i < list.length; i++) {

            let data = list[i].innerText,
                that = this;
            icon.forEach((index) => {
                let dataRole = list[i].dataset.role;
                if (dataRole === index[0]) {
                    node = new DropDown({
                        el: list[i],
                        inline: false,
                        className: "color",
                        multi: null,
                        data: index[1],//判断属于什么class 如果没有 就不创建 有的话就创建
                        onSelect: (item, index) => {

                            that.methodsTwo[dataRole] && that.methodsTwo[dataRole](item.value);
                            node.hideList();
                        }
                    })
                }
            })

            d.on(list[i], 'click', (e) => {
                node.showList();
                event.stopPropagation()
                if (this.colorCreate) {
                    let colorDom = d.query('.rfichIcon-group>.app-color', this.wrapper);
                    let color = d.query('.selectColor', colorDom);
                    color.style.display = "none";
                    this.colorCreate = false;
                }
            })
            d.on(document, 'click', () => {
                event.stopPropagation()
                node.hideList();
                let colorDom = d.query('.rfichIcon-group>.app-color', this.wrapper);
                let color = d.query('.selectColor', colorDom);
                color.style.display = "none";

            })


        }

    }


    static paletteDraw(fun?: Function,) {
        //为父元素做点击事件
        return <div></div>
    }

    private _width: number;
    set width(val) {

        this.wrapper.style.width = val + "px";
        val = this._width;
    }

    get width() {
        return this._width;
    }

    private _height: number;

    set height(val) {

        this.wrapper.style.height = val + "px";
        val = this._height;
    }

    get height() {
        return this._height;
    }

    get(): any {
        let edit = d.query('.edit-div',this.wrapper);
        console.log(edit);
        return edit.innerText;
    }

    set(...any): void {
    }


}