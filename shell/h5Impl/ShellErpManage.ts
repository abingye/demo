/// <amd-module name="ShellErpManageH5"/>
import {Param} from "../../entity/Param";
import {IShellErpManage} from "../inf/IShellErpManage";
import {BaseShellImpl} from "../BaseShellImpl";
import {Result} from "../../entity/Result";

/**
 * Created by wengyifan on 2017/12/9.
 * H5企业设备操作接口
 */
export class ShellErpManageH5 extends BaseShellImpl implements IShellErpManage{

    inventory( param:Param ): Result{
        return null;
    }

    pos( param:Param ){

    }

    downloadFile( param:Param ){

    }
}