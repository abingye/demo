interface obj{
    [any : string]: any;
}
interface objOf<T> {
    [any : string]: T;
}
// interface ComPara{
//     //将此dom转成相应的控件
//     container: HTMLElement;
//     tabIndex? : boolean;
//     tabIndexKey? : number
// }
interface CustomFile {
    blob: Blob;
    name?: string;
    lastModifiedDate?: any;
    type?: string;
    size?: number;
}

type Primitive = string | number | boolean

interface COL{
    title: string;
    name: string;
    [any:string]: any
}

interface M_COL extends COL{
    colspan: number,  // 合并列数
    rowspan: number   // 合并行数
}

// 多行合并-行数据
interface M_ROW{
    title: string,
    name: string,
    rowspan: number   // 合并行数
}

interface ListItem{
    value?: any;
    text?: string;
    [key:string]: any;
}



interface AjaxSuccess{
    (response: any, s?: string, xhr? :XMLHttpRequest):void;
}
interface AjaxError{
    (xhr: XMLHttpRequest, type?: string, text?: string): void;
}


interface IRAjaxSetting extends IAjaxSetting{
    data2url?: boolean;
    silent?: boolean;
    needGps?: boolean;
    loading?: {
        msg?: string;
        disableEl?: HTMLElement;
        duration?: number;  //延时关闭，默认3s
        container?: HTMLElement;
    }
}

interface Btn{
    title?: string;
    icon?: string;
    action?: string;
}

interface PickerOption {
    text?: string;
    value?: any;
    value2? : [any , any];
}

interface Mui_Date{
    y: PickerOption;
    m: PickerOption;
    d: PickerOption;
    h: PickerOption;
    i: PickerOption;
    value: string;
}
interface R_Aggr{
    caption: string;
    dataAddr: R_ReqAddr;
    fieldName: string;
    itemId? : string // 前端自己加的属性
    expression? : string
}

interface R_VarList{
    varName: string;//变量名称
    varValue?: string;
}//变量名称
interface R_ReqAddr {
    dataAddr: string;
    varType?: number; // 0 默认参数，2：selection（用逗号隔开），3 将参数放在body中
    commitType?: number; //
    needGps?:number; // 是否开启GPS：0 => false, 1 => true
    varList?: R_VarList[];
    type?: string;
    parseVarList?: R_VarList[];
    addrType?:boolean;
}

interface R_Field extends COL {
    caption?: string;//标题
    subcols?: R_Field[],
    noModify?: string; // 新增的时候不可编辑
    noEdit?: boolean;  // 是否不可编辑，在编辑界面有效
    noShow?: boolean;  // 是否不可查看
    noAdd?: boolean;   // 新增时是否界面展示
    flag?: boolean;    // 为false时编辑是无法编辑及修改数据，为true正常
    atrrs?: obj;       // 属性
    endField?: string; //
    elementType?: string;//元素类型  见  DbConst.RES_TYPE  VALUE、PICK、LOOKUP ,如果该字段为空，检查属性列表中是否有配数据类型 DATA_TYPE
    dataAddr?: R_ReqAddr;//数据来源
    assignSelectFields?: string[];//
    lookUpFieldName?: string;
    assignAddr?: R_ReqAddr;//assign 地址 ，新增 修改界面才会有
    supportLink?: boolean;//是否支持超链接
    link?: R_ReqAddr;
    multiValue?: boolean;
    lookUpKeyField?: string;
    comType?: string;
    displayFormat?: string;
    dataType?: string;
    noSum?: number;
    valueLists?: string;
    multiPick?: {
        dataAddr: R_ReqAddr;
    }
    chkAddr?: R_ReqAddr;
    isCanSort?: boolean;
    sortName?: string;
    fileInfo?:R_ReqAddr; // 文件信息地址
    backWhen? : string   // 后台计算规则表格单元格显示 true：显示backColor颜色
    backColor? : number  // 色码
    caculateExpr? : string // 数据渲染完成后调用计算规则

}
interface R_SubTable_Field{
    caption : string;//panel 标题，有可能为空
    fields : R_Field [];//面板中元素列表  input date 下拉等
    subButtons? : R_Button[];//操作按钮列表
    defDataAddrList? : R_ReqAddr[];//默认值获取地址列表
    dataAddr : R_ReqAddr;//获取数据后台地址
    updatefileData? : R_ReqAddr;
    subTableList?:R_SubTable_Field_UIAddr[]; // 移动端列表页子表地址
}
interface R_SubTable_Field_UIAddr{
    uiAddr?:R_ReqAddr;
    caption?:string;
    multPage:number;
}
interface winOpen {
    url: string;
    gps?: boolean;
    title?: string;
    data?: any;
    callback?: () => void;
    header?: object;
    extras?: object;
    isDownLoad?: boolean;
}
interface R_Button extends Btn {
    actionAddr: R_ReqAddr;// 操作提交后台地址
    buttonType: number;// 按钮类型: 新增、删除、修改、查询
    subType: string;// 对应哪种 方法  import时候默认不提示
    openType: string;// 打开方式 见UiConst
    hintBeforeAction?: boolean;// 操作前是否提示信息
    refresh: number;// 是否刷新
    multiselect?: 0 | 1 | 2; //按纽是否允许多选:0不选;1单选,2多选
    selectionFlag?: 1 | 0; // 反选，1反选，0不反选。
    linkName?: string;
    inventoryKey?:string;
    haveRoll? : boolean; // 是否有翻页
    icon?:string; // 图标
    operation? : {  // 单选
        content : ListItem[]; // 单选数据
        default : string; // 默认选中数据
    }

    // 前端自己加的属性
    hintAfterAction?: boolean; //点击按钮后是否提示
    caption?:string;
    title?:string;
    judgefield?: string; // 列字段名（可多个，逗号隔开），全为1可点击，有0不可点击，表格中无该字段数据则略过
}
interface R_Input {
    maxLength?: number, //最大长度
    minLength?: number, //最小长度
    timeout?: number,   //延迟发生
    fieldName?: string,
    fieldRegex?: string, //正则匹配规则
    dataAddr?: R_ReqAddr,
    container?: HTMLElement, //按键绑定的dom
    uiType?: number,
    inputType?: string, // 0扫码（rfid设备可连续扫码，手机单次扫码）1.rfid扫码  2.扫码（rfid设备，手机启用连续扫码）
}

interface HTMLElementEventMap {
    "pan": IDefinedEvent
    "panstart": IDefinedEvent
    "panmove": IDefinedEvent
    "panend": IDefinedEvent
    "panleft": IDefinedEvent
    "panright": IDefinedEvent
    "panup": IDefinedEvent
    "pandown": IDefinedEvent
    "press": ICustomEvent
    "touchzoom": ITouchZoomEvent
}
interface IVNode {
    tag: string;
    props?: {
        dataset?: obj;
        [key: string]: any;
    };
    children?: (IVNode | string)[];
    key?: string;
}