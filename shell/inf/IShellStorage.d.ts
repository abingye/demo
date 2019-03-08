
/**
 * Created by zhengchao on 2017/12/6.
 * 本地缓存操作接口
 */
export interface IShellStorage {
    /**
     *
     */
    get(key:string):any;

    set(key:string,value):void;

    del(key:string):void;

}




