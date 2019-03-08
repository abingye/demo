/// <amd-module name="BwWebsocket"/>
import {Modal} from "../components/feedback/modal/Modal";
interface IBwWebsocketPara{
    onOpen? : (r) => void
    onMessage? : (r) => void
    onError? : (r) => void
    onClose? : (r) => void
    url? : string
    sendData? : string
}

export class BwWebsocket{
    ws : WebSocket;
    constructor(para? : IBwWebsocketPara){
        if ('WebSocket' in window) {
            this.ws = new WebSocket(para.url);
        }else {
            Modal.toast('您的浏览器不支持websocket.');
            return;
        }

        this.ws.onopen = () => {
            para.onOpen;
            this.ws.send(para.sendData);
        };
        this.ws.onmessage = para.onMessage;
        this.ws.onclose = para.onClose;
        this.ws.onerror = para.onError;
    }

}
