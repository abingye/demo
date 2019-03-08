// /// <amd-module name="ShellNativeUiIp"/>
// import {Param} from "../../entity/Param";
// import {IShellNativeUi} from "../inf/IShellNativeUi";
// import {BaseShellImpl} from "../BaseShellImpl";
//
// /**
//  * Created by wengyifan on 2017/12/9.
//  * 苹果原生交互操作接口
//  */
// export class ShellNativeUiIp extends BaseShellImpl implements IShellNativeUi{
//     alert( param:Param ) :void{
//         alert(param.data);
//     };
//     confirm( param:Param ) :void{
//         if (confirm(param.data)) {
//             param.callback(1);
//         } else {
//             param.callback(0);
//         }
//     };
//     toast( param:Param ) :void{
//         mui.toast(param.data);
//     };
//     notice(obj : {msg :string, url?:string, position?:string, time?:number, title?:string, type?:string}) :void{
//         let dict :obj= {};
//         dict.data = obj.msg;
//         this.ipHandle('callMsg',dict);
//     };
//
// }