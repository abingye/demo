/// <amd-module name="ShellErpManageIp"/>
import {Param} from "../../entity/Param";
import {IShellErpManage} from "../inf/IShellErpManage";
import {BaseShellImpl} from "../BaseShellImpl";
import {Result} from "../../entity/Result";

/**
 * Created by wengyifan on 2017/12/9.
 * 苹果企业设备操作接口
 */
export class ShellErpManageIp extends BaseShellImpl implements IShellErpManage{

    inventory( param:Param ): Result{
        return null;
    }

    pos( param:Param ){

    }

    downloadFile( param:Param ){

    }

}
