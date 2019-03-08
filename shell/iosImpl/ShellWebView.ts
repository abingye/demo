/// <amd-module name="ShellWebViewIp"/>
// import {Param} from "../../entity/Param";
// import {IShellWebView} from "global/shell/inf/IShellWebView";
// import {Result} from "global/entity/Result";
// import {BaseShellImpl} from "../BaseShellImpl";
// import tools = G.tools;
// import CONF = BW.CONF;
//
// /**
//  * Created by wengyifan on 2017/12/9.
//  * 苹果窗口管理操作接口
//  */
// export class ShellWebViewIp extends BaseShellImpl implements IShellWebView{
//     open(param: Param): Result {
//         let o:winOpen = param.data;
//         if(typeof o.data === "object"){
//             o.data = JSON.stringify(o.data);
//         }
//         window.localStorage.setItem('viewData', JSON.stringify(o.extras));
//         let dict = {
//             url : o.url,
//             header : o.header,
//             event : "windowData",
//             extras : {viewData:JSON.stringify(o.extras)},
//             data : o.data
//         };
//         this.ipHandle('open', dict);
//         return null;
//     }
//
//     close(param: Param): Result {
//         let dict:obj = {};
//         dict.data = param.data.data;
//         dict.event = param.data.event;
//         this.ipHandle('close', dict);
//         return null;
//     }
//
//     load(param: Param): Result {
//         let dict:obj = {};
//         dict.url = param.data.url;
//         dict.data = param.data.data;
//         dict.event = "windowData";
//         this.ipHandle('load', dict);
//         return null;
//     }
//
//     back(param: Param): Result {
//         let dict:obj = {};
//         dict.event = param.data.event;
//         dict.data = param.data.data;
//         this.ipHandle('back',dict);
//         return null;
//     }
//
//     wake?(param: Param): Result {
//         let dict:obj = {};
//         dict.data = param.data.data;
//         dict.event = param.data.event;
//         this.ipHandle('wake', dict);
//         return null;
//     }
//
//     logout(param: Param): Result {
//         if(tools.isEmpty(param.data.url)){
//             this.ipHandle('logout', {url:CONF.url.login});
//         }else{
//             this.ipHandle('logout',{url:param.data.url});
//         }
//         return null;
//     }
//
//     openImg(param: Param): Result {
//         let dict:obj = {};
//         dict.url = param.data.url;
//         this.ipHandle('openImg',dict);
//         return null;
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
//         let dict :obj= {};
//         dict.url = param.data.url;
//         this.ipHandle('download', dict);
//         return null;
//     }
//
//     clear?(param?: Param): Result {
//         this.ipHandle('clear');
//         return null;
//     }
//
//     opentab?(param?: Param): Result {
//         let dict :obj= {};
//         let ja = [
//             {icon : "home", name : "首页", url : BW.CONF.url.home},
//             {icon : "contacts", name : "通讯", url : BW.CONF.url.contact},
//             {icon : "message", name : "消息", url : BW.CONF.url.message},
//             {icon : "myselfMenu", name : "我的", url : BW.CONF.url.myselfMenu}
//         ];
//         dict.data = JSON.stringify(ja);
//         dict.userid = param.data.userid;
//         dict.accessToken = param.data.accessToken;
//         this.ipHandle('opentab', dict);
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
//
//
