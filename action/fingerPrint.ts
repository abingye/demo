///<amd-module name="FingerPrint"/>

import {IDB} from "../core/IDB";
import {Modal} from "../components/feedback/modal/Modal";
import {InputBox} from "../components/general/inputBox/InputBox";
import {Button} from "../components/general/button/Button";
import Shell = G.Shell;
import d = G.d;
import tools = G.tools;

interface IDBConf {
    storeName: string;
    version?: number
}

interface IFingerMsg {
    fingerType: number;
    finger: string;
    verify?: string;
}

interface FingerEvent {
    userid: string;
    type: number;
    print: string;
    verify: string;
}

interface IFingerPrintPara {
    DBConf: IDBConf,
    callFingerMsg?: (text: string) => void;
}

export class FingerPrint {
    protected db: IDB = null;
    protected promise: Promise<FingerEvent> = null;

    constructor(para: IFingerPrintPara) {
        if ('AppShell' in window) {
            this.init(para);
        }
    }

    protected init(para: IFingerPrintPara) {
        let IDBName = 'fingerDB',
            IDBVersion = tools.isEmpty(para.DBConf.version) ? 1 : para.DBConf.version,
            IDBConstruct = {[para.DBConf.storeName]: ['userid', 'prints']};
        this.db = new IDB(IDBName, IDBVersion, IDBConstruct);

        Shell.finger.get({
            type: 0,
            option: 1
        }, (ev) => {
            let data: IFingerMsg = ev.data;
            this.matchedFinger(data);
        }, (ev) => {
            typeof para.callFingerMsg === 'function' && para.callFingerMsg(ev.data.text);
        });

    }

    protected matchedFinger(data: IFingerMsg) {
        let type = data.fingerType,
            print = data.finger;
        this.db && this.db.then((store) => {
            store.find((val) => {
                // Modal.alert(val.prints['type' + type])
                if (typeof val.prints['type' + type] === "undefined") {
                    return false;
                }
                let data = Shell.finger.verify(print, val.prints['type' + type][0], type);
                return data.data.matched;
            }, (response) => {
                Modal.alert(response);
                this.promise = new Promise<FingerEvent>((resolve, reject) => {
                    if (tools.isEmpty(response)) {
                        this.getUserid(<IFingerMsg>tools.obj.merge(data, {verify: '1'}), resolve, reject);
                    } else {
                        let fingers: FingerEvent = {
                            userid: response[0].userid,
                            type: type,
                            print: print,
                            verify: '0',
                        };
                        resolve(fingers);
                    }
                });
            })
        });
    }

    then(callback: (e: FingerEvent) => Promise<FingerEvent>) {
        this.promise && this.promise.then((e) => {
            return new Promise((resolve, reject) => {
                typeof callback === 'function' && callback(e).then((data) => {
                    this.setFinger(data, resolve);
                });
            });
        }, () => {

        });
    }

    protected setFinger(data: FingerEvent, callback: Function) {
        if (data.verify === '1') {
            let type = data.type,
                userid = data.userid,
                print = data.print;
            this.db.then((store) => {
                /*
                * 查询数据仓库是否有存在userid,
                * 有就更新，没有就添加
                * */

                store.update((result) => {
                    return (result.userid === userid);
                }, (result) => {
                    result.userid = userid;
                    if(typeof result.prints['type' + type] === 'undefined'){
                        result.prints['type' + type] = [];
                    }
                    result.prints['type' + type].unshift(print);
                    if(result.prints['type' + type].length > 1){
                        result.prints['type' + type].pop();
                    }
                    return result;
                }, () => {
                    typeof callback === 'function' && callback();
                }, () => {
                    let data = {
                        userid: userid,
                        prints: {
                            "type0": [],
                            "type1": [],
                            "type2": [],
                        },
                    };
                    data.prints[ 'type' + type ].push(print);
                    store.insert(data, () => {
                        typeof callback === 'function' && callback();
                    })
                });
            });
        }
    }

    protected getUserid(data: IFingerMsg, callback, error) {
        let type = data.fingerType,
            print = data.finger,
            verify = data.verify,
            inputBox = new InputBox({}),
            okBtn = new Button({content: '确定', type: 'primary', key: 'okBtn'});

        inputBox.addItem(okBtn);
        let submitUserId = (fingerModal): void => {
            let userid = fingerModal.body.querySelector('input').value.toUpperCase();
            if (!tools.str.toEmpty(userid)) {
                fingerModal.destroy();
                Modal.toast('请重新录入指纹');

                typeof error === 'function' && error();
            } else {
                fingerModal.destroy();
                let fingers: FingerEvent = {
                    userid: userid,
                    type: type,
                    print: print,
                    verify: verify,
                };

                typeof callback === 'function' && callback(fingers);
            }
        };
        //创建模态框手动输入userID
        let fingerModal = new Modal({
            header: '登记本地指纹ID',
            isOnceDestroy: true,
            body: d.create(`<div data-action="fingerModal">
                                        <form>
                                            <label>请输入您的员工号</label>
                                            <input type="text" >
                                        </form>
                                    </div>`),
            footer: {
                rightPanel: inputBox
            },
            isBackground: false,
            onOk: () => {
                submitUserId(fingerModal);
            },
            onClose: () => {
                Modal.toast('请重新录入指纹');
            }
        });
        //自动获取焦点
        fingerModal.bodyWrapper.querySelector('input').focus();
        //表单提交触发onOK事件
        d.on(fingerModal.bodyWrapper.querySelector('form'), 'submit', function (ev) {
            ev.preventDefault();
            submitUserId(fingerModal);
        });
    }
}