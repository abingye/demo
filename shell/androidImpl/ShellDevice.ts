/// <amd-module name="ShellDeviceAd"/>
import {Param} from "../../entity/Param";
import {IShellDevice} from "../inf/IShellDevice";
import {Result} from "../../entity/Result";
import tools = G.tools;
import d = G.d;
import {BaseShellImpl} from "../BaseShellImpl";
import {Modal} from "../../components/feedback/modal/Modal";
// import {ShellNativeUiAd} from "./shellNativeUi";
// import {Modal} from "../../components/feedback/modal/Modal";

/**
 * Created by zhengchao on 2017/12/5.
 * 安卓硬件设备操作接口
 */
export class ShellDeviceAd extends BaseShellImpl implements IShellDevice{

    getInfo(param?: Param): Result {
        let result = new Result();
        if(param && !tools.isEmpty(param.msg))
            result.data = this.adHandle('getDevice','{key:'+param.msg+'}');
        else
            result.data = this.adHandle('getDevice');
        return result;
    }

    copy(param: Param): Result {
        param.msg = tools.str.toEmpty(param.msg).trim();
        this.adHandle('copy', '{data:"'+param.msg+'"}');
        Modal.toast('复制成功');
        return null;
    }

    getGps(param: Param): Result {
        if(param.type === 0)
            param.callback("");
        else{
            this.adHandle('getGps','{type:'+param.type+',event:"putGps"}');
            d.once(window, 'putGps', function(e){
                param.callback(e);
            });
        }
        return null;
    }

    update?(param: Param): Result {
        this.adHandle('checkUpdate');
        Modal.toast('已经是最新版本');
        return null;
    }

    quit?(param: Param): Result {
        this.adHandle('quit');
        return null;
    }

    touchid?(param: Param): Result {
        let event = "touchidCallback";
        this.adHandle('touchid','{event:"'+event+'"}');
        d.once(window, event, function (e) {
            param.callback(e);
        });
        return null;
    }

    wechatin?(param: Param): Result {
        let event = "wechatCallback";
        this.adHandle('wechatin','{event:"'+event+'"}');
        d.once(window, event, function (e) {
            param.callback(e);
        });
        return null;
    }

    scan?(param?: Param): Result {
        let event = 'scanCallback';
        let result = new Result();
        result.data = this.adHandle('scan', '{event:"'+ event +'"}');
        d.once(window, event, function (e) {
            param.callback(e);
        });
        return result;
    }

    shake?(param: Param): Result{
        this.adHandle('shake','{event:"shake"}');//param.msg=>event;
        d.once(window, 'shake', function(e){
            param.callback(e);
        });
        return null;
    }

}





