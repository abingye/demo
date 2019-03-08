/// <amd-module name="BDMap" />
interface IBDMapPara {
    container : HTMLElement
    position : number[]
    scroll? : boolean
    mapClick? : (e)=>void
}
interface IPointPara{
    lat : number,
    lng : number
}

declare const BMap: any;
export class BDMap {
    private map : any;
    private marker : any;
    constructor(para : IBDMapPara){
        this.requireBMap().then(map => {
            this.map = new map.Map(para.container);
            if(!para.position){
                para.position = [119.173392, 26.071787];
            }
            this.init(para);
            this.addOverlay({
                lng : para.position[0],
                lat : para.position[1],
            })
        });
    }

    requireBMap() : any{
        return new Promise((resolve => {
            return require(['async!BMap'], () => {
                resolve(BMap);
            });
        }));
    }

    init(para : IBDMapPara){
        let map = this.map,
            point = new BMap.Point(para.position[0], para.position[1]);  // 中心点

        map.centerAndZoom(point, 15);  // 设初始化地图
        this.scroll = para.scroll; // 开启滚轮放大缩小
        this.mapClick = para.mapClick; // 点击事件
    }

    search(value : string){
        let localSearch = new BMap.LocalSearch(this.map,{
            renderOptions : {  // 结果呈现设置
                map : this.map
            }
        });
        localSearch.search(value);
    } 

    panTo(point : IPointPara){
        point = new BMap.Point(point.lng, point.lat);  // 中心点
        this.map.panTo(point);
    }

    // 生成新标注
    addOverlay(point : IPointPara){
        point = new BMap.Point(point.lng, point.lat);  // 中心点
        this.marker = new BMap.Marker(point);
        this.map.addOverlay(this.marker);
        this.map.panTo(point);
    }

    surroundingPois(point? : IPointPara) : Promise<obj>{
        point = point || this.getPosition() || this.map.getCenter();
        return BDMap.getSurroundingPois(point);
    }

    getPosition(){
        return this.marker && this.marker.getPosition();
    }

    // 清空标注
    clearOverlays(){
        this.map.clearOverlays();
    }

    private _click : (e) => void;
    set mapClick(click : (e)=>void){
        this._click = click;
        if(this._click){
            this.map.removeEventListener('click', this._click)
        }
        if(!click || typeof click !== 'function'){
            return;
        }
        this.map.addEventListener('click', this._click)
    }

    private _scroll : boolean;
    set scroll(scroll : boolean){
        scroll = !!scroll;
        this._scroll = scroll;
        if(scroll){
            this.map.enableScrollWheelZoom();
        }else {
            this.map.disableScrollWheelZoom();
        }
    }
    get scroll(){
        return this._scroll;
    }

    static getSurroundingPois(point : IPointPara): Promise<obj>{
        return new Promise((resolve, reject) => {
            require(['async!BMap'], () => {
                let myGeo =  new BMap.Geocoder();
                let p = new BMap.Point(point.lng, point.lat );
                myGeo.getLocation(p, (address) => {
                    resolve(address);
                });
            });
        })
    }

}


