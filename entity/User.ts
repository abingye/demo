/// <amd-module name="User"/>
import tools = G.tools;
interface IUser {
    userid?:string,
    username?:string,
    department?:string,
    loginType?:number,
    are_id?:string,
    platformName?: string,
}
/**
 * Created by zhengchao on 2017/11/13.
 * 当前用户对象唯一实例
 */
export class User implements IUser{

    private _userid?:string;
    set userid(userid:string){
        // if(tools.isEmpty(userid))
        //     this._userid = "";
        // else
        this._userid = userid;
        this.putStorage();
    }
    get userid(){
        return  tools.str.toEmpty(this._userid);
    }

    private _username?:string;
    set username(username:string){
        // if(tools.isEmpty(username))
        //     this._username = "";
        // else
        this._username = username;
        this.putStorage();
    }
    get username(){
        return tools.str.toEmpty(this._username);
    }

    private _department?:string;
    set department(department:string){
        // if(tools.isEmpty(department))
        //     this._department = "";
        // else
        this._department = department;
        this.putStorage();
    }
    get department(){
        return  tools.str.toEmpty(this._department);
    }

    private _are_id?:string;
    set are_id(are_id:string){
        // if(tools.isEmpty(are_id))
        //     this._are_id = "";
        // else
        this._are_id = are_id;
        this.putStorage();
    }
    get are_id(){
        return  tools.str.toEmpty(this._are_id);
    }

    /**
     * 0:密码登录|1:电脑指纹登录|2:手机指纹登录|3:微信登录
     */
    private _loginType?:number;
    set loginType(loginType:number){
        // if(tools.isEmpty(loginType))
        //     this._loginType = 0;
        // else
        this._loginType = loginType;
        this.putStorage();
    }
    get loginType(){
        return  tools.str.toEmpty(this._loginType);
    }

    // 当前项目
    private _platformName?: string;
    set platformName(platformName: string){
        this._platformName = platformName;
        this.putStorage();
    }
    get platformName(){
        return tools.str.toEmpty(this._platformName);
    }

    putStorage(){
        localStorage.setItem('userInfo',this.toString());
    }

    toString(){
        return JSON.stringify({
            'userid':this.userid,
            'username':this.username,
            'department':this.department,
            'are_id':this.are_id,
            'loginType':this.loginType,
            'platformName': this.platformName
        });
    }

    static user:User = null;
    private constructor() {
        let user:IUser = <IUser>JSON.parse(localStorage.getItem("userInfo"));
        if(tools.isEmpty(user))
            user = <IUser>{};
        if(typeof user === 'string')
            user = JSON.parse(<string>user);
        this.userid = user.userid;
        this.username = user.username;
        this.department = user.department;
        this.loginType = user.loginType;
        this.are_id = user.are_id;
        this.platformName = user.platformName;
    }

    clearStorage(){
        this._userid = '';
        this._username = '';
        this._department = '';
        this._loginType = undefined;
        this._are_id = '';
        this._platformName = '';
        localStorage.setItem('userInfo',null);
    }

    static get() {
        if (!User.user)
            User.user = new User();
        return User.user;
    }
}