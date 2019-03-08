/// <amd-module name="ShellErpManageAd"/>
import {Param} from "../../entity/Param";
import {IShellErpManage} from "../inf/IShellErpManage";
import {BaseShellImpl} from "../BaseShellImpl";
import {Result} from "../../entity/Result";

/**
 * Created by zhengchao on 2017/12/5.
 * 安卓企业设备操作接口
 */
export class ShellErpManageAd extends BaseShellImpl implements IShellErpManage{

    inventory( param:Param ): Result{
        return null;
    }

    pos( param:Param ){

    }

    downloadFile( param:Param ){

    }

}




