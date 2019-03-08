/// <amd-module name="SubPage"/>
import d = G.d;

export const SubPage = (function () {
    let pageHtml = '<div class="sub-page">' +
        '<div class="buttons"><span data-action="toggle" style="transform: rotate(90deg);" class="mui-icon fa fa-expand"></span>' +
        '<span data-action="close" class="mui-icon ti-close mui-pull-right"></span></div>' +
        '</div>';
    let loading = document.createElement('div'),
        pageDom = null,
        contentDom = document.createElement('div'),
        body = document.body,
        isShow = false,
        onClose = function () {};

    contentDom.classList.add('content');
    loading.classList.add('mui-spinner', 'hide');

    function close() {
        if(isShow){
            d.remove(pageDom, false);
            d.remove(contentDom, false);
            isShow = false;
            onClose();
        }
    }

    return {
        create : function () {
            if(pageDom === null){
                pageDom = G.d.create(pageHtml);
                G.d.on(pageDom.querySelector('div.buttons'), 'click', '[data-action]', function(){
                    switch (this.dataset.action){
                        case 'toggle':
                            if(pageDom.classList.toggle('full-page')){
                                this.classList.remove('fa-expand');
                                this.classList.add('fa-compress');
                            }else{
                                this.classList.remove('fa-compress');
                                this.classList.add('fa-expand');
                            }
                            break;

                        case 'close':
                            typeof close === 'function' && close();
                            break;
                    }
                });
            }
            contentDom.innerHTML = '';
            contentDom.appendChild(loading);
            return contentDom;
        },
        show : function (cb) {
            cb = typeof cb !== 'function' ? ()=>{} : cb;
            if(!isShow){
                body.appendChild(pageDom);
                isShow = true;

                setTimeout(function () {
                    pageDom.appendChild(contentDom);
                    typeof cb === 'function' && cb();
                }, 30);
            }else{
                typeof cb === 'function' && cb();
            }


        },
        onClose : function (cb) {
            onClose = cb;
        },
        getLoading : function () {
            return loading;
        }
    }
}());