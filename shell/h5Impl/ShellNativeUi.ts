// /// <amd-module name="ShellNativeUiH5"/>
// import {Param} from "../../entity/Param";
// import {IShellNativeUi} from "../inf/IShellNativeUi";
// import {BaseShellImpl} from "../BaseShellImpl";
// import tools = G.tools;
//
// /**
//  * Created by wengyifan on 2017/12/9.
//  * H5原生交互操作接口
//  */
// export class ShellNativeUiH5 extends BaseShellImpl implements IShellNativeUi{
//     alert( param:Param ) :void{
//         mui.alert(tools.str.htmlEncode(param.data));
//     };
//     confirm( param:Param ) :void{
//         mui.confirm(tools.str.htmlEncode(param.data.msg), param.data.title, param.data.btn, function(e){
//             param.callback(e.index);
//         });
//     };
//     toast( param:Param ) :void{
//         mui.toast(tools.str.htmlEncode(param.data));
//     };
//     notice(obj : {msg :string, url?:string, position?:string, time?:number, title?:string, type?:string}) :void{
//         this.toast(new Param({data:tools.str.htmlEncode(obj.msg)}));
//     };
//
// }