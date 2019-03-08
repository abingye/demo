/// <amd-module name="ShellErpManagePc"/>
import {Param} from "../../entity/Param";
import {IShellErpManage} from "../inf/IShellErpManage";
import {BaseShellImpl} from "../BaseShellImpl";
import {Result} from "../../entity/Result";
import tools = G.tools;
import d = G.d;
export interface IParam {
    type?:number,
    data?:any,
    msg?:string,
    contents?:string[],
    callback?:Function,
    is?:boolean,
}
/**
 * Created by wengyifan on 2017/12/9.
 * PC企业设备操作接口
 */
export class ShellErpManagePc extends BaseShellImpl implements IShellErpManage{

    inventory( param:IParam ){
        let result = new Result();
        let dict = tools.isEmpty( param.data ) ? "" : JSON.stringify( param.data );
        result.data = this.pcHandle(param.msg, dict); //msg=>['callUpload', 'callDownload', 'cancelSend', 'callFinger']
        return result;
    }

    pos( param:IParam ){

    }

    callFinger( param:Param ): Result{
        let result = new Result();
        result.data = JSON.parse(this.pcHandle('callFinger','{"type":'+param.type+'}'));
        return result;
    }
    callFingerMsg( param:Param ): Result{
        d.on( window,'callFingerMsg', (e) => {
            param.callback(e);
        });
        return null;
    }
    setFinger( param:Param ): Result{
        d.on( window,'setFinger', (e) => {
            param.callback(e);
        });
        return null;

    }
    verifyFinger( param:Param ): Result{
        let result = new Result();
        let data = param.data;
        result.data = this.pcHandle('verifyFinger', JSON.stringify(data));
        return result;
    }
    cancelFinger( param:Param ): Result{
        let result = new Result();
        result.data = this.pcHandle('cancelFinger','');
        d.off(window, 'callFingerMsg');
        d.off(window, 'setFinger');
        return result;
    }
    downloadFile( param:Param ){
        this.pcHandle('downloadFile',param.data);
        return null;
    }

}
