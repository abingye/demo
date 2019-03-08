namespace G{
    export interface IComponentPara {
        // guid?: string;
        // key?: string;
        container?: HTMLElement;
        className?: string;
        data?: obj;
        disabled?: boolean;
        tabIndex?: boolean;
        tabIndexKey?: number;
        custom?: any
    }

    export abstract class Component{

        custom: any;

        protected abstract wrapperInit(para: IComponentPara): HTMLElement;

        constructor(para: IComponentPara = {}) {
            // this._guid = tools.getGuid();
            this.data = para.data;
            this.custom = para.custom;
            this._wrapper = this.wrapperInit(para);
            this.cmdInit(para['__cmdInit']);
            delete para['__cmdInit'];

            this.container = para.container || document.body;
            this.className = para.className;
            this._tabIndexKey = para.tabIndexKey;
            this.tabIndex = para.tabIndex;
            this.disabled = para.disabled;
            // this.key = component.key;
        }


        // c-var, c-body
        protected innerCom: objOf<Component> = {};
        protected innerEl: objOf<HTMLElement> = {};

        // wrapperInit中的自定义指令处理
        protected cmdInit(handler:Function) {
            const TREE_KEY = __EL_DATA_INNER_KEY__.tree;

            tools.isFunction(handler) && handler(this);

            let queue: (Component | HTMLElement)[] = [this.wrapper];

            while (queue[0]) {
                let current = queue.shift();
                let data = elemData.get(current)[TREE_KEY] || {},
                    {cmd, childs} = data;

                if(cmd) {
                    for (let key in cmd) {
                        let val = cmd[key];
                        switch (key) {
                            case 'var':
                                if (current instanceof Component) {
                                    this.innerCom[val] = current;
                                } else if (current instanceof HTMLElement) {
                                    this.innerEl[val] = current;
                                }
                                break;
                            case 'body':
                                if (val) {
                                    this['_body'] = current;
                                }
                                break;
                        }
                    }
                }

                if(Array.isArray(childs)) {
                    queue.push(...childs);
                }
            }
        }

        private _tabIndexKey : number;
        get tabIndexKey(){
            return this._tabIndexKey
        };
        private _tabIndex : boolean = false;
        get tabIndex(){
            return this._tabIndex;
        }
        set tabIndex(tabIndex : boolean) {
            tabIndex = !!tabIndex;
            if(this._tabIndex === tabIndex){
                return;
            }
            this._tabIndex = tabIndex;
            if(tabIndex){
                this.wrapper.tabIndex = parseInt(tools.getGuid(''));
                d.on(this.wrapper, 'keydown', this.keyHandle);
            }else {
                d.off(this.wrapper, 'keydown', this.keyHandle);
                this.wrapper.removeAttribute('tabIndex');
            }
        }

        get isFocused() { //判断当前是否是焦点元素
            return this.wrapper === document.activeElement;
        }

        protected keyHandle = (e : KeyboardEvent) => {};

        /**
         * 包装组件dom的根元素
         */
        private _wrapper: HTMLElement;
        get wrapper() {
            return this._wrapper;
        }

        protected _className: string;
        set className(str: string) {
            let old = this._className;

            if(str && this.wrapper && typeof str === 'string' && str !== old){
                if(typeof old === 'string'){
                    d.classRemove(this.wrapper, old);
                }
                d.classAdd(this.wrapper, str);
                this._className = str;
            }
        }
        get className(){
            return this._className;
        }


        protected _disabled: boolean = false;
        set disabled(e: boolean) {
            if (this._disabled !== e) {
                if (tools.isNotEmpty(e)) {
                    this._disabled = e;
                    if (this._disabled) {
                        this.wrapper && this.wrapper.classList.add('disabled');
                    } else {
                        this.wrapper && this.wrapper.classList.remove('disabled');
                    }
                }
            }
        }

        get disabled() {
            return this._disabled;
        }

        /**
         * 组件数据
         *
         * */
        public data;

        /**
         * 指定dom挂载的 HTML 节点
         * 默认document.body
         */

        protected _container: HTMLElement;
        set container(container: HTMLElement) {
            // 容器发生改变，组件的dom元素也转移到相应容器中
            let wrapper = this.wrapper;
            if (container && this._container !== container) {

                if(wrapper && container !== wrapper) { // 特殊情况下, wrapper 和 container可以是同一个元素
                    d.append(container, wrapper);
                }

                this._container = container;
            }
        }
        get container() {
            return this._container;
        }

        get parent(): HTMLElement | Component{
            const TREE_KEY = __EL_DATA_INNER_KEY__.tree;
            let currentData = elemData.get(this)[TREE_KEY] || {};
            return currentData.parent;
        }

        /**
         * 移除组件
         */
        remove() {
            d.remove(this._wrapper, false);
            this._container = null;
        }

        destroy(){
            d.remove(this._wrapper);
            this._wrapper = null;
            this.data = null;
            this._container = null;
            this._className = null;
        }

        protected _eventHandlers: objOf<Function[]> = {};
        get eventHandlers(){
            return this._eventHandlers;
        }
        on(name: string, handler: Function) {
            if(!this._eventHandlers[name]){
                this._eventHandlers[name] = []
            }
            this._eventHandlers[name].push(handler);
        }
        off(name: string, handler?: Function){
            if(this._eventHandlers[name]){
                if(typeof handler === 'function'){
                    this._eventHandlers[name].forEach((item, index) => {
                        if(item === handler){
                            this._eventHandlers[name].splice(index, 1);
                        }
                    })
                }else{
                    delete this._eventHandlers[name];
                }
            }
        }
        trigger(type: string, ...para){
            const handlers = this._eventHandlers[type];
            handlers && handlers.forEach((item) => {
                typeof item === 'function' && item(...para);
            });
        }

    }
}
