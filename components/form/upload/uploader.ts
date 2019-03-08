/// <amd-module name="Uploader"/>

import {FormCom, IFormComPara} from "../basic";
import {User} from "../../../entity/User";
import Ajax = G.Ajax;
import d = G.d;
import tools = G.tools;
import {TextInput} from "../text/text";

export interface IUploaderPara extends IFormComPara {
    uploadUrl: string;
    nameField: string;
    thumbField?: string;

    onComplete?(...any);

    typeUnique?: string;
    text?: string;
    accept?: obj;
}

//  使用完该控件需销毁，否则后续上传会多次
export class Uploader extends FormCom {
    onSet: (val) => void;
    private com;
    private webUpLoader;
    private guid = tools.getGuid();
    private fileName: string = '';
    private fileNameInput: TextInput = null;

    get text() {
        return this.fileNameInput.get();
    }

    set text(str: string) {
        if (this.fileNameInput !== null) {
            this.fileNameInput.set(str);
        }
    }

    constructor(private para: IUploaderPara) {
        super(para);
        this.initDom();
        require(['webUpLoader', 'md5'], (WebUploader, md5) => {
            this.webUpLoader = WebUploader;
            this.comInit(WebUploader, md5);
            for (let name in this.event) {
                this.on(name, this.event[name]);
            }
            // 清理
            this.event = {};

            setTimeout(() => {
                // debugger;
                let container = para.container,
                    clickEl = d.query('.webuploader-element-invisible', container).parentElement;
                clickEl.style.width = container.offsetWidth + 'px';
                clickEl.style.height = container.offsetHeight + 'px';
            }, 200);

            this.fileNameInput = new TextInput({
                container: para.container,
                placeholder: this.para.text || '点击上传',
                readonly: true,
            });

            this.text = this.value;
        })
    }

    private initDom() {
        let dom = this.para.container;
        dom.classList.add('uploader-com');
    }

    private comInit(WebUploader, md5) {
        let userInfo = {userId: User.get().userid, md5: ""};   // 用户会话信息
        let chunkSize = 5000 * 1024;                           // 分块大小
        let uniqueFileName: string = '';                      // 文件唯一标识符
        let md5Mark = null,
            para = this.para;

        let backEndUrl = this.para.uploadUrl;                  // "http://localhost:8080/RESTServer";
        let self = this;

        WebUploader.Uploader.register({
            name: this.guid
            , "before-send-file": "beforeSendFile"
            , "before-send": "beforeSend"
            , "after-send-file": "afterSendFile"
        }, {
            beforeSendFile: (file: File) => {
                //秒传验证
                if (para.typeUnique === Uploader.type) {
                    let task = $.Deferred();
                        let start = new Date().getTime();
                        //拿到上传文件的唯一名称，用于断点续传
                        uniqueFileName = md5('' + file.name + file.type + file.lastModifiedDate + file.size);

                        (new WebUploader.Uploader()).md5File(file).progress(function (percentage) {
                            // console.log(percentage);
                        }).then(function (val) {
                            // console.log("总耗时: "+((new Date().getTime()) - start)/1000);

                            md5Mark = val;
                            userInfo.md5 = val;
                            let ajaxData: obj = {
                                status: "md5Check"
                                , md5: val.toUpperCase()
                                , nameField: para.nameField
                                , file_name: file.name
                                , name: uniqueFileName
                            };

                            if (para.thumbField) {
                                ajaxData.smallField = para.thumbField;
                            }
                            Ajax.fetch(backEndUrl, {
                                type: "POST"
                                , traditional: true
                                , data: ajaxData
                                // , cache: false
                                , timeout: 1000 // 超时的话，只能认为该文件不曾上传过
                                , dataType: "json"

                            }).then(function ({response}) {
                                if (response.ifExist) {   //若存在，这返回失败给WebUploader，表明该文件不需要上传
                                    task.reject('ifExist');
                                    self.com.skipFile(file);
                                    // file.path = data.path;
                                    self.fileName = file.name;
                                    self.para.onComplete(response, file, Uploader.type);
                                } else {
                                    task.resolve();
                                    //拿到上传文件的唯一名称，用于断点续传
                                    //uniqueFileName = md5(''+userInfo.userId+file.name+file.type+file.lastModifiedDate+file.size);
                                }
                            }).catch(() => {
                                task.resolve();
                            });

                    });

                    return $.when(task);
                }
            }
            , beforeSend: function (block) {
                //分片验证是否已传过，用于断点续传
                if (para.typeUnique === Uploader.type) {
                    let task = $.Deferred();
                    Ajax.fetch(backEndUrl, {
                        type: "POST"
                        , traditional: true
                        , data: {
                            status: "chunkCheck"
                            , name: uniqueFileName
                            , chunkIndex: block.chunk
                            , size: block.end - block.start
                        }
                        // , cache: false
                        , timeout: 1000 // 超时的话，只能认为该分片未上传过
                        , dataType: "json"
                    }).then(({response}) => {
                        if (response.ifExist) {   //若存在，返回失败给WebUploader，表明该分块不需要上传
                            task.reject('ifExist');
                        } else {
                            task.resolve();
                        }
                    }).catch(() => {
                        task.resolve();
                    });

                    return $.when(task);
                }
            }
            , afterSendFile: function (file: File) {
                if (para.typeUnique === Uploader.type) {
                    let chunksTotal = 0;
                    if ((chunksTotal = Math.ceil(file.size / chunkSize)) >= 1) {
                        //合并请求
                        let task = $.Deferred(),
                            ajaxData: obj = {
                                status: "chunksMerge"
                                , name: uniqueFileName
                                , chunks: chunksTotal
                                , md5: md5Mark.toUpperCase()
                                , file_name: file.name
                                , userid: userInfo.userId
                                , nameField: para.nameField
                            };
                        if (para.thumbField) {
                            ajaxData.smallField = para.thumbField
                        }
                        Ajax.fetch(backEndUrl, {
                            type: "POST"
                            , traditional: true
                            , data: ajaxData
                            // , cache: false
                            , dataType: "json"
                        }).then(({response}) => {

                            // 检查响应是否正常
                            task.resolve();
                            self.fileName = file.name;
                            self.para.onComplete(response, file, Uploader.type);
                        }).catch(() => {
                            task.reject();
                        });

                        return $.when(task);
                    } else {
                        // console.log(file);
                        // self.fileName = file.name;
                        // self.para.onComplete();
                    }
                }
            }
        });

        // console.log(this.para.container);
        this.com = WebUploader.create({
            swf: "Uploader.swf"
            , server: backEndUrl // url
            , pick: this.para.container // container
            , resize: false
            // , dnd: "#theList"
            // , paste: document.body
            , disableGlobalDnd: true
            , thumb: {
                width: 100
                , height: 100
                , quality: 70
                , allowMagnify: true
                , crop: true
                //, type: "image/jpeg"
            }
//				, compress: {
//					quality: 90
//					, allowMagnify: false
//					, crop: false
//					, preserveHeaders: true
//					, noCompressIfLarger: true
//					,compressSize: 100000
//				}
            , compress: false
            , prepareNextFile: true
            , chunked: true
            , chunkSize: chunkSize
            , threads: true
            , formData: function () {
                return userInfo
            } // formData
            , fileNumLimit: 30 // fileNumLimit
            , fileSingleSizeLimit: 4 * 1024 * 1024 //4m //
            , duplicate: true // 验证文件是否可以重复
            , accept: para.accept ? para.accept : null
        });
    }

    static type: string; // 标识当前uploader
    upload(type?: string) {
        Uploader.type = type || '';
        this.com.upload();
    }

    private event: objOf<Function> = {};

    on(name: string, callback: Function) {
        if (this.com) {
            this.com.on(name, callback);
        } else {
            this.event[name] = callback;
        }
    }

    get(): string {
        return this.fileName;
    }

    set(fileName: string): void {
        this.fileName = fileName;
    }

    error(isError: boolean, errorMsg: string) {
        super.error(isError, errorMsg, this.para.container);
    }

    destroy() {
        this.webUpLoader && this.webUpLoader.Uploader.unRegister(this.guid);
        this.com && this.com.destroy();
        super.destroy();
    }

    get value() {
        return this.fileName;
    };

    set value(fileName: string) {
        this.fileName = fileName;
    }

    protected wrapperInit() {
        return undefined;
    }
}