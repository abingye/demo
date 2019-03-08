/// <amd-module name="Mask"/>
import IComponentPara = G.IComponentPara; import Component = G.Component;
import tools = G.tools;
import d = G.d;

interface IMaskPara extends IComponentPara {}

export class Mask extends Component {

    protected static instance: Mask;

    static getInstance(){
        if(!Mask.instance){
            Mask.instance = new Mask({});
        }
        return Mask.instance;
    }

    protected constructor(para) {
        super(para);
        this.init();
    }

    protected wrapperInit(): HTMLElement {
        return d.create('<div class="global-mark"></div>')
    }

    protected init() {
        let type = 'click';
        d.on(this.wrapper, type, (e) => {
            if(this.background){
                e.preventDefault();
                e.stopPropagation();
                // typeof this.onClick === 'function' && this.onClick(e);
            }
            this.clickHandlers[Mask.key] && this.clickHandlers[Mask.key](e)
        });
        // this.container = this.para.container;
        // this.container.appendChild(this.wrapper);
    }

    protected static key: any;
    show(key: any){
        this.wrapper.style.display = 'block';
        for(let k in this.hashMap){
            if(this.hashMap[k] === key){
                Mask.key = k;
                break;
            }
        }
        d.on(this.wrapper, 'touchmove', (e) => {
            if(this.background) {
                e.preventDefault();
            }
        });
    }

    hide(){
        this.wrapper.style.display = 'none';
        d.off(this.wrapper, 'touchmove');
    }

    protected _background: boolean | string;
    set background(e: boolean | string) {
        this._background = tools.isEmpty(e) ? true : e;
        let background = '';
        if(typeof this._background === 'string'){
            background = this._background;
        }else{
            if (this._background) {
                background = 'rgba(0,0,0,.3)';
            } else {
                background = 'rgba(0,0,0,0)'
            }
        }
        this.wrapper.style.background = background;
    }

    get background() {
        return this._background;
    }

    protected clickHandlers: objOf<EventListener> = {};
    protected hashMap: objOf<any> = {};
    addClick(key: any, handler: EventListener){
        let name = '';
        if(key in Object.values(this.hashMap)){
            for(let k of Object.keys(this.hashMap)){
                if(this.hashMap[k] === key){
                    name = k;
                    break;
                }
            }
        }else{
            name = tools.getGuid();
            this.hashMap[name] = key;
        }
        this.clickHandlers[name] = handler;
    }

    destroy(){
        Mask.instance = null;
        super.destroy();
    }

    // destroy() {
    //     d.remove(this.wrapper);
    // }
}