/// <amd-module name="Scrollbar" />
import tools = G.tools;
import d = G.d;
interface Sbar_Para{
    el: HTMLElement,        // 横向滚动条DOM
    bottom?: number,         // 距离底部距离
    Container: HTMLElement, // 滚动外框，默认document.body，一般用于表格内嵌在DOM中滚动
    marginBottom?: number    // 当有滚动外框，设置内容区下边距(场景：表格下出现加载中...的情况)
}

export class Scrollbar {
    protected conf: Sbar_Para;
    protected panelWrapper: HTMLDivElement;
    protected panelInner: HTMLDivElement;
    protected styleThrottle: Function;
    protected elOffsetTop: number;    // 容器距离浏览器顶部距离
    protected elHeight: number;     // 容器高度
    protected scrollType: string = '';   // 滚动类型  bar：滚动条滚动  def：容器dom滚动
    /**
     * 构造函数
     */
    constructor(paraConf: Sbar_Para) {
        let self = this,
            defaultConf: Sbar_Para = {
                el: null,        // 横向滚动条DOM
                Container: null, // 滚动外框，默认document.body，一般用于表格内嵌在DOM中滚动
                bottom: 0,       // 距离底部距离
                marginBottom: 0  // 当有滚动外框，设置内容区下边距(场景：表格下出现加载中...的情况)
            };

        self.conf = <Sbar_Para>tools.obj.merge(defaultConf, paraConf);

        this.create();
        this.bindEvent.init();
    }

    // 节流
    protected throttle(delay, action) {
        let last = 0;
        return function(){
            var curr = +new Date();
            if (curr - last > delay){
                action.apply(this, arguments);
                last = curr;
            }
        }
    }


    protected bindEvent = (function(self){
        let timeout,el;
        // 滚动条超出显示范围隐藏
        function checkHide() {
            let result = true,
                scrollTop = tools.scrollTop(),
                clientHeight = document.documentElement.clientHeight,
                scrollbarTop = scrollTop+clientHeight-self.conf.bottom;
            //console.log('====>', scrollbarTop, self.elOffsetTop, self.elHeight);

            if(
                scrollbarTop>self.elOffsetTop+self.elHeight ||  // 超过下边界
                scrollbarTop<self.elOffsetTop     // 超过上边界
            ) {
                result = false;
            }

            if(result) {
                self.panelWrapper.style.display = 'block';
            }
            else {
                self.panelWrapper.style.display = 'none';
            }
        }

        // 内嵌
        function checkContainerHide() {
            let result = true,
                containerHeight = self.conf.Container.scrollHeight,
                offsetHeight = self.conf.Container.offsetHeight,
                clientHeight = containerHeight-self.conf.marginBottom,
                scrollbarTop = self.conf.Container.scrollTop+offsetHeight;

           // console.log(self.conf.Container.scrollHeight)
            if(
                clientHeight<offsetHeight ||
                scrollbarTop - self.conf.bottom>clientHeight // 超过下边界
            ) {
                result = false;
            }
            /*if(
                scrollbarTop>self.elOffsetTop+self.elHeight ||  // 超过下边界
                scrollbarTop<self.elOffsetTop     // 超过上边界
            ) {
                result = false;
            }*/

            if(result) {
                self.panelWrapper.style.width   = `${el.offsetWidth}px`;
                self.panelWrapper.style.top     = `${scrollbarTop-12 - self.conf.bottom}px`;
                self.panelWrapper.style.display = 'block';
                self.panelWrapper.scrollLeft = el.scrollLeft;
            }
            else {
                self.panelWrapper.style.display = 'none';
            }
        }

        function checkFunc() {
            if(self.conf.Container) {
                checkContainerHide();
            }
            else {
                checkHide();
            }
        }

        // type: 是否纵向滚动
        function updateStyle(type:boolean=false) {
            if(!self.styleThrottle) {
                self.styleThrottle = self.throttle(1000, (type)=>{
                    self.panelInner.style.width = `${el.scrollWidth}px`;
                    if(self.conf.Container) {
                        // 内容器
                        self.elOffsetTop = 0;
                        self.elHeight = el.offsetHeight-self.conf.marginBottom;
                        self.panelWrapper.style.left     = `${tools.offset.left(el)-tools.offset.left(self.conf.Container)}px`;
                    }
                    else {
                        self.elOffsetTop = tools.offset.top(el);
                        self.elHeight = el.offsetHeight;
                    }


                    type || checkFunc();
                });
            }
            type && checkFunc();
            self.styleThrottle(type);
        }

        function elScrollXHandle() {
            if(self.scrollType === '' || self.scrollType === 'def') {
                self.scrollType = 'def';
                timeout && clearTimeout(timeout);
                timeout = setTimeout(()=>{
                    self.scrollType = '';
                }, 100);
              //  console.log(self.panelWrapper)
                updateStyle();
                self.panelWrapper.style.display === 'block' && (self.panelWrapper.scrollLeft = el.scrollLeft);
            }
        }

        function barScrollXHandle() {
            if(self.scrollType === '' || self.scrollType === 'bar') {
                self.scrollType = 'bar';
                timeout && clearTimeout(timeout);
                timeout = setTimeout(() => {
                    self.scrollType = '';
                }, 100);
                el.scrollLeft = self.panelWrapper.scrollLeft;
            }
        }

        let scrollYHandle = function() {
            updateStyle(true);
        }

        let init  = function(){
            el = self.conf.el;
            d.on(el, 'scroll', elScrollXHandle);
            d.on(self.panelWrapper, 'scroll', barScrollXHandle);
            if(self.conf.Container) {
                setTimeout(()=>{
                    scrollYHandle();
                },0);
                d.on(self.conf.Container, 'scroll', scrollYHandle);
                d.on(window,'resize',()=>{
                    scrollYHandle();
                });
                //d.on(window, 'scroll', scrollYHandle);
            }
            else {
                d.on(window, 'scroll', scrollYHandle);
            }
        };
        return {scrollYHandle,init}
    })(this)

    updateStyle(){
        this.bindEvent.scrollYHandle();
    }
    setConfBottom(bottom : number){
        this.conf.bottom = bottom;
        this.updateStyle();
    }

    protected create() {
        let self = this;
        function createStyle() {
            let style = document.createElement('style'),
                styleContent;
            style.setAttribute('type', 'text/css');
            styleContent = `
            .sbarWrapper{ height: 12px; position: fixed; overflow-x: auto; overflow-y: hidden; z-index:10;}
            .sbarWrapper::-webkit-scrollbar{ width: 8px; height: 8px;}
            .sbarWrapper::-webkit-scrollbar-thumb{ width: 8px; height: 8px;border-radius: 4px;background-color: #7f7f7f;}
            .sbarWrapper div{height:12px;}
        `;
            style.innerHTML = styleContent;
            if(self.conf.Container) {
                self.conf.Container.style.position = 'relative';
            }
            document.body.appendChild(style);

        }
        function createWrapper() {
            let el = self.conf.el;
            self.panelInner = document.createElement('div');
            self.panelWrapper = <HTMLDivElement>d.create('<div class="sbarWrapper"></div>');
            self.panelWrapper.style.width    = `${el.offsetWidth}px`;


            self.panelInner.style.width = `${el.scrollWidth}px`;
            self.panelWrapper.appendChild(self.panelInner);
            if(self.conf.Container) {
                //self.panelInner.style.width = `${el.scrollWidth}px`;
                self.panelWrapper.style.position = 'absolute';
                self.panelWrapper.style.paddingTop = '0px';
                self.panelWrapper.style.paddingBottom = '0px';
                self.conf.Container.appendChild(self.panelWrapper);
            }
            else {
                self.panelWrapper.style.left     = `${tools.offset.left(el)}px`;
                self.panelWrapper.style.bottom   = `${self.conf.bottom}px`;
                document.body.appendChild(self.panelWrapper);
            }

        }

        createStyle();
        createWrapper();

    }
}