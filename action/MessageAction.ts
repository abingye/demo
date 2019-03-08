// /// <amd-module name="MessageAction"/>
// import tools = G.tools;
// import sys = G.sys;
// import {Message} from "../entity/Message";
// import {StorageManager} from "../core/StorageManager";
// /**
//  * 接收消息控制器
//  */
// export class MessageAction{
//
//     /**
//      * 保存消息
//      */
//     saveMessage(message:Message):number{
//         return this.storageManager.save(message.toString());
//     }
//
//     /**
//      * 删除消息
//      */
//     deleteMessage(id:string):number{
//         return this.storageManager.del(id);
//     }
//
//     /**
//      * 获取单条消息
//      */
//     getMessageInfo(id:string):Message{
//         let obj = this.storageManager.get(id);
//         let message = new Message(obj);
//         return message;
//     }
//
//     /**
//      * 获取消息列表
//      */
//     messagelist():Array<Message>{
//         return this.storageManager.list();
//     }
//
//     /**
//      * 获取未读消息数
//      */
//     getListNum():number{
//         return this.storageManager.num();
//     }
//
//     private storageManager;
//
//     constructor() {
//         this.storageManager = new StorageManager("messageList")
//     }
// }