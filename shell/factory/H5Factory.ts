/// <amd-module name="H5Factory"/>
import {ShellErpManageH5} from "../h5Impl/ShellErpManage";
import {ShellFactory} from "./ShellFactory";
import {ShellDeviceH5} from "global/shell/h5Impl/ShellDevice";

/**
 * Created by zhengchao on 2017/12/6.
 * H5接口工厂类
 */
export class H5Factory extends ShellFactory{

    device() {
        return new ShellDeviceH5();
    }

    erp() {
        return new ShellErpManageH5();
    }

    // webView() {
    //     return new ShellWebViewH5();
    // }

    // nativeUi() {
    //     return new ShellNativeUiH5();
    // }
    //
    // storage() {
    //     return new ShellStorageH5();
    // }

}





