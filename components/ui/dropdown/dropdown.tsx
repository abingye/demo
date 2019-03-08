/// <amd-module name="DropDown"/>

import tools = G.tools;
import {List} from "../list/list";
import d = G.d;
import {Spinner} from "../spinner/spinner";

export interface DropDownPara extends SelectDataPara {
    // tpl? : string, // html模板文件 {{var}} - 变量
    el: HTMLElement;  // 如果inline为真,则el作为下拉框的父容器；否则父容器为body，el仅用于作为相对此位置显示下拉框
    inline?: boolean; // 是否直接显示在界面上，为真时其父容器是el，否则为body
    multi?: boolean;  // true多选 false单选（默认）, null or undefined 每次点击都会调用onSelect
    className?: string;
    isAdapt?:boolean;//下拉框是否自适应
    // onSelect?(item : ListItem, index:number): void;
    onSelect?(item: ListItem, index: number): void;

    onMultiSelect?(items: ListItem[], index: number): void
}

export interface ListData extends Array<ListItem | string | number> {
}

export interface SelectDataPara {
    data?: ListData,
    ajax?: {
        fun?(url, value: string, callback: (data: ListData) => void),
        url?: string;
    };
}

export class DropDown {
    // private values : any[] = null;
    // private texts : string[] = null;
    private selectIndex: number = -1;
    private ulDom: HTMLUListElement;
    private isVisible = false;
    private list: List;
    private data: ListItem[];
    private isAdapt: boolean;
    get isShow(){
        return this.isVisible;
    }

    constructor(private para: DropDownPara) {
        this.ulDom = <ul className="dropdown-menu"></ul>;
        this.isAdapt = para.isAdapt || false;
        if (para.className) {
            this.ulDom.classList.add(para.className);
        }

        if (!para.el) {
            para.el = document.body;
        }
        if (para.multi !== null && !para.multi) {
            para.multi = false;
        }
        //当inline不为真时，所有的下拉列表都放在body下,以el为相对此位置显示下拉框
        if (para.inline) {
            para.el.appendChild(this.ulDom);
        } else {
            d.query('body').appendChild(this.ulDom);
        }


        //   if(para.multi === true){
        let listPara = {
            container: this.ulDom,
            select: null,
            data: this.data
            // callback : (index ) => {
            //     if(!this.para.inline){
            //         this.hideList();
            //     }else if(this.selectIndex !== -1){
            //         this.selectIndex = index;
            //         this.onSelect();
            //     }
            //     if(this.selectIndex !== index){
            //         this.selectIndex = index;
            //         this.onSelect();
            //     }
            // }
        };


        if (para.multi === true) {
            listPara.select = {
                multi: true,
                show: true,
                callback: (selected, index) => {
                    let items: ListItem[] = [];

                    selected.forEach((i) => {
                        items.push(this.data[i])
                    });
                    selected = items;

                    let onMultiSelect = this.para.onMultiSelect;
                    if(onMultiSelect && typeof onMultiSelect === 'function'){
                        onMultiSelect(selected, index);
                    }
                }
            }
        } else {
            this.initSingleEvent();
        }


        this.list = new List(listPara);

        this.list.removeAllDom();

        this.initListData(this.para.data);

        if (para.inline) {

            this.ulDom.classList.add('inline');
            this.showList();
        } else {
            window.addEventListener('mui' in window ? 'tap' : 'click', this.clickHideHandler, true);
        }
    }

    get selectedIndex() {
        return this.selectIndex;
    }
    getUlDom() {
        return this.ulDom;
    }

    private clickHideHandler = (e: Event) => {
        if(this.para.multi){
            let target = e.target as HTMLElement;
            if(d.closest(target,'.dropdown-menu')){
                return;
            }
        }
        if(this.para.el !== document.body && d.isParent(e.target as HTMLElement, this.para.el)){
            return
        }
        this.hideList();
    };

    removeItem(index) {
        this.list.removeDom(index);
    }

    removeAllItem() {
        this.list.removeAllDom();
    }


    // callback
    private initSingleEvent() {
        let self = this;
        d.on(this.ulDom, 'click', 'li[data-index]', function (e: Event) {
            let index = parseInt(this.dataset.index);
            if (typeof self.para.multi !== 'boolean') {
                self.selectIndex = index;
                self.onSelect();
            } else {
             //   console.log(self.data[index])
                if (!self.para.inline) {
                    self.hideList();
                }
                self.selectIndex = index;
                self.onSelect();
                /* else if (self.selectIndex !== -1) {
                    self.selectIndex = index;
                    self.onSelect();
                }
                if (self.selectIndex !== index) {
                    self.selectIndex = index;
                    self.onSelect();
                }*/
            }

            e.stopPropagation();
        });
    }

    public setPara(para: SelectDataPara) {

        let data = para.data,
            ajax = para.ajax;

        if (data && data[0]) {

            this.para.data = data;
            //用data参数获取数据
            this.initListData(data);

            this.para.ajax = null;
            // this.addShowClass();

        } else if (ajax) {
            this.para.ajax = tools.obj.merge(this.para.ajax, ajax);

            this.para.data = null;
            this.data = null;
            this.ulDom.innerHTML = '';
        }
    }

    private onSelect() {
        let index = this.selectIndex;
        this.para.onSelect && this.para.onSelect(this.data[index], index);

        // let onMultiSelect = this.para.onMultiSelect;
        // if(onMultiSelect && typeof onMultiSelect === 'function'){
        //     onMultiSelect(selected, index);
        // }

    }

    /**
     * 将传入的参数转为title 与 value
     */
    private initListData(data: ListData) {
        this.data = this.data2listItem(data);
        this.render(this.data);
    }

    private data2listItem(data: ListData) {
        let newData: ListItem[] = [];
        if (Array.isArray(data)) {
            let hasTitle = typeof data[0] !== 'string';

            data.forEach(d => {
                if (hasTitle) {
                    newData.push(d as ListItem);
                } else {
                    newData.push({
                        text: d + '',
                        value: d
                    });
                }
            });
        }
        return newData;
    }

    public setData(data: ListData) {
        if (Array.isArray(data)) {
            // this.para.data = data;
            //用data参数获取数据
            this.initListData(data);
        }
    }

    private addShowClass(relEl?: HTMLElement) {
        //如果没有指定的相对位置，就以el为相对此位置显示下拉框
        this.ulDom.classList.add('show');
        if(!this.para.inline) {
            if(relEl) {
                d.setPosition(this.ulDom, relEl, this.isAdapt);
            } else {
                d.setPosition(this.ulDom, this.para.el, this.isAdapt);
            }
        }
    }

    protected spinner: Spinner;
    protected isFirst: boolean = true;
    public showList(relEl?: HTMLElement) {
        let self = this,
            data = this.para.data,
            ajax = this.para.ajax;

        this.addShowClass(relEl);
        this.isVisible = true;
        if (ajax && ajax.fun) {
            let isMulti = this.para.multi;
            if(!isMulti || (this.isFirst && isMulti)){
                this.isFirst = false;
                this.spinner && this.spinner.hide();
                this.spinner = new Spinner({
                    el: this.ulDom,
                    type: Spinner.SHOW_TYPE.cover
                });
                this.spinner.show();
                // 用ajax获取数据
                let selectedData = this.get();
                ajax.fun(ajax.url, (selectedData && selectedData.value) ? selectedData.value.toString() : '', d => {
                    self.spinner && self.spinner.hide();
                    self.spinner = null;
                    if (Array.isArray(d)) {
                        this.initListData(d);
                    }
                });
            }
        } else {

            // 数据为空时，先解析为列表的数据
            if (this.data === null && Array.isArray(data)) {

                //用data参数获取数据
                this.initListData(data);

            }
        }

    }

    public hideList() {
        this.spinner && this.spinner.hide();
        this.ulDom && this.ulDom.classList.contains('show') && this.ulDom.classList.remove('show');
        this.isVisible = false;
    }

    /**
     * 隐藏指定下标的item，每次重新隐藏，不与上次操作重叠，传入 空数组，或者null则显示全部
     * @param {number[]} indexes
     */
    public showItems(indexes: number[]) {
        d.queryAll('li[data-index]', this.ulDom)
            .forEach(li => {
                let index = parseInt(li.dataset.index);
                if (Array.isArray(indexes)){
                    if(indexes.indexOf(index) > -1) {
                        li.classList.remove('hide');
                    } else {
                        li.classList.add('hide');
                    }
                }else{
                    li.classList.remove('hide');
                }
                // if (Array.isArray(indexes) && indexes.indexOf(index) > -1) {
                //     li.classList.remove('hide');
                // } else {
                //     li.classList.add('hide');
                // }
            });
    }

    public toggle(relEl?: HTMLElement) {
        this.isVisible ? this.hideList() : this.showList(relEl);
    }

    public select(value: string | number) {
        if (Array.isArray(this.data)) {
            for (let i = 0, d: ListItem = null; d = this.data[i]; i++) {
                if (d.value === value) {
                    if(this.selectIndex !== i){
                        this.selectIndex = i;
                        this.onSelect();
                    }

                    return true;
                }
            }
            return false;
        } else {
            return false;
        }
    }

    /**
     * 获取选中index
     * @returns {any}
     */

    public get(): ListItem {
        let index = this.selectIndex;
        //多选
        if (this.list.get()) {
            let indexes = this.list.get();
            return this.data ? this.data.filter((data, index) => {
                return indexes.indexOf(index) > -1;
            }) : null;

            //单选
        } else if (tools.isEmpty(this.data) || index === -1) {
            return null;
        } else {
            return this.data[index];
        }
    }

    /**
     * 获取选中的数据
     * @returns {ListItem[]}
     */
    public getSelect() : ListItem[]{
        let select = this.get(),
            data : ListItem[] = [];
        select.forEach((s) => {
            this.data.forEach((d, i) => {
                if(s === i){
                    data.push(d);
                }
            })
        });
        return data;
    }




    public addSelected(index : Array<number>) {
        this.list.addSelected(index);
    }

    public set(index : Array<number>) {
        this.list.set(index);
    }

    public setAll() {
        this.list.setAll();
    }
    public unSet(index : Array<number>) {
        this.list.unSet(index);
    }


    private render(data: ListItem[], isRefresh = true) {
        let plus = 0;
        if (isRefresh) {
            this.ulDom.innerHTML = '';
        } else {
            plus = this.data ? this.data.length : 0;
        }
        let items: HTMLElement[] = [];
        data.forEach((da, i) => {
            if (!tools.isEmpty(da)) {
                items.push(<li className="drop-item" title={tools.str.removeHtmlTags(da.text)}
                               data-index={plus + i}><span className="drop-span">{da.text}</span></li>);
            }
        });
        this.list.addByDom(items);
    }

    public destroy() {
        this.data = null;
        // this.ulDom.remove();
        d.remove(this.ulDom);
        this.ulDom = null;
        // this.texts = null;
        window.removeEventListener('mui' in window ? 'tap' : 'click', this.clickHideHandler, true);
    }

    public dataAdd(data: ListData) {

        let newData = this.data2listItem(data);
        this.render(newData, false);
        this.data = Array.isArray(newData) && Array.isArray(this.data) ? this.data.concat(newData) : newData;
    }

    public dataDel(index: number) {
        this.ulDom.removeChild(this.ulDom.querySelector(`[data-index="${index}"]`));

        delete this.data[index];

        if (index === this.selectIndex) {
            this.selectIndex = -1;
        }
    }


    public dataDelAll() {
        this.data = null;
        // this.values = null;
        this.render([]);
    }

    public getData() {
        return this.data;
    }

    /**
     * 返回value对应的index
     * @param str
     * @returns {Array}
     */
    public transIndex(str : string[]) : number[] {
        let data = this.getData(),
            num = [];

        data && str.forEach((s) => {
            data.forEach((d, i) => {
                if(s === d.value){
                    num.push(i);
                }
            })
        });

        return num;
    }

}