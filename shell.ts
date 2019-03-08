
namespace G {

    export const Shell = ((window, document) => {

        let _device: obj;

        const base = {

            get device() {
                if (!_device) {
                    _device = ShellBase.handler('deviceGet', {});
                }
                return _device;
            },
            fullScreenSet(fullScreen: boolean, back: IShellEventHandler) {
                return ShellBase.handler('setFullScreen', { fullScreen }, back);
            },
            versionGet() {
                return ShellBase.handler('versionGet', {});
            },
            versionUpdate(url: string, back: IShellEventHandler, info: IShellEventHandler) {
                let versionGet = Shell.base.versionGet();

                return Ajax.fetch(url, {
                    type: 'POST',
                    data: { msg: versionGet && versionGet.data },
                    dataType: 'json'
                }).then(({ response }) => {
                    if (response && response.data && response.data.byteLength > 0) {
                        ShellBase.handler('versionUpdate', {
                            byteLength: response.data.byteLength,
                            file: response.data.file
                        }, back, info);
                    } else {
                        back({
                            success: false,
                            msg: '已经是最新版本了',
                            data: null
                        });
                    }
                    return response;
                });

            },
            speak(type: number, text: string, back: IShellEventHandler, info?: IShellEventHandler) {
                return ShellBase.handler('speak', {
                    type: type, // 0语音识别 1停止语音识别 2语音播放（文字转语音） 3语音识别实时获取
                    text: text, // type=2需要传入文字
                }, back, info)
            },
            getEditImg(type: number, image: string, back: IShellEventHandler) {
                return ShellBase.handler('getSignImg', { type, image }, back);
            },
            wxShare(data: string) {
                return ShellBase.handler('wxShare', { data });
            },
            testAPI(data: string, back: IShellEventHandler, info: IShellEventHandler) {
                return ShellBase.handler('testAPI', { data }, back, info);
            }
        };

        const finger = {
            get(para: obj, back: IShellEventHandler, info: IShellEventHandler, isKeepOn = false) {
                return ShellBase.handler('fingerGet', para, back, info, isKeepOn);
            },
            cancel() {
                ShellBase.eventOff('fingerGet');
                return ShellBase.handler('fingerCancel', {});
            },
            verify(enterFinger: string, matchFinger: string, fingerType: number) {
                return ShellBase.handler('fingerVerify', {
                    enterFinger: enterFinger, // 用户输入的指纹
                    matchFinger: matchFinger, // 本地需要匹配的指纹
                    fingerType: fingerType   // 是那一种指纹器，值为0或1或2
                });
            }
        };

        const file = {
            save(path: string, file: string, isAppend = false, back, info?, isDecode = false) {
                return ShellBase.handler('fileSave', {
                    path: path, // 保存文件到path，例如C:/text.txt
                    file: file, // base64的二进制码
                    isAppend: isAppend, // false覆盖，true添加
                    isDecode: isDecode
                }, back, info)
            },
            syncSave(path: string, file: string, isAppend = false) {
                return ShellBase.handler('fileSave', {
                    path: path,
                    file: file,
                    isAppend: isAppend // false覆盖，true添加
                })
            },
            remove(path: string, back, info?) {
                return ShellBase.handler('fileDelete', {
                    path: path
                }, back, info)
            },
            syncRemove(path: string) {
                return ShellBase.handler('fileDelete', {
                    path: path
                })
            },
            directoryDelete(path) {  // 删除当前文件
                return ShellBase.handler('directoryDelete', {
                    path: path
                })
            },
            unZip(path: string, outdir: string, back?, info?) {
                return ShellBase.handler('fileUnzip', {
                    path: path,
                    outdir: outdir
                }, back, info)
            },
            syncUnZip(path: string, outdir: string) {
                return ShellBase.handler('fileUnzip', {
                    path: path,
                    outdir: outdir
                })
            },
            read(path: string, back, info) {
                return ShellBase.handler('fileRead', {
                    path: path
                }, back, info)
            },
            syncRead(path: string) {
                return ShellBase.handler('fileRead', {
                    path: path
                })
            },
        };

        const casio = {
            upload(port: string, speed: string, back: IShellEventHandler, infor: IShellEventHandler) {
                // let innerBack = function () {
                //     back(ShellBase.handler('casioDataGet', {}));
                // };
                return ShellBase.handler('casioUpload', { port, speed }, back, infor);
            },
            download(port: string, speed: string, data: obj, back: IShellEventHandler, infor: IShellEventHandler) {
                return ShellBase.handler('casioDownload', { port, data, speed }, back, infor);
            }
        };

        const sqlite = (() => {
            function query(str: string, back: IShellEventHandler): boolean;
            function query(str: string): IShellResult;
            function query(str: string, back?) {
                return back ? ShellBase.handler('sqliteQuery', { query: str }, back) :
                    ShellBase.handler('sqliteQuery', { query: str });
            }

            return { query };
        })();

        const rfid = (() => {
            // comPort:"COM1",comBaud:115200
            // ipAddress:"192.168.1.234",ipPort:100
            // config :{led:true;buzzer:false;power:5}
            function start(str: string, num: number, back: IShellEventHandler) {
                // 判断是否是ip
                let data = str.split('.').length === 4 ? { ipAddress: str, ipPort: num } : { comPort: str, comBaud: num };

                return ShellBase.handler('rfidStart', data, back, null, false);
            }

            function reset(str: string, num: number, back: IShellEventHandler) {
                let data = str.split('.').length === 4 ? { ipAddress: str, ipPort: num } : { comPort: str, comBaud: num };

                return ShellBase.handler('rfidReset', data, back, null, false);
            }

            function config(str: string, num: number, config: { led?: boolean, buzzer?: boolean, power?: number, mode?: string }, back: IShellEventHandler) {
                // 判断是否是ip
                let data = str.split('.').length === 4 ? { ipAddress: str, ipPort: num } : { comPort: str, comBaud: num };
                // document.body.innerHTML = JSON.stringify( Object.assign(data, {config}));
                return ShellBase.handler('rfidConfig', Object.assign(data, { config }), back, null, false);
            }


            function stop(back: IShellEventHandler) {
                // ShellBase.eventOff('rfidStart');
                return ShellBase.handler('rfidStop', null, back);
            }

            function downLoad(url: string, token: string, uniqueFlag: string, back: IShellEventHandler) {
                return ShellBase.handler('downloadbarcode', { url, token, uniqueFlag }, back);
            }

            function scanCode(code: string, uniqueFlag: string) {
                return ShellBase.handler('operateTable', { code, uniqueFlag });
            }

            return { start, stop, config, reset, downLoad, scanCode }
        })();

        const startUp = {

            start(autoStart: boolean) {
                return ShellBase.handler('setAutoStart', { autoStart });
            },
            query() {
                return ShellBase.handler('queryAutoStart', {});
            },
            shutDown(back: IShellEventHandler) {
                return ShellBase.handler('powerOff', {}, back);
            }
        };

        const printer = {
            get() {
                return ShellBase.handler('printersGet', {});
            },
            labelPrint(quantity: number, driveCode: number, image: string, back: IShellEventHandler) {
                return ShellBase.handler('labelPrint', { quantity, driveCode, image }, back);
            }
        };

        const inventory = {
            getDeviceAddress() {
                return ShellBase.handler('getDeviceAddress', function (res) {
                    alert(res);
                });
            },
            defaultRfidDevice(type: string, num: number) {
                return ShellBase.handler('defaultRfidDevice', { type: type, num: num })
            },
            loadData(url: string, uploadUrl: string, inventoryKey: string, back: IShellEventHandler) {
                return ShellBase.handler('loadData', { url, uploadUrl, inventoryKey }, back);
            },
            uploadData(url: string, inventoryKey: string, back: IShellEventHandler) {
                return ShellBase.handler('uploadData', { url, inventoryKey }, back);
            },
            insertData(data: { gooId: string, barcode: string, epc: string, check: boolean }[], inventoryKey: string, back: IShellEventHandler) {
                return ShellBase.handler('insertData', { data, inventoryKey }, back);
            },
            delData(data: { goodId: string, barcode: string, epc: string, check: boolean }[], inventoryKey: string, back: IShellEventHandler) {
                return ShellBase.handler('delData', { data, inventoryKey }, back);
            },
            clearData(dbName: string, back: IShellEventHandler) {
                return ShellBase.handler('clearData', { dbName }, back);
            },
            rfidOpen(back: IShellEventHandler) {
                return ShellBase.handler('rfid', { type: 'open' }, back, null, false);
            },
            rfidClose(back: IShellEventHandler) {
                ShellBase.eventOff('rfid');
                return ShellBase.handler('rfid', { type: 'close' }, back);
            },
            /**
             *
             * @param {obj} value - 获取频段
             * @param {G.IShellEventHandler} back
             * @returns {boolean}
             */
            getBand(value: obj, back: IShellEventHandler) {
                return ShellBase.handler('rfid', { type: 'getBand', value }, back);
            },
            /**
             *
             * @param {obj} value - 获取功率
             * @param {G.IShellEventHandler} back
             * @returns {boolean}
             */
            getMinMaxBand(value: obj, back: IShellEventHandler) {
                return ShellBase.handler('rfid', { type: 'getMinMaxBand', value }, back);
            },
            /**
             *
             * @param {obj} value - 开始盘点
             * @param {G.IShellEventHandler} back
             * @returns {boolean}
             */
            startCheck(value: obj, back: IShellEventHandler) {
                return ShellBase.handler('rfid', { type: 'startCheck', value }, back, null, false);
            },
            stopCheck(value: obj, back: IShellEventHandler) {
                ShellBase.eventOff('rfid');
                return ShellBase.handler('rfid', { type: 'endCheck', value }, back);
            },
            /**
             *
             * @param {obj} value - 设置参数
             * @param {G.IShellEventHandler} back
             * @returns {boolean}
             */
            rfidSetParam(value: obj, back: IShellEventHandler) {
                return ShellBase.handler('rfid', { type: 'setParam', value }, back);
            },
            /**
             *
             * @param {obj} value - 获取设置参数
             * @param {G.IShellEventHandler} back
             * @returns {boolean}
             */
            rfidGetParam(value: obj, back: IShellEventHandler) {
                return ShellBase.handler('rfid', { type: 'getParam', value }, back);
            },
            /**
             *
             * @param {obj} value - 开始找货
             * @param {G.IShellEventHandler} back
             * @returns {boolean}
             */
            findGoods(value: obj, back: IShellEventHandler) {
                return ShellBase.handler('rfid', { type: 'findGoods', value }, back, null, false);
            },
            /**
             *
             * @param {obj} value - 停止找货
             * @param {G.IShellEventHandler} back
             * @returns {boolean}
             */
            stopFind(value: obj, back: IShellEventHandler) {
                ShellBase.eventOff('rfid');
                return ShellBase.handler('rfid', { type: 'stopFind', value }, back);
            },
            /**
             *
             * @param {obj} value - 开始扫描epc
             * @param {G.IShellEventHandler} back
             * @returns {boolean}
             */
            startEpc(value: obj, back: IShellEventHandler) {
                return ShellBase.handler('rfid', { type: 'startEpc', value }, back, null, false);
            },
            stopEpc(value: obj, back: IShellEventHandler) {
                ShellBase.eventOff('rfid');
                return ShellBase.handler('rfid', { type: 'stopEpc', value }, back);
            },
            /**
             *
             * @param {obj} value - clearEpc 清除epc
             * @param {G.IShellEventHandler} back
             * @returns {boolean}
             */
            clearEpc(value: obj, back: IShellEventHandler) {
                return ShellBase.handler('rfid', { type: 'clearEpc', value }, back);
            },
            returnEpcbyTime(epcs: string[] | null, time: number, turn, back) {
                return ShellBase.handler('rfid', { type: 'returnEpcbyTime', epcs, time, turn }, back);
            },
            /**
             *
             * @param {obj} value - 盘点模式设置值
             * @param {G.IShellEventHandler} back
             * @returns {boolean}
             */
            setPwm(value: obj, back: IShellEventHandler) {
                return ShellBase.handler('rfid', { type: 'setPwm', value }, back);
            },
            /**
             *
             * 获取当前盘点模式的值
             * @param {G.IShellEventHandler} back
             * @returns {boolean}
             */
            getPwn(back: IShellEventHandler) {
                return ShellBase.handler('rfid', { type: 'getPwm' }, back);
            },
            /**
             *
             * @param {obj} value - 打开扫码功能
             * @param {G.IShellEventHandler} back
             * @returns {boolean}
             */
            openScan(back: IShellEventHandler) {
                return ShellBase.handler('supon', { type: 'openScanFunction' }, back, null, false);
            },
            openContinueScan(back: IShellEventHandler) {
                return ShellBase.handler('supon', { type: 'openContinueScan' }, back, null, false);
            },
            closeContinueScan(back: IShellEventHandler) {
                return ShellBase.handler('supon', { type: 'closeContinueScan' }, back, null, false);
            },
            /**
             *
             * @param {obj} value - 关闭扫码功能
             * * @param {G.IShellEventHandler} back
             * @returns {boolean}
             */
            closeScan(back: IShellEventHandler) {
                ShellBase.eventOff('supon');
                return ShellBase.handler('supon', { type: 'closeScanFunction' }, back, null, false);
            },
            /**
             *
             * @param {obj} value -加载盘点数据（已下载的本地的盘点数据，包括已盘点与未盘点）
             * @param {G.IShellEventHandler} back
             * @returns {boolean}
             */
            getData(inventoryKey: string, field: string, back: IShellEventHandler) {
                return ShellBase.handler('getData', { inventoryKey, field }, back, null, false);
            },
            /**
             *
             * @param {obj} value - 获取盘点已扫描量
             * * @param {G.IShellEventHandler} back
             * @returns {boolean}
             */
            getScanCount(summary: string, back: IShellEventHandler) {
                return ShellBase.handler('getScanCount', { summary }, back, null, false);
            },
            /**
             *
             * @param {obj}  - 获取表列头统计的数值
             * * @param {G.IShellEventHandler} back
             * @returns {boolean}
             */
            columnCountOn(when: obj, time: number, inventoryKey: string, once: boolean, out: boolean, back: IShellEventHandler) {
                return ShellBase.handler('getColumnCount', { when: when, time: time, turn: true, inventory: inventoryKey, once: once, out: out }, back, null, false);
            },
            columnCountOff(when: obj, time: number, inventoryKey: string, back: IShellEventHandler) {
                ShellBase.eventOff('getColumnCount');
                return ShellBase.handler('getColumnCount', { when: when, time: time, turn: false, inventory: inventoryKey, once: true, out: true }, back);
            },
            //条码扫码下载的
            downloadbarcode(uniqueFlag: string, downUrl: string, uploadUrl: string, defaultUpload: boolean, back: IShellEventHandler) {
                return ShellBase.handler('downloadbarcode', { uniqueFlag: uniqueFlag, downUrl: downUrl, uploadUrl: uploadUrl, defaultUpload: defaultUpload }, back, null, false);
            },
            getScanData(uniqueFlag: string) {
                return ShellBase.handler('getScanData', { uniqueFlag: uniqueFlag })
            },
            //条码扫码总量统计
            getCountData(uniqueFlag: string, where: obj, back: IShellEventHandler) {
                return ShellBase.handler('getCountData', { uniqueFlag: uniqueFlag, where: where }, back);
            },
            dealbarcode(type: number, params: object, back: IShellEventHandler) {
                return ShellBase.handler('dealbarcode', { type: type, params: params }, back, null, false);
            },
            //注入监听事件
            openRegistInventory(type: number, params: obj, back: IShellEventHandler) {
                return ShellBase.handler('registInventory', { type: type, params: params }, back, null, false);
            },
            closeRegistInventory(type: number, params: obj, back: IShellEventHandler) {
                ShellBase.eventOff('registInventory');
                return ShellBase.handler('registInventory', { type: type, params: params }, back);
            },
            //删除条码数据
            delInventoryData(nameId: string, where: object, back: IShellEventHandler) {
                return ShellBase.handler('delInventoryData', { nameId: nameId, where: where }, back);
            },
            //上传条码数据
            uploadcodedata(nameId: string, uploadUrl: string, images: any, typeName: string, typeValue: string, back: IShellEventHandler) {
                return ShellBase.handler('uploadcodedata', { nameId: nameId, uploadUrl: uploadUrl, images: images, typeName: typeName, typeValue: typeValue }, back, null, false);
            },
            //移动端打开摄像头扫码
            openScanCode(type: number, back: IShellEventHandler, info?: IShellEventHandler) {
                return ShellBase.handler('scanCode', { type: type }, back, info)
            },
            //获取盘点数据
            getTableInfo(uniqueFlag: string) {
                return ShellBase.handler('getTableInfo', { uniqueFlag: uniqueFlag })
            },
            //输入条码扫码查询
            inputcodedata(optionStype: number, uniqueFlag: string, value: string, category: string[], back: IShellEventHandler) {
                return ShellBase.handler('inputcodedata', { uniqueFlag: uniqueFlag, value: value, category: category, optionStype: optionStype }, back)
            },
            codedataOperate(value: string, uniqueFlag: string, where: any, option: number, num: number, back: IShellEventHandler) {
                return ShellBase.handler('operateTable', { value: value, uniqueFlag: uniqueFlag, where: where, option: option, num: num }, back)
            },
            scan2dOn(back: IShellEventHandler) {
                return ShellBase.handler('startScan2DResult', '', back, null, false);
            },
            scan2dOff() {
                ShellBase.eventOff('startScan2DResult');
                return ShellBase.handler('closeScan2D', '')
            },
            get canRfid() {
                if (!tools.os.android) {
                    return false
                }
                let isSupport = ShellBase.handler('isSupport', 'rfid');
                if (typeof isSupport === 'object') {
                    return isSupport.data;
                } else {
                    return isSupport
                }
            },
            get can2dScan() {
                if (!tools.os.android) {
                    return false
                }
                let isSupport = ShellBase.handler('isSupport', '2dScan');
                if (typeof isSupport === 'object') {
                    return isSupport.data;
                } else {
                    return isSupport
                }
            }
        };

        /**
         * 离线操作
         */
        const imports = {
            //条码扫码下载
            downloadbarcode(uniqueFlag:string, downUrl:string, defaultUpload:boolean, back:IShellEventHandler){
                return ShellBase.handler('downloadbarcode',{uniqueFlag,downUrl,defaultUpload},back,null,false);
            },
            //上传条码数据
            uploadcodedata(uniqueFlag:string,uploadUrl:string, back:IShellEventHandler){
                return ShellBase.handler('uploadcodedata',{uniqueFlag, uploadUrl},back,null,false);
            },
            //条码扫码总量统计
            getCountData(uniqueFlag: string, itemid: string, fieldname: string, expression: string, where: obj, back: IShellEventHandler) {
                return ShellBase.handler('getCountData', { uniqueFlag, itemid, fieldname, expression, where }, back);
            },
            calculateData(uniqueFlag: string, itemid: string, fieldname: string, expression: string, back: IShellEventHandler) {
                return ShellBase.handler('calculateData', { uniqueFlag, itemid, fieldname, expression }, back);
            },
            /**
             *
             * @param uniqueFlag 唯一值
             * @param itemid 对应表
             * @param params 要操作的字段
             * @param where 条件如：{keyField ：value} 主键及值
             * @param type “delete”，“updata”，“query”分别 表示删改查
             * @param back
             */
            operateTable(uniqueFlag:string, itemid:string, params:obj, where:obj, type: string,back:IShellEventHandler){
                return ShellBase.handler('operateTable',{uniqueFlag, itemid, params, where,type},back)
            },
            operateScanTable(sancode:string, option: string, uniqueFlag:string, keyfield:obj, numName: string, num: string, back:IShellEventHandler){
                return ShellBase.handler('operateScanTable',{sancode, keyfield, uniqueFlag, option, numName, num},back)
            },

        };

        const image = {
            // 拍照
            photograph(callback: (file: CustomFile[]) => void, error?: (msg: string) => void) {
                this.getImg(0, callback, error);
            },
            // 图库
            photoAlbum(callback: (file: CustomFile[]) => void, error?: (msg: string) => void) {
                this.getImg(1, callback, error);
            },
            getImg(type: number, callback: (file: CustomFile[]) => void, error?: (msg: string) => void) {
                ShellBase.handler('getImg', {
                    type: type
                }, (result: IShellResult) => {
                    //alert(JSON.stringify(result.data));
                    if (result.success) {
                        let data = result.data;
                        let file = tools.base64ToFile(data.dataurl, data.filename);
                        callback && callback([file]);
                    } else {
                        error && error(result.msg);
                    }
                });
            },
            // 编辑指定图片
            editImg(img: string, back: IShellEventHandler) {
                ShellBase.handler('editImg', {
                    type: 0,
                    img
                }, back)
            },
            // 截取当前屏幕并编辑
            editPrintScreen(back: IShellEventHandler) {
                ShellBase.handler('editImg', {
                    type: 1,
                }, back)
            },
            // 保存图片至本地
            saveImg(img: string) {
                return ShellBase.handler('saveImg', { img })
            }
        };

        const openSystem = (path: string, param: string, back: IShellEventHandler) => {
            return ShellBase.handler('openExe', {
                path: path,
                params: param
            }, back)
        };
        //pc清理缓存
        const clearCache = (back: IShellEventHandler) => {
            return ShellBase.handler('clear', {}, back)
        };
        //表格上方的发送位置-停止发送
        const location = {
            startRecord(back?: IShellEventHandler) {
                return ShellBase.handler('startRecord', { "timestep": "5000" },back);
            },
            stopRecord(back?: IShellEventHandler) {
                return ShellBase.handler('stopRecord', {},back);
            },
        };
        return {
            base, finger, file, casio, sqlite, printer, rfid, inventory, startUp, image, location, imports, openSystem,clearCache
        }
    })(window, document);

    declare const AppShell: {
        syncFunction(name: string, data: string): string;
        asyncFunction(name: string, data: string, back: string, infor?: string): boolean;
        postMessage(para: { action: string, data?: string, back?: string, info?: string });   // ios仅支持传一个json对象
        postMessage(action: string, data: string);  // android or pc
    };

    declare const webkit: any;

    enum ShellTypes {
        IOS,
        ANDROID,
        WINDOWS
    }
    interface IShellEventHandler {
        (result: IShellResult): void;
    }
    interface IShellHandler {
        (action: string, data: obj | string): IShellResult;
        (action: string, data: obj | string, back: IShellEventHandler, infor?: IShellEventHandler, isAutoOff?: boolean): boolean;

    }

    interface IShellResult {
        success: boolean,
        msg: string,
        data: any
    }
    const ShellBase = (() => {
        const userAgent = navigator.userAgent || navigator.vendor,
            shellType: ShellTypes = typeDetect(),
            shellHandler: IShellHandler = windowsHandler,
            action2eventName: objOf<string[]> = {};


        function eventNameGet(action: string) {
            return action + '__SHELL_EVENT__' + tools.getGuid();
        }

        function eventOff(action: string) {
            let events = action2eventName[action] || [];
            events.forEach(event => d.off(window, event));
            delete events[action];
        }
        function windowsHandler<IShellHandler>(action:string, data, back?, infor?, isAutoOff = true) {
            if(typeof AppShell === 'object' || (tools.os.ios && 'webkit' in window && typeof webkit.messageHandlers.AppShell === 'object')) {
                let dataStr = typeof data === 'string' ? data : JSON.stringify(data);

                if (tools.isEmpty(back) && tools.isEmpty(infor)) {
                    return JSON.parse(AppShell.syncFunction(action, dataStr));
                    // return JSON.parse(AppShell.postMessage({action, data : dataStr}));
                } else {
                    // 生成唯一事件名称
                    let eventBack = back ? eventNameGet(action) : '',
                        eventInfor = infor ? eventNameGet(action) : '';
                    if (!isAutoOff) {
                        action2eventName[action] = action2eventName[action] || [];
                        let events = action2eventName[action];
                        events.push(eventBack, eventInfor);
                    }

                    if (eventInfor) {
                        d.on(window, eventInfor, function (e: CustomEvent) {
                            // alert(typeof e.detail === 'string' ? e.detail : e);
                            let detail = e.detail;
                            try {
                                infor(typeof detail === 'string' ? JSON.parse(detail) : detail);
                            } catch (e) {
                                console.log(detail);
                                console.log(e);
                                alert('JSON解析错误')
                            }
                        })
                    }
                    // 异步完成通知
                    if (eventBack) {
                        d.on(window, eventBack, function (e: CustomEvent) {
                            let detail = e.detail;
                            if (isAutoOff) {

                                d.off(window, eventInfor);
                                d.off(window, eventBack);
                            }
                            try {
                                detail = typeof detail === 'string' ? JSON.parse(detail) : detail;
                            } catch (e) {
                                console.log(e, 'JSON解析错误');
                                console.log(detail);
                                alert('JSON解析错误');
                                return;
                            }
                            // alert(JSON.stringify(e.detail));
                            back(detail);
                        })
                    }

                    // 异步调用
                    let flag, shellData = Object.assign({ data: dataStr } || {}, { back: eventBack, info: eventInfor });
                    if (tools.os.ios) {
                        // ios只有异步调用
                        flag = webkit.messageHandlers.AppShell.postMessage(Object.assign(shellData, { action }));
                    } else {
                        flag = AppShell.asyncFunction(action, dataStr, eventBack, eventInfor);
                        // flag = AppShell.postMessage(action, JSON.stringify(shellData));
                    }
                    // 过程通知
                    if (!flag && !tools.os.ios) {
                        // alert('Shell失败');
                        d.off(window, eventInfor);
                        d.off(window, eventBack);
                    }
                    return flag;
                }
            } else {
                return false;
            }
        }

        // function androidHandler() {
        //
        // }
        // function iosHandler() {
        //
        // }

        function typeDetect() {
            if (/OursAndroid/i.test(userAgent)) {
                return ShellTypes.ANDROID;
            }
            if (/OursIos/i.test(userAgent)) {
                return ShellTypes.IOS;
            }
            if (/OursWindows/.test(userAgent)) {
                return ShellTypes.WINDOWS;
            }
            return -1;
        }

        return {
            eventOff,
            get handler() {
                return shellHandler;
            }
        }
    })();
}