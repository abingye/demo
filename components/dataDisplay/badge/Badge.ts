/// <amd-module name="Badge"/>
// import d = G.d;
// import tools = G.tools;
// import {Component, IComponentPara} from "../../Component";
//
// interface IBadge extends IComponentPara{
//     count?: number;
//     maxcount?: number;
//     isShowZero?: boolean;
//     isDot?: boolean;
//     position?: string;
//     container: HTMLElement;
//     color?: string;
// }
//
// /**
//  * 徽标组件对象
//  */
// export class Badge extends Component implements IBadge {
//     protected wrapperInit(): HTMLElement {
//         return d.create(`<span class="badge">` + container.innerHTML + `<sup class="badge-count">.</sup></span>`);
//     }
//
//     private init(badge: IBadge) {
//         // this._wrapper = d.createByHTML(`<sup class="badge-count"></sup>`);
//         // this.container = badge.container;
//         this.count = badge.count;
//         this.isShowZero = badge.isShowZero;
//         this.isDot = badge.isDot;
//         this.color = badge.color;
//         this.maxcount = badge.maxcount;
//         this.position = badge.position;
//     }
//
//     /*
//     * 展示的数字，大于 maxcount 时显示为 ${maxcount}+，为 0 时隐藏
//     * 类型number
//     * */
//     private _count: number;
//     set count(count: number) {
//         this._count = tools.isEmpty(count) ? 0 : count;
//         let curCount = tools.isEmpty(count) ? 0 : count > this._maxcount ? this._maxcount + '+' : count;
//         if (this._container) {
//             let countWrapper = d.query(`.badge-count`, this._container);
//             if (countWrapper) {
//                 if (!this._isShowZero && curCount === 0) {
//                     countWrapper.style.display = 'none';
//                     return;
//                 }
//                 countWrapper.innerHTML = curCount + '';
//             }
//         }
//     }
//
//     get count() {
//         return this._count;
//     }
//
//     /*
//     *  展示封顶的数字值
//     *  类型：number
//     *  默认值：99
//     * */
//     private _maxcount;
//     set maxcount(maxcount: number) {
//         this._maxcount = tools.isEmpty(maxcount) ? 99 : maxcount;
//         let countWrapper = d.query(`.badge-count`, this._container);
//         if (countWrapper && this._maxcount) {
//             if (this._count > this._maxcount) {
//                 countWrapper.innerHTML = this.maxcount + '+';
//             } else {
//                 countWrapper.innerHTML = this._count + '';
//             }
//         }
//     }
//
//     get maxcount() {
//         return this._maxcount;
//     }
//
//     /*
//     * 当数值为 0 时，是否展示 Badge
//     * 类型：boolean
//     * 默认：false
//     * */
//     private _isShowZero: boolean;
//     set isShowZero(isShowZero: boolean) {
//         this._isShowZero = tools.isEmpty(isShowZero) ? false : isShowZero;
//         let countWrapper = d.query('sup', this._container);
//         if (countWrapper && this._isShowZero) {
//             if (this._count === 0) {
//                 countWrapper.style.display = 'inline-block';
//             }
//         } else if(countWrapper && this._count === 0){
//             countWrapper.style.display = 'none';
//         }
//     }
//
//     get isShowZero() {
//         return this._isShowZero;
//     }
//
//     /*
//     *  不展示数字，只有一个小红点
//     *  类型：boolean
//     *  默认值：false
//     * */
//     private _isDot: boolean;
//     set isDot(isDot: boolean) {
//         this._isDot = tools.isEmpty(isDot) ? false : isDot;
//         let sup = d.query('sup', this._container);
//         if (this._isDot && sup) {
//             sup.classList.remove('badge-count');
//             sup.classList.add('badge-dot');
//         } else if (sup) {
//             sup.classList.remove('badge-dot');
//             sup.classList.add('badge-count');
//         }
//     }
//
//     get isDot() {
//         return this._isDot;
//     }
//
//     /*
//     * 徽标背景颜色
//     * 默认：green
//     * green|red|gray|blue|yellow
//     * */
//     private _color;
//     set color(color: string) {
//         color = tools.isEmpty(color) ? 'red' : color;
//         let sup = d.query('sup', this._container);
//         if (!sup) {
//             return;
//         }
//         if (this._color) {
//             sup.classList.remove(this._color);
//         }
//         switch (color) {
//             case 'green':
//                 sup.classList.add('badge-green');
//                 break;
//             case 'red':
//                 sup.classList.add('badge-red');
//                 break;
//             case 'gray':
//                 sup.classList.add('badge-gray');
//                 break;
//             case 'yellow':
//                 sup.classList.add('badge-yellow');
//                 break;
//             case 'blue':
//                 sup.classList.add('badge-blue');
//                 break;
//         }
//         this._color = color;
//     }
//
//     get color() {
//         return this._color;
//     }
//
//     /*
//     * 徽标出现位置
//     * 默认值：rightTop:右上 | center: 居中
//     * */
//     private _position;
//     set position(position: string) {
//         position = tools.isEmpty(position) ? 'rightTop' : position;
//         let sup = d.query('sup', this._container);
//         switch (position) {
//             case 'rightTop':
//                 sup.classList.add('right-top');
//                 break;
//             case 'center':
//                 sup.classList.add('center');
//                 break;
//         }
//         this._position = position;
//     }
//
//     get position() {
//         return this._position;
//     }
//
//
//
//     // set container(container) {
//     //     //如果container存在，则将container装载到徽标容器
//     //     if (container) {
//     //
//     //     }
//     //     this._container = container;
//     // }
//     constructor(private badge?: IBadge) {
//         super(badge);
//         this.init(badge);
//     }
// }