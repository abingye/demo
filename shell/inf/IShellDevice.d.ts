import {Param} from "../../entity/Param";
import {Result} from "../../entity/Result";

/**
 * Created by zhengchao on 2017/12/5.
 * 硬件设备操作接口
 */
export interface IShellDevice{
    /**
     * 获取设备信息
     */
    getInfo( param?:Param ) :Result;

    /**
     * 数据拷贝
     */
    copy( param:Param ) :Result;

    /**
     * 获取gps信息
     */
    getGps( param:Param ) :Result;

    /**
     * 设备更新
     */
    update?( param:Param ) :Result;

    /**
     * 退出应用
     */
    quit?( param:Param ) :Result;

    /**
     * 指纹验证
     */
    touchid?( param:Param ) :Result;

    /**
     * 微信登录
     */
    wechatin?( param:Param ) :Result;

    /**
     * 扫一扫
     */
    scan?( param?:Param ) :Result;

    /**
     * 摇一摇
     */
    shake?( param:Param ) :Result;

}





