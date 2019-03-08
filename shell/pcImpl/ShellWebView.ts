/// <amd-module name="ShellWebViewPc"/>
// import {Param} from "../../entity/Param";
// import {IShellWebView} from "global/shell/inf/IShellWebView";
// import {Result} from "global/entity/Result";
// import {BaseShellImpl} from "../BaseShellImpl";
// import tools = G.tools;
// import CONF = BW.CONF;
// import d = G.d;
//
// interface SYSInitPara {
//     pageContainer: HTMLDivElement;
//     navBar: HTMLDivElement;
// }
// interface UrlData{
//     title : string,
//     url?: string;
//     refer? : string,
//     isLock?: boolean;
// }
/**
 * Created by wengyifan on 2017/12/9.
 * Pc窗口管理操作接口
//  */
// export class ShellWebViewPc extends BaseShellImpl implements IShellWebView{
//     private pages: G.sysPcPage = null;
//     private tabs: G.sysPcTab = null;
//     private tabContainer: HTMLUListElement = null;
//     private pageContainer: HTMLDivElement;
//     private navBar: HTMLDivElement;
//     private inMain: boolean = false;
//
//     private tabMenu:TabMenuI[] = [{
//         title: '刷新',
//         callback: (url:string) => {
//             this.refresh(new Param({msg:url}));
//         }
//     },{
//         title: '锁定/解锁',
//         callback: (url) => {
//             let tab = this.tabs.getTab(url);
//             if(tab) {
//                 this.lockToggle( new Param({msg:url,is:!tab.classList.contains('locked')}) );
//             }
//         }
//     }];
//
//     constructor(para: SYSInitPara) {
//         super();
//         if (para && para.pageContainer && para.navBar) {
//             this.inMain = true;
//             this.pageContainer = para.pageContainer;
//             this.navBar = para.navBar;
//             this.tabContainer = <HTMLUListElement>para.navBar.querySelector('ul.page-tabs-content');
//             this.pages = new G.sysPcPage(para.pageContainer);
//             this.tabs = new G.sysPcTab(this.tabContainer, this.tabMenu);
//
//             if(sysPcHistory.isUseLockInit()){
//                 sysPcHistory.setInitType('0');
//
//                 setTimeout(() => {
//                     sysPcHistory.lockGet(tabArr => {
//                         // debugger;
//                         sysPcHistory.removeAll();
//                         tabArr = tabArr.map(tab => {
//                             tab.isLock = true;
//                             sysPcHistory.add(tab);
//                             return tab;
//                         });
//
//                         // debugger;
//                         this.tabs.initHistory(tabArr);
//
//                         if(!tools.isEmpty(tabArr)){
//                             this.open(new Param({data:{url: tabArr.pop().url}}));
//                         }
//                     });
//                 }, 300);
//
//
//
//             }else{
//                 let lastUrl = sysPcHistory.last();
//                 if (lastUrl) {
//                     this.tabs.initHistory((() => {
//                         let tabs: UrlData[] = [],
//                             menus = sysPcHistory.getMenuOrder();
//
//                         for(let url in menus){
//                             let menu = menus[url];
//                             tabs.push({
//                                 url: url,
//                                 title: menu.title,
//                                 isLock: menu.isLock,
//                                 refer: menu.refer
//                             })
//                         }
//
//                         return tabs;
//                     })());
//                     this.open(new Param({data:{url: lastUrl}}));
//                 }
//             }
//
//
//         } else {
//             this.inMain = false;
//         }
//     }
//
//     open(param: Param): Result {
//         let o:winOpen = param.data;
//         if (this.inMain) {
//             let isNew = this.pages.open(o);
//             this.tabs.open(o.url);
//             sysPcHistory.add({url: o.url, refer:param.msg, title:''});
//             if (!isNew) {
//                 this.fire(new Param({msg:'wake', data:{data:this.pages.get(o.url).dom, url:o.url}}));
//             }
//         } else {
//             location.assign(o.url);
//         }
//         localStorage.setItem('viewData', JSON.stringify(o.extras));
//         return null;
//     }
//
//     close(param?: Param): Result {
//         let lastUrl = sysPcHistory.last(),url;
//         if( !!param ){
//             if( typeof param.data === 'object' ){
//                 url = param.data.url;
//             }
//         }
//         typeof url === 'undefined' && (url = lastUrl);
//         if (sysPcHistory.indexOf(url) > -1) {
//             let isLast = lastUrl === url;
//             //事件发送
//             this.fire(new Param({data:{data:param.data.data,event:param.data.event, url:sysPcHistory.getRefer(url)[0]}}));
//             // 历史清除
//             sysPcHistory.remove(url);
//             this.pages.close(url);
//             this.tabs.close(url);
//             // 如果关闭当前打开的页面，则关闭后打开历史倒数第二位置的页面
//             if (sysPcHistory.len() > 0 && isLast) {
//                 this.open(new Param({data:{url: sysPcHistory.last()}}));
//             }
//         }
//         return null;
//     }
//
//     load(param: Param): Result {
//         location.assign(param.data.url);
//         return null;
//     }
//
//     back(param?: Param): Result {
//         window.history.back();
//         return null;
//     }
//
//     wake?(param: Param): Result {
//         throw new Error("Method not implemented.");
//     }
//
//     refresh?(param: Param): Result {
//         this.pages.refresh(param.data.url, () => {
//             // this.setBreadcrumb(url);
//             typeof param.callback === 'function' && param.callback();
//         });
//         return null;
//     }
//
//     lockToggle? (param: Param): Result {
//         sysPcHistory.lockToggle(param.msg, param.is);
//         this.tabs.lockToggle(param.msg, param.is);
//         return null;
//     }
//
//     logout(param: Param): Result {
//         let url = param.data.url;
//         if(G.tools.isEmpty(url)){
//             window.location.assign(CONF.url.login);
//         }else{
//             window.location.assign(url);
//         }
//         return null;
//     }
//
//     openImg(param: Param): Result {
//         throw new Error("Method not implemented.");
//     }
//
//     closeAll?(param:Param):Result {
//         sysPcHistory.get().forEach(url => {
//             this.pages.close(url);
//             this.tabs.close(url);
//         });
//         sysPcHistory.removeAll();
//         return null;
//     }
//
//     closeOther?(param:Param):Result {
//         let lastUrl = sysPcHistory.last();
//         sysPcHistory.get().slice(0).forEach(url => {
//             if (url !== lastUrl) {
//                 this.pages.close(url);
//                 this.tabs.close(url);
//                 sysPcHistory.remove(url);
//             }
//         });
//         return null;
//     }
//
//     download(param: Param): Result {
//         window.location.href = param.data.url;
//         return null;
//     }
//
//     clear?(param?: Param): Result {
//         throw new Error("Method not implemented.");
//     }
//
//     opentab?(param?: Param): Result {
//         location.assign(BW.CONF.url.main);
//         return null;
//     }
//
//     setTitle?(param:Param): Result {
//         this.tabs.setTabTitle( param.data.url, param.data.title );
//         sysPcHistory.setMenuName(param.data.url, param.data.title);
//         // 打开后设置面包屑
//         this.setBreadcrumb( new Param( {data:{url:param.data.url}} ) );
//         return null;
//     }
//
//     setBreadcrumb?( param: Param ): Result {
//         let url=param.data.url;
//         let refers = sysPcHistory.getRefer(url, -1),
//             liHtml = '<li><span class="iconfont icon-house"></span></li>',
//             menu = sysPcHistory.getMenuOrder(),
//             page = this.pages.get(url);
//
//         refers.unshift(url);
//         for (let len = refers.length - 1; len >= 0; len--) {
//             let m = menu[refers[len]];
//             if (m && m.title) {
//                 if (len > 0) {
//                     liHtml += '<li><a data-href="' + refers[len] + '">' + m.title + '</a></li>';
//                 } else {
//                     liHtml += '<li class="active">' + m.title + '</li>';
//                 }
//             }
//         }
//         let self = this,
//             liHtmlDom = d.create('<ol class="breadcrumb">' + liHtml + '</ol>');
//
//         d.on(liHtmlDom, 'click', 'a[data-href]', function() {
//             self.open(new Param({data:{url: this.dataset.href}}));
//         });
//         page.dom.insertBefore(liHtmlDom, page.dom.firstElementChild);
//         return null;
//     }
//
//     fire?(param: Param): Result {
//         let page = this.pages.get(param.data.url);
//         if (page) {
//             tools.event.fire(param.data.event, param.data.data, page.dom);
//         }
//         return null;
//     }
//
// }




