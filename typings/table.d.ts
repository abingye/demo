/**
 * basicTable
 */

interface BT_Para {
    Container?: any;
    cols?: COL[];
    // ajax?: BT_Ajax;// function(mt, customer, callback){}
    // ajaxData? : obj; // ajax请求带上的data
    data?: any[]|M_ROW[][];//直接传入数据
    table?: HTMLTableElement; //dom
    sort?: number; // number 0, 默认 不开启排序 1 - 本地排序 2 - 只开启thead点击事件，排序留给外部实现
    move?: boolean;
    // appendPage? : boolean;
    // length?: number; //
    indexCol?: 'number' | 'select';  // string
    indexColMulti?: boolean; // true多选, false单选
    pseudoCol?: {
        width?: number,        // 伪列宽
        render: (index: number)=> string|HTMLElement,
        click: (index: number, event)=>void
    };
    lockColNum?: number;
    lockRowNum?: number;
    lockRow?: boolean;      // 是否锁行
    colResize?: boolean;    // 列宽是否可调整
    lockRowTop?: number;    // 锁行距离顶部距离
    dragSelect?: any;    // 拖拽选择
    dragRows?: any;      // 拖拽选中行
    multi?: {    // 是否多行表头
        enabled: boolean;
        cols: M_COL[][];
    };
    expand?: BT_Expand  // 展开行
    treegrid?: BT_Treegrid  // 树形展开行
    thead? : boolean;
    colMenu? : BT_Btn[];
    rowMenu? : BT_Btn[];
    colGroup? : boolean,    // 多列分组
    cellWidth? : number;
    cellMaxWidth?: any;
    // click? : (target:HTMLElement, bt:BasicTable)=>void;
    // clickSelector? : string;
    textFormat? : (trData:any, col:COL, index:number) => string;
    beforeShow?: (trData: any, colsData: any[]) => any;// param : trData, colsData ,  return: { tr : {attrs : value, ...} , td : [{attrs : value, ...}, ...]}
    onComplete?: () => void;
}
interface BT_SysCol{
    Container: HTMLDivElement,  // 伪列dom对象
    start: number,              // 列序号起始号
    offset: number,             // 显示的序列起始序号
    len: number,                // 序列生成的总条数
    colType: string,            // 功能列类型 index: 序列号  pseudo: 伪列
    childNode: (index: number)=>string|any    // 伪列节点生成函数/节点dom的html
}
interface BT_Expand{
    enabled: boolean;   // 是否启用
    cache: boolean;     // 是否缓存(是否每次展开都执行render)
    icon?: string[];    // 图标
    mode?: string;      // 展开方式  toggler|accordion
    /* 展开行的回调填充函数
     * @param   row     : 行数据
     * @param   index   : 行序号
     * @param   level   : 树展开深度
     * @param   callback: 展开行渲染函数
     *      @param   dom        : 展开行填充数据(string类型将直接填充|object[键值对]类型将与renderType配合渲染)
     *      @param   renderType : 渲染模版(dom设置为object[键值对]时使用，"dl"：列表)
     * @param
     */
    render: (row, index: number, callback:(dom?: string|object, renderType?: string)=>void)=>void;
}
interface BT_Treegrid{
    enabled: boolean;   // 是否启用
    cache: boolean;     // 是否缓存(是否每次展开都执行render)
    icon?: string[];    // 图标
    /* 是否显示展开行按钮
     * @param   nodeData: 节点数据
     * @param   index   : 行序号
     * @param
     */
    expand: (nodeData, index: number)=> boolean;
    /* 展开行的回调填充函数
     * @param   nodeData: 行数据
     * @param   index   : 行序号
     * @param   callback: 展开行渲染函数
     *      @param   childData        : 展开行 子数据项
     * @param
     */
    render: (nodeData, index: number, callback:(childData: any[])=>void)=>void;
}
interface BT_ExpandCache {
    index   : number,   // 缓存的行索引
    text   ?: string    // 展开内容缓存
}
interface BT_Page {
    page : number;
    length : number;
}
interface BT_StatPara {
    cols: string[];
    groupCols: string[];
    stats: {
        title: string;
        method: ((nums: number[]) => number)
    }
}
interface BT_Menu{
    event? : string;
    btns? : string[];
    extraBtns? : BT_Btn[];
    callback? : (btn:BT_Btn, target: HTMLElement)=>void
}
interface BT_MenuConf {
    identifier: string,
    targetSelector: string,
    targetGet(selector : HTMLElement): HTMLElement[];
    btns: BT_Btn[],
    eventHandle?:(target: HTMLElement, e: any) => void
}

interface BT_Btn{
    title : string;
    icon? : string;
    multi? : boolean;
    callback?(btn: BT_Btn, targets: HTMLElement[], target: HTMLElement) : void,
    children? : Array<BT_Btn>
}

/**
 * MobileTable
 */
interface MT_Para extends BT_Para{
    colReorder? : boolean;
    cellMenu? : BT_Menu;
    topBtn? : {
        query? : boolean;
        search? : boolean;
        btnArr : BT_Btn[],
        handle : (...any)=>void
    }
}

interface BT_PopMenu {
    show(identifier : string, btns? : BT_Btn[], btnHandle?);
    hide();
}