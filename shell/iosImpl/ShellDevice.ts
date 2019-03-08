/// <amd-module name="ShellDeviceIp"/>
import {Param} from "../../entity/Param";
import {IShellDevice} from "../inf/IShellDevice";
import {Result} from "../../entity/Result";
import tools = G.tools;
import d = G.d;
import {BaseShellImpl} from "../BaseShellImpl";
import {Modal} from "../../components/feedback/modal/Modal";

/**
 * Created by zhengchao on 2017/12/5.
 * 苹果硬件设备操作接口
 */
export class ShellDeviceIp extends BaseShellImpl implements IShellDevice{
    getInfo(param?: Param): Result {
        let result = new Result(),dict:obj = {};
        if(tools.isEmpty(param.msg)){
            dict.key = param.msg;
        }
        dict.event = "getDevice";
        this.ipHandle('getDevice', dict);
        window.addEventListener('getDevice', function(e) {
            param.callback(e);
        });
        return result;
    }

    copy(param: Param): Result {
        // let ui=new ShellNativeUiIp();
        param.msg = G.tools.str.toEmpty(param.msg).trim();
        this.ipHandle('copy', {data:param.msg});
        Modal.toast('复制成功');
        return null;
    }

    getGps(param: Param): Result {
        if(param.type===0)
            param.callback("");
        else{
            let dict:obj = {};
            dict.type = param.type;
            dict.event = "putGps";
            this.ipHandle('getGps',dict);
            window.addEventListener('putGps',function(e){
                param.callback(e);
            });
        }
        return null;
    }

    update(param: Param): Result {
        this.ipHandle('checkUpdate');
        Modal.toast('已经是最新版本');
        return null;
    }

    quit?(param: Param): Result {
        this.ipHandle('quit');
        return null;
    }

    touchid?(param: Param): Result {
        let event = "touchidCallback";
        this.ipHandle('touchid', {event : event});
        d.once(window, event, function (e) {
            param.callback(e);
        });
        return null;
    }

    wechatin?(param: Param): Result {
        let event = "wechatCallback";
        this.ipHandle('wechatin', {event : event});
        d.once(window, event, function (e) {
            param.callback(e);
        });
        return null;
    }

    scan?(param?: Param): Result {
        let event = 'scanCallback';
        this.ipHandle('scan',{event : event});
        d.once(window, event, function (e) {
            param.callback(e);
        });
        return null;
    }

    shake?(param: Param): Result {
        this.ipHandle('shake',{event: 'shake'});//param.msg=>event;
        d.once(window, 'shake', function(e){
            param.callback(e);
        });
        return null;
    }
}





