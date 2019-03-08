/// <amd-module name="Param"/>
import tools = G.tools;
export interface IParam {
    type?:number,
    data?:any,
    msg?:string,
    contents?:string[],
    callback?:Function,
    is?:boolean,
}

/**
 * 统一参数对象
 */
export class Param implements IParam{

    private _type?:number;
    set type(type:number){
        this._type = type;
    }
    get type(){
        return this._type;
    }

    private _data?:any;
    set data(data:any){
        if(tools.isEmpty(data))
            this._data = {};
        else
            this._data = data;
    }
    get data(){
        return this._data;
    }

    private _contents?:string[];
    set contents(contents:string[]){
        this._contents = contents;
    }
    get contents(){
        return this._contents;
    }

    private _msg?:string;
    set msg(msg:string){
        if(tools.isEmpty(msg))
            this._msg = "";
        else
            this._msg = msg;
    }
    get msg(){
        return this._msg;
    }

    private _callback?:Function;
    set callback(callback:Function){
        this._callback = callback;
    }
    get callback(){
        return this._callback;
    }

    private _is?:boolean;
    set is(is:boolean){
        this._is = is;
    }
    get is(){
        return this._is;
    }

    toString(){
        return {
            'type':this.type,
            'data':this.data,
            'msg':this.msg,
            'callback':this.callback
        }
    }

    constructor(param?:IParam) {
        if(tools.isEmpty(param))
            param = <IParam>{};
        if(typeof param === 'string')
            param = JSON.parse(<string>param);
        this.type = param.type;
        this.data = param.data;
        this.msg = param.msg;
        this.callback = param.callback;
        this.is = param.is;
    }
}
