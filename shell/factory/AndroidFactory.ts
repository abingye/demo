/// <amd-module name="AndroidFactory"/>
import {ShellDeviceAd} from "../androidImpl/ShellDevice";
import {ShellErpManageAd} from "../androidImpl/ShellErpManage";
import {ShellFactory} from "./ShellFactory";

/**
 * Created by zhengchao on 2017/12/6.
 * 安卓接口工厂类
 */
export class AndroidFactory extends ShellFactory{

    device() {
        return new ShellDeviceAd();
    }

    erp() {
        return new ShellErpManageAd();
    }

    // webView() {
    //     return new ShellWebViewAd();
    // }

    // nativeUi() {
        // return new ShellNativeUiAd();
    // }

    // storage() {
        // return new ShellStorageAd();
    // }

}



