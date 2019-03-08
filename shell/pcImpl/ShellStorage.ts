// /// <amd-module name="ShellStoragePc"/>
// import {IShellStorage} from "global/shell/inf/IShellStorage";
// import {BaseShellImpl} from "../BaseShellImpl";
//
// /**
//  * Created by wengyifan on 2017/12/9.
//  * PC本地缓存操作接口
//  */
// export class ShellStoragePc extends BaseShellImpl implements IShellStorage{
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
