/// <amd-module name="NewUploader"/>

import {FormCom, IFormComPara} from "../basic";
import d = G.d;
import tools = G.tools;
import {Modal} from "../../feedback/modal/Modal";
import {Loading} from "../../ui/loading/loading";

export interface IUploaderPara extends IFormComPara {
    text?: string;
    url?: string;
    formData?: () => obj; // 附带的数据
    fileSingleSizeLimit?: number; // 文件大小限制
    accept?: FileType; // 文件类型
    beforeSendFile?: (file: File) => Promise<obj>;
    isChangeText?: boolean; //默认true
    // duplicate?: boolean; // 验证文件是否可以重复
    successHandler?: (response: Array<{data: any, file: File}>) => void;
    isAutoUpload?: boolean;
    failure?: (error: obj) => void;
    isMulti?: boolean; // 是否多选，默认否
    maxTotal?: number; // 最大上传数量，最大5；
}

export interface FileType {
    extensions?: string, // 允许的文件后缀，不带点，多个用逗号分割。
    mimeTypes?: string
}

export class NewUploader extends FormCom {
    static readonly EVT_UPLOAD_PROGRESS = '__EVENT_UPLOAD_STATUS_PROGRESS__';

    onSet: (val) => void;
    protected isChangeText;
    protected isMulti: boolean;
    protected maxTotal: number;

    protected wrapperInit(para: IUploaderPara): HTMLElement {
        let isMulti = para.isMulti || false;
        return <div className="uploader-wrapper">
            <input multiple={isMulti} type="file"/>
            <span className="uploader-box">{para.text || '点击上传'}</span>
        </div>;
    }

    protected input: HTMLInputElement;
    protected span: HTMLElement;
    protected text: string;
    protected url: string;
    protected isAutoUpload: boolean;
    protected successHandler: (response: Array<{data: any, file: File}>) => void;
    protected failure: (error: obj) => void;

    constructor(para: IUploaderPara) {
        super(para);

        this.isChangeText = tools.isEmpty(para.isChangeText) ? true : para.isChangeText;
        this.input = d.query('input', this.wrapper) as HTMLInputElement;
        this.isMulti = this.input.multiple;
        this.maxTotal = tools.isEmpty(para.maxTotal) ? 5 : para.maxTotal;
        this.span = d.query('.uploader-box', this.wrapper);
        this.text = para.text || '点击上传';
        this.url = para.url;
        this.size = para.fileSingleSizeLimit;
        this.beforeSendFile = para.beforeSendFile;
        this.formData = para.formData;
        this.setAccept(para.accept);
        this.event.on();
        this.isAutoUpload = para.isAutoUpload;
        this.successHandler = para.successHandler;
        this.failure = para.failure;
    }

    protected event = (() => {
        return {
            on: () => {
                d.on(this.wrapper, 'click', () => {
                    this.input.click();
                });
                d.on(this.input, 'change', () => {
                    if(this.isMulti && (this.input.files.length > this.maxTotal)){
                        Modal.alert('超过一次性最大上传数量：' + this.maxTotal);
                        return ;
                    }

                    let files = this.isMulti ? this.input.files : [this.input.files[0]];
                    this.temporaryFile = [];

                    if(files !== null){
                        for(let i = 0; i <files.length; i ++){
                            let file = files[i];
                            this.setFile(file);
                        }
                        if (this.isAutoUpload === true) {
                            this.upload().then((res) => {
                                typeof this.successHandler === 'function' && this.successHandler(res);
                            }).catch((error: obj) => {
                                typeof this.failure === 'function' && this.failure(error);
                            });
                        }
                    }
                    this.input.value = '';
                })
            }
        }
    })();

    protected files: File[];
    protected temporaryFile: File[];

    protected setFile(file: File) {
        if (file) {
            // if(this.accept.length > 1){
            //     if(this.accept.indexOf(file.type) === -1){
            //         Modal.alert('文件格式错误');
            //         return ;
            //     }
            // }
            if (this.size && (file.size > this.size)) {
                Modal.alert('文件大小超过' + (this.size / 1024 / 1024).toFixed(2) + 'M');
                return;
            }
            if(this.isMulti){
                if(!Array.isArray(this.files)){
                    this.files = [];
                }
                this.files.push(file);
                this.temporaryFile.push(file);
            }else{
                this.files = [file];
                this.temporaryFile = [file];
            }
            this.isChangeText && (this.span.innerText = file.name);
        } else {
            if(!this.isMulti) {
                this.files = [];
                this.temporaryFile = [];
            }
            this.span.innerText = this.text;
        }
    }

    upload() :Promise<Array<{data: any, file: File}>> {
        let promises = [],
            loading = new Loading({
                msg: '上传中...',
            });

        loading.show();
        this.temporaryFile.forEach((file) => {
            promises.push(new Promise((resolve, reject) => {
                this.beforeSendFile(file).then((response) => {
                    if (!response.ifExist) {
                        this.innerUpload(file, (res) => {
                            resolve({
                                data: res,
                                file
                            });
                        }, () => {
                            reject();
                        });
                    }else {
                        resolve({
                            data: response,
                            file
                        });
                    }
                });
            }));
        });
        return new Promise((resolve, reject) => {
            Promise.all(promises).then((res) =>{
                resolve(res);
            }).catch((e) => {
                reject(e);
            }).finally(() => {
                loading.hide();
            })
        });
    }

    protected innerUpload(file, success?, error?) {
        if (tools.isNotEmpty(file) && tools.isNotEmpty(this.url)) {
            let formData = new FormData();
            let data = this.formData ? this.formData() : null;
            if (data) {
                for (let key in data) {
                    formData.append(key, data[key]);
                }
            }
            formData.append('file', file, file.name);
            let result = {success: false, uploading: false, progress: 0};
            let xhr = new XMLHttpRequest();
            xhr.open("post", this.url, true);
            xhr.addEventListener('error', () => {
                typeof error === 'function' && error();
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
                let events = this.eventHandlers[NewUploader.EVT_UPLOAD_PROGRESS];
                tools.isNotEmpty(events) && events.forEach((handler) => {
                    handler(result);
                });
            });
            xhr.addEventListener("abort", () => Modal.alert("您取消了本次上传."));
            xhr.addEventListener("load", (ev) => {
                result.uploading = false;
                result.success = true;
                result.progress = 100;
                let events = this.eventHandlers[NewUploader.EVT_UPLOAD_PROGRESS];
                tools.isNotEmpty(events) && events.forEach((handler) => {
                    handler(result);
                });
            });
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    typeof success === 'function' && success(xhr.responseText);
                }
            };
            xhr.send(formData);
        }
    }

    // protected _disabled: boolean;
    // get disabled(){
    //     return this._disabled;
    // }
    // set disabled(disabled: boolean){
    //     this._disabled = disabled;
    //     this.wrapper.classList.toggle("disabled", disabled);
    // }

    protected formData: () => obj;

    protected accept: Array<string> = [];

    protected setAccept(accept: FileType) {
        if (tools.isNotEmpty(accept)) {
            let result = [];
            if (tools.isNotEmpty(accept.extensions)) {
                let exts = accept.extensions.split(/\s*,\s*/);
                exts.forEach((ext) => {
                    result.push('.' + ext);
                });
            } else if (tools.isNotEmpty(accept.mimeTypes)) {
                let mimeTypes = accept.mimeTypes.split(/\s*,\s*/);
                mimeTypes.forEach((mimeType) => {
                    if (mimeType) {
                        result.push(mimeType);
                    }
                });
            }
            this.accept = result;
            this.accept.length > 0 && (this.input.accept = this.accept.join(','));
        }
    }

    protected size: number;
    protected _beforeSendFile: (file: File) => Promise<obj>;
    set beforeSendFile(beforeSendFile: (file: File) => Promise<obj>) {
        this._beforeSendFile = beforeSendFile || (() => new Promise((resolve) => resolve()));
    }

    get beforeSendFile() {
        return this._beforeSendFile;
    }

    delFile(index: number): void;
    delFile(file: File): void;
    delFile(flag){
        if(Array.isArray(this.files)) {
            if (typeof flag === 'number') {
                this.files.splice(flag, 1);
            } else {
                let index = this.files.indexOf(flag);
                this.files.splice(index, 1);
            }
        }
    }

    open(){
        this.input.click();
    }

    get(): File[] {
        return this.files;
    }

    set(files: File[]): void {
        this.files = files;
    }

    get value() {
        return this.files;
    }
}

let mimeTypes = {
    "dir": "application/x-director",
    "doc": "application/msword",
    "dot": "application/msword",
    "dv": "video/x-dv",
    "gif": "image/gif",
    "htm": "text/html",
    "html": "text/html",
    "htmls": "text/html",
    "ico": "image/x-icon",
    "jpe": "image/jpeg",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "mp3": "audio/mpeg",
    "mpa": "audio/mpeg",
    "mpe": "video/mpeg",
    "mpeg": "video/mpeg",
    "mpg": "video/mpeg",
    "mpga": "audio/mpeg",
    "mv": "video/x-sgi-movie",
    "pic": "image/pict",
    "pict": "image/pict",
    "pps": "application/vnd.ms-powerpoint",
    "ppt": "application/vnd.ms-powerpoint",
    "ppz": "application/vnd.ms-powerpoint",
    // "psd": "image/vnd.adobe.photoshop",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "swf": "application/x-shockwave-flash",
    "txt": "text/plain",
    "viv": "video/vivo",
    "vivo": "video/vivo",
    "xml": "application/xml",
    "xls": "application/vnd.ms-excel",
};