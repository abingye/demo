/**
 * DOM操作封装
 */
interface IEventOnPara {
    <K extends keyof HTMLElementEventMap>(el: EventTarget, type: K, cb: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any);
    (el: EventTarget, type: string, cb: EventListener);

    <K extends keyof HTMLElementEventMap>(el: Node, type: K, selector: string, cb: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any);
    (el: EventTarget, type: string, selector: string, cb: EventListener);
}

interface IEventOffPara {
    <K extends keyof HTMLElementEventMap>(el: EventTarget, type?: K, cb?: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any);
    (el: EventTarget, type?: string, cb?: EventListener);
    <K extends keyof HTMLElementEventMap>(el: Node, type?: K, selector?: string, cb?: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any);
    (el: EventTarget, type?: string, selector?: string, cb?: EventListener);
}

// interface EventSelectorFunPara extends EventFunPara{
//     (elSelector : string, type : string, cb : EventListener);
//     (elSelector : string, type : string, evSelector : string, cb : EventListener);
//     (elSelector : string, el : Node, type : string, cb : EventListener);
//     (elSelector : string, el : Node,  type : string, evSelector : string, cb : EventListener);
// }
interface IDiffFunction {
    <T, K>(nowArr: T[], oldArr: K[], operate: {
        create?(now: T): void,
        replace?(now: T, old: K): void,
        destroy?(old: K): void
    });
}


interface IEventCache {
    handlers: IEventCacheHandlers;
    disabled: boolean;
    dispatcher: EventListener;
    defined
}

interface IEventCacheHandlers{
    [event: string]: {
        [selector: string]: EventListener[]
    }
}

interface ITouchZoomEvent extends ICustomEvent{
    scale: number;
    centerX: number;
    centerY: number;
}

interface ICustomEvent {
    type: string,
    target: HTMLElement,
    preventDefault: Function,
    deltaX: number,   //	x轴偏移量
    deltaY: number,   //	y轴偏移量
    srcEvent: TouchEvent
}

interface IDefinedEvent {
    type: string,     // 事件类型
    deltaX: number,   //	x轴偏移量
    deltaY: number,   //	y轴偏移量
    deltaTime: number,//	第一次触发事件到目前的事件 ms
    distance:number,  //	偏移距离
    angle:number,     //	偏移角度.
    velocityX: number,//	x轴偏移速度 px/ms.
    velocityY:number, //	y轴偏移速度 px/ms
    velocity:number,	 // 最高速度.
    direction: 'up' | 'down' | 'left' | 'right', //	偏移方向 up down left right.
    offsetDirection: 'up' | 'down' | 'left' | 'right',//	从起点的偏移方向.
    srcEvent: MouseEvent | TouchEvent,//	原始事件
    target: HTMLElement,//	 接收事件的dom
    // eventType:0
    isFirst: boolean,	// 是否第一次
    isFinal: boolean,   // 是否最后一次
    preventDefault: Function	//  srcEvent.preventDefault()
}

namespace G {
/**
 * 操作element自定义数据
 * @type {{get: ((elem: Node) => obj); remove: ((elem: Node) => any)}}
 */

export const __EL_DATA_INNER_KEY__ = {
    event: '__event',
    data: '__customData',
    tree: '__virtualTree'
};

export let elemData = (function () {
    let cache: obj = {},
        guidCounter = 1,
        expando = `_D_A_T_A_${(new Date).getTime()}`;

    /**
     * 获取数据
     * @param {Node} elem
     * @returns {obj}
     */
    function get(elem: any): obj {
        if(typeof elem === 'object' && elem){
            let guid = elem[expando];
            if (!guid) {
                guid = elem[expando] = guidCounter++;
                cache[guid] = {};
            }

            return cache[guid];
        }
        return null;
    }

    /**
     * 删除
     * @param {Node} elem
     */
    function remove(elem: any) {
        if(typeof elem === 'object' && elem){
            let guid = elem[expando];
            if (guid) {
                delete cache[guid];
                delete elem[expando]
            }
        }
    }

    return {get, remove}

}());

/**
 * 事件管理
 */
let event = (function () {

    // 委托元素对应的回调
    let eventHash = __EL_DATA_INNER_KEY__.event,
        noDelegateSelector = '';

    let customEvent = (() => {
        const SUPPORT_TOUCH = tools.isMb,
            EVENT_MB_START = 'touchstart',
            EVENT_MB_MOVE = 'touchmove',
            EVENT_MB_END = 'touchend',
            EVENT_PC_START = 'mousedown',
            EVENT_PC_MOVE = 'mousemove',
            EVENT_PC_END = 'mouseup',
            EVENT_START = SUPPORT_TOUCH ? EVENT_MB_START : EVENT_PC_START,
            EVENT_MOVE = SUPPORT_TOUCH ? EVENT_MB_MOVE : EVENT_PC_MOVE,
            EVENT_END = SUPPORT_TOUCH ? EVENT_MB_END : EVENT_PC_END;

        function dispatcherGet(el:Node) {
            return elemData.get(el)[eventHash] && elemData.get(el)[eventHash].dispatcher
        }

        function typesGet(el:Node) {
            let eventData = elemData.get(el)[eventHash];
            return  eventData && eventData.handlers ? Object.keys(eventData.handlers) : null;
        }

        let events = {
            touchzoom: {
                type: 'touchzoom',
                constant: 0.05, // 每次放大缩小的基数
                handlerName: '__TOUCH_ZOOM_HANDLER__',
                on(el:Node, selector:string){
                    let startHandler,
                        moveHandler,
                        endHandler,
                        scale = 1;

                    eventOn(el, EVENT_MB_START, selector, startHandler = (ev: TouchEvent) =>{
                        let touches = ev.changedTouches;
                        if(touches.length === 2){
                            let centerX = Math.abs(touches[0].clientX - touches[1].clientX) / 2,
                                centerY = Math.abs(touches[0].clientY - touches[1].clientY) / 2;
                            let startDistance = Math.sqrt(Math.pow(touches[0].clientX - touches[1].clientX, 2)
                                + Math.pow(touches[0].clientY - touches[1].clientY, 2));
                            eventOn(el, EVENT_MB_MOVE, moveHandler = tools.pattern.throttling((ev: TouchEvent) =>{
                                let touches = ev.changedTouches;
                                let moveDistance = Math.sqrt(Math.pow((touches[0].clientX - touches[1].clientX),2)
                                    + Math.pow((touches[0].clientY - ev.touches[1].clientY),2));
                                if(moveDistance / startDistance > 1){
                                    scale += this.constant;
                                }else if(moveDistance / startDistance < 1){
                                    scale -= this.constant;
                                }
                                startDistance = moveDistance;
                                let dispatcher = dispatcherGet(el);
                                dispatcher && dispatcher.call(el, getTouchZoomEvent(ev, scale, centerX, centerY));
                            }, 35));
                            eventOn(el, EVENT_MB_END, endHandler = () =>{
                                eventOff(el, EVENT_END, endHandler);
                                eventOff(el, EVENT_MOVE, moveHandler);
                            });
                        }
                    });
                    d.data(el, startHandler);
                },
                off(el:Node, selector:string){
                    eventOff(el, EVENT_START, selector, d.data(el));
                }

            },
            press: {
                type: 'press',
                time: 800,
                longClick: 0,
                on(el:Node, selector:string){
                    let press = events.press,
                        timer: number = null,
                        touchY = 0,
                        longClick = 0,
                        handler,
                        moveHandler,
                        endHandler;

                    eventOn(el, EVENT_MB_START, selector, handler = (ev) => {
                        clearTimeout(timer);
                        longClick = 0;
                        let touch = ev.touches[0];
                        touchY = touch.clientY;
                        timer = setTimeout(() => {
                            longClick = 1;
                            let dispatcher = dispatcherGet(el);
                            dispatcher && dispatcher.call(el, getCustomEvent(ev, 'press'));
                        }, press.time);


                    });
                    eventOn(document, EVENT_MB_MOVE, moveHandler = (ev) => {
                        let touch = ev.touches[0];
                        clearTimeout(timer);
                    });

                    eventOn(document, EVENT_MB_END, endHandler = (ev) => {
                        clearTimeout(timer);
                        if(longClick === 1){
                            ev.preventDefault();
                            longClick = 0;
                        }
                        // eventOff(document, EVENT_MB_END, endHandler);
                        // eventOff(document, EVENT_MB_MOVE, moveHandler);
                    });

                    d.data(el, handler);
                },
                off(el:Node, selector:string){
                    eventOff(el, EVENT_MB_START, selector, d.data(el));
                }
            },
            pan: {
                default: 'pan panstart panmove panend pancancel panleft panright',
                all: 'panstart panmove panend pancancel panleft panright panup pandown',
                prev: <IDefinedEvent> null,
                first: <IDefinedEvent> null,
                firstTime: 0,
                once: true,
                isTriggerMove: true,
                direction: null,
                handlers :{
                    start: function (event: MouseEvent|TouchEvent) {
                        lockEvent(this, event, 'start');
                    },
                    move: function (event) {
                        lockEvent(this, event, 'move');
                    },
                    end: function (event) {
                        lockEvent(this, event, 'end');
                    }
                },
                on (el:Node, selector:string) {
                    let handler, moveHandler, endHandler;

                    eventOn(el, EVENT_START, selector, handler = (ev:MouseEvent|TouchEvent) => {
                        this.handlers.start.call(el, ev);

                        // eventOn(el, EVENT_MOVE, selector, this.handlers.move);
                        eventOn(el, EVENT_MOVE, moveHandler = (ev) => {
                            this.handlers.move.call(el, ev);
                        });

                        // eventOn(el, EVENT_END, this.handlers.end);
                        eventOn(el, EVENT_END, endHandler = (ev) => {
                            this.handlers.end.call(el, ev);
                            eventOff(el, EVENT_MOVE, moveHandler);
                            eventOff(el, EVENT_END, endHandler);
                        });
                    });
                    d.data(el, handler);
                },
                off(el: Node, selector: string){
                    eventOff(el, EVENT_START, selector, d.data(el));
                }
            }
        };

        function getTouchZoomEvent(ev: TouchEvent, scale, centerX, centerY): ITouchZoomEvent {
            return Object.assign({}, getCustomEvent(ev, 'touchzoom'),{scale, centerX, centerY})
        }

        function getCustomEvent(ev: TouchEvent, type): ICustomEvent{
            return {
                type,
                target: ev.target as HTMLElement,
                preventDefault: () => {ev.preventDefault()},
                deltaX: ev.changedTouches[0].clientX,   //	x轴偏移量
                deltaY: ev.changedTouches[0].clientY,   //	y轴偏移量
                srcEvent: ev
            }
        }

        let lockEvent = (() => {
            let move_lock = false,
                start_lock = false,
                end_lock = false,
                move_id = null,
                start_id = null,
                end_id = null;
            return function(el, ev: MouseEvent|TouchEvent, type: 'start'|'move'|'end'){
                if(type === 'move'){
                    if(!move_lock){
                        move_lock = true;
                        clearTimeout(move_id);
                        move_id = setTimeout(() => {
                            triggerEvent(el, ev, type);
                            move_lock = false;
                        },1)
                    }
                }else if(type === 'start'){
                    if(!start_lock){
                        start_lock = true;
                        clearTimeout(start_id);
                        start_id = setTimeout(() => {
                            triggerEvent(el, ev, type);
                            start_lock = false;
                        },1)
                    }
                }else if(type === 'end'){
                    if(!end_lock){
                        end_lock = true;
                        clearTimeout(end_id);
                        end_id = setTimeout(() => {
                            triggerEvent(el, ev, type);
                            end_lock = false;
                        },1)
                    }
                }
            }
        })();

        function triggerEvent(el, ev: MouseEvent|TouchEvent, type: 'start'|'move'|'end'){

            // console.log(type)
            let eventList = recognizer(typesGet(el));
            let event = eventObjGet(ev, eventList.indexOf('pan') !== -1 ? '' : type, (() =>{
                if(type === 'start'){
                    return 0
                }else if(type === 'move'){
                    return 1
                }else if (type === 'end'){
                    return 2
                }
                return null
            })());
            if(type === 'start'){
                events.pan.once = true;
                events.pan.direction = '';
            }
            if(type === 'move' && events.pan.once){
                events.pan.once = false;
                events.pan.isTriggerMove = events.pan.all.indexOf(event.direction) !== -1;
                events.pan.direction = event.direction;
            }
            if(type === 'move' && !events.pan.isTriggerMove){
                return ;
            }
            if(eventList.indexOf('pan') !== -1){
                let dispatcher = dispatcherGet(el);
                dispatcher && dispatcher.call(el, event);
            }else if (eventList.indexOf('pan' + type) !== -1){
                let dispatcher = dispatcherGet(el);
                dispatcher && dispatcher.call(el, event);
            }else if (eventList.indexOf('pan' + events.pan.direction) !== -1 && type === 'move'){
                let dispatcher = dispatcherGet(el);
                event.type = 'pan' + events.pan.direction;
                dispatcher && dispatcher.call(el, event);
            }
        }

        function eventObjGet(event:MouseEvent | TouchEvent, eventType: 'start'|'move'|'end'|'', staus:number ): IDefinedEvent{
            let customEvent: IDefinedEvent = {
                type: 'pan' + eventType,     // 事件类型
                deltaX: 0,   //	x轴偏移量
                deltaY: 0,   //	y轴偏移量
                deltaTime: 0,//	第一次触发事件到目前的事件 ms
                distance:0,  //	偏移距离
                angle: 0,     //	偏移角度.
                velocityX: 0,//	x轴偏移速度 px/ms.
                velocityY: 0, //	y轴偏移速度 px/ms
                velocity:0,	 // 最高速度.
                direction: null, //	偏移方向 up down left right.
                offsetDirection:null,//	从起点的偏移方向.
                srcEvent: event,//	原始事件
                target: (function(){
                    if(staus === 2){
                        return <HTMLElement>event.target
                    } else{
                        return SUPPORT_TOUCH ? <HTMLElement>(<TouchEvent>event).changedTouches[0].target : <HTMLElement>event.target
                    }
                })(),//	 接收事件的dom
                // eventType:0
                isFirst: false,	// 是否第一次
                isFinal: false,   // 是否最后一次
                preventDefault: () => {event.preventDefault()}
            };
            switch (staus){
                case 0:
                    events.pan.prev = (<any>{});
                    for(let attr in customEvent){
                        events.pan.prev[attr] = customEvent[attr];
                    }
                    customEvent.isFirst = true;
                    events.pan.first = customEvent;
                    events.pan.firstTime = new Date().getTime();
                    break;
                case 1:
                    customEvent = getMoveEvent(customEvent);
                    break;
                case 2:
                    customEvent = getMoveEvent(customEvent);
                    customEvent.isFirst = false;
                    customEvent.isFinal = true;
                    break;
            }
            return customEvent;
        }

        function getMoveEvent(ev: IDefinedEvent): IDefinedEvent{
            let event: MouseEvent | Touch = getEvent(ev.srcEvent),
                prevEv: MouseEvent | Touch = getEvent(events.pan.prev.srcEvent),
                firstEv: MouseEvent | Touch = getEvent(events.pan.first.srcEvent);

            function getEvent(ev: TouchEvent | MouseEvent): Touch | MouseEvent{
                return SUPPORT_TOUCH ? (<Touch>(<TouchEvent>ev).changedTouches[0]) : <MouseEvent>ev;
            }

            ev.deltaX = event.clientX - prevEv.clientX;//	x轴偏移量
            ev.deltaY = event.clientY - prevEv.clientY;//	y轴偏移量
            ev.angle = Math.atan2(ev.deltaY, ev.deltaX) / Math.PI * 180;//	偏移角度.
            ev.distance = Math.sqrt(Math.pow(ev.deltaY, 2) + Math.pow(ev.deltaX, 2));//	偏移距离
            ev.direction = getDirection(ev.angle);      //	偏移方向 up down left right.
            ev.offsetDirection =                        //	从起点的偏移方向.
                getDirection(Math.atan2(event.clientY - firstEv.clientY,
                        event.clientX - firstEv.clientX) / Math.PI * 180);
            ev.deltaTime = new Date().getTime() - events.pan.firstTime;
            ev.velocityX = ev.deltaX / (ev.deltaTime - events.pan.prev.deltaTime);
            ev.velocityY = ev.deltaY / (ev.deltaTime - events.pan.prev.deltaTime);

            events.pan.prev = ev;
            return ev;
        }

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

        /**
         * 判断是否时自定义事件，并返回自定义事件对象
         */
        let recognizer = function (eventTypes:string[]) {
            let eventList = [];
            if(tools.isNotEmpty(eventTypes)){
                for(let i = 0; i < eventTypes.length; i ++){
                    let position = events.pan.all.indexOf(eventTypes[i]);
                    if(position !== -1){
                        eventList.push(events.pan.all.substr(position, eventTypes[i].length))
                    }
                }
            }
            return eventList;
        };


        let on = function (el, type, selector) {
            if(events.pan.all.indexOf(type) !== -1){
                events.pan.on(el, selector);
            }else if(events.press.type === type){
                events.press.on(el, selector);
            }else if(events.touchzoom.type === type){
                events.touchzoom.on(el, selector);
            }
        };

        let off = (el, type, selector) => {
            if(events.pan.all.indexOf(type) !== -1) {
                events.pan.off(el, selector)
            }else if(events.press.type === type){
                events.press.off(el, selector);
            }else if(events.touchzoom.type === type){
                events.touchzoom.off(el, selector);
            }
        };
        return {on, off}
    })();

    function fixEvent(event:Event) {

        let stopPropagation = event.stopPropagation;
        event['isPropagationStopped'] = false;
        event.stopPropagation = () => {
            stopPropagation.call(event);
            event['isPropagationStopped'] = true;
        };

        let stopImmediatePropagation = event.stopImmediatePropagation;
        event['isImmediatePropagationStopped'] = false;
        event.stopImmediatePropagation = () => {
            stopImmediatePropagation.call(event);
            event['isImmediatePropagationStopped'] = true;
        }
    }

    let eventDispatcherGet = function (eventCache:IEventCache) {
        return function (evt: Event) {
            let eventType = evt.type,
                typeHandlers = eventCache.handlers && eventCache.handlers[eventType];

            if (eventCache.disabled || tools.isEmpty(typeHandlers) || d.closest(this, '.disabled')) { // this has disabled
                return;
            }

            fixEvent(evt);

            let isBubbleEnd = false,
                bubbleEl = <EventTarget>evt.target;

            // 开始委托、冒泡
            do {
                if (bubbleEl !== this) {
                    if (bubbleEl instanceof Element) {
                        for (let selector in typeHandlers) {
                            let selectorHandlers = typeHandlers[selector],
                                target: Element = null;

                            // debugger;
                            // 匹配委托元素
                            if (selector != noDelegateSelector) {
                                target = d.matches(bubbleEl, selector) ? bubbleEl : null;
                            }

                            let isImmediateStop = runHandler(target, selectorHandlers);
                            if(isImmediateStop){
                                isBubbleEnd = true;
                                break;
                            }
                        }

                        isBubbleEnd = evt['isPropagationStopped'];
                    }
                } else {
                    // 到达绑定元素，事件冒泡结束
                    runHandler(this, typeHandlers[noDelegateSelector]);
                    isBubbleEnd = true;
                }

                if(!isBubbleEnd){
                    // 冒泡
                    if (bubbleEl instanceof Element) {
                        bubbleEl = bubbleEl.parentElement;
                    }
                    // 冒泡到了html节点,继续冒泡
                    if (!bubbleEl) {
                        bubbleEl = document
                    } else if (bubbleEl === document) {
                        bubbleEl = window;
                    }
                }

            } while (!isBubbleEnd && bubbleEl !== window) ;

            function runHandler(target: EventTarget, handlers: EventListener[]) {
                if (target) {
                    let isImmediateStop = false,
                        isDocWin = target === window || target === document,
                        el = <Element>target;
                    if (isDocWin || (el.classList && !el.classList.contains('disabled') && handlers && handlers[0])) {
                        for (let handler of handlers) {
                            handler.call(target, evt);

                            if (evt['isImmediatePropagationStopped']) {
                                isImmediateStop = true;
                                break;
                            }
                        }
                    }
                    return isImmediateStop;
                }

                return false;
            }
        }

    };

    function eventArrayGet(type:string){
        return type.split(' ').filter(str => str);
    }

    /**
     * 开启事件
     * @param {EventTarget | Node} el
     * @param {string} types
     * @param {EventListener | string} selector
     * @param {EventListener} cb
     */
    let eventOn: IEventOnPara = function (el, types, selector, cb?) {
        if(!el || !(!window['EventTarget'] || el instanceof EventTarget) || !(typeof types === 'string')) {
            return;
        }
        eventArrayGet(types).forEach(function (type) {
            // 兼容mui
            // if ('mui' in window && tools.isMb && type === 'click') {
            //     type = 'tap';
            // }

            // 是否第一次绑定此元素的此事件类型
            let first = false;

            // 委托选择器是函数的时候，则选择器为空
            if (typeof selector === 'function') {
                cb = <EventListener>selector;
                selector = noDelegateSelector
            }
            customEvent.on(el, type, selector);
            // 获取当前是否已经绑定事件
            !elemData.get(el)[eventHash] && (elemData.get(el)[eventHash] = {});
            let eventCache = <IEventCache>elemData.get(el)[eventHash];

            // 初始化数据结
            !eventCache.handlers && (eventCache.handlers = {});
            let handlers = eventCache.handlers;
            if (!handlers[type]) {
                first = true;
                handlers[type] = {};
            }
            !handlers[type][selector] && (handlers[type][selector] = []);

            // 回调函数入栈
            handlers[type][selector].push(cb);

            //
            if (!eventCache.dispatcher) {
                eventCache.disabled = false;
                eventCache.dispatcher = eventDispatcherGet(eventCache);
            }

            if (first) {
                // let passiveTypes = ['mousewheel', 'touchmove', 'touchstart', 'touchend'];
                // try{
                    el.addEventListener(type, eventCache.dispatcher, false);
                // }catch (e){
                //     el.addEventListener(type, eventCache.dispatcher, false);
                // }
            }
        });

    };

    /**
     *
     * 关闭事件
     * @param {EventTarget | Node} el
     * @param {string} types
     * @param {EventListener | string} selector
     * @param {EventListener} cb
     */
    let eventOff: IEventOffPara = function (el, types?, selector?, cb?) {
        if(!el || !(!window['EventTarget'] || el instanceof EventTarget)) {
            return;
        }
        let elData = <IEventCache>elemData.get(el)[eventHash];
        if (!elData || !elData.dispatcher) {
            return;
        }

        if (typeof types === "undefined") {
            for (let type in elData.handlers) {
                removeHandler(type);
            }
            return;
        }
        customEvent.off(el, types, selector);

        eventArrayGet(types).forEach(type => {
            // 兼容mui
            if('mui' in window && tools.isMb && type === 'click'){
                type = 'tap';
            }
            if (typeof selector === 'undefined') {
                removeHandler(type);
                return;
            }

            // 委托选择器是函数的时候，则选择器为空
            if (typeof selector !== 'string') {
                cb = <EventListener>selector;
                selector = noDelegateSelector
            }

            if (typeof cb === 'undefined') {
                removeHandler(type, selector);
                return;
            }

            // 删除一个回调函数
            let selectorHandlers = tools.keysVal(elData.handlers, type, selector),
                cbIndex = Array.isArray(selectorHandlers) ? selectorHandlers.indexOf(cb) : -1;

            if (cbIndex >= 0) {
                selectorHandlers.splice(cbIndex, 1);
            }
            tidyUp(el, type, selector);

        });
        function removeHandler(t: string, s?: string) {
            let selectorHandlers = elData.handlers[t];

            if (typeof s === 'undefined') {
                for (let selector in selectorHandlers) {
                    selectorHandlers[selector] = [];
                    tidyUp(el, t, selector);
                }
            } else {
                selectorHandlers[s] = [];
                tidyUp(el, t, s)
            }
        }

        function tidyUp(el: EventTarget, type: string, seletor: string) {
            let elData = <IEventCache>elemData.get(el)[eventHash],
                isEmpty = tools.isEmpty;

            // 选择器函数数组为空
            if (elData.handlers[type] && isEmpty(elData.handlers[type][seletor])) {
                delete elData.handlers[type][seletor];
            }

            // 一个事件下没有委托的选择器
            if (isEmpty(elData.handlers[type])) {

                delete elData.handlers[type];
                el.removeEventListener(type, elData.dispatcher);

            }

            if (isEmpty(elData.handlers)) {
                delete elData.handlers;
                delete elData.dispatcher;
            }

            if (isEmpty(elData)) {
                delete elemData.get(el)[eventHash];
                // elemData.remove(el);
            }
        }
    };

    /**
     * 只执行一次事件
     * @param {EventTarget | Node} el
     * @param {string} types
     * @param {EventListener | string} selector
     * @param {EventListener} cb
     */
    let eventOnce: IEventOnPara = function (el, types, selector, cb?) {

        eventArrayGet(types).forEach(type => {
            if (typeof selector === 'function') {
                let func = selector;
                selector = function (e) {
                    eventOff(el, type, selector, cb);
                    func(e);
                };
            } else {
                let func = cb;
                cb = function (e) {
                    // debugger;
                    eventOff(el, type, selector, cb);
                    func(e);
                };
            }
            eventOn(el, type, selector, cb)
        });
    };

    /**
     * 触发一次事件
     * @param {EventTarget} elem
     * @param {string} type
     * @param {string} selector
     */
    let trigger = function (elem: EventTarget, type: string, selector?: string) {
        // if(el !== window){
        // for (let el of <Element[]>_getElPath(<Node>elem)) {
        //     let eventData = elemData.get(el)[eventHash];
        //     if (eventData) {
        //
        //     }
        // }
        // }
        if(selector) {

        }
    };

    // let elSelectorEventOn:EventSelectorFunPara = function(a, b, c, d?, e?){
    //     if(typeof a !== 'string'){
    //         on(a, b, c, d);
    //     }else{
    //         if(typeof b === 'string'){
    //             G.d.queryAll(document, b).forEach(el => on(el, b, c, d))
    //         }else{
    //             G.d.queryAll(b, a).forEach(el => on(el, c, d, e))
    //         }
    //     }
    // };
    //
    // let elSelectorEventOff:EventSelectorFunPara = function(a, b, c, d?, e?){
    //     if(typeof a !== 'string'){
    //         off(a, b, c, d);
    //     }else{
    //         if(typeof b === 'string'){
    //             G.d.queryAll(document, b).forEach(el => off(el, b, c, d))
    //         }else{
    //             G.d.queryAll(b, a).forEach(el => off(el, c, d, e))
    //         }
    //     }
    // };

    // let elSelectorEventOnce:EventSelectorFunPara = function(a, b, c, d?, e?){
    //     if(typeof a !== 'string'){
    //         off(a, b, c, d);
    //     }else{
    //         if(typeof b === 'string'){
    //             G.d.queryAll(document, b).forEach(el => off(el, b, c, d))
    //         }else{
    //             G.d.queryAll(b, a).forEach(el => off(el, c, d, e))
    //         }
    //     }
    // };
    return {eventOn, eventOff, eventOnce}
}());

function createElement(html: IVNode[]): DocumentFragment;
function createElement(html: IVNode): HTMLElement;
function createElement(html: string, parent?: string): HTMLElement;
function createElement(html, parent = 'div') {
    //常用不闭合标签
    let notCloseEle = ['br','input','hr','img','meta'];

    if (typeof html === 'string'){

        let div = document.createElement(parent);
        div.innerHTML = html;
        return <HTMLElement>div.firstElementChild;

    }else if(typeof html === 'object'){

        if (Array.isArray(html)){
            let f = document.createDocumentFragment();
            html.forEach((child, index)=>{
                d.append(f, createEle(child));
            });
            return f;
        }else{
            return createEle(html);

        }
    }else{
        return null;
    }

    function createEle({tag, children, props}:IVNode, parent?:HTMLElement){
        // 创建标签
        let container = document.createElement(tag);
        if (parent){
            parent.appendChild(container)
        }
        // 添加属性
        if(props){
            for (const prop in props){
                if (prop === 'dataset') {
                    let datasetObj = props.dataset;
                    for (let datasetName in datasetObj) {
                        container.dataset[datasetName] = datasetObj[datasetName];
                    }
                } else if (prop === "className") {
                    container.setAttribute('class', props[prop]);
                } else {
                    // if (prop in container){
                        container.setAttribute(prop, props[prop]);
                    // }
                }
            }
        }

        if (notCloseEle.indexOf(tag) === -1 && Array.isArray(children)){
            // 添加子标签
            children.forEach((child,index)=>{
                if (typeof child === 'string'){
                    container.appendChild(document.createTextNode(child));
                }else{
                    createEle(child,container);
                }
            })
        }
        return <HTMLElement>container;
    }
}


 // function diff(newSet: T[], oldSet: K[], operate: { create?(now: T): void, replace?(now: T, old: K): void, destroy?(old: K): void }) => {
 //        let i = 0,
 //            {create, replace, destroy} = operate;
 //
 //        newSet = [...(newSet || [])];
 //        oldSet = [...(oldSet || [])];
 //
 //        while (newSet[i] || oldSet[i]) {
 //            let n = newSet[i],
 //                o = oldSet[i];
 //
 //            if(n && o) {
 //                replace && replace(n, o);
 //
 //            }else if(n && !o) {
 //                create && create(n);
 //            }else if(!n && o) {
 //                destroy && destroy(o);
 //            }
 //            i++;
 //        }
 //    })
export const d = {
    /**
     * 一个元素是否匹配一个css选择器
     * @param {Element} dom
     * @param {string} selector
     * @return {boolean}
     */
    matches(dom: Element, selector: string) {
        if(dom instanceof Element && typeof selector === 'string' && selector) {
            if (dom.webkitMatchesSelector) {
                // 兼容android 4.4
                return dom.webkitMatchesSelector(selector);
                // }else if('matchesSelector' in dom){
                // 兼容老版本浏览器
                // return dom.matches(selector);
            } else if (dom.matches) {
                return dom.matches(selector);
            }
        }
        return false;
    },
    /**
     * 设置innerHTML 可执行html中的script里面脚本
     * @param {HTMLElement} dom
     * @param {string} html
     */
    setHTML(dom: Element, html: string) {
        if(dom instanceof Element && typeof html === 'string') {
            dom.innerHTML = tools.str.toEmpty(html);
            let scripts = dom.querySelectorAll('script');
            for (let i = 0, s: HTMLScriptElement = null; s = scripts.item(i); i++) {
                let newSc: HTMLScriptElement = document.createElement('script');
                newSc.text = s.text;
                s.parentNode && s.parentNode.replaceChild(newSc, s);
            }
        }
    },

    /**
     * 通过html字符串创建元素
     * @param {string} html
     * @param {string} parent
     * @return {HTMLElement}
     */
    create: createElement,

    /**
     * 移除一个元素
     * @param {Element} node
     * @param {boolean} [clearEvent=true] - 是否移除此元素以及所有子元素的事件, 默认true
     */
    remove(node: Element, clearEvent = true) {
        if (node instanceof Element) {
            if (clearEvent) {
                d.off(node);
                d.queryAll('*', node).forEach(nd => {
                    d.off(nd);
                    elemData.remove(node);
                })
            }
            node.parentNode && node.parentNode.removeChild(node);
        }
    },
    /**
     * 向上冒泡遍历查找与能与css选择器匹配的元素(包含自身),
     */
    closest: function (target: HTMLElement, selector: string, stopNode?:HTMLElement):HTMLElement {
        if(target instanceof HTMLElement && typeof selector === 'string' && (tools.isUndefined(stopNode) || stopNode instanceof HTMLElement)){
            let tar = target;
            while (tar) {
                if (d.matches(tar, selector)) {
                    return tar;
                }
                tar = tar.parentElement;
                if(stopNode && stopNode.isSameNode(tar)){
                    return null;
                }
            }
        }
        return null;
    },
    isParent(target: HTMLElement, parent: HTMLElement){
        if(target instanceof HTMLElement && parent instanceof HTMLElement){
            let tar = target;
            while (tar){
                if(tar.isSameNode(parent)){
                    return true;
                }
                tar = tar.parentElement;
            }
        }
        return false;
    },
    /**
     * 查询匹配的集合
     * @param {string} selector
     * @param {NodeSelector} dom
     * @return {HTMLElement[]}
     */
    queryAll(selector: string, dom: NodeSelector = document): HTMLElement[] {
        if(typeof selector === 'string' && dom && tools.isFunction(dom.querySelectorAll)) {
            return Array.prototype.slice.call(dom.querySelectorAll(selector), 0);
        }
        return [];
    },
    /**
     * 查询一个
     * @param {string} selector
     * @param {NodeSelector} dom
     * @return {HTMLElement}
     */
    query(selector: string, dom: NodeSelector = document): HTMLElement {
        // if(dom === window){
        //     dom = document;
        // }
        if(typeof selector === 'string' && dom && tools.isFunction(dom.querySelector)) {
            return <HTMLElement>dom.querySelector(selector);
        }else{
            return null;
        }
    },
    /**
     * 往父元素最后附加一个元素
     */
    append(parent: Node, child: Node | Primitive) {
        if(parent instanceof Node && parent !== child) {
            if(tools.isPrimitive(child)) {
                child = document.createTextNode(child + '');
            }
            if(child instanceof Node) {
                try {
                    parent.appendChild(child);
                }catch(e){
                    console.log(e);
                }
            }
        }

    },
    /**
     * 往父元素第一个位置插入一个元素
     */
    prepend(parent: Node, child: Node | Primitive) {
        if(parent instanceof Node) {
            if (tools.isPrimitive(child)) {
                child = document.createTextNode(child + '');
            }
            if(child instanceof Node) {
                parent.insertBefore(child, parent.firstChild)
            }
        }
    },
    /**
     * 在某个元素之前插入一个元素
     */
    before(ref: Node, el: Node | Primitive) {
        if(ref instanceof Node) {
            if (tools.isPrimitive(el)) {
                el = document.createTextNode(el + '');
            }
            if(el instanceof Node) {
                ref.parentNode && ref.parentNode.insertBefore(el, ref);
            }
        }
    },

    /**
     * 在某个元素之后插入一个元素
     * @param {Element} ref
     * @param {Node | string} el
     */
    after(ref: Node, el: Node | Primitive) {
        if(ref instanceof Node) {
            if (tools.isPrimitive(el)) {
                el = document.createTextNode(el + '');
            }
            if(el instanceof Node) {
                ref.parentNode && ref.parentNode.insertBefore(el, ref.nextSibling);
            }
        }
    },
    /**
     * 将oldEl替换为newEl
     */
    replace(newEl: Node | Primitive, oldEl: Node) {
        if(oldEl instanceof Node){
            if(tools.isPrimitive(newEl)) {
                newEl = document.createTextNode(newEl + '');
            }

            if(newEl instanceof Node) {
                oldEl.parentNode && oldEl.parentNode.replaceChild(newEl, oldEl);
            }
        }

    },

    /**
     * 设置el相对relEl的绝对定位位置, 使得el出现在relEl的下方
     * 调用该函数后，el会被放到body下
     * @param {HTMLElement} el
     * @param {HTMLElement} relEl
     * @param {boolean} [useRelWidth]
     */
    setPosition(el: HTMLElement, relEl: HTMLElement, useRelWidth = true) {
        if(el instanceof HTMLElement && relEl instanceof HTMLElement){
            if (el.parentNode !== document.body) {
                d.append(document.body, el);
            }
            let relRect = relEl.getBoundingClientRect();
            if (useRelWidth) {
                el.style.width = `${relRect.width}px`;
            }

            let elHeight = el.offsetHeight,
            elWidth = el.offsetWidth,
            bodyWidth = document.body.offsetWidth,
            bodyHeight = document.body.offsetHeight,
            top = relRect.bottom,
            left = relRect.left - 2;

            if (!useRelWidth) {
                left = (Math.max(relRect.width - elWidth, 0)) + relRect.left - 2;
            }

            top = top + elHeight < bodyHeight ? top : relRect.top - elHeight - 2;
            left = left + elWidth > bodyWidth ? left - (left + elWidth - bodyWidth) - 2 : left;

            el.style.position = 'absolute';
            el.style.left = `${left}px`;
            el.style.top = `${top}px`;
            el.style.zIndex = '1020';
            //是否将el的宽度设置为relEl的宽度
        }

    },
    off: event.eventOff,
    on: event.eventOn,
    once: event.eventOnce,

    /**
     * 添加/获取 数据
     * @param {Node} node
     * @param data
     * @return {any}
     */
    data(node: Node, data?) {
        if(node instanceof Node){
            let eleData = elemData.get(node);
            if(data){
                eleData[__EL_DATA_INNER_KEY__.data] = data
            }else{
                return eleData[__EL_DATA_INNER_KEY__.data];
            }
        }
    },
    // <>(nowArr: T[], oldArr: K[], operate: {
    //     create?(now: T): void,
    //     replace?(now: T, old: K): void,
    //     destroy?(old: K): void
    // });

    diff<T, K>(newSet: T[], oldSet: K[], operate: { create?(now: T, index: number): void,
        replace?(now: T, old: K, index: number): void,
        destroy?(old: K, index: number): void }){
        let i = 0,
            {create, replace, destroy} = operate;

        newSet = [...(newSet || [])];
        oldSet = [...(oldSet || [])];

        let hasNew = i in newSet,
            hasOld = i in oldSet;

        while (hasNew || hasOld) {
            let n: T = newSet[i],
                o: K = oldSet[i];

            if(hasNew && hasOld) {
                replace && replace(n, o, i);

            }else if(hasNew && !hasOld) {
                create && create(n, i);
            }else if(!hasNew && hasOld) {
                destroy && destroy(o, i);
            }

            i++;
            hasNew = i in newSet;
            hasOld = i in oldSet;
        }
    },

    classAdd(el: Element, tokens: string | string[]) {
        if(el instanceof Element) {
            let classArr = tools.toArray(tokens)
                .reduce((per, cur) => per.concat(cur.split(' ')), []);

            el.classList.add(...classArr.filter(token => !!token));
        }
    },
    classRemove(el: Element, tokens: string | string[]) {
        if(el instanceof Element) {
            let classArr = tools.toArray(tokens)
                .reduce((per, cur) => per.concat(cur.split(' ')), []);
            el.classList.remove(...classArr.filter(token => !!token));
        }
    },
    classToggle(el: Element, token: string, force?:boolean) {
        if(el instanceof Element){
            el.classList.toggle(token, force);
        }
    },
    hide(el, force = true) {
        d.classToggle(el, 'hide', force);
    },
    disable(el, force = true) {
        d.classToggle(el, 'disable', force);
    }
};
}


function h<K extends keyof HTMLElementTagNameMap>(tagName: K, props?: obj, ...children: (HTMLElement|string)[]): HTMLElementTagNameMap[K];
function h(tagName: string, props?: obj, ...children: (HTMLElement|string)[]): HTMLElement;
function h(tag, props?: obj, ...children ) {
    const TREE_KEY = G.__EL_DATA_INNER_KEY__.tree;
    let isCustom = typeof tag !== 'string', // 是否是自定义标签
        com;

    if(isCustom) {
        com = comCreate(tag, props, ...children);
    } else {
        com = domCreate(tag, props, ...children);
    }


    function childrenNodeGet(com, children){
        if(!Array.isArray(children)) {
            return null
        }

        if(Array.isArray(children[0])) {
            children = children[0];
        }
        // 虚拟树
        let currentData = G.elemData.get(com);
        currentData[TREE_KEY] = Object.assign({}, currentData[TREE_KEY], {
            childs: [],
        });

        return children.filter(c => G.tools.isNotEmpty(c)).map(child => {

            let node: Node = null;
            if(['string', 'boolean', 'number'].includes(typeof child)) {

                child = node = document.createTextNode(child + '');
            }else if(child instanceof Node) {

                node = child;

            }else if(child.wrapper instanceof Node){
                node = child.wrapper;
            }

            // 虚拟树
            currentData[TREE_KEY].childs.push(child);
            let childData = G.elemData.get(child);
            childData[TREE_KEY] = Object.assign({}, childData[TREE_KEY], {parent: com});

            return node;
        });

    }


    function comCreate(Tag, props?: obj, ...children) {
        let nodes: Node[],
            com = new Tag(Object.assign({}, props, {
            '__cmdInit': function (com) {
                cmdParse(com, props);
                if((com._body instanceof Node)){
                    nodes = childrenNodeGet(com, children);
                }
            }
        }));

        Array.isArray(nodes) && com._body && nodes.forEach(node => {
            G.d.append(com._body, node);
        });

        return com
    }

    function domCreate(tag:string, props?: obj, ...children) {
        let element = document.createElement(tag);
        if(props && typeof props === 'object') {
            for (let prop in props) {
                let val = props[prop];
                if (prop === 'class') {
                    prop = 'className';
                }
                if (prop === 'style' && val) {
                    if (typeof val === 'string') {
                        element.style.cssText = val;
                    } else if (typeof val === 'object') {
                        for (let name in val) {
                            element.style[name] = val[name]
                        }
                    }
                } else if (prop.indexOf('data-') === 0) {
                    prop = prop.slice(5).split('-').map((name, i) => {
                        if (i !== 0) {
                            name = name[0].toUpperCase() + name.slice(1);
                        }
                        return name;
                    }).join('');
                    element.dataset[prop] = val;
                } else if (prop === 'placeholder') {
                    element[prop] = G.tools.str.toEmpty(val);
                } else {
                    element[prop] = val;
                }
            }
        }

        cmdParse(element, props);
        let nodes = childrenNodeGet(element, children);
        Array.isArray(nodes) && nodes.forEach(node => {
            G.d.append(element, node);
        });

        return element;
    }

    function cmdParse(com, props:obj) {
        let currentData = G.elemData.get(com);
        currentData[TREE_KEY] = {
            cmd: {}
        };

        if(props && typeof props === 'object') {
            for (let prop in props) {
                let val = props[prop];
                if(prop.indexOf('c-') === 0) {
                    delete [props][prop];
                    prop = prop.slice(2).split('-').map((name, i) => {
                        if(i !== 0){
                            name = name[0].toUpperCase() + name.slice(1);
                        }

                        return name;
                    }).join('');
                    currentData[TREE_KEY].cmd[prop] = val;
                }
            }
        }
    }

    return com;
}
