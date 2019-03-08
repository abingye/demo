/// <amd-module name="DrawSvg"/>

interface locPara{
    x:number,//横坐标
    y:number,//纵坐标
    w?:number,
    h?:number
}
interface svgStyle{
    width:number,
    height:number,
}
interface fontStyle{
    fontName?:string,
    fontSize?:number,
    fontColor?:number,
    fontStyle?:number
}
interface  textCss{
    alignment?:number,//0：左对齐；1：右对齐；2：居中 done
    backColor?:number,//背景色，颜色RGB的十进制值 done
    font?:fontStyle,//done
    forFill?:boolean,//在套打标签时，指明该对象是否打印。true：打印；false：不打印
    autoSize?:boolean,//自动大小。根据对小的大小自动调整，此时width和height参数失效 done
    stretch?:boolean,//将对象伸延至width和height大小 done
    transparent?:boolean,//对象透明 done
    wrapping?:boolean//是否换行 done
}
interface shapeCss{
    angle?:number,//默认为0不旋转
    brushColor?:number,//默认为黑色，填充图形里面的颜色 done
    penColor?:number,//图形边框的颜色 默认为黑色 done
    brushStyle?:number,//默认为实心填充 图形的填充类型 done
    penStyle?:number,//默认为实线 图形边框的类型  实线 虚线等 done
    penWidth?:number//画笔的粗细 done
}
export class DrawSvg{
    private svg : SVGSVGElement;
    private g : SVGGElement;
    private defsColor : Array<any> = [];//填充类型颜色缓存
    constructor(para : svgStyle){
        this.init(para);
    }
    graph(shapeKind : number,loc : locPara,sty : shapeCss){//画图形
        //如果为非实心填充或者空心填充添加图形填充类型
        if(!(sty.brushStyle===0 || sty.brushStyle===1)) {
            this.appendDefs(sty);
        }
        this.shapeKindFun[shapeKind].call(this,loc,sty);//根据图形字段调用相应图形函数
    }
    text(data : string,loc : locPara,sty : textCss) {//画文字
        data = data + "";
        if(loc.w || loc.h) {
            loc.h === 0 && (loc.h = sty.font.fontSize);
            //如果需要换行则创建换行的标签foreignObject；否则为不自动换行标签text
            let textDom = <SVGSVGElement>(document.createElementNS(DrawSvg.svgUrl,'text'));

            this.drawText.drawWHText(textDom,data,sty,loc);
            this.textStyleFun['font'].call(this,textDom,sty);
            this.textStyleFun['hasWHSty'].call(this,textDom,sty,loc);
            //为有宽高的字设置背景颜色，需要新创建一个矩形作为背景
            /* let fillColor = '#' + sty['backColor'].toString(16);
             let back = document.createElementNS(DrawSvg.svgUrl,'rect');
             back.setAttribute('x',`${loc.x}`);
             back.setAttribute('y',`${loc.y}`);
             back.setAttribute('width',`${loc.w}`);
             back.setAttribute('height',`${loc.h}`);
             back.setAttribute('fill',fillColor);
             this.svg.appendChild(back);*/

            this.g.appendChild(textDom);
        }
        else{
            let textDom = <SVGSVGElement>document.createElementNS(DrawSvg.svgUrl,'text');
            this.drawText.drawNotWHText(textDom,data,sty,loc);
            this.textStyleFun['font'].call(this,textDom,sty);
            this.g.appendChild(textDom);
        }
    }
    icon(iconKind : number,loc : locPara){
        this.drawIcon(iconKind,loc);
    }
    get group(){
        return this.g;
    }
    getSvg(){
        return this.svg;
    }
    private init(can : svgStyle){
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.svg.setAttribute('width',`${can.width}`);
        this.svg.setAttribute('height',`${can.height}`);
        this.svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        /*document.body.innerHTML = '';
        document.body.appendChild(this.svg);*/
        this.svg.appendChild(this.g);
    }
    private drawIcon(iconKind : number,loc : locPara){
        let svgimg = document.createElementNS('http://www.w3.org/2000/svg','image');
        svgimg.setAttributeNS(null,'height',`${loc.h}`);
        svgimg.setAttributeNS(null,'width',`${loc.w}`);
        //TODO 图片位置错误
        svgimg.setAttributeNS('http://www.w3.org/1999/xlink','href', G.requireBaseUrl + `../img/label/${iconKind}${DrawSvg.iconSuffix[iconKind]}`);
        svgimg.setAttributeNS(null,'x',`${loc.x}`);
        svgimg.setAttributeNS(null,'y',`${loc.y}`);
        svgimg.setAttributeNS(null, 'visibility', 'visible');
        this.g.appendChild(svgimg);
    };
    private drawText = (function(self){
        let wrapBreak = (text: string, allWidth: number, font: number): string[] => {
            text = text || '';
            let maxCount = Math.floor(allWidth / font),
                index = 0,
                // 将字符串中的字符与转义字符分开
                textArr: string[] = text.match(/&[a-zA-Z]+;|&#\d+;|[\w\W]/g) || [],
                result: string[] = [];

            while(index * maxCount < textArr.length){
                result.push(textArr.slice(index * maxCount, (index + 1) * maxCount).join(''));
                index ++;
            }
            return result;
        };

        let drawWHText = function(textDom:SVGSVGElement,data:string,sty:textCss,loc:locPara){
            textDom.setAttribute('x',`${loc.x}`);
            textDom.setAttribute('y',`${loc.y}`);
            textDom.setAttribute('width',`${loc.w}`);
            textDom.setAttribute('height',`${loc.h}`);
            textDom.setAttribute('dominant-baseline','text-before-edge');
            let tempTextArr = data.split("\r\n"),innerText = '';
            if(tempTextArr.length>1){
                for(let j=0;j<tempTextArr.length;j++){
                    innerText += `<tspan xml:space='preserve' x="${loc.x}" dy="${j*sty.font.fontSize+3}">${tempTextArr[j]}</tspan>`;
                }
                if(sty.wrapping){
                    let fontSize = sty.font.fontSize;
                    wrapBreak(innerText, loc.w, fontSize).forEach((txt, index) => {
                        let tspan  = <SVGSVGElement>document.createElementNS(DrawSvg.svgUrl,'tspan');
                        // tspan.setAttribute('x',loc.x + '');
                        tspan.setAttribute('dy',fontSize * 1.2 * index + '');
                        tspan.innerHTML = txt;
                        textDom.appendChild(tspan);
                    })
                }else{
                    textDom.innerHTML = innerText;
                }
            }
            else {
                if(data.indexOf(" ") > -1 && data.indexOf("<") !== 0){
                    data = data.replace(/\s/g,"&ensp;");
                }
                if(sty.wrapping){
                    let fontSize = sty.font.fontSize;
                    wrapBreak(data, loc.w, fontSize).forEach((txt, index) => {
                        let tspan  = <SVGSVGElement>document.createElementNS(DrawSvg.svgUrl,'tspan');
                        tspan.setAttribute('x',loc.x + '');
                        tspan.setAttribute('y',fontSize * 1.2 * index + loc.y + '');
                        tspan.innerHTML = txt;
                        textDom.appendChild(tspan);
                    })
                }else {
                    textDom.innerHTML = data;
                }
            }
        };

        let drawNotWHText = function(textDom:SVGSVGElement,data:string,sty:textCss,loc:locPara){
            textDom.setAttribute('x',`${loc.x}`);
            textDom.setAttribute('y',`${loc.y}`);
            textDom.setAttribute('dominant-baseline','text-before-edge');
            if(data.indexOf(" ") > -1){
                data = data.replace(/\s/g,"&ensp;");
            }
            textDom.innerHTML = data;
        };
        return {drawWHText,drawNotWHText};
    })(this);
    private textStyleFun = (function(self){//设置文字的所有样式函数
        let arr = [];
        arr['font'] = function(textDom:SVGSVGElement,sty:textCss){
            if(sty['font']['fontStyle']===1) {
                textDom.setAttribute('font-weight', "bold");
            }
                textDom.setAttribute('font-size',`${sty.font.fontSize}px`);
                textDom.setAttribute('font-family',`${sty.font.fontName}`);
                textDom.setAttribute('fill','#'+ sty['font']['fontColor'].toString(16));
        };
        arr['hasWHSty'] = function(textDom:SVGSVGElement,sty:textCss,loc:locPara){
            sty.transparent && textDom.setAttribute('opacity','0');
            typeof sty.transparent=='number' && textDom.setAttribute('opacity',`${Number(sty.transparent)}`);
            textDom.setAttribute('style',`text-align:${DrawSvg.alignMent[sty.alignment]};`);
            switch (sty.alignment){
                case 0:
                    textDom.setAttribute('style',`text-anchor: start;`);
                    textDom.setAttribute('x',`${loc.x}`);
                    break;
                case 1:
                    textDom.setAttribute('style',`text-anchor: end;`);
                    textDom.setAttribute('x',`${loc.x + loc.w}`);
                    break;
                case 2:
                    textDom.setAttribute('style',`text-anchor: middle;`);
                    textDom.setAttribute('x',`${loc.x + loc.w / 2}`);
                    break;
            }
            if(!sty['autoSize']&&sty['stretch']){
                textDom.setAttribute('font-size',`${loc.h}px`);
            }
            if(sty['autoSize']){
                textDom.setAttribute('width',`${textDom.innerHTML.length*sty.font.fontSize}px`);
                textDom.setAttribute('height',`${sty.font.fontSize}px`);
            }
        };
        return arr;
    }(this));
    private shapeKindFun = (function(self){//绘制具体图案的方法
        let arr = [];
        arr[DrawSvg.graphKind.rectangle] = function(loc:locPara,sty:shapeCss){
               let rect = document.createElementNS(DrawSvg.svgUrl,'rect'),rectStyle,borderDom = null;
                let fillColor = sty.brushColor ? '#' + sty['brushColor'].toString(16) : 'black';
                let borderColor = sty.penColor ? '#' + sty['penColor'].toString(16) : 'black';
               if(!(sty.brushStyle===0 || sty.brushStyle===1)){
                    rectStyle = `fill:url(#${DrawSvg.fillKindNumber[sty.brushStyle]}${fillColor});stroke:${borderColor};stroke-width:${sty.penStyle === 6 ? 1 : sty.penWidth}`;//设置边框颜色，填充颜色，边框线条宽度
                }else{
                    rectStyle = `fill:${sty.brushStyle ? 'white' : fillColor};stroke:${borderColor};stroke-width:${sty.penStyle === 6 ? 1 : sty.penWidth}`;//设置边框颜色，填充颜色，边框线条宽度
                }
               if(sty.penStyle !== 6){ //判断是否是透视效果
                   rect.setAttribute('stroke-dasharray',DrawSvg.lineStyle[sty.penStyle]);
                   rect.setAttribute('width',`${loc.w - sty.penWidth}`);
                   rect.setAttribute('height',`${loc.h - sty.penWidth}`);
                   rect.setAttribute('x',`${loc.x}`);
                   rect.setAttribute('y',`${loc.y}`);
                }
              else {
                   borderDom = document.createElementNS(DrawSvg.svgUrl,'rect');//透视边框节点
                   borderDom.setAttribute('width',`${loc.w}`);
                   borderDom.setAttribute('height',`${loc.h}`);
                   borderDom.setAttribute('x',`${loc.x}`);
                   borderDom.setAttribute('y',`${loc.y}`);
                   borderDom.setAttribute('style',`fill:white;stroke:${borderColor};stroke-width:1;`);
                   rect.setAttribute('width',`${loc.w-2*sty.penWidth}`);
                   rect.setAttribute('height',`${loc.h-2*sty.penWidth}`);
                   rect.setAttribute('x',`${loc.x+sty.penWidth}`);
                   rect.setAttribute('y',`${loc.y+sty.penWidth}`);
               }
               rect.setAttribute('style',rectStyle);
               borderDom && self.svg.appendChild(borderDom);
               self.svg.appendChild(rect);
        };
        arr[DrawSvg.graphKind.circle] = function(loc:locPara,sty:shapeCss){
            let fillColor = sty.brushColor ? '#' + sty['brushColor'].toString(16) : 'black';
            let borderColor = sty.penColor ? '#' + sty['penColor'].toString(16) : 'black';
            let circle,circleStyle,borderDom = null;
            if(!(sty.brushStyle===0 || sty.brushStyle===1)){
                circleStyle = `fill:url(#${DrawSvg.fillKindNumber[sty.brushStyle]}${fillColor});stroke:${borderColor};stroke-width:${sty.penStyle === 6 ? 1 : sty.penWidth}`;//设置边框颜色，填充颜色，边框线条宽度
            }else{
                circleStyle = `fill:${sty.brushStyle ? 'white' : fillColor};stroke:${borderColor};stroke-width:${sty.penStyle === 6 ? 1 : sty.penWidth}`;//设置边框颜色，填充颜色，边框线条宽度
            }
            if(loc.w && loc.h && (loc.w !== loc.h)){ //椭圆
                circle = document.createElementNS(DrawSvg.svgUrl,'ellipse');
                if(sty.penStyle !== 6){ //判断是否是透视效果
                    circle.setAttribute('rx',`${loc.w/2 - sty.penWidth/2}`);
                    circle.setAttribute('ry',`${loc.h/2 - sty.penWidth/2}`);
                    circle.setAttribute('cx',`${loc.x + loc.w/2}`);
                    circle.setAttribute('cy',`${loc.y + loc.h/2}`);
                    circle.setAttribute('stroke-dasharray',DrawSvg.lineStyle[sty.penStyle]);
                }
                else{
                    borderDom = document.createElementNS(DrawSvg.svgUrl,'circle');//透视边框节点
                    borderDom.setAttribute('rx',`${loc.w/2}`);
                    borderDom.setAttribute('ry',`${loc.h/2}`);
                    borderDom.setAttribute('cx',`${loc.x + loc.w/2}`);
                    borderDom.setAttribute('cy',`${loc.y + loc.h/2}`);
                    borderDom.setAttribute('style',`fill:white;stroke:${borderColor};stroke-width:1;`);
                    circle.setAttribute('rx',`${loc.w/2 - sty.penWidth}`);
                    circle.setAttribute('ry',`${loc.h/2 - sty.penWidth}`);
                    circle.setAttribute('cx',`${loc.x + loc.w/2}`);
                    circle.setAttribute('cy',`${loc.y + loc.h/2}`);
                }
                circle.setAttribute('style',circleStyle);
                borderDom && self.svg.appendChild(borderDom);
                self.svg.appendChild(circle);
            }
            else{//圆
                circle = document.createElementNS(DrawSvg.svgUrl,'circle');
                let r = loc.w ? loc.w/2 : loc.h/2;
                if(sty.penStyle !== 6){ //判断是否是透视效果
                    circle.setAttribute('r',`${r - sty.penWidth/2}`);
                    circle.setAttribute('cx',`${loc.x + r}`);
                    circle.setAttribute('cy',`${loc.y + r}`);
                    circle.setAttribute('stroke-dasharray',DrawSvg.lineStyle[sty.penStyle]);
                }
                else{
                    borderDom = document.createElementNS(DrawSvg.svgUrl,'circle');//透视边框节点
                    borderDom.setAttribute('r',`${r}`);
                    borderDom.setAttribute('cx',`${loc.x + r}`);
                    borderDom.setAttribute('cy',`${loc.y + r}`);
                    borderDom.setAttribute('style',`fill:white;stroke:${borderColor};stroke-width:1;`);
                    circle.setAttribute('r',`${r - sty.penWidth}`);
                    circle.setAttribute('cx',`${loc.x + r}`);
                    circle.setAttribute('cy',`${loc.y + r}`);
                }
            }
            circle.setAttribute('style',circleStyle);
            borderDom && self.svg.appendChild(borderDom);
            self.svg.appendChild(circle);
        };
        arr[DrawSvg.graphKind.verticalLine] = function(loc:locPara,sty:shapeCss){
            let line = document.createElementNS(DrawSvg.svgUrl,'line'),lineStyle,borderDom = null;
            let borderColor = sty.penColor ? '#' + sty['penColor'].toString(16) : 'black';
                lineStyle = `stroke:${borderColor};stroke-width:${sty.penStyle === 6 ? 1 : sty.penWidth}`;//设置边框颜色，边框线条宽度
            if(sty.penStyle !== 6){
                line.setAttribute('x1',`${loc.x}`);
                line.setAttribute('y1',`${loc.y}`);
                line.setAttribute('x2',`${loc.x}`);
                line.setAttribute('y2',`${loc.y + loc.h}`);
                line.setAttribute('style',lineStyle);
                line.setAttribute('stroke-dasharray',DrawSvg.lineStyle[sty.penStyle]);
            }
            else{
                borderDom = document.createElementNS(DrawSvg.svgUrl,'rect');
                borderDom.setAttribute('style',`stroke:${borderColor};stroke-width:1;`);
                borderDom.setAttribute('x',`${loc.x}`);
                borderDom.setAttribute('y',`${loc.y}`);
                borderDom.setAttribute('width',`${sty.penWidth}`);
                borderDom.setAttribute('height',`${loc.h}`);
                borderDom.setAttribute('stroke-dasharray',DrawSvg.lineStyle[sty.penStyle]);
            }
            self.svg.appendChild(borderDom ? borderDom : line);
        };
        arr[DrawSvg.graphKind.line] = function(loc:locPara,sty:shapeCss){
            let line = document.createElementNS(DrawSvg.svgUrl,'line'),lineStyle,borderDom = null;
            let borderColor = sty.penColor ? '#' + sty['penColor'].toString(16) : 'black';
            lineStyle = `stroke:${borderColor};stroke-width:${sty.penStyle === 6 ? 1 : sty.penWidth}`;//设置边框颜色，边框线条宽度
            if(sty.penStyle !== 6){
                line.setAttribute('x1',`${loc.x}`);
                line.setAttribute('y1',`${loc.y}`);
                line.setAttribute('x2',`${loc.x + loc.w}`);
                line.setAttribute('y2',`${loc.y}`);
                line.setAttribute('style',lineStyle);
                line.setAttribute('stroke-dasharray',DrawSvg.lineStyle[sty.penStyle]);
            }
            else{
                borderDom = document.createElementNS(DrawSvg.svgUrl,'rect');
                borderDom.setAttribute('style',`stroke:${borderColor};stroke-width:1;`);
                borderDom.setAttribute('x',`${loc.x}`);
                borderDom.setAttribute('y',`${loc.y}`);
                borderDom.setAttribute('width',`${loc.w}`);
                borderDom.setAttribute('height',`${sty.penWidth}`);
                borderDom.setAttribute('stroke-dasharray',DrawSvg.lineStyle[sty.penStyle]);
            }
            self.svg.appendChild(borderDom ? borderDom : line);
        };
        arr[DrawSvg.graphKind.upAndDownParallelLine] = function(loc:locPara,sty:shapeCss){
            let upLine = document.createElementNS(DrawSvg.svgUrl,'line'),
                 downLine = document.createElementNS(DrawSvg.svgUrl,'line'),
                lineStyle;
            let borderColor = sty.penColor ? '#' + sty['penColor'].toString(16) : 'black';
            lineStyle = `stroke:${borderColor};stroke-width:${sty.penWidth}`;//设置边框颜色，边框线条宽度
            upLine.setAttribute('x1',`${loc.x}`);
            upLine.setAttribute('y1',`${loc.y}`);
            upLine.setAttribute('x2',`${loc.x + loc.w}`);
            upLine.setAttribute('y2',`${loc.y}`);
            upLine.setAttribute('style',`${lineStyle}`);

            downLine.setAttribute('x1',`${loc.x}`);
            downLine.setAttribute('y1',`${loc.y + loc.h}`);
            downLine.setAttribute('x2',`${loc.x + loc.w}`);
            downLine.setAttribute('y2',`${loc.y + loc.h}`);
            downLine.setAttribute('style',`${lineStyle}`);

            self.svg.appendChild(upLine);
            self.svg.appendChild(downLine);
        };
        arr[DrawSvg.graphKind.leftAndRightParallelLine] = function(loc:locPara,sty:shapeCss){
            let leftLine = document.createElementNS(DrawSvg.svgUrl,'line'),
                rightLine = document.createElementNS(DrawSvg.svgUrl,'line'),
                lineStyle;
            let borderColor = sty.penColor ? '#' + sty['penColor'].toString(16) : 'black';
            lineStyle = `stroke:${borderColor};stroke-width:${sty.penWidth}`;//设置边框颜色，边框线条宽度
            leftLine.setAttribute('x1',`${loc.x}`);
            leftLine.setAttribute('y1',`${loc.y}`);
            leftLine.setAttribute('x2',`${loc.x}`);
            leftLine.setAttribute('y2',`${loc.y + loc.h}`);
            leftLine.setAttribute('style',`${lineStyle}`);

            rightLine.setAttribute('x1',`${loc.x + loc.w}`);
            rightLine.setAttribute('y1',`${loc.y}`);
            rightLine.setAttribute('x2',`${loc.x + loc.w}`);
            rightLine.setAttribute('y2',`${loc.y + loc.h}`);
            rightLine.setAttribute('style',`${lineStyle}`);

            self.svg.appendChild(leftLine);
            self.svg.appendChild(rightLine);
        };
        return arr;
    }(this));
    /**
     * 根据图形的brushColor来生成svg的不同defs，用作填充类型的使用
     * @param {shapeCss} sty
     */
    private appendDefs(sty : shapeCss){
        let fillColor = '#' + sty['brushColor'].toString(16);
        if(this.defsColor.indexOf(fillColor) === -1){
            this.defsColor.push(fillColor);
            this.shapeFillStyle[sty.brushStyle].call(this,fillColor,this.g);
        }
    }
    private shapeFillStyle = (function(){
        let arr = [];
        arr[DrawSvg.fillKind.shuiping] = function(color:string,svgDom:SVGSVGElement){
            (color === '#0') && (color = 'black');
            let defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = ` <pattern id="shuiping${color}" width="5" height="5" patternUnits="userSpaceOnUse">
                                        <line x1="0" y1="2.5" x2="5" y2="2.5"  style="stroke:${color};stroke-width:1" />
                                </pattern>`;
            svgDom.appendChild(defs);
        };
        arr[DrawSvg.fillKind.chuizhi] = function(color:string,svgDom:SVGSVGElement){
            (color === '#0') && (color = 'black');
            let defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = ` <pattern id="chuizhi${color}" width="5" height="5" patternUnits="userSpaceOnUse">
                                    <line x1="2.5" y1="0" x2="2.5" y2="5"  style="stroke:${color};stroke-width:1" />
                                </pattern>`;
            svgDom.appendChild(defs);
        };
        arr[DrawSvg.fillKind.youxie] = function(color:string,svgDom:SVGSVGElement){
            (color === '#0') && (color = 'black');
            let defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = ` <pattern id="youxie${color}" width="7" height="7" patternUnits="userSpaceOnUse">
                                    <line x1="0" y1="0" x2="7" y2="7"  style="stroke:${color};stroke-width:1" />
                                    <line x1="-7" y1="0" x2="0" y2="7"  style="stroke:${color};stroke-width:1" />
                                    <line x1="7" y1="0" x2="14" y2="7"  style="stroke:${color};stroke-width:1" />
                                </pattern>`;
            svgDom.appendChild(defs);
        };
        arr[DrawSvg.fillKind.zuoxie] = function(color:string,svgDom:SVGSVGElement){
            (color === '#0') && (color = 'black');
            let defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = `  <pattern id="zuoxie${color}" width="7" height="7" patternUnits="userSpaceOnUse">
                                    <line x1="7" y1="0" x2="0" y2="7"  style="stroke:${color};stroke-width:1" />
                                    <line x1="0" y1="0" x2="-7" y2="7"  style="stroke:${color};stroke-width:1" />
                                    <line x1="14" y1="0" x2="7" y2="7"  style="stroke:${color};stroke-width:1" />
                                </pattern>`;
            svgDom.appendChild(defs);
        };
        arr[DrawSvg.fillKind.fangge] = function(color:string,svgDom:SVGSVGElement){
            (color === '#0') && (color = 'black');
            let defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = `<pattern id="fangge${color}" width="5" height="5" patternUnits="userSpaceOnUse">
                                <line x1="0" y1="2.5" x2="5" y2="2.5"  style="stroke:${color};stroke-width:1" />
                                <line x1="2.5" y1="0" x2="2.5" y2="5"  style="stroke:${color};stroke-width:1" />
                            </pattern>`;
            svgDom.appendChild(defs);
        };
        arr[DrawSvg.fillKind.xiefangge] = function(color:string,svgDom:SVGSVGElement){
            (color === '#0') && (color = 'black');
            let defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = ` <pattern id="xiefangge${color}" width="7" height="7" patternUnits="userSpaceOnUse">
                                    <line x1="0" y1="0" x2="7" y2="7"  style="stroke:${color};stroke-width:1" />
                                    <line x1="-7" y1="0" x2="0" y2="7"  style="stroke:${color};stroke-width:1" />
                                    <line x1="7" y1="0" x2="14" y2="7"  style="stroke:${color};stroke-width:1" />
                                    <line x1="7" y1="0" x2="0" y2="7"  style="stroke:${color};stroke-width:1" />
                                    <line x1="0" y1="0" x2="-7" y2="7"  style="stroke:${color};stroke-width:1" />
                                    <line x1="14" y1="0" x2="7" y2="7"  style="stroke:${color};stroke-width:1" />
                                </pattern>`;
            svgDom.appendChild(defs);
        };
        return arr;
    })();
    static svgUrl:string = 'http://www.w3.org/2000/svg';
    static lineStyle = {//直线填充形状类型
        0:"",//实线
        1:"5,5",//虚线
        2:"2, 2",//点线
        3:"10,10,4,10",//虚点线
        4:"30,10,4,10,4,10",//虚点点线
        5:"0,1000"//无
        // 6:透视效果在程序中判断
    };
    static  graphKind ={//形状类型对应的执行函数
        rectangle:0,//矩形
        circle:1,//圆或者椭圆
        verticalLine:2,//竖线
        line:3,//直线
        upAndDownParallelLine:4,//上下平行线
        leftAndRightParallelLine:5//左右平行线
    };
    static  fillKind ={//图形填充类型
        shixing:0,//实心填充
        kongxin:1,//空心填充
        shuiping:2,//水平平行线填充
        chuizhi:3,//垂直平行线填充
        youxie:4,//右斜线填充
        zuoxie:5,//左斜线填充
        fangge:6,//方格填充
        xiefangge:7//斜方格填充
    };
    static  fillKindNumber = ['shixing','kongxin','shuiping','chuizhi','youxie','zuoxie','fangge','xiefangge'];
    static alignMent = {
        0:'left',//左对齐
        1:'right',//右对齐
        2:'center'//居中
    }
    static  iconSuffix = {
        1 : '.bmp',
        2 : '.bmp',
        3 : '.gif',
        4 : '.bmp',
        50000 : '.bmp',
        50001 : '.bmp',
        90000 : '.jpeg',
        90001 : '.jpeg'
    }//图表对应的图片后缀
}