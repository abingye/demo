// /// <amd-module name="ShellNativeUiAd"/>
// import {Param} from "../../entity/Param";
// import {IShellNativeUi} from "../inf/IShellNativeUi";
// import {BaseShellImpl} from "../BaseShellImpl";
//
// /**
//  * Created by zhengchao on 2017/12/5.
//  * 安卓原生交互操作接口
//  */
// export class ShellNativeUiAd extends BaseShellImpl implements IShellNativeUi{
//     alert(param: Param): void {
//         alert(param.data);
//     }
//
//     confirm(param: Param): void {
//         if (confirm(param.data)) {
//             param.callback(1);
//         } else {
//             param.callback(0);
//         }
//     }
//
//     toast(param: Param): void {
//         mui.toast(param.data);
//     }
//
//     notice(obj: { msg: string; url?: string; position?: string; time?: number; title?: string; type?: string }): void {
//         this.adHandle('callMsg',obj.msg);
//     }
//
//
//
//
// }
//
//
//
//
