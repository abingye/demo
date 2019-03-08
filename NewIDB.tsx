///<amd-module name="NewIDB"/>

export interface IIDBPara {
    name: string,
    version?: number,
    tableConf: objOf<string[]>;
}

interface IDBDataFilter {
    (data: any): boolean
}

export class NewIDB {
    protected promise: Promise<IDBDatabase>;

    constructor(para: IIDBPara) {
        this.promise = new Promise<IDBDatabase>((resolve, reject) => {
            let request: IDBOpenDBRequest = indexedDB.open(para.name, para.version || 1);
            request.onsuccess = (e: Event) => {
                console.log(e);
                let db = (e.target as IDBOpenDBRequest).result;
                resolve(db);
            };

            request.onerror = (e) => {
                reject(e);//('打开indexDB失败');
            };

            /*
            * 版本升级调用onupgradeneeded
            */
            request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
                console.log(e);
                let db: IDBDatabase = (e.target as IDBOpenDBRequest).result;
                NewIDB.initStore(db, para.tableConf || {});
            };
        })
    }

    getCollection(name: string): Promise<IDBCollection> {
        return new Promise((resolve, reject) => {
            this.promise.then((db) => {
                resolve(this._getCollection(db, name))
            }).catch((e) => {
                console.log(e);
                reject(e);
            });
        });
    }

    /*
    * 获取操作objectStore的对象
    * */
    private collectors: objOf<IDBCollection> = {};
    protected _getCollection(db, storeName: string): IDBCollection {
        if (G.tools.isEmpty(this.collectors[storeName])) {
            if (db.objectStoreNames.contains(storeName)) {
                this.collectors[storeName] = new IDBCollection(db, storeName);
            }
        }

        if (!G.tools.isEmpty(this.collectors[storeName])) {
            return this.collectors[storeName];
        } else {
            return null
        }
    }
    /*
    * 关闭数据库
    * */
    destroy() {
        this.promise.then((db) => {
            db.close();
        });
    }

    protected static initStore(db: IDBDatabase, tableConf: objOf<string[]>) {
        for (let attr in tableConf) {
            if (!db.objectStoreNames.contains(attr)) {
                let store: IDBObjectStore = db.createObjectStore(attr, {
                    keyPath: tableConf[attr][0]
                });
                for (let i = 1, len = tableConf[attr].length; i < len; i++) {
                    store.createIndex(tableConf[attr][i], tableConf[attr][i], {unique: false});
                }
            }
        }
    }
}

class IDBCollection {

    constructor(protected db: IDBDatabase, protected storeName: string) {
    }

    /*
    * 添加数据，主键相同不覆盖
    * data => 插入的数据
    * */
    insert(data: obj): Promise<any> {
        return new Promise((resolve, reject) => {
            let store = this.db.transaction(this.storeName, 'readwrite').objectStore(this.storeName);
            let request = store.add(data);
            request.onsuccess = (e) => {
                resolve(e);
            };
            request.onerror = (err) => {
                reject(err);
            };
        })
    }

    /*
    * 删除数据(删除一个)
    * filter => 根据filter规则删除指定数据，filter接收一个参数，即遍历的数据
    * */
    delete(filter: IDBDataFilter): Promise<any>{
        return new Promise((resolve, reject) => {
            let store = this.db.transaction(this.storeName, 'readwrite').objectStore(this.storeName);
            let request: IDBRequest = (store as any).getAll();
            request.onsuccess = () => {
                let data = request.result;
                let result: any;
                for (let i = 0, len = data.length; i < len; i++) {
                    if (filter(data[i])) {
                        result = data[i];
                        break;
                    }
                }
                let del = store.delete(result);
                G.d.on(del, 'success', () => {
                    resolve();
                });
            };
            request.onerror = (err) => {
                reject(err);
            };
        })

    }

    /*
    * 更新数据(更新一个)
    * filter => 根据filter规则更新指定数据，filter接收一个参数，即遍历的数据
    * newDataGet => 指定要更新的数据，newDataGet接收一个参数，即遍历的数据
    * */
    update(filter: IDBDataFilter, newDataGet: (oldData: obj) => obj): Promise<any> {
        return new Promise((resolve, reject) => {
            let store = this.db.transaction(this.storeName, 'readwrite').objectStore(this.storeName);
            let request: IDBRequest = (store as any).getAll();
            request.onsuccess = (e) => {
                let data = (e.target as IDBRequest).result;
                let result: any;
                for (let i = 0, len = data.length; i < len; i++) {
                    if (filter(data[i])) {
                        result = newDataGet(data[i]);
                        break;
                    }
                }
                if (typeof result !== 'undefined') {
                    // let update = request.transaction(self.storeName, 'readwrite').objectStore(self.storeName).put(result);
                    let update = store.put(result);
                    G.d.on(update, 'success', () => {

                        resolve(result);
                    });
                } else {
                    reject(result);
                }
            };
            request.onerror = (e) => {
                reject(e);
            };
        });

    }

    /*
    * 查询数据
    * filter => 根据filter规则查询指定数据，filter接收一个参数，即遍历的数据
    * */
    find(filter: IDBDataFilter): Promise<any> {
        return new Promise((resolve, reject) => {
            let store = this.db.transaction(this.storeName, 'readwrite').objectStore(this.storeName);
            let request: IDBRequest = (store as any).getAll();
            request.onsuccess = () => {
                let data = request.result;
                console.log(data);
                let result: any[] = [];
                for (let i = 0, len = data.length; i < len; i++) {
                    if (filter(data[i])) {
                        result.push(data[i]);
                    }
                }
                resolve(result);
            };
            request.onerror = (e) => {
                reject(e);
            };
        });
    }

    /*
    * 获取所有数据
    * */
    findAll(): Promise<any> {
        return this.find(() => true);
    }
}