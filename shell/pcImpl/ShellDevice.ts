/// <amd-module name="ShellDevicePc"/>
import {Param} from "../../entity/Param";
import {IShellDevice} from "../inf/IShellDevice";
import {Result} from "../../entity/Result";
import tools = G.tools;
import {BaseShellImpl} from "../BaseShellImpl";
import {Modal} from "global/components/feedback/modal/Modal";
import Ajax = G.Ajax;

/**
 * Created by zhengchao on 2017/12/5.
 * 电脑硬件设备操作接口
 */
export class ShellDevicePc extends BaseShellImpl implements IShellDevice{

    getInfo(param: Param): Result {
        let result = new Result();
        let json = this.pcHandle('getDevice','');
        if(!tools.isEmpty(json)){
            result.data = JSON.parse(json).msg;
        }else{
            Modal.toast("获取不到设备信息");
        }
        return result;
    }

    copy(param: Param): Result {
        tools.copy(param.msg);
        Modal.alert('复制成功');
        return null;
    }

    getGps(param: Param): Result {
        throw new Error("Method not implemented.");
    }

    versionUp(url, param: Param): Result {
        let result = new Result();
        let versionText = this.pcHandle('getVersion','');
        Ajax.fetch(url, {
            data : {getversion : versionText},
        }).then(({response}) => {
            param.callback(response);
        });
        return result;
    }

    wechatin?(param: Param): Result {
        throw new Error("Method not implemented.");
    }

    scan?(param: Param): Result {
        throw new Error("Method not implemented.");
    }

}





