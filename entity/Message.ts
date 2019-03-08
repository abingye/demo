/// <amd-module name="Message"/>
import tools = G.tools;
interface IMessage {
    id  ?:string,
    sender?:string,
    title?:string,
    content?:string,
    link?:string,
    time?:string,
    isRead?:boolean,
    num?:number
}
/**
 * 接收到的消息对象
 */
export class Message{

    private _id?:string;
    set id(id:string){
        if(tools.isEmpty(id)){
            id = this.getGuid();
        }
        this._id = id;
    }
    get id(){
        return this._id;
    }

    private _sender?:string;
    set sender(sender:string){
        if(tools.isEmpty(sender))
            this._sender = "";
        else
            this._sender = sender;
    }
    get sender(){
        return this._sender;
    }

    private _title?:string;
    set title(title:string){
        if(tools.isEmpty(title))
            this._title = "";
        else
            this._title = title;
    }
    get title(){
        return this._title;
    }

    private _content?:string;
    set content(content:string){
        if(tools.isEmpty(content))
            this._content = "";
        else
            this._content = content;
    }
    get content(){
        return this._content;
    }

    private _link?:string;
    set link(link:string){
        if(tools.isEmpty(link))
            this._link = "";
        else
            this._link = link;
    }
    get link(){
        return this._link;
    }

    private _time?:string;
    set time(time:string){
        if(tools.isEmpty(time))
            this._time = "";
        else
            this._time = time;
    }
    get time(){
        return this._time;
    }

    private _isRead?:boolean;
    set isRead(isRead:boolean){
        if(tools.isEmpty(isRead))
            this._isRead = false;
        else
            this._isRead = isRead;
    }
    get isRead(){
        return this._isRead;
    }

    private _num?:number;
    set num(num:number){
        if(tools.isEmpty(num))
            this._num = 0;
        else
            this._num = num;
    }
    get num(){
        return this._num;
    }

    getGuid():string{
        var guid = "";
        for (var i = 1; i <= 32; i++){
            var n = Math.floor(Math.random()*16.0).toString(16);
            guid +=   n;
            if((i==8)||(i==12)||(i==16)||(i==20))
                guid += "-";
        }
        return guid;
    }

    toString(){
        return {
            'id':this.id,
            'sender':this.sender,
            'title':this.title,
            'content':this.content,
            'link':this.link,
            'num':this.num,
            'time':this.time,
            'isRead':this.isRead
        };
    }

    constructor(message?: IMessage) {
        if(tools.isEmpty(message)){
            message = {};
        }
        this.id = message.id;
        this.sender = message.sender;
        this.title = message.title;
        this.content = message.content;
        this.link = message.link;
        this.num = message.num;
        this.time = message.time;
        this.isRead = message.isRead;
    }
}