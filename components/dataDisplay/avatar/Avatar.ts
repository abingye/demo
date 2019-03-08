/// <amd-module name="Avatar"/>
// import d = G.d;
// import tools = G.tools;
// import {Component, IComponentPara} from "../../Component";
//
// interface IAvatar extends IComponentPara{
//     container: HTMLElement;
//     shape?: string;
//     size?: string;
//     url?: string;
//     type?: string;
//     content?: string;
//     color?: string;
//     bgColor?: string;
//     tip?: string;
// }
//
// /**
//  * 头像组件对象
//  */
// export class Avatar extends Component implements IAvatar {
//     protected wrapperInit(): HTMLElement {
//         return d.create(`<span class="avatar"></span>`);
//     }
//
//     private init(avatar: IAvatar) {
//         // this.wrapper = d.create(`<span class="avatar"></span>`);
//         // this.container = avatar.container;
//         this._content = avatar.content;
//         this.type = avatar.type;
//         this.size = avatar.size;
//         this.content = avatar.content;
//         this.url = avatar.url;
//         this.shape = avatar.shape;
//         this.color = avatar.color;
//         this.bgColor = avatar.bgColor;
//         this.container.appendChild(this.wrapper);
//     }
//
//     /**
//      * 头像文本
//      * 类型：string
//      * 默认值：type为icon时则为avatar|type为text时则为User
//      */
//     private _content: string;
//     set content(content: string) {
//         let iconWrapper = d.query('i', this.wrapper);
//         switch (this._type) {
//             case 'icon':
//                 content = tools.isEmpty(content) ? 'avatar' : content;
//                 //不存在则创建i标签作为图标容器
//                 if (!iconWrapper) {
//                     this.wrapper.innerHTML = '';
//                     iconWrapper = d.create(`<i class="avatar-icon iconfont icon-${content}" style="float:none"></i>`);
//                     this.wrapper.appendChild(iconWrapper);
//                 }
//                 //存在则删除原来的样式
//                 else {
//                     iconWrapper.classList.remove(`icon-${this._content}`);
//                     iconWrapper.classList.add(`icon-${content}`);
//                 }
//                 break;
//             case 'text':
//                 this.wrapper.innerHTML = '';
//                 content = tools.isEmpty(content) ? 'USER' : content;
//                 if (iconWrapper) {
//                     d.remove(iconWrapper);
//                 }
//                 let textSpan = d.create(`<span class="avatar-text" style="display:inline-block;">${content}</span>`),
//                     textLen = content.replace(/[^\x00-\xff]/gi, "--").length - 1;
//
//                 this.wrapper.appendChild(textSpan);
//                 //由于size和content相互依赖（size中的长度依赖于content，content字体缩小的情况又依赖于size）,【待斟酌。。。】
//                 //对于字符型的头像，当字符串较长时，字体大小可以根据头像宽度自动调整。
//                 switch (this._size) {
//                     case 'large':
//                         if (textLen > 3) {
//                             textSpan.style.transform = `scale(${1 - 0.06 * textLen})`;
//                         }
//                         break;
//                     case 'small':
//                         textSpan.style.transform = `scale(${1 - 0.125 * textLen})`;
//                         break;
//                     default:
//                         if (textLen > 2) {
//                             textSpan.style.transform = `scale(${1 - 0.07 * textLen})`;
//                         }
//                         break;
//                 }
//                 break;
//             case 'img':
//                 this.wrapper.innerHTML = '';
//                 let imgDiv = d.create(`<img />`);
//                 this.wrapper.appendChild(imgDiv);
//         }
//         this._content = content;
//     }
//
//     get content() {
//         return this._content;
//     }
//
//     /*
//     * 图片类头像的资源地址
//     * 类型：string;
//     * 默认值：空
//     * */
//     private _url: string;
//     set url(url: string) {
//         url = tools.isEmpty(url) ? 'default' : url;
//         let img = <HTMLElement> this.wrapper.firstChild;
//         if (this._type === 'img' && url && img) {
//             img.setAttribute('src', url);
//         }
//         this._url = url;
//     }
//
//     get url() {
//         return this._url;
//     }
//
//     /*
//   * 头像类型
//   * 类型：string;
//   * 默认值：icon |img|text
//   *
//   * */
//     private _type: string;
//     set type(type: string) {
//         type = tools.isEmpty(type) ? 'icon' : type;
//         this._type = type;
//         let iconDom = d.query('i', this.wrapper),
//             imgDom = d.query('img', this.wrapper);
//         switch (type) {
//             case 'icon':
//                 this.wrapper.innerHTML = '';
//                 if (imgDom) {
//                     d.remove(imgDom);
//                     imgDom = null;
//                 }
//                 this.content = this._content;
//                 break;
//             case 'img':
//                 this.wrapper.innerHTML = '';
//                 if (iconDom) {
//                     d.remove(iconDom);
//                     iconDom = null;
//                 }
//                 break;
//             case 'text':
//                 this.wrapper.innerHTML = '';
//                 if (imgDom) {
//                     d.remove(imgDom);
//                     imgDom = null;
//                 }
//                 if (iconDom) {
//                     d.remove(iconDom);
//                     iconDom = null;
//                 }
//                 this.content = this._content;
//                 break;
//         }
//     }
//
//     get type() {
//         return this._type;
//     }
//
//
//     /**
//      * 头像形状
//      * 类型：string;
//      * 默认值：circle:圆形|square:正方形
//      */
//     private _shape: string;
//     set shape(shape: string) {
//         shape = tools.isEmpty(shape) ? 'circle' : shape;
//         switch (shape) {
//             case 'circle':
//                 this.wrapper.classList.remove('avatar-square');
//                 this.wrapper.classList.add('avatar-circle');
//                 break;
//             case 'square':
//                 this.wrapper.classList.remove('avatar-circle');
//                 this.wrapper.classList.add('avatar-square');
//                 break;
//         }
//         this._shape = shape;
//     }
//
//     get shape() {
//         return this._shape;
//     }
//
//     /*
//     * 头像尺寸
//     * 类型:string;
//     * 默认值：default |small|large
//     * */
//     private _size: string;
//     set size(size: string) {
//         //若已经初始化过头像尺寸，则删除之前添加的样式
//         if (this._size) {
//             this.wrapper.classList.remove(`avatar-${this._size}`);
//         }
//         if (size) {
//             this.wrapper.classList.add(`avatar-${size}`);
//             this._size = size;
//         }
//         if (this.type === 'text') {
//             let textSpan = d.query(`.avatar-text`, this.wrapper),
//                 textLen = textSpan.innerHTML.replace(/[^\x00-\xff]/gi, "--").length - 1;
//             //对于字符型的头像，当字符串较长时，字体大小可以根据头像宽度自动调整。
//             switch (size) {
//                 case 'large':
//                     if (textLen > 3) {
//                         textSpan.style.transform = `scale(${1 - 0.06 * textLen})`;
//                     }
//                     break;
//                 case 'small':
//                     textSpan.style.transform = `scale(${1 - 0.125 * textLen})`;
//                     break;
//             }
//         }
//         this._size = size;
//     }
//
//     get size() {
//         return this._size;
//     }
//
//     /*
//     * 头像默认背景颜色
//     * 类型：string
//     * 默认： #CCCCCC;
//     * */
//     private _bgColor: string;
//     set bgColor(bgColor: string) {
//         this._bgColor = tools.isEmpty(bgColor) ? '#CCCCCC' : bgColor;
//         this.wrapper.style.backgroundColor = this._bgColor;
//     }
//
//     get bgColor() {
//         return this._bgColor;
//     }
//
//     /*
//     * 头像默认字体颜色
//     * 类型：string
//     * 默认： #FFFFFF;
//     * */
//     private _color: string;
//     set color(color: string) {
//         this._color = tools.isEmpty(color) ? '#FFFFFF' : color;
//         this.wrapper.style.color =  this._color;
//     }
//
//     get color() {
//         return this._color;
//     }
//     constructor(private avatar: IAvatar) {
//         super(avatar);
//         this.init(avatar);
//     }
//
//
// }