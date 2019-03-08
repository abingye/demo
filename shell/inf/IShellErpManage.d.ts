
import {Param} from "../../entity/Param";
import {Result} from "../../entity/Result";

/**
 * Created by zhengchao on 2017/12/6.
 * 硬件设备操作接口
 */
export interface IShellErpManage{
    /**
     * 盘点接口
     */
    inventory( param:Param ) :void;

    /**
     * 打印小票接口
     */
    pos( param:Param ) :void;

    /**
     * 唤起指纹器接口
     */
    callFinger?( param:Param ):  Result;
    callFingerMsg?( param:Param ) : Result;
    setFinger?( param:Param ): Result;
    verifyFinger?( param:Param ): Result;
    cancelFinger?( param:Param ): Result;
    downloadFile( param:Param ) :void;

}




