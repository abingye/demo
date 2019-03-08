/// <amd-module name="TagsInput"/>
/// <amd-dependency path="tagsInput" name="tagsInput"/>
import {FormCom, IFormComPara} from "../basic";
import tools = G.tools;
export interface ITagsInputPara extends IFormComPara{
    name : string;
    multi : boolean,
    sepValue : string;
    ajax?(data:string):Promise<ListItem[]>,
    onItemRemove?: (val: obj[]) => void;
    // ajaxUrl? : string;
    // ajaxSuccess?(data, response) : {value : any, text : string}[];
}
export class TagsInput extends FormCom{
    onSet: (val) => void;
    onItemRemove?: (val: obj[]) => void;
    private com;
    constructor(private para: ITagsInputPara){
        super(para);
        this.onItemRemove = para.onItemRemove;
        this.comInit();
    }

    protected wrapperInit(): HTMLElement {
        return <input />;
    }

    private comInit(){

        // let tagsDom = tagsInput.get(0);

        require(['tagsInput'], () => {
            this.com = $(this.wrapper);
            this.com.tagsinput({
                tagClass: '',
                itemText: 'text',
                itemValue: 'value',
                maxTags: this.para.multi ? undefined : 1,
                //    confirmKeys: [13, 44]
                //	freeInput : false
            });
            this.com.on('itemRemoved', (event) => {
                this.onItemRemove && this.onItemRemove(this.get());
            });

            this.initEvent();

            this.set(this._value);
            for(let name in this.event){
                this.on(name, this.event[name]);
            }
            this.event = {};
        });

    }

    // 删除tagsInput中的item项，无参数为清除所有
    removeItems(items?: any[]){
        if(!this.com){
            return
        }
        if(items){
            items.forEach((val) => {
                this.com.tagsinput('remove', val);
            })
        }else{
            this.com.tagsinput('removeAll');
        }
    }

    public get() : obj[]{
        return this.com ? this.com.tagsinput('items') : this._value;
    }

    public set(data: string) {
        if(!data) {
            return;
        }

        this._value = data;

        if(!this.com) {
            return;
        }

        if(!tools.isFunction(this.para.ajax)) {
            data.split(this.para.sepValue).forEach((v) => {
                this.com.tagsinput('add', {value: v, text: v})
            });
            return;
        }

        this.para.ajax(data).then(items => {
            items.forEach((item) => {
                this.com.tagsinput('add', item);
            });
            typeof this.onSet === 'function' && this.onSet(data);
            this.com.tagsinput('input').val('');
            // typeof callback === 'function' && callback(response);
        })
    }

    private event: objOf<Function> = {};
    on (name : string, callback:Function) {

        if(this.com) {
            this.com.on(name, callback);
        }else{
            this.event[name] = callback;
        }
    }

    private initEvent(){
        if (!this.para.ajax) {
            return
        }
        let self = this;
        this.com.tagsinput('input').on('keypress blur', function (e) {
            if (e.charCode === 13 || e.type === 'blur') {
                let input = this;
                let inputValue = input.value.trim().toUpperCase();
                if (inputValue.length === 0) {
                    return;
                }
                self.set(inputValue);
            }
        });
    }

    get value() {
        return this.com ? this.com.tagsinput('items') : this._value;
    }
    set value(val:string){
        this.set(val)
    }
}