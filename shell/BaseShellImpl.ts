/// <amd-module name="BaseShellImpl"/>
import tools = G.tools;


/**
 * Created by zhengchao on 2017/12/6.
 * 硬件接口基类
 */
declare const AppShell;
declare const webkit : any;
declare const BlueWhaleShell : any;

export class BaseShellImpl{
    public adHandle(action:string, dict?:string) {
        if(typeof window['AppShell'] === 'undefined'){
            return;
        }
        if(tools.isEmpty(dict)){
            return JSON.parse(AppShell.postMessage(action));
        }else{
            return JSON.parse(AppShell.postMessage(action,dict));
        }
    }

    public ipHandle(action:string, dict?:obj) {
        if(tools.isEmpty(dict))
            dict = {};
        dict.action = action;
        webkit.messageHandlers.AppShell.postMessage(dict);
    }

    public pcHandle(action:string, dict?:string | obj) {
        if(!('BlueWhaleShell' in window)) {
            return null;
        }
        if(typeof dict === 'undefined'){
            return BlueWhaleShell.postMessage(action);
        }else{
            if(typeof dict !== 'string'){
                dict = JSON.stringify(dict);
            }
            return BlueWhaleShell.postMessage(action,dict);
        }

    }

    constructor(){

    }
}





