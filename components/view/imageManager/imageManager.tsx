/// <amd-module name="ImageManager"/>

import Component = G.Component;
import IComponentPara = G.IComponentPara;
import d = G.d;
import tools = G.tools;
import {Modal} from "../../feedback/modal/Modal";
import {InputBox} from "../../general/inputBox/InputBox";
import {Button} from "../../general/button/Button";

export interface IImageManagerPara extends IComponentPara{
    isAdd?: boolean; // 默认false
    isDelete?: boolean;
}

export class ImageManager extends Component{

    static EVT_IMG_DELETE = '__event_image_delete__';
    static EVT_ADD_IMG = '__event_add_image__';

    protected addEl: HTMLElement;
    protected isDel: boolean;
    protected wrapperInit(para: IImageManagerPara){
        this.addEl = <div className="img-add manager-img-item">+</div>;
        !para.isAdd && this.addEl.classList.add('hide');
        return <div className="image-manager-wrapper">
            {this.addEl}
        </div>;
    }

    constructor(para: IImageManagerPara){
        super(para);
        this.isDel = tools.isEmpty(para.isDelete) ? true : para.isDelete;
        this.closeEvent.on();
        this.imgShowEvent.on();


        d.on(this.addEl, 'click', () => {
            this.trigger(ImageManager.EVT_ADD_IMG);
        });
    }

    protected imgShowEvent = (() => {
        let handler = null,
            width = 100,
            current = -1,
            img = <img src="" alt=""/>,
            body = <div className="img-manager-show">{img}</div>,
            inputBox = new InputBox({}),
            leftCount = <span>{current}</span>,
            scaleEl = <span>{width}%</span>,
            delEl = <i className="app-shanchu appcommon"/>;

        if(tools.isPc){
            inputBox.addItem(<Button key="prev" tip="上一页" icon="arrow-left" onClick={() => {
                showImg(current - 1);
            }}/>);
            inputBox.addItem(<Button key="next" tip="下一页" icon="arrow-right" onClick={() => {
                showImg(current + 1);
            }}/>);
            inputBox.addItem(<Button key="zoomIn" tip="放大" icon="unie038" color="info" onClick={() => {
                imgScale(width + 10);
            }}/>);
            inputBox.addItem(<Button key="zoomOut" tip="缩小" icon="suoxiao" color="info" onClick={() => {
                imgScale(width - 10);
            }}/>);
            inputBox.addItem(<Button key="delete" tip="删除" icon="app-shanchu" iconPre="appcommon" color="error" onClick={() => {
                delImg(false, () => {
                    let index = current > 0 ? current - 1 : current + 1;
                    if(this.images.length === 0){
                        modal.isShow = false;
                    }else{
                        showImg(index);
                    }
                });
            }}/>);
        }else{
            d.on(delEl, 'click', () => {
                delImg();
            });
        }

        let delImg = (isHide = true, callback?: Function) => {
            Modal.confirm({
                msg: '是否删除该图片',
                callback: (flag) => {
                    if(flag){
                        isHide && (modal.isShow = false);
                        this.delImg(current);
                        this.trigger(ImageManager.EVT_IMG_DELETE, current);
                        callback && callback();
                    }
                }
            })
        };

        let imgScale = (scale: number) => {
            width = scale;
            width = Math.max(width, 30);
            width = Math.min(width, 200);
            img.style.width = width + '%';
            scaleEl.innerHTML = width + '%';
        };
        let showImg = (index: number) => {
            if(index < 0){
                Modal.toast('已经是第一张了');
                return
            }
            if(index >= this.images.length){
                Modal.toast('已经是最后一张了');
                return
            }
            current = index;
            leftCount.innerHTML = current + 1;
            img.setAttribute('src', this.images[current]);
        };

        let modal = new Modal({
            header: {
                title: '图片预览',
                rightPanel: tools.isPc ? null : delEl
            },
            container: document.body,
            isShow: false,
            className: tools.isPc ? 'full-screen-fixed img-manager-show-modal' : 'img-manager-show-modal',
            isBackground: false,
            body,
            footer: tools.isPc ? {
                rightPanel: inputBox,
                leftPanel: <span>第 {leftCount} 张，放大比例{scaleEl}</span>
            } : void 0
        });

        return {
            on: () => {
                if(!this.isDel){
                    delEl.classList.add('hide');
                    inputBox.delItem('delete');
                }
                d.on(this.wrapper, 'click', '.img-wrapper', handler = (ev) => {
                    let el = ev.target as HTMLElement,
                        parent = d.closest(el, '.manager-img-item'),
                        url = d.data(parent);
                    modal.isShow = true;
                    showImg(parseInt(parent.dataset['index']));
                });
            },
            off: () => {
                d.off(this.wrapper, 'click', '.img-wrapper', handler);
            }
        }
    })();

    protected closeEvent = (() => {
        let handler = null;
        return {
            on: () => {
                d.on(this.wrapper, 'click', '.img-close', handler = (ev) => {
                    ev.preventDefault();
                    let el = ev.target as HTMLElement,
                        parent = d.closest(el, '.manager-img-item'),
                        index = parseInt(parent.dataset['index']);

                    this.trigger(ImageManager.EVT_IMG_DELETE, index);
                    d.remove(parent);
                    let items: HTMLElement[] = d.queryAll('.manager-img-item:not(.img-add)', this.wrapper);
                    this.images = items.map(item => d.data(item));
                })
            },
            off: () => {
                d.off(this.wrapper, 'click', '.img-close', handler);
            }
        }
    })();

    protected images: string[] = [];

    render(){
        let items: HTMLElement[] = d.queryAll('.manager-img-item:not(.img-add)', this.wrapper);
        d.diff(this.images, items, {
            create: (url: string, index: number) => {
                d.before(this.addEl, ImageManager.createImg(url, index, this.isDel));
            },
            replace: (url: string, el: HTMLElement, index: number) => {
                let img = d.query('img', el) as HTMLImageElement;
                if(img && img.src !== url){
                    img.setAttribute('src', url);
                    d.data(el, url);
                }
                el.dataset['index'] = index + '';
            },
            destroy: (el: HTMLElement) => {
                d.remove(el);
            }
        });
    }

    addImg(url: string){
        this.images.push(url);
        this.render();
    }

    delImg(index?: number){
        typeof index === 'number' ? this.images.splice(index, 1) : (this.images = []);
        this.render();
    }

    get(): string[]{
        return this.images;
    }

    getBase64(): Promise<string[]>{
        return Promise.all(this.images.map(url => getBase64(url)));
    }

    set(urls: string[]){
        this.images = urls;
        this.render();
    }

    destroy(){
        this.closeEvent.off();
        this.imgShowEvent.off();
        super.destroy();
    }

    static createImg(src: string, index: number, isDel: boolean = true){
        let div = <div className="manager-img-item" data-index={index + ''}>
            <div class="img-wrapper">
                <img src={src} alt=""/>
            </div>
            {isDel ? <div className="img-close">
                <i className="appcommon app-guanbi2"/>
            </div> : null}
        </div>;
        d.data(div, src);
        return div;
    }
}

function getBase64(url: string): Promise<string>{
    return new Promise((resolve, reject) => {
        let image = new Image();
        image.setAttribute("crossOrigin",'anonymous');
        image.onload = () => {
            let canvas = document.createElement("canvas");   //创建canvas DOM元素，并设置其宽高和图片一样
            // canvas.style.backgroundColor = '#fff';
            canvas.width = image.width;
            canvas.height = image.height;
            let ctx = canvas.getContext("2d");

            ctx.drawImage(image, 0, 0, image.width, image.height); //使用画布画图

            //console.log(url);
            let dataURL = canvas.toDataURL("image/png");
            console.log(dataURL);
            resolve(dataURL);
            canvas = null;
        };
        image.onerror = () => {
            reject();
        };
        image.src = url;
    })
}