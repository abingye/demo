/// <amd-module name="BarCode" />
/// <amd-dependency path="JsBarcode" name="JsBarcode"/>
/// <amd-dependency path="D3" name="D3"/>
declare const JsBarcode;
interface locPara{
    x:number,//横坐标
    y:number,//纵坐标
    w?:number,
    h?:number
}
interface codePara{
    alignment?:number,
    codeData?:string,
    codeType?:number;
    codeRate?: number;
}
export class BarCode{
    private svg:SVGSVGElement;
        constructor(svgDom,loc:locPara,sty:codePara){
            this.init();
            this.draw(svgDom,loc,sty);
        }
        private init(){
            this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            this.svg.id = 'tempSvg';
            document.body.appendChild(this.svg);
        }
        private draw(svgDom:SVGSVGElement,loc:locPara,sty:codePara){
            JsBarcode("#tempSvg", sty.codeData,{
                lineColor: "#000000",
                // width: (loc.w-88)/68+1,
                width: 1,
                height: loc.h,
                margin: 0,
                displayValue: false,
                format: BarCode.CodeType[sty.codeType]
            });
            let width = this.svg.width.animVal.value;
            this.svg.setAttribute('width', `${loc.w}`);
            // this.svg.setAttribute('height', `${loc.h}`);
            this.svg.setAttribute('x', `${loc.x}`);
            this.svg.setAttribute('y', `${loc.y}`);
            this.svg.setAttribute("viewBox", `0 0 ${loc.w} ${loc.h}`);

            svgDom.appendChild(this.svg);
            setTimeout(() => {
                let boxObj = this.svg.getBBox();
                if(boxObj.width > loc.w){
                    d3.select(this.svg).remove();
                    d3.select(svgDom).append('text')
                        .html('条码宽度超出')
                        .attr('x', loc.x)
                        .attr('y', loc.y + 10)
                        // .attr('width', loc.w)
                        .attr('font-size', 10)
                        // .style('text-anchor','middle')
                }else{
                    let x;
                    switch (sty.alignment) {
                        case 0:
                            break;
                        case 1:
                            x = Math.max((loc.w - boxObj.width), 0);
                            this.svg.setAttribute('x', `${x}`);
                            break;
                        case 2:
                            x = (loc.w - boxObj.width) / 2;
                            this.svg.setAttribute('x', `${x}`);
                            break;
                    }
                }
            }, 200);
        }
        static CodeType = {
            0:'ITF',
            3:'CODE39',
            4:'CODE39',
            5:'CODE128A',
            6:'CODE128B',
            7:'CODE128C',
        }
}

