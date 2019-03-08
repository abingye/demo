/// <amd-module name="ShellDeviceH5"/>
import {Param} from "../../entity/Param";
import {IShellDevice} from "../inf/IShellDevice";
import {Result} from "../../entity/Result";
import {BaseShellImpl} from "../BaseShellImpl";
import {Modal} from "../../components/feedback/modal/Modal";

/**
 * Created by zhengchao on 2017/12/5.
 * 移动硬件设备操作接口
 */
export class ShellDeviceH5 extends BaseShellImpl implements IShellDevice{

    getInfo(param: Param): Result {
        let result = new Result();
        result.success = false;
        result.msg = "设备信息只在客户端中才可获取";
        return result;
    }

    copy(param: Param): Result {
        // let ui = new ShellNativeUiH5();
        Modal.toast('您的设备暂不支持复制');
        return null;
    }

    getGps(param: Param): Result {
        throw new Error("Method not implemented.");
    }

    update(param: Param): Result {
        Modal.toast('已经是最新版本');
        return null;
    }

    touchid?(param: Param): Result {
        Modal.toast('您的设备暂不支持指纹');
        return null;
    }

    wechatin?(param: Param): Result {
        Modal.toast('您的设备暂不支持微信');
        return null;
    }

    scan?(param: Param): Result {
        Modal.toast('您的设备暂不支持扫一扫');
        return null;
    }

    shake?(param: Param): Result {
        Modal.toast('您的设备暂不支持摇一摇');
        return null;
    }


}





