// /// <amd-module name="ShellStorageAd"/>
// import {IShellStorage} from "global/shell/inf/IShellStorage";
// import {BaseShellImpl} from "../BaseShellImpl";
//
// /**
//  * Created by zhengchao on 2017/12/6.
//  * 安卓本地缓存操作接口
//  */
// export class ShellStorageAd extends BaseShellImpl implements IShellStorage{
//
//     get(key:string) {
//         return window.localStorage.getItem(key);
//     }
//
//     set(key:string,value):void{
//         if(typeof value === 'object')
//             value = JSON.stringify(value);
//         window.localStorage.setItem(key ,value);
//     }
//
//     del(key:string):void{
//         window.localStorage.removeItem(key);
//     }
//
// }
//
//
//
//
