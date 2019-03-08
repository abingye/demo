interface IAjaxSetting{
    isLowCase?: boolean;
    type?: string;
    data?: obj | string | number;
    dataType?: string;
    processData?: boolean; // 是否
    contentType?: string | boolean; // header中的content-type， false表示不发送content-type
    headers?: objOf<string>; // headers
    cache?: boolean; // 是否开启缓存
    // localCache?: boolean;
    timeout?: number;
    traditional?: boolean;
    xhrFields?: obj
}
interface IAjaxSuccess{
    response,
    statusText: string,
    xhr: XMLHttpRequest
}
interface IAjaxError{
    xhr: XMLHttpRequest,
    statusText: string,
    errorThrown: string
}

interface IRequestSuccessFun{
    (result: IAjaxSuccess): void
}

interface IRequestErrorFun{
    (result: IAjaxError): void
}
namespace G{

    interface IXHRSetting extends IAjaxSetting{
        data?: string;
        url: string;
        contentType?: string;
    }


    export class Ajax {
        protected _xhr: XMLHttpRequest = null;
        protected cache = new AjaxCache();
        constructor() {
            this._xhr = new XMLHttpRequest();
        }
        protected _promise: Promise<IAjaxSuccess> = null;

        get promise(){
            return this._promise || Promise.resolve();
        }

        fetch(url:string, setting?: IAjaxSetting) {
            this._promise = new Promise( (resolve:IRequestSuccessFun, reject:IRequestErrorFun) => {
                this.request(url, setting, (result) => {
                    resolve(result)
                }, (result) => {
                    reject(result)
                })
            });
            return this._promise
        }

        protected request(url:string, setting: IAjaxSetting, success: IRequestSuccessFun, error: IRequestErrorFun){
            let accepts = {
                    text: 'text/plain',
                    html: 'text/html',
                    xml: 'application/xml, text/xml',
                    json: 'application/json, text/javascript',
                    script: 'text/javascript, application/javascript, application/x-javascript'
                },
                xhr = this._xhr,
                // 处理ajax参数
                s = getSetting(url, setting),
                // 判断是否开启本地缓存
                isLocalCache = s.cache && s.type === 'GET' && ~['text', 'json'].indexOf(s.dataType),
                abortTimeoutId = null;
                // isLocalCache = s.cache && s.localCache && s.type === 'GET' && ~['text', 'json'].indexOf(s.dataType);

            // 直接调用本地缓存
            if(isLocalCache && this.cache.has(s)) {
                done(null, this.cache.get(s));
                return;
            }

            // url是否加入禁用缓存参数
            let uncacheUrl = s.cache === false ? {'_': new Date().getTime()} : null;

            // 打开xhr
            xhr.open(s.type, tools.url.addObj(s.url, uncacheUrl));

            // 返回类型设置
            let mine = accepts[s.dataType];
            if(mine) {
                xhr.overrideMimeType(mine.split(',')[0])
            }

            // Apply custom fields if provided
            if ( setting && setting.xhrFields ) {
                for ( let i in setting.xhrFields ) {
                    xhr[ i ] = setting.xhrFields[ i ];
                }
            }

            // headers 设置
            for(let name in s.headers){
                xhr.setRequestHeader(name, s.headers[name])
            }

            //超时设置
            if (s.timeout > 0) {
                abortTimeoutId = setTimeout(function () {
                    xhr.onreadystatechange = () => {
                    };
                    xhr.abort();
                    failure('timeout');
                }, s.timeout);
            }

            // 文件类型
            if(s.dataType === 'file'){
                xhr.responseType = 'blob';
            }

            // 返回状态处理
            xhr.onreadystatechange = (e) => {
                if(xhr.readyState !== XMLHttpRequest.DONE) {
                    return;
                }
                // 成功
                if((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304){
                    let type2response = {
                        xml: 'responseXML',
                        file: 'response'
                    };
                    done(xhr, xhr[type2response[s.dataType] || 'responseText']);

                    // 加入缓存
                    if(isLocalCache) {
                        this.cache.push(s, xhr.responseText)
                    }

                } else {
                    // 失败
                    failure(xhr.status ? 'error' : 'abort', xhr.statusText);
                    // error(Ajax.errRes(xhr, 'error', xhr.statusText));
                }

            };
            // xhr.onabort = function() {
            //     error(Ajax.errRes(xhr, 'abort', ''));
            // };

            // xhr.onerror = function() {
            //     error(Ajax.errRes(xhr, 'error', ''));
            // };
            // 发送
            xhr.send(s.data);


            function done(xhr: XMLHttpRequest, response)  {

                let result = null;

                if(s.dataType === 'json') {
                    try {
                        result = JSON.parse(response)
                    } catch(e) {
                        failure('parsererror', e);
                        return;
                    }

                } else {
                    result = response;
                }

                // success({response: result, statusText: 'success', xhr});
                clearTimeout(abortTimeoutId);
                success(Ajax.sucRes(result, 'success', xhr));
            }

            function failure(statusType: string, errorThrown:any = '') {
                clearTimeout(abortTimeoutId);
                error(Ajax.errRes(xhr, statusType, errorThrown))
            }

            function getSetting(url:string, setting?: IAjaxSetting): IXHRSetting {
                // 默认值
                setting = <IAjaxSetting>Object.assign({
                    type: 'GET'
                    , dataType: 'text'
                    , timeout: 0
                    , processData: true
                    , traditional: false
                }, setting);

                let s:IXHRSetting = {
                    url: url
                    , timeout: setting.timeout
                    , processData: setting.processData
                    , cache: setting.cache
                    // , localCache: setting.localCache
                    , type: setting.type.toUpperCase()
                    , dataType: setting.dataType.toLowerCase()
                    , traditional: setting.traditional
                    , xhrFields: setting.xhrFields
                };

                // 确定content type
                if(typeof setting.contentType ==='string' && setting.contentType){
                    // 如果有传入content type, 则直接赋值
                    s.contentType = setting.contentType;

                } else if(setting.contentType !== false && s.type !== 'GET' && setting.data) {
                    // 如果传入的contentType不为false，type为GET时不需要发送数据，所以不为GET时才设置ContentType, 然后data不为空
                    s.contentType = s.traditional ? 'application/x-www-form-urlencoded' : accepts.json;
                }

                //设置headers
                s.headers = {
                    Accept: accepts[setting.dataType] || '*/*', // 设置通过dataType找到期望返回的数据类型
                    'X-Requested-With': 'XMLHttpRequest'
                };
                if(s.contentType) {
                    // 设置contentType
                    s.headers['Content-Type'] = s.contentType;
                }
                if(setting.headers){
                    // 设置用户自定义的header
                    for(let name in setting.headers){
                        s.headers[name] = setting.headers[name];
                    }
                }

                // 处理数据
                if(setting.data){
                    let sData = setting.data;
                    if (setting.processData && typeof sData === 'object') {
                        if (s.type === 'GET') {
                            s.url = tools.url.addObj(url, sData, setting.isLowCase);
                            s.data = '';
                        } else if(s.contentType){
                            // 发送数据为json时将json转为字符串
                            s.data = s.traditional ? tools.obj.toUri(sData, setting.isLowCase) : JSON.stringify(sData);
                        }
                    }else if( typeof sData === 'string'){
                        s.data = sData;
                    }else if(typeof sData.toString === 'function') {
                        s.data = sData.toString()
                    }
                }

                return s;
            }
        }

        protected static errRes(xhr: XMLHttpRequest, statusText: string, errorThrown: string): IAjaxError {
            return {xhr, statusText, errorThrown}
        }


        protected static sucRes(response, statusText: string, xhr: XMLHttpRequest): IAjaxSuccess{
            return {response, statusText, xhr}
        }

        static fetch(url:string, setting?: IAjaxSetting) {
            return new Ajax().fetch(url, setting);
        }

    }

    class AjaxCache{
        private hashArr:string[] = [];
        private dataArr = [];
        private max: 30;

        private hashGet(s:IXHRSetting) {
            return s.url + s.data;
        }

        public push(s:IXHRSetting, data:any) {

            let hash = this.hashGet(s),
                index = this.hashArr.indexOf(hash);
            // 如果已经存在此hash 则替换上面的数据
            if(index >= 0){
                this.dataArr[index] = data;
                return;
            }

            // 如果已经是最大长度，则先做出栈
            if(this.hashArr.length === this.max){
                this.hashArr.shift();
                this.dataArr.shift();
            }
            this.hashArr.push(hash);
            this.dataArr.push(data);
        }

        public get(s:IXHRSetting) {
            let hash = this.hashGet(s),
                index = this.hashArr.indexOf(hash);

            return index >= 0 ? this.dataArr[index] : null
        }

        public has(s:IXHRSetting): boolean{
            return this.hashArr.indexOf(this.hashGet(s)) >= 0;
        }

        public clear(){
            this.hashArr = [];
            this.dataArr = [];
        }

    }
}