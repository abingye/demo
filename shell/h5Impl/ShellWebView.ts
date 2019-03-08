/// <amd-module name="ShellWebViewH5"/>
// import {Param} from "../../entity/Param";
// import {IShellWebView} from "global/shell/inf/IShellWebView";
// import {Result} from "global/entity/Result";
// import {BaseShellImpl} from "../BaseShellImpl";
// import {ShellNativeUiH5} from "./ShellNativeUi";
// import tools = G.tools;
// import CONF = BW.CONF;
//
// /**
//  * Created by wengyifan on 2017/12/9.
//  * H5窗口管理操作接口
//  */
// export class ShellWebViewH5 extends BaseShellImpl implements IShellWebView{
//     open(param: Param): Result {
//         let o:winOpen=param.data;
//         localStorage.setItem('viewData', JSON.stringify(o.extras));
//         mui.openWindow({
//             url : o.url,
//             createNew : true,
//             show:{
//                 aniShow: 'slide-in-right',
//                 duration: 300
//             },
//             waiting:{
//                 autoShow : true,
//                 title : '正在加载...',
//                 options : {
//                 }
//             }
//         });
//         return null;
//     }
//
//     close(param: Param): Result {
//         mui.back();
//         return null;
//     }
//
//     load(param: Param): Result {
//         location.assign(param.data.url);
//         return null;
//     }
//
//     back(param: Param): Result {
//         history.back();
//         return null;
//     }
//
//     wake?(param: Param): Result {
//         throw new Error("Method not implemented.");
//     }
//
//     logout(param: Param): Result {
//         location.assign(CONF.url.login);
//         return null;
//     }
//
//     openImg(param: Param): Result {
//         throw new Error("Method not implemented.");
//     }
//
//     closeAll?(param:Param):Result {
//         throw new Error("Method not implemented.");
//     }
//
//     closeOther?(param:Param):Result {
//         throw new Error("Method not implemented.");
//     }
//
//     download(param: Param): Result {
//         window.location.href = param.data.url;
//         return null;
//     }
//
//     clear?(param?: Param): Result {
//         let ui = new ShellNativeUiH5();
//         ui.toast(new Param({data:'清除成功'}));
//         return null;
//     }
//
//     opentab?(param?: Param): Result {
//         this.open(new Param({data:{url: CONF.url.main}}));
//         return null;
//     }
//
//     setTitle?(param:Param):Result {
//         throw new Error("Method not implemented.");
//     }
//
//     fire?(param: Param): Result {
//         tools.event.fire(param.msg, param.data, window);
//         return null;
//     }
//
// }
//
//


