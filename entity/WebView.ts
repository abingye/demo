/// <amd-module name="WebView"/>
// import tools = G.tools;
// interface IWebView {
//     url?:string,
//     event?:string,
//     data?:object,
//     msg?:string,
//     header?:object,
//     side?:number,//移动端使用
//     refer?:string,
//     title?:string,
//     callback?:Function
// }
// /**
//  * 窗口对象
//  */
// export class WebView implements IWebView{
//
//     private _url?:string;
//     set url(url:string){
//         if(tools.isEmpty(url))
//             this._url = "";
//         else
//             this._url = url;
//     }
//     get url(){
//         return this._url;
//     }
//
//     private _event?:string;
//     set event(event:string){
//         if(tools.isEmpty(event))
//             this._event = "";
//         else
//             this._event = event;
//     }
//     get event(){
//         return this._event;
//     }
//
//     private _data?:object;
//     set data(data:object){
//         if(tools.isEmpty(data))
//             this._data = {};
//         else
//             this._data = data;
//     }
//     get data(){
//         return this._data;
//     }
//
//     private _msg?:string;
//     set msg(msg:string){
//         if(tools.isEmpty(msg))
//             this._msg = "";
//         else
//             this._msg = msg;
//     }
//     get msg(){
//         return this._msg;
//     }
//
//     private _header?:object;
//     set header(header:object){
//         if(tools.isEmpty(header))
//             this._header = {};
//         else
//             this._header = header;
//     }
//     get header(){
//         return this._header;
//     }
//
//     private _side?:number;
//     set side(side:number){
//         if(tools.isEmpty(side))
//             this._side = 0;
//         else
//             this._side = side;
//     }
//     get side(){
//         return this._side;
//     }
//
//     private _refer?:string;
//     set refer(refer:string){
//         if(tools.isEmpty(refer))
//             this._refer = "";
//         else
//             this._refer = refer;
//     }
//     get refer(){
//         return this._refer;
//     }
//
//     private _title?:string;
//     set title(title:string){
//         if(tools.isEmpty(title))
//             this._title = "";
//         else
//             this._title = title;
//     }
//     get title(){
//         return this._title;
//     }
//
//     private _callback?:Function;
//     set callback(callback:Function){
//         this._callback = callback;
//     }
//     get callback(){
//         return this._callback;
//     }
//
//     toString(){
//         return {
//             'url':this.url,
//             'event':this.event,
//             'data':this.data,
//             'msg':this.msg,
//             'header':this.header,
//             'side':this.side,
//             'refer':this.refer,
//             'title':this.title,
//             'callback':this.callback
//         }
//     }
//
//     constructor(webView:IWebView) {
//         if(tools.isEmpty(webView))
//             webView = <IWebView>{};
//         if(typeof webView === 'string')
//             webView = JSON.parse(<string>webView);
//         this.url = webView.url;
//         this.event = webView.event;
//         this.data = webView.data;
//         this.msg = webView.msg;
//         this.header = webView.header;
//         this.side = webView.side;
//         this.refer = webView.refer;
//         this.title = webView.title;
//         this.callback = webView.callback;
//     }
// }