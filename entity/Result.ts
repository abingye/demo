/// <amd-module name="Result"/>
import tools = G.tools;
export interface IResult {
    code?:number,
    data?:object,
    msg?:string,
    success:boolean
}
/**
 * 统一的返回值对象
 */
export class Result implements IResult{

    private _code?:number;
    set code(code:number){
        if(tools.isEmpty(code))
            code = 0;
        this._code = code;
    }
    get code(){
        return this._code;
    }

    private _data?:object;
    set data(data:object){
        if(tools.isEmpty(data))
            this._data = {};
        else
            this._data = data;
    }
    get data(){
        return this._data;
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

    private _success:boolean;
    set success(success:boolean){
        if(tools.isEmpty(success))
            success = true;
        this._success = success;
    }
    get success(){
        return this._success;
    }

    toString(){
        return {
            'code':this.code,
            'data':this.data,
            'msg':this.msg,
            'success':this.success
        }
    }

    constructor(result?:IResult) {
        if(tools.isEmpty(result))
            result = <IResult>{};
        if(typeof result === 'string')
            result = JSON.parse(<string>result);
        this.code = result.code;
        this.data = result.data;
        this.msg = result.msg;
        this.success = result.success;
    }
}