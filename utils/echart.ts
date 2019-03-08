/// <amd-module name="Echart" />
import tools = G.tools;
interface titlePara{
    text? : string;//主标题文本
    subtext? : string;//副标题文本
    show? : boolean;//是否显示标题组件
    x? : string;//标题位置 left right center
    top? : string | number;
}
interface legendPara{
    data? : any[];//图例数据
    show? : boolean;//是否显示图例组件
    x? : string;//图例位置 left right center
    type? : string;//图例的类型 'plain'：普通图例。缺省就是普通图例 'scroll'：可滚动翻页的图例。当图例数量较多时可以使用
    orient? : string;//图例列表的布局朝向  'horizontal' 默认横向    'vertical' 纵向
    left? : string;// 图例组件离容器左侧的距离。
    top? : string;//图例组件离容器上侧的距离
    right? : string;//图例组件离容器右侧的距离
    bottom? : string;//图例组件离容器下侧的距离
    pageIconColor? :string;
}
interface gridPara{
    top? : string;
    bottom? : string;
    left? : string;
    right? : string;
    containLabel? : boolean;
}
interface xAxisPara{
    data : any[];
    boundaryGap : boolean;
    axisPointer ? : obj;
    triggerEvent : boolean;//坐标轴是否相应点击事件
}
interface yPara{
    name : string;//y轴坐标名称
    type : string;//坐标轴类型
    axisLabel? : obj;//坐标轴刻度标签的相关设置
    triggerEvent : boolean;//坐标轴是否相应点击事件
}
interface labelPara{
    normal? : obj;
    emphasis? : obj;
}
interface areaStylePara{
    normal? : obj;
}
interface seriesPara{
    name? : string;//系列名称，用于tooltip的显示，legend 的图例筛选
    type? : string;//类型
    data : any[];//数据
    yAxisIndex? : number;//使用的 y 轴的 index，在单个图表实例中存在多个 y轴的时候有用。
    center? : any[];//饼图的中心（圆心）坐标，数组的第一项是横坐标，第二项是纵坐标  default: ['50%', '50%']
    radius? : any[];//饼图的半径，数组的第一项是内半径，第二项是外半径 default: [0, '75%']
    label? : labelPara;//图形上的文本标签，可用于说明图形的一些数据信息，比如值，名称等
    areaStyle? : areaStylePara;//区域填充样式
    smooth? : boolean;//是否平滑曲线显示
    clickable?:boolean;
}
interface axisPointerPara{
    type? : string;
    crossStyle ? : obj;
}
interface tooltipPara{
    trigger? :  string;//触发类型 'axis'坐标轴触发，主要在柱状图，折线图等会使用类目轴的图表中使用
    axisPointer? : axisPointerPara;
    show? : boolean;
    formatter? : string | Function;
    position? : Function;
}
interface dataZoomPara{
    type? : string;
    disabled? : boolean;
    realtime? : boolean;
    start? : number;
    end? : number;
    show? : boolean;
}
interface echartPara{
    title? : titlePara;//标题组件
    legend? : legendPara;//图例组件
    grid? : gridPara;//坐标位置
    tooltip? : tooltipPara;//提示框组件
    xAxis? : xAxisPara;//x轴坐标
    yAxis? : yPara[];//y轴坐标
    series? : seriesPara;//坐标轴数据
    dataZoom? : dataZoomPara[];//dataZoom 组件 用于区域缩放，从而能自由关注细节的数据信息，或者概览数据整体，或者去除离群点的影响
    color? : string[];//图例颜色数组
}
export class Echart{
    private   _title : titlePara;//标题组件
    private  _legend : legendPara;//图例组件
    private    _grid : gridPara;//坐标位置
    private   _xAxis : xAxisPara;//x轴坐标
    private   _yAxis :  yPara[];//y轴坐标
    private  _series : seriesPara;//坐标轴数据
    private _tooltip : tooltipPara;//提示框组件
    private _dataZoom :  dataZoomPara[];//缩放组件
    private _color : string[];//图例颜色数组
    private   option : echartPara;//echart表格参数

    constructor(){
        this.setDefault();
    }

    private setDefault(){
        this._title = {
            text : '订单明细图',
            x : 'center'
        };
        this._grid = tools.isMb ? {
            left: '1%',
            right: '6%',
            bottom:'30px',
            containLabel: true
        } : {
            left: '1%',
            right: '15%',
            bottom: '3%',
            containLabel: true
        };
        this.option = {
            title : this._title,
             grid : this._grid
        };
    }
    set title(title : titlePara){
        this._title = title;
        this.option['title'] = title;
    }
    get title(){
        return this._title;
    }
    set legend(legend : legendPara){
        this._legend = legend;
        this.option['legend'] = legend;
    }
    get legend(){
        return this._legend;
    }
    set grid(grid : gridPara){
        this._grid = grid;
        this.option['grid'] = grid;
    }
    get grid(){
        return this._grid;
    }
    set xAxis(xAxis : xAxisPara){
        this._xAxis = xAxis;
        this.option['xAxis'] = xAxis;
    }
    get xAxis(){
        return this._xAxis;
    }
    set yAxis(yAxis :  yPara[]){
        this._yAxis = yAxis;
        this.option['yAxis'] = yAxis;
    }
    get yAxis(){
        return this._yAxis;
    }
    set series(series : seriesPara){
        this._series = series;
        this.option['series'] = series;
    }
    get series(){
        return this._series;
    }
    set tooltip(tooltip : tooltipPara){
        this._tooltip = tooltip;
        this.option['tooltip'] = tooltip;
    }
    get tooltip(){
        return this._tooltip;
    }

    set dataZoom(dataZoom : dataZoomPara[]){
        this._dataZoom = dataZoom;
        this.option['dataZoom'] = dataZoom;
    }
    get dataZoom(){
        return this._dataZoom;
    }

    set color(color : string[]){
        this._color = color;
        this.option['color'] = color;
    }
    get color(){
        return this._color;
    }
    getOption(){
        return this.option;
    }
}