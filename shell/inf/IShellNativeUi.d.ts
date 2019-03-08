
import {Param} from "../../entity/Param";

/**
 * Created by zhengchao on 2017/12/6.
 * 硬件设备操作接口
 */
export interface IShellNativeUi{
    alert( param:Param ) :void;
    confirm( param:Param ) :void;
    toast( param:Param ) :void;
    notice(obj : {msg :string, url?:string, position?:string, time?:number, title?:string, type?:string}) :void;
}




