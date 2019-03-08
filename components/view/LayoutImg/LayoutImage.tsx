/// <amd-module name="LayoutImage"/>
import IComponentPara = G.IComponentPara; import Component = G.Component;
import d = G.d;
interface ILayoutImagePara extends IComponentPara {
    urls: string[];
    size?: string;
}
export class LayoutImage extends Component{
    private max = 4;
    constructor(para: ILayoutImagePara) {
        super(para);
        this.urls = para.urls;
        this.size = para.size;
    }

    protected wrapperInit(para: IComponentPara): HTMLElement {
        return <div className="layout-img-wrapper"></div>;
    }

    private _urls:string[] = [];
    get urls() {
        return this._urls;
    }

    set urls(urls: string[]) {
        Array.isArray(urls) && urls.forEach(url => {
            this.add(url);
        });
    }

    set size(size:string){
        if(size) {
            this.wrapper.style.width = size;
            this.wrapper.style.height = size;
        }
    }

    add(url: string) {
        if(this._urls.length >= this.max) {
            return;
        }

        d.append(this.wrapper, <img src={url}/>);
        this._urls.push(url);
        this.wrapper.dataset.count = this._urls.length + '';
    }
}
