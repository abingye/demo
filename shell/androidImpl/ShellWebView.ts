/// <amd-module name="ShellWebViewAd"/>
// import {Param} from "../../entity/Param";
// import {IShellWebView} from "global/shell/inf/IShellWebView";
// import {Result} from "global/entity/Result";
// import {BaseShellImpl} from "../BaseShellImpl";
// import tools = G.tools;
// import CONF = BW.CONF;
//
// /**
//  * Created by zhengchao on 2017/12/5.
//  * 安卓窗口管理操作接口
//  */
// export class ShellWebViewAd extends BaseShellImpl implements IShellWebView{
//     open(param: Param): Result {
//         let result = new Result();
//         let o:winOpen = param.data;
//         if(typeof o.data === "string"){
//             o.data = JSON.parse(o.data);
//         }
//         o.extras = {viewData:JSON.stringify(o.extras)};
//         result.data = this.adHandle('open',JSON.stringify(o));
//         return result;
//     }
//
//     close(param: Param): Result {
//         let result = new Result();
//         result.data = this.adHandle('close','{event:"'+param.data.event+'",data:"'+param.data.data+'"}');
//         return result;
//     }
//
//     load(param: Param): Result {
//         let result = new Result();
//         result.data = this.adHandle('load','{url:"'+param.data.url+'",event:"windowData",data:"'+param.data.data+'"}');
//         return result;
//     }
//
//     back(param: Param): Result {
//         let result = new Result();
//         result.data = this.adHandle('back','{event:"'+param.data.event+'",data:"'+param.data.data+'"}');
//         return result;
//     }
//
//     wake?(param: Param): Result {
//         let result = new Result();
//         result.data = this.adHandle('wake','{event:"'+param.data.event+'",data:"'+param.data.data+'"}');
//         return result;
//     }
//
//     logout(param: Param): Result {
//         let result = new Result();
//         if(tools.isEmpty(param.data.url)){
//             result.data = this.adHandle('logout', '{url:' + CONF.url.login + '}');
//         }else{
//             result.data = this.adHandle('logout','{url:"'+param.data.url+'"}');
//         }
//         return result
//     }
//
//     openImg(param: Param): Result {
//         let result = new Result();
//         result.data = this.adHandle('openImg','{url:"'+param.data.url+'"}');
//         return result;
//     }
//
//     download(param: Param): Result {
//         let result = new Result();
//         result.data = this.adHandle('download','{url:'+param.data.url+'}');
//         return result;
//     }
//
//     clear?(param?: Param): Result {
//         let result = new Result();
//         result.data = this.adHandle('clear');
//         return result;
//     }
//
//     opentab?(param?: Param): Result {
//         let result = new Result();
//         let ja = [
//             {icon : "home", name : "首页", url : CONF.url.home},
//             {icon : "contacts", name : "通讯", url : CONF.url.contact},
//             {icon : "message", name : "消息", url : CONF.url.message},
//             {icon : "myselfMenu", name : "我的", url : CONF.url.myselfMenu}
//         ];
//         result.data = this.adHandle('opentab',
//             "{\"userid\":"+param.data.userid+"," +
//             "\"accessToken\":\""+param.data.accessToken+"\"," +
//             "\"data\":"+JSON.stringify(ja)+"}");
//         return result;
//     }
//
//     fire?(param: Param): Result {
//         tools.event.fire(param.msg, param.data, window);
//         return null;
//     }
//
//     powerManager?(param?: Param): Result{
//         let result = new Result();
//         result.data = this.adHandle('powerManager','');
//         return result;
//     }
//
//     whiteBat?(param?: Param): Result{
//         let result = new Result();
//         result.data = this.adHandle('whiteBat','');
//         return result;
//     }
// }
//
//
//

