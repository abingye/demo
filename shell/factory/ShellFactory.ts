/// <amd-module name="ShellFactory"/>
/**
 * Created by zhengchao on 2017/12/4.
 * 硬件设备抽象工厂
 */
export abstract class ShellFactory{

    /**
     * 硬件设备操作接口
     */
    protected abstract device();

    /**
     * 企业应用操作接口
     */
    protected abstract erp();

    /**
     * 窗口操作接口
     */
    // protected abstract webView( pageContainer?:HTMLDivElement , navBar?:HTMLDivElement );

    /**
     * 原生界面操作接口
     */
    // protected abstract nativeUi();

    /**
     * 本地缓存操作接口
     */
    // protected abstract storage();

    constructor(){

    }
}





