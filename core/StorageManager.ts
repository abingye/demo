/// <amd-module name="StorageManager"/>
// import tools = G.tools;
//
// /**
//  * Created by zhengchao on 2017/10/3.
//  * 客户端Storage增删改查管理
//  */
// export class StorageManager{
//
//     /**
//      * 新增一条数据，生成id主键
//      */
//     add(obj:obj):number{
//         if(tools.isEmpty(obj)){
//             return 0;
//         }
//         let list = this.list();
//         list.unshift(obj);
//         sys.storage.set(this.storage,list)
//         return 1;
//     }
//
//     /**
//      * 根据id修改一条数据
//      */
//     update(obj:obj):number{
//         if(tools.isEmpty(obj) || tools.isEmpty(obj.id)){
//             return 0;
//         }
//         let list = this.list();
//         let listObj = list.filter((o)=>{
//             return o.id===obj.id;
//         })
//         let i = list.indexOf(listObj[0]);
//         if(i>-1){
//             list.splice(i,1,obj);
//             sys.storage.set(this.storage,list);
//             return 1;
//         }else
//             return 0;
//     }
//
//     /**
//      * 根据id主键，存在做修改，不存在做新增
//      */
//     save(obj:obj):number{
//         if(tools.isEmpty(obj)){
//             return 0;
//         }
//         let list = this.list();
//         let listObj = list.filter((o)=>{
//             return o.id===obj.id;
//         })
//         let i = list.indexOf(listObj[0]);
//         if(i>-1){
//             list.splice(i,1,obj);
//         }else
//             list.unshift(obj);
//         sys.storage.set(this.storage,list);
//         return 1;
//     }
//
//     /**
//      * 根据id主键删除一条数据
//      */
//     del(id:string):number{
//         let list = this.list();
//         let obj = list.filter((o)=>{
//             return o.id===id;
//         })
//         let i = list.indexOf(obj[0]);
//         if(i>-1){
//             list.splice(i,1);
//             sys.storage.set(this.storage,list);
//             return 1;
//         }else
//             return 0;
//     }
//
//     /**
//      * 删除所有数据
//      */
//     remove(){
//         sys.storage.del(this.storage);
//     }
//
//     /**
//      * 根据id主键获取单条数据
//      */
//     get(id:string){
//         let list = this.list();
//         let obj = list.filter((o)=>{
//             return o.id===id;
//         })
//         return obj[0];
//     }
//
//     /**
//      * 获取所有集合
//      */
//     list():Array<obj>{
//         let list = <string>sys.storage.get(this.storage);
//         if(tools.isEmpty(list))
//             list = '[]';
//         return JSON.parse(list);
//     }
//
//     /**
//      * 获取总记录数
//      */
//     num():number{
//         let list = this.list();
//         return list.length;
//     }
//
//     private storage;
//
//     constructor(storage:string) {
//         this.storage = storage;
//     }
// }