/// <amd-module name="SearchInput"/>
import {TextInput, ITextInputBasicPara} from "../text/text";
import tools = G.tools;
import d = G.d;

interface ISearchInputPara extends ITextInputBasicPara{
    data? : ListData,
    ajax? : {
        fun(url:string,  data:obj , recentValue:string, callback : (data : ListData) => void ),
        url? : string,
        data? : obj
    };
}
interface ListData extends Array<ListItem | string | number>{}

export class SearchInput extends TextInput{
    onSet: (val) => void;
    protected para: ISearchInputPara;
    constructor(p: ISearchInputPara){
        super(<ISearchInputPara>Object.assign({}, p,{
            icons : ['iconfont icon-sousuo'],
            iconHandle : () => {
                this.search();
            }
        }));
    }

    wrapperInit(para){
        let wrapper = super.wrapperInit(para);
        d.classAdd(wrapper, 'search-input');
        //回车搜索
        d.on(this.input,'keypress',(e:KeyboardEvent)=> {
            if(e.charCode === 13){
                this.search();
            }
        });
        return wrapper;
    }

    search(){
        let recentValue = this.input.value,
            ajax = this.para.ajax;

        if(ajax && ajax.url && ajax.fun){
            //用ajax获取数据
            ajax.fun(ajax.url, ajax.data, recentValue, d => {

            })
        }
    }


}