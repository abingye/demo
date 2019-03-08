/// <amd-module name="FileUpload"/>

import tools = G.tools;

export interface IFileUpload {
    beforeSendFile?: (file: CustomFile) => Promise<any>; // promise返回的数据会在beforeSendBlock，afterSendFile方法中作为参数
    formData?: () => obj;   // 上传附带数据
    uploadUrl: string;  // 上传地址
    chunk?: {//是否分块
        beforeSendBlock: (block: IFileBlock, ...any) => Promise<any>;
        afterSendFile: (file: CustomFile, ...any) => Promise<any>;
        chunkSize: number;  // 分块大小
    },
}

export interface IFileBlock {
    end: number;
    start: number;
    index: number;
}

export class FileUpload {
    protected chunkSize: number;
    protected chunked: boolean;
    protected beforeSendFile: (file: CustomFile) => Promise<any>;
    protected beforeSendBlock: (block: IFileBlock, ...any) => Promise<any>;
    protected afterSendFile: (file: CustomFile, ...any) => Promise<any>;
    protected uploadUrl: string;

    constructor(para: IFileUpload) {
        this.uploadUrl = para.uploadUrl;
        this.beforeSendFile = para.beforeSendFile || Promise.resolve;
        this.formData = para.formData;
        this.chunked = tools.isNotEmpty(para.chunk);
        if (this.chunked) {
            this.beforeSendBlock = para.chunk.beforeSendBlock;
            this.chunkSize = para.chunk.chunkSize;
            this.afterSendFile = para.chunk.afterSendFile;
        }
    }

    formData: () => obj;

    // 验证并上传文件
    upload(file: CustomFile): Promise<any> {
        return new Promise((resolve, reject) => {
            // 秒传验证
            this.beforeSendFile(file).then((...any) => {
                // any是beforeSendFile函数中promise返回的数据，会带入到分块验证与合并请求中去。

                // 分片验证
                if (this.chunked) {
                    this.chunkUpload(file, ...any).then(() => {
                        // 合并请求
                        this.afterSendFile(file, ...any).then((...anyData) => {
                            // anyData 为成功后返回的数据
                            resolve(...anyData); // 上传成功
                        }).catch(() => {
                            // 第一次合并请求失败时再次请求一次合并
                            this.afterSendFile(file, ...any).then((...anyData) => {
                                // anyData 为成功后返回的数据
                                resolve(...anyData); // 上传成功
                            }).catch((msg) => {
                                reject(msg);
                            });
                        });
                    }).catch(() => {
                        reject(); // 表示分片上传失败
                    })
                } else {
                    let data = {
                        name: file.name,
                        size: file.size,
                        type: file.type || '',
                        lastModifiedDate: file.lastModifiedDate
                    };
                    this.uploadFile(file.blob, file.name, data).then((response) => {
                        // 成功返回
                        resolve(response);
                    }).catch((msg) => {
                        reject(msg); // 表示分片上传失败
                    })
                }
            }).catch((...anyData) => {
                console.log(anyData);
                if(tools.isEmpty(anyData)){
                    reject();
                }else{
                    resolve(...anyData); // 表示已存在后台
                }
            })
        })
    }

    abort() {
        this.xhrs.forEach((xhr) => {
            xhr.abort();
        });
    }

    // 分片验证逻辑
    protected chunkUpload(file: CustomFile, ...any) {
        let self = this,
            totalSize = file.size,
            total = Math.ceil(totalSize / this.chunkSize),

            list: Promise<any>[] = [],
            startSize = 0,
            endSize = 0,
            chunkIndex = 0,
            fileBlob: Blob = file.blob;
        this.xhrs = [];

        let totalPieces = total;
        while(totalPieces--){
            endSize = startSize + self.chunkSize;
            if (totalPieces === 0) {
                endSize = file.size;
            }
            let index = chunkIndex,
                blob = fileBlob.slice(startSize, endSize); // 切片
            list.push(new Promise((resolve, reject) => {
                self.beforeSendBlock({
                    end: endSize,
                    start: startSize,
                    index: chunkIndex,
                }, ...any).then(() => {
                    // 调用文件上传
                    let data: obj = {
                        chunk: index,
                        chunks: total,
                        name: file.name,
                        size: file.size,
                        type: file.type || '',
                        lastModifiedDate: file.lastModifiedDate
                    };
                    // 当分块数量为1 时，上传数据无需传递分块参数
                    if(total <= 1){
                        delete data.chunks;
                        delete data.chunk;
                        blob = file.blob;
                    }
                    self.uploadFile(blob, file.name, data).then(() => {
                        resolve();
                    }).catch(() => {
                        reject();
                    });
                }).catch(() => {
                    resolve(); // 返回失败表示文件已存在后台
                });
            }));
            chunkIndex++;
            startSize = endSize;
        }
        return Promise.all(list);
    }

    // 文件上传方法
    protected xhrs: XMLHttpRequest[] = [];

    protected uploadFile(file: Blob, filename: string, ajaxData?: obj, isLoop: boolean = true): Promise<any> {
        let url = this.uploadUrl;
        return new Promise<any>((resolve, reject) => {
            if (tools.isNotEmpty(file) && tools.isNotEmpty(url)) {
                let formData = new FormData();
                let data = Object.assign({},
                    ajaxData || {},
                    this.formData ? this.formData() : {}); // 合并数据时以ajaxData为主

                for (let key in data) {
                    formData.append(key, data[key]);
                }

                formData.append('file', file, filename);
                let result = {success: false, uploading: false, progress: 0};
                let xhr = new XMLHttpRequest();
                this.xhrs.push(xhr);
                xhr.open("post", url, true);
                xhr.addEventListener('error', () => {
                    if(isLoop){
                        // 第一次上传失败时会再上传一次
                        this.uploadFile(file, filename, ajaxData, false).then(() => {
                            resolve();
                        }).catch(() => {
                            reject();
                        })
                    }else{
                        reject();
                    }
                });
                xhr.addEventListener('progress', (evt) => {
                    if (evt.lengthComputable) {
                        let percentComplete = Math.round(evt.loaded * 100 / evt.total);
                        result.uploading = true;
                        result.progress = percentComplete;
                    }
                    else {
                        result.uploading = false;
                        result.progress = 0;
                    }
                });
                // xhr.addEventListener("abort", () => reject());
                xhr.addEventListener("load", (ev) => {
                    result.uploading = false;
                    result.success = true;
                    result.progress = 100;
                });
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4 && xhr.status == 200) {
                        resolve(xhr.responseText);
                    }
                };
                xhr.send(formData);
            } else {
                reject()
            }
        })
    }
}