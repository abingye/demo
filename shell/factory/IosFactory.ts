/// <amd-module name="IosFactory"/>
import {ShellDeviceIp} from "../iosImpl/ShellDevice";
import {ShellErpManageIp} from "../iosImpl/ShellErpManage";
import {ShellFactory} from "./ShellFactory";

/**
 * Created by zhengchao on 2017/12/4.
 * 苹果接口工厂类
 */
export class IosFactory extends ShellFactory{

    device() {
        return new ShellDeviceIp();
    }

    erp() {
        return new ShellErpManageIp();
    }

    // webView() {
    //     return new ShellWebViewIp();
    // }
    //
    // nativeUi() {
    //     return new ShellNativeUiIp();
    // }
    //
    // storage() {
    //     return new ShellStorageIp();
    // }

}





