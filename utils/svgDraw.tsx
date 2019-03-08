/// <amd-module name="SvgDraw"/>
/// <amd-dependency path="D3" name="D3"/>
/// <amd-dependency path="JsBarcode" name="JsBarcode"/>
/// <amd-dependency path="QRCode" name="QRCode"/>

import tools = G.tools;

declare const JsBarcode;
declare const QRCode;

export interface ISvgDrawPara{
    container?: HTMLElement; // svg的容器
    width?: number; // svg宽度
    height?: number; // svg高度
}

export interface IDrawPara{
    data?: Primitive; // 渲染的数据
    x?: number; // 渲染的位置，x轴
    y?: number; // 渲染的位置，y轴
    width?: number; // 渲染的宽度
    height?: number; // 渲染的高度
}

export interface ITextDrawPara extends IDrawPara{
    isWrap?: boolean; // 是否换行，默认false
    align?: 'start' | 'end' | 'middle'; // 文字对齐方式，默认start
    font: {
        weight?: string | number; // 字体加粗
        size: number;   // 文字大小
        family?: string; //字体
        color?: string; // 文字填充颜色 默认黑色
    };
    isItalic?: boolean;
    decoration?: 'line-through' | 'underline' | 'none'; // 下划线or删除线
    data: string;
}

export interface IBarCodeDrawPara extends IDrawPara{
    format?: string; // 条码类型
    showText?: boolean; // 是否显示条码文字，默认无
    text?: string; // 条码文字，默认无
    align?: 'start' | 'end' | 'middle'; // 条码相对于绘制区域的左右对齐方式，默认start
    background?: string; // 条码背景颜色，默认白色
    lineColor?: string; // 条码颜色，默认白色
    barCodeWidth?: number; // 条码宽度，默认1
}

export interface IImageDrawPara extends IDrawPara{
    data: string; // url 图片地址
}

export interface IShapeDrawPara extends IDrawPara{
    fill?: string;
    stroke?: {
        width?: number;
        dasharray?: string;
        color?: string;
    };
    width: number; // 渲染的宽度
    height: number; // 渲染的高度
}

interface ILineDrawPara extends IDrawPara{
    x2: number;
    y2: number;
    stroke: {
        width?: number;
        dasharray?: string;
        color?: string;
    };
}

export class SvgDraw{
    protected _svg: d3.Selection<any>;
    protected group: d3.Selection<any>;
    get svg(): d3.Selection<any>{
        return this._svg;
    }
    get svgEl(): SVGSVGElement{
        return this._svg.node() as SVGSVGElement;
    }
    get g(): d3.Selection<any>{
        return this.group;
    }
    get gEl(): SVGGElement{
        return this.group.node() as SVGGElement;
    }

    constructor(para: ISvgDrawPara){
        this._svg = d3.select(para.container || document.body)
            .append('svg')
            .attr('width', para.width)
            .attr('height', para.height)
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .style('background', '#fff');
        this.group = this._svg.append('g');
    }

    // 渲染文字
    drawText(para: ITextDrawPara){
        let {
            x,
            y,
            data,
            width,
            align,
            isWrap,
            font: {
                size,
                weight,
                family,
                color,
            },
            decoration,
            isItalic
        } = para;

        x = x || 0;
        y = y || 0;
        align = align || 'start';
        weight = weight || 'normal';
        family = family || 'Arial';
        decoration = decoration || 'none';
        isItalic = isItalic || false;

        // 生成文字，并设置属性
        let text = this.group.append('text')
            .attr('dominant-baseline', 'text-before-edge')
            .attr('text-anchor', align)
            .attr('font-size', size + 'px')
            .attr('font-weight', weight)
            .attr('font-family', family)
            .attr('fill', color || '#000')
            .attr('font-style', isItalic ? 'italic' : 'normal')
            .attr('text-decoration', decoration)
            .attr('y', y)
            .attr('x', () => {
                let delayX = x;
                if(width && typeof width === 'number'){
                    switch (align){
                        case 'end':
                            delayX = x + width;
                            break;
                        case 'middle':
                            delayX = x + width / 2;
                            break;
                    }
                }
                return delayX;
            });

        if(isWrap && width && typeof width === 'number'){
            let textArr = SvgDraw.textLineFeed(data, width, size + 'px', family, weight);
            // 生成tspan换行
            text.selectAll('tspan').data(textArr).enter().append('tspan')
                .attr('x', x)
                .attr('dy', (d, index) => {
                    return size * 1.2 * Math.min(1, index);
                })
                .html((d) => {
                    return d;
                });
        }else{
            text.html(data);
        }
    }

    // 文字换行规则
    static textLineFeed(text: string, width: number, fontSize: string, fontFamily: string = 'Arial', fontWeight: string | number = 'normal'): string[]{
        let canvasContext = document.createElement("canvas").getContext('2d'),
            textArr: string[] = text.match(/&[a-zA-Z]+;|&#\d+;|[\w\W]/g) || [],
            result = [];
        canvasContext.font = [fontWeight, fontSize, fontFamily].join(' ');

        let start = 0;
        for(let i = 0, len = textArr.length; i < len; i ++){
            let str = textArr.slice(start, i + 1).join(''),
                canvasText = str.replace(/&[a-zA-Z]+;|&#\d+;/g, ' ');
            if(canvasContext.measureText(canvasText).width >= width || i === len - 1){
                result.push(str);
                start = i + 1;
            }
        }
        return result;
    }

    // 绘制图片
    drawImage(para: IImageDrawPara){
        let {
            x,
            y,
            width,
            height,
            data
        } = para;

        x = x || 0;
        y = y || 0;

        this.group.append('image')
            .attr('x', x)
            .attr('y', y)
            .attr('width', width)
            .attr('height', height)
            .attr('xlink:href', data);
    }

    // 绘制条形码
    drawBarCode(para: IBarCodeDrawPara){
        let {
            data,
            x,
            y,
            width,
            height,
            format,
            align,
            background,
            lineColor,
            text,
            showText,
            barCodeWidth
        } = para;

        x = x || 0;
        y = y || 0;
        barCodeWidth = barCodeWidth || 1;
        showText = showText || false;
        lineColor = lineColor || '#000';
        background = background || '#fff';

        let group = this.group.append('g'),
            groupEl = group.node() as SVGGElement;

        // 绘制条形码
        JsBarcode(groupEl, data, {
            lineColor,
            background,
            // width: (loc.w-88)/68+1,
            width: barCodeWidth,
            height: height,
            margin: 0,
            displayValue: showText,
            text: text,
            format: format
        });

        let box = groupEl.getBBox(),
            boxWidth = box.width;

        // 条形码宽度超过给定宽度时，不显示条形码
        if(width && boxWidth > width){
            group.remove();
            this.drawText({
                data: '条码宽度超出',
                font: {
                    size: height * 0.75,
                },
                isWrap: false,
                x: x,
                y: y,
                width,
                height
            });
        }else{
            if(typeof width === 'number'){
                switch (align){
                    case 'end':
                        x = x + (width - boxWidth);
                        break;
                    case 'middle':
                        x = x + (width - boxWidth) / 2;
                        break;
                }
            }

            group.style('transform', `translate(${x}px, ${y}px)`);
            // group.attr('x', x).attr('y', y);
        }
    }

    // 绘制二维码
    drawQrCode(para: IDrawPara){
        let {
            data,
            width,
            height,
            x,
            y
        } = para;

        let group = this.group.append('g'),
            groupEl = group.node() as SVGGElement;

        new QRCode(groupEl, {
            useSVG: true,
            text: data,
            correctLevel: QRCode.CorrectLevel.L
        });

        group.select('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('x', x)
            .attr('y', y);
    }

    // 绘制矩形
    drawRect(para: IShapeDrawPara){
        let {
            fill,
            stroke,
            width,
            height,
            x,
            y
        } = para;

        let rect = this.group.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('x', x)
            .attr('y', y)
            .attr('fill', fill);

        // 边框
        if(tools.isNotEmpty(stroke)){
            let {
                color,
                dasharray,
                width
            } = stroke;

            rect.attr('stroke', color)
                .attr('stroke-width', width)
                .attr('stroke-dasharray', dasharray);
        }
    }

    // 绘制圆形与椭圆
    drawCircle(para: IShapeDrawPara){
        let {
            width,
            height,
            x,
            y,
            fill,
            stroke
        } = para,
            circle: d3.Selection<any>;

        // 判断是圆形还是椭圆
        if(width === height){
            //圆形
            let radius = width / 2;
            circle = this.group.append('circle')
                .attr('cx', x + radius)
                .attr('cy', y + radius)
                .attr('r', radius)
                .attr('fill', fill)
        }else{
            //椭圆
            let rx = width / 2,
                ry = height / 2;
            circle = this.group.append('ellipse')
                .attr('rx', rx)
                .attr('ry', ry)
                .attr('cx', x + rx)
                .attr('cy', y + ry)
                .attr('fill', fill)
        }

        // 边框
        if(tools.isNotEmpty(stroke)){
            let {
                color,
                dasharray,
                width
            } = stroke;

            circle.attr('stroke', color)
                .attr('stroke-width', width)
                .attr('stroke-dasharray', dasharray);
        }
    }

    // 绘制直线
    drawLine(para: ILineDrawPara){
        let {
            x,
            y,
            x2,
            y2,
            stroke: {
                color,
                width,
                dasharray
            }
        } = para;

        this.group.append('line')
            .attr('x1', x)
            .attr('y1', y)
            .attr('x2', x2)
            .attr('y2', y2)
            .attr('stroke', color)
            .attr('stroke-dasharray', dasharray)
            .attr('stroke-width', width);
    }
}
