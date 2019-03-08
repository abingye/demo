///<amd-module name="IDB"/>


interface IDBDataFilter{
    (data:obj) : boolean
}
import tools = G.tools;
export class IDB {
    protected db: IDBDatabase = null;
    protected promise: Promise<Event>;
    protected dbName: string;

    constructor(name: string, version: number, protected tableConf: objOf<string[]>) {
        /*
        * 打开数据库
        * */
        this.dbName = name;
        let request: IDBOpenDBRequest = indexedDB.open(name, version);
        /*
        * 打开成功调用onupgradeneeded
        * */
        this.promise = new Promise<Event>((resolve, reject) => {
            request.onsuccess = (e: Event) => {
                this.db = (<IDBOpenDBRequest>e.target).result;
                this._success(e);
                resolve(e);
            };

            request.onerror = (e) => {
                reject(e);
                return null;//('打开indexDB失败');
            };
        });

        /*
        * 版本升级调用onupgradeneeded
        */
        request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
            this.db = (<IDBOpenDBRequest>e.target).result;
            this.constructChange(tableConf);
        };
        /*
        * 上一个数据库未关闭，重新打开新版本数据库
        * */
        request.onblocked = () => {
            return null;
        }
    }

    then(success: (e) => void){
        this.promise.then((e) => {
            for(let name in this.tableConf){
                let store = this.collection(name);
                typeof success === 'function' && success(store);
            }
        });
    }

    catch(error){
        this.promise.catch(error);
    }

    private collectors: objOf<IDBCollection> = {};

    /*
     * 数据库结构定义
     *
     * 根据construct配置创建数据仓库ObjectStore
     * construct => {[ 'keyPath', 'index', 'index'...]}
     * */
    private constructChange(tableConf: objOf<string[]>) {
        for (let attr in tableConf) {
            if (!this.db.objectStoreNames.contains(attr)) {
                let store: IDBObjectStore = this.db.createObjectStore(attr, {
                    keyPath: tableConf[attr][0]
                });
                for (let i = 1, len = tableConf[attr].length; i < len; i++) {
                    store.createIndex(tableConf[attr][i], tableConf[attr][i], {unique: false});
                }
            }
        }
    }

    /*
    * 获取操作objectStore的对象
    * */
    collection(storeName: string): IDBCollection {
        if (tools.isEmpty(this.collectors[storeName])) {
            if (this.db.objectStoreNames.contains(storeName)) {
                this.collectors[storeName] = new IDBCollection(this.db, storeName);
            }
        }

        if (!tools.isEmpty(this.collectors[storeName])) {
            return this.collectors[storeName];
        } else {
            return null
        }
        // if(this.db.objectStoreNames.contains(storeName)) {
        //     this.collectors[storeName] = new IDBCollection(this.db, storeName);
        //     return this.collectors[storeName];
        // }else{
        //    return null;//('没有创建'+ storeName + '数据仓库');
        // }
    }

    /**
     *
     * @param {string} eventName
     * @param {Function} callback
     */
    // on(eventName: string, callback:Function){
    //
    // }

    /*
    * 定义打开indexedDB 成功后的事件
    * */
    private _success: EventListener = () => {
    };
    set success(cb: EventListener) {
        this._success = cb;
    }

    deleteDatabase(){
        this.db.close();
        window.indexedDB.deleteDatabase(this.dbName);
    }

    /*
    * 关闭数据库
    * */
    destroy() {
        this.db.close();
    }
}

class IDBCollection {
    protected store: any;

    constructor(protected db: IDBDatabase, protected storeName: string) {
        this.store = db.transaction(storeName, 'readwrite').objectStore(storeName);
    }

    /*
    * 添加数据，主键相同不覆盖
    * data => 插入的数据
    * callback => 回调函数
    * */
    insert(data: obj, callback?: Function) {
        let request = this.store.add(data);
        request.onsuccess = (e: Event) => {
            typeof callback === 'function' && callback(e);
        };
        request.onerror = (ev) => {
            console.log(ev);
        }
    }

    /*
    * 删除数据(删除一个)
    * filter => 根据filter规则删除指定数据，filter接收一个参数，即遍历的数据
    * callback => 回调函数
    * */
    delete(filter: IDBDataFilter, callback?: () => void) {
        // this.direction = this.toggleDirection();
        // let request: IDBRequest = this.store.openCursor(null, this.direction), self = this;
        // request.onsuccess = (e:Event) => {
        //     let cursor: IDBCursorWithValue = (<IDBRequest>e.target).result;
        //     if( !tools.isEmpty(cursor) ){
        //         let value = cursor.value;
        //         if( filter(value) ){
        //             let updateRequest: IDBRequest = cursor.delete();
        //             updateRequest.onsuccess = () => {
        //                 typeof callback === 'function' && callback();
        //             }
        //         }else{
        //             cursor.continue();
        //         }
        //     }
        // }

        let request: IDBRequest = (<any>this.store).getAll(), self = this;
        request.onsuccess = (e) => {
            let data = request.result;
            let result: any;
            for (let i = 0, len = data.length; i < len; i++) {
                if (filter(data[i])) {
                    result = data[i];
                    break;
                }
            }
            let update = self.store.delete(result);
            update.onsuccess = () => {
                typeof callback === 'function' && callback();
            }
        }
    }

    /*
    * 更新数据(更新一个)
    * filter => 根据filter规则更新指定数据，filter接收一个参数，即遍历的数据
    * newDataGet => 指定要更新的数据，newDataGet接收一个参数，即遍历的数据
    * callback => 回调函数
    * */
    update(filter: IDBDataFilter, newDataGet: (oldData: obj) => obj, success?: (e) => void, error?: Function) {
        // this.direction = this.toggleDirection();
        // let request: IDBRequest = this.store.openCursor(null, this.direction), self = this;
        // request.onsuccess = (e:Event) => {
        //     let cursor: IDBCursorWithValue = (<IDBRequest>e.target).result;
        //     if( cursor ){
        //         let value = cursor.value;
        //         if( filter(value) ){
        //             let updateRequest: IDBRequest = cursor.update( newDataGet(value) );
        //             updateRequest.onsuccess = (e) => {
        //                 typeof callback === 'function' && callback( newDataGet(value) );
        //             };
        //             updateRequest.onerror = (e) => {
        //                 alert('error')
        //             };
        //             return null;
        //         }else{
        //             cursor.continue();
        //         }
        //     }
        // }
        let request: IDBRequest = (<any>this.store).getAll(), self = this;
        request.onsuccess = (e) => {
            let data = (<IDBRequest>e.target).result;
            let result: any;
            for (let i = 0, len = data.length; i < len; i++) {
                if (filter(data[i])) {
                    result = newDataGet(data[i]);
                    break;
                }
            }
            if (typeof result !== 'undefined') {
                // let update = request.transaction(self.storeName, 'readwrite').objectStore(self.storeName).put(result);
                let update = self.store.put(result);
                update.onsuccess = (e) => {
                    typeof success === 'function' && success(result);
                }
            } else {
                typeof error === 'function' && error(result);
            }

        };
        request.onerror = () => {
        }
    }

    /*
    * 查询数据
    * filter => 根据filter规则查询指定数据，filter接收一个参数，即遍历的数据
    * callback => 回调函数，callback接收一个参数data，即获取到的数据，没有为 []
    * */
    find(filter: IDBDataFilter, callback: (data) => void) {
        let request: IDBRequest = (<any>this.store).getAll(), self = this;
        request.onsuccess = (e) => {
            let data = request.result;
            let result: any[] = [];
            for (let i = 0, len = data.length; i < len; i++) {
                if (filter(data[i])) {
                    result.push(data[i]);
                }
            }
            typeof callback === 'function' && callback(result);
        }
    }

    /*
    * 获取所有数据
    * callback => 回调函数，callback接收一个参数data，即获取到的数据，没有为 []
    * */
    findAll(callback: (data) => void) {
        this.find(() => true, callback);
    }

    on(eventName: string, callback: Function) {

    }
}