///<amd-module name="SwipeOut"/>

import {Button, IButton} from "../../general/button/Button";
import d = G.d;
import tools = G.tools;

interface ISwipeOutPara {
    target: HTMLElement;//要添加滑块按钮的元素
    left?: IButton | HTMLElement | (IButton | HTMLElement)[];//左边按钮
    right?: IButton | HTMLElement | (IButton | HTMLElement)[];//右边按钮，左右按钮可同时添加
}

export class SwipeOut {
    protected target: HTMLElement;
    protected innerWrapper: HTMLElement;
    protected SwipeOutLeft: HTMLElement;
    protected SwipeOutRight: HTMLElement;
    protected transConfig: obj;
    protected static isTouch = false;
    constructor(protected para: ISwipeOutPara) {
        this.init();
    }

    protected init() {
        let para = this.para;
        this.target = para.target;
        let position = getComputedStyle(this.target, null).position;
        if (position !== 'absolute' && position !== 'fixed') {
            this.target.style.position = 'relative';
        }
        this.target.classList.add('swipe-out-bar');
        this.innerWrapper = d.create('<div class="swipe-out-handle"></div>');
        let frag = document.createDocumentFragment();
        while (this.target.firstChild) {
            frag.appendChild(this.target.firstChild);
        }
        this.innerWrapper.appendChild(frag);
        this.initConfig();
        this.left = para.left;
        this.right = para.right;
        this.target.appendChild(this.innerWrapper);
        this.event.touchStart.on();
    }

    protected alterConfig(position: 'left' | 'right'){
        if(position === 'left'){
            let leftEl = tools.isEmpty(this.SwipeOutLeft) ? false : this.SwipeOutLeft,
                leftWidth = leftEl && leftEl.offsetWidth;
            this.transConfig.left.el = leftEl;
            this.transConfig.left.start = -leftWidth;
            this.transConfig.left.change = leftWidth;
            this.transConfig.left.length = leftEl ? leftEl.children.length : 1;
            if(leftEl){
                this.transConfig.position = position;
            }
        }else if(position === 'right'){
            let rightEl = tools.isEmpty(this.SwipeOutRight) ? false : this.SwipeOutRight,
                rightWidth = rightEl && rightEl.offsetWidth;
            this.transConfig.right.el = rightEl;
            this.transConfig.right.start = rightWidth;
            this.transConfig.right.change = rightWidth;
            this.transConfig.right.length = rightEl ? rightEl.children.length : 1;
            if(rightEl){
                this.transConfig.position = position;
            }
        }
    }

    protected initConfig() {
        this.transConfig = {
            left: {
                //左滑块
                el: null,
                //滑块起点位置
                start: null,
                //滑块运动到终点的距离
                change: null,
                //滑块当前位置
                current: 0,
                length: null
            },
            right: {
                //右滑块
                el: null,
                //滑块起点位置
                start: null,
                //滑块运动到终点的距离
                change: null,
                //滑块当前位置
                current: 0,
                length: null
            },
            position: null, //滑块当前运动方向
            end: 0, //滑块滑动终点
            time: 0, //滑块滑动的当前时间
            duration: 0, //滑块滑动总时间
            pointStart: 0, //鼠标开始按下位置的x轴
            pointCurrent: 0, //鼠标移动位置的x轴
            scale: 1, //滑块运动速度比值
            toEnd: true, //是否要运动到起点位置，即结束
            isStart: true, //是否在起点位置
            animated_id: null, //动画桢ID
            speed: 0
        };
    }

    protected animation = (() => {
        let self = this;

        let ease = (t, b, c, d) => {
            return -c * (t /= d) * (t - 2) + b;
        };

        let animation = (end) => {
            let trans = self.transConfig.position === 'right'
                ? self.transConfig.right : self.transConfig.left;
            self.transConfig.end = end;
            self.transConfig.time++;
            self.transConfig.speed = ease(self.transConfig.time, trans.current, self.transConfig.end - trans.current,
                self.transConfig.duration);
            animationObj.changeStyle(self.transConfig.speed);
            self.transConfig.animated_id = window.requestAnimationFrame(() => {
                animation(end);
            });
            if (self.transConfig.time >= self.transConfig.duration) {
                self.transConfig.speed = trans.current = self.transConfig.end;
                animationObj.changeStyle(trans.current);
                window.cancelAnimationFrame(self.transConfig.animated_id);
                self.transConfig.time = 0;

            }
        };

        let animationObj = {
            open() {
                let trans = self.transConfig.position === 'right'
                    ? self.transConfig.right : self.transConfig.left;
                let time = Math.abs(trans.current) > trans.change
                    ? Math.abs(trans.current) - trans.change
                    : Math.abs(trans.current);
                self.transConfig.duration = Math.ceil(time / 4 / trans.length);
                self.transConfig.duration = self.transConfig.duration > 40 ? 40 : self.transConfig.duration;
                animation(-trans.start);
            },
            close() {
                self.event.cancelSwipeOut.off();
                let trans = self.transConfig.position === 'right'
                    ? self.transConfig.right : self.transConfig.left;
                self.transConfig.duration = Math.ceil(Math.abs(trans.current) / 4 / trans.length);
                self.transConfig.duration = self.transConfig.duration > 40 ? 40 : self.transConfig.duration;
                animation(0);
                SwipeOut.isTouch = false;
            },
            changeStyle(s) {
                if (self.transConfig.position === 'right') {
                    self.transConfig.right.el && ((<HTMLElement>self.transConfig.right.el).style.transform =
                        'translate(' + (s + self.transConfig.right.start) + 'px, 0)');
                    self.transConfig.right.el && ((<HTMLElement>self.transConfig.right.el).style.webkitTransform =
                        'translate(' + (s + self.transConfig.right.start) + 'px, 0)');
                } else if (self.transConfig.position === 'left') {
                    self.transConfig.left.el && ((<HTMLElement>self.transConfig.left.el).style.transform =
                        'translate(' + (s + self.transConfig.left.start) + 'px, 0)');
                    self.transConfig.left.el && ((<HTMLElement>self.transConfig.left.el).style.webkitTransform =
                        'translate(' + (s + self.transConfig.left.start) + 'px, 0)');
                } else {
                    return null;
                }
                self.innerWrapper.style.transform = 'translate(' + s + 'px, 0)';
                self.innerWrapper.style.webkitTransform = 'translate(' + s + 'px, 0)';
            },
            judgePosition() {
                if (self.transConfig.pointCurrent > self.transConfig.pointStart
                    && self.transConfig.right.current === 0 && self.transConfig.left.el) {
                    self.transConfig.position = 'left';
                } else if (self.transConfig.pointCurrent < self.transConfig.pointStart
                    && self.transConfig.left.current === 0 && self.transConfig.right.el) {
                    self.transConfig.position = 'right';
                }
            },
            easeOut() {
                let trans = self.transConfig.position === 'right' ? self.transConfig.right : self.transConfig.left;
                if (Math.abs(trans.current - trans.start) > trans.change * 2) {
                    self.transConfig.scale *= .92;
                    self.transConfig.scale = self.transConfig.scale < .12 ? .12 : self.transConfig.scale;
                } else {
                    self.transConfig.scale = 1;
                }
                if (self.transConfig.position === 'right') {
                    self.transConfig.toEnd = !self.transConfig.isStart
                        ? self.transConfig.pointCurrent - self.transConfig.pointStart < 0
                        : self.transConfig.toEnd;
                    trans.current = trans.current > 0 ? 0 : trans.current;
                } else {
                    self.transConfig.toEnd = !self.transConfig.isStart
                        ? self.transConfig.pointCurrent - self.transConfig.pointStart > 0
                        : self.transConfig.toEnd;
                    trans.current = trans.current < 0 ? 0 : trans.current;
                }
            },
            stop() {
                window.cancelAnimationFrame(self.transConfig.animated_id);
                let trans = self.transConfig.position === 'right' ? self.transConfig.right : self.transConfig.left;
                self.transConfig.time = 0;
                trans.current = self.transConfig.speed;
            },
            toEnd() {
                let trans = self.transConfig.position === 'right' ? self.transConfig.right : self.transConfig.left;
                if (Math.abs(trans.current) > trans.change / 3 && self.transConfig.toEnd) {
                    self.transConfig.isStart = false;
                    this.open();
                } else {
                    self.transConfig.isStart = true;
                    this.close();
                }
            }
        };
        return animationObj;
    })();

    protected event = (() => {
        let self = this,
            startX, startY, isFirst, angle;
        function getDirection(angle: number): 'up' | 'down' | 'left' | 'right'{
            if (angle <= 45 && angle > -45){
                return 'right';
            }else if(angle <= 135 && angle > 45){
                return 'down';
            }else if(angle <= -45 && angle > -135){
                return 'up';
            }else if(angle > 135 || angle <= -135){
                return 'left';
            }else{
                return null
            }
        }
        let start = (ev: TouchEvent) => {
            isFirst = true;
            startX = ev.targetTouches[0].clientX;
            startY = ev.targetTouches[0].clientY;
            if (self.transConfig.position && !SwipeOut.isTouch) {
                self.animation.stop();
                SwipeOut.isTouch = true;
                self.transConfig.isClose = false;
                self.transConfig.pointStart = ev.targetTouches[0].clientX;
                self.transConfig.scale = 1;
                self.transConfig.toEnd = true;
                event.touchMove.on();
                event.touchEnd.on();
                event.cancelSwipeOut.on();
            }
        };
        let move = (ev) => {
            let x = ev.targetTouches[0].clientX,
                y = ev.targetTouches[0].clientY;
            if(isFirst){
                angle = getDirection(Math.atan2(y - startY, x - startX) / Math.PI * 180);
                isFirst = false;
            }
            if(angle === 'right' || angle === 'left'){
                self.transConfig.pointCurrent = x;
                self.animation.judgePosition();
                let trans = self.transConfig.position === 'right' ? self.transConfig.right : self.transConfig.left;
                trans.current += (self.transConfig.pointCurrent - self.transConfig.pointStart) * self.transConfig.scale;
                self.animation.easeOut();
                this.animation.changeStyle(trans.current);
                self.transConfig.pointStart = self.transConfig.pointCurrent;
            }
        };
        let end = () => {
            self.transConfig.isClose = true;
            event.touchMove.off();
            event.touchEnd.off();
            self.animation.toEnd();
        };
        let stopClose = (ev) => {
            if(d.closest(ev.target, '.swipe-out-bar') !== self.target){
                // ev.stopPropagation();
                if(self.transConfig.isClose){
                    self.animation.stop();
                    self.animation.close();
                }
            } else {
                if (self.transConfig.isClose) {
                    SwipeOut.isTouch = false;
                }
            }
        };
        let close = (ev) => {
        };
        let cancelBubble = (ev) => {
        };
        let event = {
            touchStart: {
                on() {
                    d.on(self.target, 'touchstart', start);
                },
                off() {
                    d.off(self.target, 'touchstart', start);
                }
            },
            touchMove: {
                on() {
                    d.on(document, 'touchmove', move);
                },
                off() {
                    d.off(document, 'touchmove', move);
                }
            },
            touchEnd: {
                on() {
                    d.on(document, 'touchend', end);
                },
                off() {
                    d.off(document, 'touchend', end);
                }
            },
            cancelSwipeOut: {
                on() {
                    window.addEventListener('touchstart', close);
                    document.addEventListener('touchstart', stopClose, true);
                    // d.on(document, 'touchstart', close);
                },
                off() {
                    // d.off(document, 'touchstart', close);
                    window.removeEventListener('touchstart', close);
                    document.removeEventListener('touchstart', stopClose, true);
                }
            }
        };
        return event;
    })();

    protected initSwipeOutEl(btn: IButton | HTMLElement | (IButton | HTMLElement)[],
                           SwipeOutContainer: HTMLElement, className: string) {
        if (tools.isEmpty(btn)) {
            if (!tools.isEmpty(SwipeOutContainer)) {
                d.remove(SwipeOutContainer);
            }
            SwipeOutContainer = null;
        } else if (Array.isArray(btn)) {
            if (!tools.isEmpty(SwipeOutContainer)) {
                SwipeOutContainer.innerHTML = '';
                btn.forEach((item) => {
                    if (item.constructor === Object) {
                        (<IButton>item).container = SwipeOutContainer;
                        new Button(<IButton>item);
                    } else {
                        SwipeOutContainer.appendChild(<HTMLElement>item);
                    }
                });
            }else{
                SwipeOutContainer = d.create('<div class="' + className + '"></div>');
                btn.forEach((item) => {
                    if (item.constructor === Object) {
                        (<IButton>item).container = SwipeOutContainer;
                        new Button(<IButton>item);
                    } else {
                        SwipeOutContainer.appendChild(<HTMLElement>item);
                    }
                });
                this.target.appendChild(SwipeOutContainer);
            }
        } else {
            if (!tools.isEmpty(SwipeOutContainer)) {
                SwipeOutContainer.innerHTML = '';
                if (btn.constructor === Object) {
                    (<IButton>btn).container = SwipeOutContainer;
                    new Button(<IButton>btn);
                } else {
                    SwipeOutContainer.appendChild(<HTMLElement>btn);
                }
            }else{
                SwipeOutContainer = d.create('<div class="' + className + '"></div>');
                if (btn.constructor === Object) {
                    (<IButton>btn).container = SwipeOutContainer;
                    new Button(<IButton>btn);
                } else {
                    SwipeOutContainer.appendChild(<HTMLElement>btn);
                }
                this.target.appendChild(SwipeOutContainer);
            }
        }
        return SwipeOutContainer;
    }

    protected _left: IButton | HTMLElement | (IButton | HTMLElement)[];
    set left(btn: IButton | HTMLElement | (IButton | HTMLElement)[]) {
        this._left = btn;
        this.SwipeOutLeft = this.initSwipeOutEl(btn, this.SwipeOutLeft, 'swipe-out-left');
        this.alterConfig('left');
    }

    get left() {
        return this._left;
    }

    protected _right: IButton | HTMLElement | (IButton | HTMLElement)[];
    set right(btn: IButton | HTMLElement | (IButton | HTMLElement)[]) {
        this._right = btn;
        this.SwipeOutRight = this.initSwipeOutEl(btn, this.SwipeOutRight, 'swipe-out-right');
        this.alterConfig('right');
    }

    get right() {
        return this._right;
    }

    destroy() {
        let frag = document.createDocumentFragment();
        while (this.innerWrapper.firstElementChild) {
            frag.appendChild(this.innerWrapper.firstElementChild);
        }
        d.remove(this.innerWrapper);
        this.SwipeOutRight !== null && d.remove(this.SwipeOutRight);
        this.SwipeOutLeft !== null && d.remove(this.SwipeOutLeft);
        this.target.appendChild(frag);
        this.target.classList.remove('swipe-out-bar');
        this.event.touchStart.off();
        this.event.touchMove.off();
        this.event.touchEnd.off();
        this.event.cancelSwipeOut.off();
    }
}

// protected setSwipeOutBar() {
//     let self = this;
//     let leftEl = tools.isEmpty(self.SwipeOutLeft) ? false : self.SwipeOutLeft;
//     let rightEl = tools.isEmpty(self.SwipeOutRight) ? false : self.SwipeOutRight;
//     let translate = {
//         left: {//左滑块
//             //滑块起点位置
//             start: leftEl && parseInt(getComputedStyle(leftEl, null).transform
//                 .replace(/matrix\(1,\s0,\s0,\s1,\s(-?\d+),\s0\)/, ($1, $2) => {
//                     return $2;
//                 })),
//             //滑块运动到终点的距离
//             change: leftEl && leftEl.offsetWidth,
//             //滑块当前位置
//             current: 0,
//         },
//         right: {//右滑块
//             //滑块起点位置
//             start: rightEl && parseInt(getComputedStyle(rightEl, null).transform
//                 .replace(/matrix\(1,\s0,\s0,\s1,\s(-?\d+),\s0\)/, ($1, $2) => {
//                     return $2;
//                 })),
//             //滑块运动到终点的距离
//             change: rightEl && rightEl.offsetWidth,
//             //滑块当前位置
//             current: 0,
//         },
//         position: getPosition(), //滑块当前运动方向
//         end: 0, //滑块滑动终点
//         time: 0, //滑块滑动的当前时间
//         duration: 0, //滑块滑动总时间
//         pointStart: 0, //鼠标开始按下位置的x轴
//         pointCurrent: 0, //鼠标移动位置的x轴
//         scale: 1, //滑块运动速度比值
//         toEnd: true, //是否要运动到起点位置，即结束
//         isStart: true, //是否在起点位置
//         animated_id: null //动画桢ID
//     };
//
//     function getPosition(): string | boolean {
//         if (leftEl) {
//             return 'left'
//         } else if (rightEl) {
//             return 'right'
//         } else {
//             return false;
//         }
//     }
//
//     let isAnimated = true;
//     d.on(self.target, 'touchstart', function (ev: TouchEvent) {
//         // if(isAnimated){
//         if (translate.position) {
//             isAnimated = false;
//             translate.pointStart = ev.targetTouches[0].clientX;
//             translate.scale = 1;
//             translate.toEnd = true;
//             d.on(document, 'touchmove', function (ev: TouchEvent) {
//                 translate.pointCurrent = ev.targetTouches[0].clientX;
//                 if (translate.pointCurrent > translate.pointStart
//                     && translate.right.current === 0 && leftEl) {
//                     translate.position = 'left';
//                 } else if (translate.pointCurrent < translate.pointStart
//                     && translate.left.current === 0 && rightEl) {
//                     translate.position = 'right';
//                 }
//                 let trans = translate.position === 'right' ? translate.right : translate.left;
//                 trans.current += (translate.pointCurrent - translate.pointStart) * translate.scale;
//                 if (Math.abs(trans.current - trans.start) > trans.change * 2) {
//                     translate.scale *= .92;
//                     translate.scale = translate.scale < .12 ? .12 : translate.scale;
//                 } else {
//                     translate.scale = 1;
//                 }
//                 if (translate.position === 'right') {
//                     translate.toEnd = !translate.isStart
//                         ? translate.pointCurrent - translate.pointStart < 0
//                         : translate.toEnd;
//                     trans.current = trans.current > 0 ? 0 : trans.current;
//                 } else {
//                     translate.toEnd = !translate.isStart
//                         ? translate.pointCurrent - translate.pointStart > 0
//                         : translate.toEnd;
//                     trans.current = trans.current < 0 ? 0 : trans.current;
//                 }
//                 changeStyle(trans.current);
//                 translate.pointStart = translate.pointCurrent;
//             });
//             d.on(document, 'touchend', function () {
//                 d.off(document, 'touchmove');
//                 d.off(document, 'touchend');
//                 let trans = translate.position === 'right' ? translate.right : translate.left;
//                 let time = Math.abs(trans.current) > trans.change
//                     ? Math.abs(trans.current) - trans.change
//                     : Math.abs(trans.current);
//                 translate.duration = Math.ceil(time / 4);
//                 translate.duration = translate.duration > 40 ? 40 : translate.duration;
//                 if (Math.abs(trans.current) > trans.change / 2 && translate.toEnd) {
//                     translate.isStart = false;
//                     animation(-trans.start);
//                 } else {
//                     translate.isStart = true;
//                     animation(0);
//                 }
//             })
//         }
//         // }
//     });
//
//     function animation(end) {
//         let trans = translate.position === 'right' ? translate.right : translate.left;
//         translate.end = end;
//         translate.time++;
//         let s = easeOut(translate.time, trans.current, translate.end - trans.current, translate.duration);
//         changeStyle(s);
//         translate.animated_id = window.requestAnimationFrame(() => {
//             animation(end);
//         });
//         if (translate.time >= translate.duration) {
//             trans.current = translate.end;
//             changeStyle(trans.current);
//             window.cancelAnimationFrame(translate.animated_id);
//             isAnimated = true;
//             translate.time = 0;
//         }
//     }
//
//     function changeStyle(s) {
//         if (translate.position === 'right') {
//             rightEl && ((<HTMLElement>rightEl).style.transform = 'translate(' +
//                 (s + translate.right.start) + 'px, 0)');
//             rightEl && ((<HTMLElement>rightEl).style.webkitTransform = 'translate(' +
//                 (s + translate.right.start) + 'px, 0)');
//         } else if (translate.position === 'left') {
//             leftEl && ((<HTMLElement>leftEl).style.transform = 'translate(' +
//                 (s + translate.left.start) + 'px, 0)');
//             leftEl && ((<HTMLElement>leftEl).style.webkitTransform = 'translate(' +
//                 (s + translate.left.start) + 'px, 0)');
//         } else {
//             return null;
//         }
//         self.innerWrapper.style.transform = 'translate(' + s + 'px, 0)';
//         self.innerWrapper.style.webkitTransform = 'translate(' + s + 'px, 0)';
//     }
//
//     function easeOut(t, b, c, d) {
//         return -c * (t /= d) * (t - 2) + b;
//     }
// }