/// <amd-module name="QrCode" />
/// <amd-dependency path="QRCode" name="QRCode"/>
import tools = G.tools;
declare const QRCode;
interface locPara{
    x:number,//横坐标
    y:number,//纵坐标
    w?:number,
    h?:number
}
interface codePara{
    alignment?:number,
    codeData?:string,
    codeType?:number,
    condition?:string
}
export class QrCode{
    private g:SVGElement;
    constructor(svgDom:SVGGElement | SVGSVGElement,loc:locPara,sty:codePara){
        this.init(svgDom,loc,sty);
    }
    private init(svgDom:SVGGElement | SVGSVGElement,loc:locPara,sty:codePara){
        this.g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        let qrcode = new QRCode(this.g, {
            width : loc.w,
            height : loc.h,
            useSVG: true,
        });
        qrcode.makeCode(sty.codeData);
        let gSvg = <SVGSVGElement>this.g.firstChild;
        gSvg.setAttribute('width',`${loc.w}`);
        gSvg.setAttribute('height',`${loc.h}`);
        gSvg.setAttribute('x',`${loc.x}`);
        gSvg.setAttribute('y',`${loc.y}`);
        svgDom.appendChild(this.g);
    }

    static toCanvas(text:string,x:number,y:number,container?:HTMLElement){
        let div = tools.isEmpty(container) ? document.createElement( 'div') : container;
        new QRCode(div,{
            text:text,
            width:x,
            height:y,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        let canvas = div.getElementsByTagName("canvas")[0];
        return canvas;
    }
}
