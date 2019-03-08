/// <amd-module name="Device"/>
import tools = G.tools;
export interface IDevice {
    userid:string,
    password:string,
    auth_code:string,
    uuid:string,
    isSavePassword:boolean
}
/**
 * Created by zhengchao on 2017/11/13.
 * 当前设备对象唯一实例
 */
export class Device implements IDevice{

    private _userid?:string;
    set userid(userid:string){
        if(tools.isEmpty(userid))
            this._userid = "";
        else
            this._userid = userid;
        this.putStorage();
    }
    get userid(){
        return this._userid;
    }

    private _password?:string;
    set password(password:string){
        if(tools.isEmpty(password))
            this._password = "";
        else
            this._password = password;
        this.putStorage();
    }
    get password(){
        return this._password;
    }

    private _auth_code?:string;
    set auth_code(auth_code:string){
        if(tools.isEmpty(auth_code))
            this._auth_code = "";
        else
            this._auth_code = auth_code;
        this.putStorage();
    }
    get auth_code(){
        return this._auth_code;
    }

    private _uuid?:string;
    set uuid(uuid:string){
        if(tools.isEmpty(uuid))
            this._uuid = "";
        else
            this._uuid = uuid;
        this.putStorage();
    }
    get uuid(){
        return this._uuid;
    }

    private _isSavePassword?:boolean;
    set isSavePassword(isSavePassword:boolean){
        if(tools.isEmpty(isSavePassword))
            this._isSavePassword = false;
        else
            this._isSavePassword = isSavePassword;
        this.putStorage();
    }
    get isSavePassword(){
        return this._isSavePassword;
    }

    putStorage(){
        localStorage.setItem('deviceInfo', this.toString());
    }

    isMb = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    getOs():string {
        let userAgent = navigator.userAgent,os;
        if(!this.isMb)
            os = 'pc';
        else if(/OursAndroid/i.test(userAgent))
            os = 'ad';
        else if(/OursIOS/i.test(userAgent))
            os = 'ip';
        else if(/MicroMessenger/i.test(userAgent))
            os = 'wc';
        else
            os = 'h5';
        return os;
    }

    toString(){
        return JSON.stringify({
            'userid':this.userid,
            'password':this.password,
            'auth_code':this.auth_code,
            'uuid':this.uuid,
            'isSavePassword':this.isSavePassword
        })
    }

    static device:Device = null;
    private constructor() {
        let device:IDevice = <IDevice>JSON.parse(localStorage.getItem("deviceInfo"));
        if(tools.isEmpty(device))
            device = <IDevice>{};
        if(typeof device === 'string')
            device = JSON.parse(<string>device);
        this.userid = device.userid;
        this.password = device.password;
        this.auth_code = device.auth_code;
        this.uuid = device.uuid;
        this.isSavePassword = device.isSavePassword;
    }

    test(i){
        console.log("test.device."+i);
    }

    static get() {
        if (!Device.device)
            Device.device = new Device();
        return Device.device;
    }
}