/// <amd-module name="TextInput"/>
import tools = G.tools;
import {FormCom, IFormComPara} from "../basic";
import d = G.d;
import {ShellAction} from "../../../action/ShellAction";
import Shell = G.Shell;

export interface ITextInputPara extends ITextInputBasicPara {
    icons?: string[];

    iconHandle?(index?: number, icon?: HTMLElement): void;

    isScan?: boolean;

    on2dScan?(code: string): void

    blur?() : void
}

export interface ITextInputBasicPara extends IFormComPara {
    placeholder?: string;
    readonly?: boolean;
    type?: string;
}

export class TextInput extends FormCom {
    onSet: (val) => void;
    protected input: HTMLInputElement;
    protected iconGroup: HTMLElement;
    protected isReadonly: boolean;
    protected props: ITextInputPara;

    constructor(protected para: ITextInputPara) {
        super(para);
        this.props = para;
        let defaultPara = {
            className: '',
            placeholder: '',
            readonly: false,
            disabled: false,
            type: 'text'
        };

        this.para = Object.assign(defaultPara, para);
        this.isReadonly = !!this.para.readonly;
        this.inputType = this.para.type;
        // this.initInput();

        // this.initIcons();
        tools.isNotEmpty(para.value) && (this._value = para.value,this.input.value = para.value);
        if (typeof para.iconHandle === 'function') {
            this.initIconEven();
        }
        d.on(this.input, 'change', () => {
            // debugger;
            this.set(this.get());
        });

        //ios软键盘下去后body滚动的距离还原
        if (tools.isMb) {
            d.on(this.input, 'blur', () => {
                document.body.scrollTop = 0;
                typeof this.para.blur === 'function' && this.para.blur();
            })
        }

    }


    protected keyHandle = (e: KeyboardEvent) => {
    };

    tabIndexElGet(): HTMLElement {
        return this.input
    }

    // /**
    //  * 初始化输入框
    //  * @return {HTMLInputElement}
    //  */
    // private initInput() {
    //     let div = document.createElement('div');
    //     div.classList.add('text-input');
    //     this._wrapper = div;
    //
    //     let input = document.createElement('input');
    //     input.type = (typeof this.para.type === 'undefined') ?  'text' :this.para.type;
    //
    //     input.className = this.para.className;
    //     input.placeholder = this.para.placeholder;
    //     input.readOnly = this.para.readonly;
    //     input.disabled = this.para.disabled;
    //
    //     this.input = input;
    //
    //     div.appendChild(input);
    // }
    /**
     * 初始化输入框按钮图标
     */
    // private initIcons(){
    //     let icons = this.para.icons;
    //
    //     if(icons && icons[0]){
    //         let iconGroup = <div class="btn-group">
    //             {icons.map((icon, i) => <a class={`btn btn-sm icon ${icon}`} data-index={i}></a>)}
    //         </div>;
    //
    //         this.input.style.width = `calc(100% - ${icons.length * 20}px)`;
    //
    //         this.wrapper.appendChild(iconGroup);
    //
    //         // 事件绑定
    //         if(typeof this.para.iconHandle === 'function'){
    //            this.initIconEven(iconGroup);
    //         }
    //         // console.log(iconGroup)
    //         this.iconGroup = iconGroup;
    //     }
    // }
    private initIconEven() {
        let self = this,
            can2dScan = Shell.inventory.can2dScan;
        this.iconGroup && d.on(this.iconGroup, 'click', 'a[data-index]', function (e: Event) {
            let index = parseInt(this.dataset.index);
            if (this.dataset.type === 'scan' && !can2dScan) {
                //扫码
                (ShellAction.get()).device().scan({
                    callback: (even) => {
                        self.set(JSON.parse(even.detail).data)
                    }
                });
            } else {
                self.props.iconHandle(index, this);
            }

            e.stopPropagation();
        });
    }

    private _scanEl: HTMLElement;
    private _isScan: boolean;
    set isScan(flag: boolean) {
        if (!flag && this._scanEl) {
            d.remove(this._scanEl);
            this._scanEl = null;
        }
        if (!this._scanEl && flag) {
            if (!this.iconGroup) {
                this.iconGroup = <div className="btn-group"></div>;
                this.wrapper.appendChild(this.iconGroup);
                this.initIconEven();
            }
            this._scanEl = <a data-index="-1" class="btn btn-sm icon iconfont icon-richscan_icon" data-type="scan"></a>;
            d.append(this.iconGroup, this._scanEl);

            let can2dScan = Shell.inventory.can2dScan;
            if (can2dScan) {
                Shell.inventory.openScan((res) => {

                    if (res.success && res.data !== 'openSuponScan') {
                        this.set(res.data);
                        if (tools.isFunction(this.para.on2dScan)) {
                            this.para.on2dScan(res.data);
                        }
                    }
                });
            }
        }
    }

    get isScan() {
        return this._isScan
    }


    /**
     * 事件绑定
     * @param type - HTMLInputElement 原生事件
     * @param handle - 事件处理
     */
    public on(type: string, handle: EventListener) {
        d.on(this.input, type, handle);
    }

    get(): string | any {
        return this.input ? this.input.value : '';
    }

    set(str: string | number): void {
        this.input && (this.input.value = tools.str.toEmpty(str));
        typeof this.onSet === 'function' && this.onSet(str);
    }

    private _inputType: string;
    set inputType(str: string) {
        let types = ['text', 'button', 'checkbox', 'password', 'radio', 'image', 'reset', 'file', 'submit', 'textarea', 'number'],
            type = types.indexOf(str) > -1 ? str : types[0];

        this.input.type = this._inputType = type;
    }

    get inputType() {
        return this._inputType;
    }

    readonly(is?: boolean) {
        if (typeof is === 'undefined') {
            return this.isReadonly;
        } else {
            this.input.readOnly = is;
            return is;
        }
    }

    placeholder(str: string) {
        this.input.placeholder = str;
    }

    destroy() {
        super.destroy();
        this.input = null;
        this.para = null;
    }

    // wrapperGet(){
    //     return this._wrapper;
    // }

    focus() {
        this.input.focus();
    }

    get value() {
        return this.input.value;
    }

    set value(str) {
        this.input.value = tools.str.toEmpty(str);
        typeof this.onSet === 'function' && this.onSet(str);
    }

    set disabled(e: boolean) {
        if (this._disabled !== e) {
            if (tools.isNotEmpty(e)) {
                this._disabled = e;
                if (this._disabled) {
                    this.wrapper && this.wrapper.classList.add('disabled');
                } else {
                    this.wrapper && this.wrapper.classList.remove('disabled');
                }
            }
        }
        this.input && (this.input.disabled = e || false);
    }

    protected wrapperInit(para: ITextInputPara = {}): HTMLElement {
        let icons = para.icons,
            isNotEmptyIcons = tools.isNotEmptyArray(icons);

        return <div className="text-input">
            {this.input =
                <input type={typeof para.type === 'undefined' ? 'text' : para.type}
                       placeholder={para.placeholder || ''}
                       readOnly={!!para.readonly}
                       disabled={!!para.disabled}
                       style={isNotEmptyIcons ? {width: `calc(100% - ${icons.length * 20}px)`} : null}
                />}
            {isNotEmptyIcons ?
                (this.iconGroup = <div className="btn-group">
                    {icons.map((icon, i) => <a className={`btn btn-sm icon ${icon}`} data-index={i}></a>)}
                </div>)
                : null}
        </div>;
    }
}