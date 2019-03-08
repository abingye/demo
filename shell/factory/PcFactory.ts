/// <amd-module name="PcFactory"/>
import {ShellErpManagePc} from "../pcImpl/ShellErpManage";
import {ShellFactory} from "./ShellFactory";
import {ShellDevicePc} from "../pcImpl/ShellDevice";

/**
 * Created by wengyifan on 2017/12/9.
 * Pc接口工厂类
 */
export class PcFactory extends ShellFactory{

    device() {
        return new ShellDevicePc();
    }

    erp() {
        return new ShellErpManagePc();
    }

    // webView( pageContainer?:HTMLDivElement ,navBar?:HTMLDivElement ) {
    //     return new ShellWebViewPc({
    //         pageContainer,
    //         navBar,
    //     });
    // }

    // nativeUi() {
    //     return new ShellNativeUiPc();
    // }
    //
    // storage() {
    //     return new ShellStoragePc();
    // }

}





