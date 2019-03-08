/// <amd-module name="Draw"/>
import {QrCode} from "./QRCode";

interface ILocPara{
    x:number,//横坐标
    y:number,//纵坐标
    w?:number,
    h?:number
}
interface IShapeCss{
    angle?:number,//默认为0不旋转
    brushColor?:string,//默认为黑色，填充图形里面的颜色
    penColor?:string,//图形边框的颜色 默认为黑色
    brushStyle?:number,//默认为实心填充 图形的填充类型
    penStyle?:number,//默认为实线 图形边框的类型  实线 虚线等
    penWidth?:number//画笔的粗细
}
interface IFontStyle{
    fontName?:string,
    fontSize?:number,
    fontColor?:string,
    fontStyle?:number
}
interface ITextCss{
    alignment?:number,//0：左对齐；1：右对齐；2：居中
    backColor?:string,//背景色，颜色RGB的十进制值
    font?:IFontStyle,
    forFill?:boolean,//在套打标签时，指明该对象是否打印。true：打印；false：不打印
    autoSize?:boolean,//自动大小。根据对小的大小自动调整，此时width和height参数失效
    stretch?:boolean,//将对象伸延至width和height大小
    transparent?:boolean,//对象透明
    wrapping?:boolean//是否换行
}
interface ICanvasStyle{
    width:number,
    height:number
}
export class Draw{
    private canvas : HTMLCanvasElement;
    private ctx : CanvasRenderingContext2D;
    constructor(can : ICanvasStyle){
        this.init(can);
    }
    init(can : ICanvasStyle){
        this.canvas = document.createElement('canvas');
        this.canvas.width = can.width * window.devicePixelRatio;
        this.canvas.height = can.height * window.devicePixelRatio;
        this.canvas.style.width = can.width +"px";
        this.canvas.style.height  = can.height + "px";
        this.ctx = this.canvas.getContext('2d');
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    }
    graph(shapeKind : number,loc : ILocPara,sty : IShapeCss){//画图形
        sty = Object.assign(Draw.defaultPara.shapeDefaultPara,sty);
        this.shapeKindFun[shapeKind].call(this,this.ctx,loc,sty);//根据图形字段调用相应图形函数
    }
    text(data : string,loc : ILocPara,sty : ITextCss){//画文字
        if(data){//当文字内容为null时候不绘制该文字
            data = data.replace(/null/g, "");
            sty = G.tools.obj.merge(true,Draw.defaultPara.textDefaultPara,sty);
            if(loc.w&&loc.h) {
                let tempCanvas = document.createElement("canvas");//创建一个临时canvas保存字体的背景以及字体的内容
                let tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = loc.w;
                tempCanvas.height = loc.h;
                for (let key in sty) {//循环设置字体的所有样式
                    if (!this.contains(key))//过滤掉某些不需要执行的样式
                        this.textStyleFun[key].call(this, tempCtx, loc, sty);
                }
                // debugger;
                tempCtx.textBaseline = "top";//设置文字的基线为top
                this.drawText(data, tempCtx, loc, sty);//绘制文字
                let imgData = tempCtx.getImageData(0,0,tempCanvas.width,tempCanvas.height);
                this.ctx.putImageData(imgData, loc.x, loc.y);
            }
            else{
                this.ctx.save();
                for (let key in sty) {//循环设置字体的所有样式
                    if (!this.contains(key))//过滤掉某些不需要执行的样式
                        this.textStyleFun[key].call(this, this.ctx, loc, sty);
                }
                this.ctx.textBaseline = "top";//设置文字的基线为top
                this.ctx.fillText(data,loc.x,loc.y);
                this.ctx.restore();
            }
        }
    }

    insertImg(loc: ILocPara ,url : string | HTMLImageElement ,callback?:Function ) {
        let  _ctx = this.ctx,
             imgObj = new Image();
        if(typeof url === 'string') {

            imgObj.src = url;
            imgObj.onload = () => {
                _ctx.drawImage(imgObj, loc.x, loc.y, loc.w, loc.h);
                let base = this.canvas.toDataURL("image/png", 1.0);
                typeof callback === 'function' && callback(base);
            }
        }else {
                _ctx.drawImage(url, loc.x, loc.y, loc.w, loc.h);
                let base = this.canvas.toDataURL("image/jpeg", 1.0);
                typeof callback === 'function' && callback(base);
        }
    }

   //插入 二维码canvas
    /*
    * ewmW:二维码生成的宽
    * ewmH:二维码生成的高
    * ewmContent:二维码内容
    * 显示部分
    * posionX:显示在canvas的X位置坐标
    * posionY:显示在canvas的Y位置坐标
    *
    * */
     insertCanvas( canvas:HTMLCanvasElement,posionX ?:number,posionY ?:number,) {
         let ewmPen = canvas.getContext('2d');
         //获取到二维码的像素点
         let imgDataA = ewmPen.getImageData(0,0,canvas.width,canvas.height);
         this.ctx.putImageData(imgDataA,posionX,posionY);
     }


    getPng(){//获取canvas图片的png格式二进制流
        return this.canvas.toDataURL("image/png");
    }
    getCanvasCt() : CanvasRenderingContext2D{//获取canvas环境 由一维码 或者 二维码类调用
        return this.ctx;
    }
    getCanvas() : HTMLCanvasElement{//获取canvas 由一维码 或者 二维码类调用
        return this.canvas;
    }
    private shapeKindFun = (function(self){//绘制具体图案的方法
        let arr = [];
        arr[Draw.graphKind.rectangle] = function(ctx:CanvasRenderingContext2D,loc:ILocPara,sty:IShapeCss){//长方形或者正方形
            ctx.save();
            if(sty.angle){
                let  rectCenterPoint;
                loc.h? rectCenterPoint = {x: loc.x+loc.w/2, y: loc.y+loc.h/2}:rectCenterPoint = {x: loc.x+loc.w/2, y: loc.y+loc.w/2};
                ctx.translate(rectCenterPoint.x, rectCenterPoint.y);
                ctx.rotate(sty.angle);
                ctx.translate(-rectCenterPoint.x, -rectCenterPoint.y);
            }
            if(sty.penStyle==6){
                ctx.beginPath();
                ctx.moveTo(loc.x+sty.penWidth,loc.y+sty.penWidth);
                ctx.lineTo(loc.x+loc.w-sty.penWidth,loc.y+sty.penWidth);
                loc.h?ctx.lineTo(loc.x+loc.w-sty.penWidth,loc.y+loc.h-sty.penWidth):ctx.lineTo(loc.x+loc.w-sty.penWidth,loc.y+loc.w-sty.penWidth);
                loc.h?ctx.lineTo(loc.x+sty.penWidth,loc.y+loc.h-sty.penWidth):ctx.lineTo(loc.x+sty.penWidth,loc.y+loc.w-sty.penWidth);
                ctx.lineTo(loc.x+sty.penWidth,loc.y+sty.penWidth);
                Draw.brushStyleFun.brush(ctx,sty);
                ctx.lineWidth=1;
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(loc.x,loc.y);
                ctx.lineTo(loc.x+loc.w,loc.y);
                ctx.lineTo(loc.x+loc.w,loc.y+loc.h);
                ctx.lineTo(loc.x,loc.y+loc.h);
                ctx.lineTo(loc.x,loc.y);
                ctx.lineWidth=1;
                ctx.stroke();
            }
            else{
                ctx.beginPath();
                ctx.moveTo(loc.x+sty.penWidth/2,loc.y+sty.penWidth/2);
                ctx.lineTo(loc.x+loc.w-sty.penWidth/2,loc.y+sty.penWidth/2);
                loc.h?ctx.lineTo(loc.x+loc.w-sty.penWidth/2,loc.y+loc.h-sty.penWidth/2):ctx.lineTo(loc.x+loc.w-sty.penWidth/2,loc.y+loc.w-sty.penWidth/2);
                loc.h?ctx.lineTo(loc.x+sty.penWidth/2,loc.y+loc.h-sty.penWidth/2):ctx.lineTo(loc.x+sty.penWidth/2,loc.y+loc.w-sty.penWidth/2);
                ctx.lineTo(loc.x+sty.penWidth/2,loc.y+sty.penWidth/2);
                Draw.brushStyleFun.brush(ctx,sty);
                ctx.fill();
                ctx.stroke();
            }
            ctx.restore();
        };
        arr[Draw.graphKind.circle] = function(ctx:CanvasRenderingContext2D,loc:ILocPara,sty:IShapeCss){//圆或者椭圆
            ctx.save();
            if(sty.angle){
                let  rectCenterPoint;
                rectCenterPoint = {x: loc.x, y: loc.y};
                ctx.translate(rectCenterPoint.x, rectCenterPoint.y);
                ctx.rotate(sty.angle);
                ctx.translate(-rectCenterPoint.x, -rectCenterPoint.y);
            }
            if(loc.h){//如果有传高度则为椭圆
                if(sty.penStyle==6){//画笔类型为透视效果
                    ctx.save();
                    let r = (loc.w > loc.h) ? loc.w : loc.h;
                    let ratioX = loc.w / r;
                    let ratioY = loc.h / r;
                    ctx.scale(ratioX, ratioY);
                    ctx.beginPath();
                    ctx.arc(loc.x / ratioX, loc.y / ratioY, r-sty.penWidth, 0, 2 * Math.PI, false);
                    Draw.brushStyleFun.brush(ctx,sty);
                    ctx.lineWidth=1;
                    ctx.fill();
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(loc.x / ratioX, loc.y / ratioY, r, 0, 2 * Math.PI, false);
                    ctx.stroke();
                    ctx.restore();
                }
                else{//画笔类型不为透视效果
                    ctx.save();
                    let r = (loc.w > loc.h) ? loc.w : loc.h;
                    let ratioX = loc.w / r;
                    let ratioY = loc.h / r;
                    ctx.scale(ratioX, ratioY);
                    ctx.beginPath();
                    ctx.arc(loc.x / ratioX, loc.y / ratioY, r-sty.penWidth/2, 0, 2 * Math.PI, false);
                    Draw.brushStyleFun.brush(ctx,sty);
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                }
            }
            else{
                if(sty.penStyle==6){//画笔类型为透视效果
                    ctx.beginPath();
                    ctx.arc(loc.x,loc.y,loc.w-sty.penWidth,0,2*Math.PI);
                    Draw.brushStyleFun.brush(ctx,sty)
                    ctx.lineWidth=1;
                    ctx.fill();
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(loc.x,loc.y,loc.w,0,2*Math.PI);
                    Draw.brushStyleFun.brush(ctx,sty)
                    ctx.lineWidth =1;
                    ctx.stroke();
                }
                else{
                    ctx.beginPath();
                    ctx.arc(loc.x,loc.y,loc.w-sty.penWidth/2,0,2*Math.PI);
                    Draw.brushStyleFun.brush(ctx,sty)
                    ctx.fill();
                    ctx.stroke();
                }
            }
            ctx.restore();
        };
        arr[Draw.graphKind.verticalLine] = function(ctx:CanvasRenderingContext2D,loc:ILocPara,sty:IShapeCss){//竖线
            ctx.save();
            if(sty.penStyle==6){
                ctx.beginPath();
                ctx.moveTo(loc.x+0.5,loc.y+0.5);
                ctx.lineTo(loc.x+sty.penWidth-0.5,loc.y+0.5);
                ctx.lineTo(loc.x+sty.penWidth-0.5,loc.y+loc.h-0.5);
                ctx.lineTo(loc.x+0.5,loc.y+loc.h-0.5);
                ctx.lineTo(loc.x+0.5,loc.y+0.5);
                Draw.brushStyleFun.brushLine(ctx,sty);
                ctx.lineWidth=1;
                ctx.stroke();
            }
            else{
                ctx.beginPath();
                ctx.moveTo(loc.x+sty.penWidth/2,loc.y);
                ctx.lineTo(loc.x+sty.penWidth/2,loc.y+loc.h);
                Draw.brushStyleFun.brushLine(ctx,sty);
                ctx.stroke();
            }
            ctx.restore();
        };
        arr[Draw.graphKind.line] = function(ctx:CanvasRenderingContext2D,loc:ILocPara,sty:IShapeCss){//横线
            ctx.save();
            if(sty.penStyle==6){
                ctx.beginPath();
                ctx.moveTo(loc.x+0.5,loc.y+0.5);
                ctx.lineTo(loc.x+loc.w-0.5,loc.y+0.5);
                ctx.lineTo(loc.x+loc.w-0.5,loc.y+sty.penWidth-0.5);
                ctx.lineTo(loc.x+0.5,loc.y+sty.penWidth-0.5);
                ctx.lineTo(loc.x+0.5,loc.y+0.5);
                Draw.brushStyleFun.brushLine(ctx,sty);
                ctx.lineWidth=1;
                ctx.stroke();
            }
            else{
                ctx.beginPath();
                ctx.moveTo(loc.x,loc.y+sty.penWidth/2);
                ctx.lineTo(loc.x+loc.w,loc.y+sty.penWidth/2);
                Draw.brushStyleFun.brushLine(ctx,sty);
                ctx.stroke();
            }
            ctx.restore();
        };
        arr[Draw.graphKind.upAndDownParallelLine] = function(ctx:CanvasRenderingContext2D,loc:ILocPara,sty:IShapeCss){//上下平行线
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(loc.x,loc.y+sty.penWidth/2);
            ctx.lineTo(loc.x+loc.w,loc.y+sty.penWidth/2);
            ctx.moveTo(loc.x,loc.y+sty.penWidth/2+loc.h);
            ctx.lineTo(loc.x+loc.w,loc.y+sty.penWidth/2+loc.h);
            Draw.brushStyleFun.brushLine(ctx,sty);
            ctx.stroke();
            ctx.restore();
        };
        arr[Draw.graphKind.leftAndRightParallelLine] = function(ctx:CanvasRenderingContext2D,loc:ILocPara,sty:IShapeCss){//上下平行线
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(loc.x+sty.penWidth/2,loc.y);
            ctx.lineTo(loc.x+sty.penWidth/2,loc.y+loc.h);
            ctx.moveTo(loc.x+sty.penWidth/2+loc.w,loc.y);
            ctx.lineTo(loc.x+sty.penWidth/2+loc.w,loc.y+loc.h);
            Draw.brushStyleFun.brushLine(ctx,sty);
            ctx.stroke();
            ctx.restore();
        };
        return arr;
    }(this))
    private textStyleFun = (function(self){//设置文字的所有样式函数
        let arr = [];
        arr['backColor'] = function(tempCtx:CanvasRenderingContext2D,loc:ILocPara,sty:ITextCss) {
            // debugger;
            tempCtx.save();
            // sty.transparent === true ? tempCtx.globalAlpha = 0 : '';
            // sty.transparent === false ? tempCtx.globalAlpha = 1 : '';
            // typeof sty.transparent == 'number' ? tempCtx.globalAlpha = Number(sty.transparent) : '';
            // tempCtx.fillStyle = '#' + sty['backColor'].toString(16);
            // let {r, g, b} = G.tools.val2RGB(sty['backColor']);
            // tempCtx.fillStyle = `rgb(${r},${g},${b})`;
            tempCtx.fillStyle = sty.backColor;
            tempCtx.fillRect(0, 0, loc.w, loc.h);
            // tempCtx.restore();
        };
        arr['font'] = function(tempCtx:CanvasRenderingContext2D,loc:ILocPara,sty:ITextCss){
            tempCtx.fillStyle =sty.font.fontColor;
            if(sty['font']['IFontStyle']===1){
                tempCtx.font = "bolder "+sty['font']['fontSize'] +"px" +" "+ 'Source Han Sans CN';
            }
            else{
                tempCtx.font = sty['font']['fontSize'] +"px" +" "+ 'Source Han Sans CN';
            }
        };
        arr['forFill'] = function(){

        };
        arr['stretch'] = function(tempCtx:CanvasRenderingContext2D,loc:ILocPara,sty:ITextCss){
            if(!sty['autoSize']&&sty['stretch']){
                tempCtx.font = loc.h +"px" +" "+ sty['font']['fontName'];
            }
        };
        return arr;
    }(this))
    private drawText(data : string,tempCtx : CanvasRenderingContext2D,loc : ILocPara,sty : ITextCss){//绘制文字的方法
        /*传进alignment需要根据居中，左对齐，右对齐来相应的调整文字显示的位置
         *如果autoSize为false 且 stretch为true则自动将文字填充为width和height的大小，
         *此时需要调整文字显示位置不为居中而是从0,0开始显示
        * */
        //debugger
        if(sty['wrapping']&&(tempCtx.measureText(data).width)>loc.w){
            let tempTextArr = data.split("\r\n");
            if(tempTextArr.length>1){
                for(let j=0;j<tempTextArr.length;j++){
                    tempCtx.fillText(tempTextArr[j],0,(j*sty.font.fontSize)+5*j);
                }
            }
            else{
                let wrapText = tempCtx.measureText(data).width,
                    tempText = [],
                    len = Math.floor((loc.w/wrapText)*data.length) - 1,   // 换行时有时最后一个字体会被遮挡故减1
                    tempLen = len,
                    i = 0;

                while(tempLen==len){
                    let tempWrapText = data.substring(i*len,(i+1)*len);
                    tempText.push(tempWrapText);
                    i++;
                    tempLen = tempWrapText.length;
                }
                tempCtx.textAlign=Draw.alignMent[0];
                for(let j=0;j<tempText.length;j++){
                    tempCtx.fillText(tempText[j],0,(j*sty.font.fontSize)+3*j);
                }
            }

        }
        else{
            let tempTextArr = data.split("\r\n");
            if(tempTextArr.length>=1){
                for(let j=0;j<tempTextArr.length;j++){
                    tempCtx.fillText(tempTextArr[j],0,(j*sty.font.fontSize)+5*j);
                }
            }
            else {

                tempCtx.textAlign = Draw.alignMent[sty["alignment"]];
                sty['alignment'] == 0 ?
                    loc.w && loc.h ? tempCtx.fillText(data, 0, (!sty['autoSize'] && sty['stretch']) ? 0 : (loc.h - sty.font.fontSize) / 2) : tempCtx.fillText(data, 0, 0) : "";
                sty['alignment'] == 1 ?
                    loc.w && loc.h ? tempCtx.fillText(data, 0 + loc.w, (!sty['autoSize'] && sty['stretch']) ? 0 : (loc.h - sty.font.fontSize) / 2) : tempCtx.fillText(data, 0, 0) : "";
                sty['alignment'] == 2 ?
                    loc.w && loc.h ? tempCtx.fillText(data, 0 + loc.w / 2, (!sty['autoSize'] && sty['stretch']) ? 0 : (loc.h - sty.font.fontSize) / 2) : tempCtx.fillText(data, 0, 0) : "";
            }
        }
    }
    private contains = function(key : string) : boolean{//判断key是否在指定的数组里面
        let tempArr = ['dataName','alignment','autoSize','transparent','wrapping'];
        var index = tempArr.length;
        while (index--) {
            if (tempArr[index] === key) {
                return true;
            }
        }
        return false;
    }
    static defaultPara = {//默认参数
        textDefaultPara:{
            alignment:0,
            backColor: '#fff',
            font:{fontName:'黑体',fontSize:7,fontColor:'#000',fontStyle:0},
            forFill:false,
            autoSize:true,
            stretch:true,
            transparent:false,
            wrapping:false
        },
        shapeDefaultPara:{
            brushColor: '#000',//默认填充颜色黑色
            brushStyle: 0,//默认填充类型实心填充
            penColor: '#000',//默认画笔颜色黑色
            penStyle: 0,//默认图形边框类型 实线
            penWidth: 1//默认画笔宽度 1
        }
    }
    static brushStyleFun = {
        brush:function(ctx:CanvasRenderingContext2D,sty:IShapeCss){//填充图形样式
            let p = document.createElement("canvas");
            p.width=16;
            p.height=8;
            let pctx=p.getContext('2d');
            sty.penStyle==6?'':ctx.setLineDash(Draw.lineStyle[sty.penStyle]);
            pctx.strokeStyle = sty.brushColor;
            ctx.strokeStyle =  sty.penColor;
            pctx.lineWidth=sty['fillPenWidth']?sty['fillPenWidth']:1;
            ctx.lineWidth=sty['borderPenWidth']?sty['borderPenWidth']:sty['penWidth'];

            let offset=16;
            let x0=0,y0=0,x1=0,y1=0;
            if(sty.brushStyle==1){
                ctx.fillStyle = "white";
            }
            else if(sty.brushStyle==2){
                p.width=16;
                p.height=6;
                pctx.strokeStyle = sty.brushColor;
                pctx.beginPath();
                pctx.moveTo(0,3);
                pctx.lineTo(16,3);
                pctx.stroke();
                ctx.fillStyle=ctx.createPattern(p,'repeat');
            }
            else if(sty.brushStyle==3){
                p.width=6;
                p.height=16;
                pctx.strokeStyle = sty.brushColor;
                pctx.beginPath();
                pctx.moveTo(3,0);
                pctx.lineTo(3,16);
                pctx.closePath();
                pctx.stroke();
                ctx.fillStyle=ctx.createPattern(p,'repeat');
            }
            else if(sty.brushStyle==4){
                x0=-2;
                x1=18;
                y0=-1;
                y1=9;
                pctx.beginPath();
                pctx.moveTo(x0,y0);
                pctx.lineTo(x1,y1);
                pctx.moveTo(x0-offset,y0);
                pctx.lineTo(x1-offset,y1);
                pctx.moveTo(x0+offset,y0);
                pctx.lineTo(x1+offset,y1);
                pctx.stroke();
                ctx.fillStyle=ctx.createPattern(p,'repeat');
            }
            else if(sty.brushStyle==5){
                x0=18;
                x1=-2;
                y0=-1;
                y1=9;
                pctx.beginPath();
                pctx.moveTo(x0,y0);
                pctx.lineTo(x1,y1);
                pctx.moveTo(x0-offset,y0);
                pctx.lineTo(x1-offset,y1);
                pctx.moveTo(x0+offset,y0);
                pctx.lineTo(x1+offset,y1);
                pctx.stroke();
                ctx.fillStyle=ctx.createPattern(p,'repeat');
            }
            else if(sty.brushStyle==6){
                p.width=10;
                p.height=10;
                pctx.strokeStyle = sty.brushColor;
                pctx.beginPath();
                pctx.moveTo(0,5);
                pctx.lineTo(10,5);
                pctx.moveTo(5,0);
                pctx.lineTo(5,10);
                pctx.stroke();
                ctx.fillStyle=ctx.createPattern(p,'repeat');
            }
            else if(sty.brushStyle==7){
                x0=-2;
                x1=18;
                y0=-1;
                y1=9;
                pctx.strokeStyle = sty.brushColor;
                pctx.lineWidth = sty.penWidth;
                pctx.beginPath();
                pctx.moveTo(x0,y0);
                pctx.lineTo(x1,y1);
                pctx.moveTo(x0-offset,y0);
                pctx.lineTo(x1-offset,y1);
                pctx.moveTo(x0+offset,y0);
                pctx.lineTo(x1+offset,y1);
                pctx.stroke();
                x0=18;
                x1=-2;
                y0=-1;
                y1=9;
                pctx.beginPath();
                pctx.moveTo(x0,y0);
                pctx.lineTo(x1,y1);
                pctx.moveTo(x0-offset,y0);
                pctx.lineTo(x1-offset,y1);
                pctx.moveTo(x0+offset,y0);
                pctx.lineTo(x1+offset,y1);
                pctx.stroke();
                ctx.fillStyle=ctx.createPattern(p,'repeat');
            }
            else{
                ctx.fillStyle = sty.penColor;
            }
        },
        brushLine(ctx:CanvasRenderingContext2D,sty:IShapeCss){//直线样式
            sty.penStyle==6?'':ctx.setLineDash(Draw.lineStyle[sty.penStyle]);
            ctx.lineWidth = sty.penWidth;
            ctx.strokeStyle = sty.penColor;
        }
    };
    static lineStyle = {//直线填充形状类型
        0:[],//实线
        1:[5,5],//虚线
        2:[2, 2],//点线
        3:[10,10,4,10],//虚点线
        4:[30,10,4,10,4,10],//虚点点线
        5:[0,1000]//无
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
    static alignMent = {
        0:'left',//左对齐
        1:'right',//右对齐
        2:'center'//居中
    }
}