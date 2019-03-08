import {Param} from "../../entity/Param";
import {Result} from "../../entity/Result";

/**
 * Created by zhengchao on 2017/12/5.
 * 硬件窗口操作接口
 */
export interface IShellWebView{
    /**
     * 打开新窗口
     */
    open( param:Param ) :Result;

    /**
     * 关闭窗口
     */
    close( param?:Param ) :Result;

    /**
     * 当前窗口加载新页面
     */
    load( param:Param ) :Result;

    /**
     * 当前窗口回退
     */
    back( param?:Param ) :Result;

    /**
     * 唤醒webView触发
     */
    wake?( param:Param ) :Result;

    /**
     * 回到入口
     */
    logout( param:Param ) :Result;

    /**
     * 打开一张图片
     */
    openImg( param:Param ) :Result;

    /**
     * 关闭所有窗口
     */
    closeAll?( param:Param ) :Result;

    /**
     * 关闭除当前窗口外的其他窗口
     */
    closeOther?( param:Param ) :Result;

    /**
     * 下载文件
     */
    download( param:Param ) :Result;

    /**
     * 清理缓存
     */
    clear?( param?:Param ) :Result;

    /**
     * 打开带底部标签的页面
     */
    opentab?( param?:Param ) :Result;

    /**
     * 设置页面标题头部
     */
    setTitle?( param:Param ) :Result;

    /**
     * 发送事件到指定窗口
     */
    fire?( param:Param ) :Result;

    refresh?( param:Param ) :Result;

    lockToggle?( param:Param ) :Result;

    setBreadcrumb?( param:Param ) :Result;

    powerManager?( param?:Param ) :Result;

    whiteBat?(param?:Param): Result;

}





