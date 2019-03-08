/// <amd-module name="TreeNodeBase"/>
import tools = G.tools;

export interface IBasicTreePara<T = any> {
    // parent?: BasicTreeNode;
    content?: T;
    children?: IBasicTreePara<T>[];
    isCollect?:boolean;
    // tnode?: BasicTreeNode;
}
const isInit = '__IS_INIT__',
    parent = '__PARENT__';


export class TreeNodeBase<T = any> {
    /**
     * para[parent] - 不用parent作为参数接口的属性 是防止外部调用是误传此参数.
     * @param {IBasicTreePara} para
     */
    protected isCollect: boolean;//配置收藏按钮
    constructor(para: IBasicTreePara<T> = {}) {
        this.isCollect = para.isCollect?para.isCollect:false;
        if (!para[isInit]) { // 根节点, 广度遍历初始化树，以免初始化时无法找到父节点
            let paraQueue: IBasicTreePara<T>[] = [para],
                root: this = null;

            while (paraQueue[0]) {
                let currentPara = paraQueue.shift();
                //
                currentPara[isInit] = true;
                if (root === null) {
                    currentPara[parent] = currentPara[parent] || 'nothing'; // hack 根元素 防止无限递归
                }
                let node = this.nodeCreate(currentPara);
                delete currentPara[isInit];

                if (root === null) {
                    root = node
                }

                if (Array.isArray(currentPara.children)) {

                    paraQueue.push(...currentPara.children.map(child => {
                        child[parent] = node;
                        return child;
                    }));
                }
            }
            return root;
        } else {
            this.init(para);
        }
    }

    protected init(para?: IBasicTreePara<T>) {
        if (para[parent] instanceof TreeNodeBase) {
            this.parent = para[parent];
            delete para[parent];
        }
        this.content = para.content;
    }

    protected nodeCreate(para: IBasicTreePara<T> = {}): this {
        para.isCollect=this.isCollect;
        return new (<any>this.constructor)(para);
    }

    // 获取当前节点深度
    get deep() {
        let deep = 0,
            current = this;

        while (current = current.parent) {
            deep++;
            // 防止死循环
            if (deep > 10000) {
                return null
            }
        }

        return deep;
    }

    /**
     * 将参数转成一棵树
     * @param {IBasicTreePara} data
     * @param {G.TreeNodeBase} root
     * @return {G.TreeNodeBase}
     */
    // protected data2tree(data: IBasicTreePara, root?: this): this {
    //
    //     let toTree = (data: IBasicTreePara, root?: this) => {
    //         let {content, children} = data,
    //             top = root ? root : new (<any>this.constructor(data));
    //
    //         // top._content = content;
    //
    //         if(!tools.isEmpty(children)) {
    //             children.forEach(nodeData => {
    //                 let child = this.data2tree(nodeData);
    //                 if(child) {
    //                     child.parentSet(top);
    //                 }
    //             });
    //         }
    //
    //         return top;
    //     };
    //
    //     return toTree(data, root);
    // }

    // 内容
    public content: any = null;

    // 父
    protected _parent: this = null;
    set parent(tnode: this) {
        // TODO 判断是否会引起回路(tnode 是否为当前树的根节点)
        if (tnode) {
            tnode.childrenAdd(this);

        } else {
            // 从父元素将自己移除
            this._parent && this._parent.childrenRemove(this);
        }
    }
    get parent() {
        return this._parent;
    }

    get siblings(): this[] {
        return this.parent ? this.parent.children.filter(node => node !== this) : null;
    }

    // 子
    protected _children: this[];
    set children(tnode: this[]) {
        this.childrenSet(tnode);
    }
    get children() {
        return this._children && [...this._children];
    }
    /**
     * 重置子节点
     * @param {this | this[]} tnode
     */
    childrenSet(tnode: this | IBasicTreePara<T> | (this | IBasicTreePara<T>)[]) {
        // 将之前的children父元素清理
        Array.isArray(this._children) && this._children.forEach(t => {
            t._parent = null;
        });

        this._children = null;
        this.childrenAdd(tnode);
    }

    childrenAdd(nodePara: this | IBasicTreePara<T> | (this | IBasicTreePara<T>)[]): this[] {
        let add = (tnodes: this[]) => {
            if (tools.isEmpty(tnodes)) {
                return;
            }
            this._children = this._children || [];
            this._children.push(...tnodes);

            // 把新的父节点指向当前节点
            // tnodes._parent = this;
            tnodes.forEach(tnode => tnode._parent = this);
        };

        let paraArr = tools.toArray(nodePara),
            nodes: this[] = [];

        paraArr.forEach((para) => {
            // let node: this = null;
            if (para instanceof TreeNodeBase) {
                nodes.push(para);
            } else {
                // para[parent] = 'noting';
                para[parent] = this;
                this.nodeCreate(para);
            }
        });

        add(nodes);

        return nodes;
    }

    childrenRemove(tnode: this | this[]) {

        let nodes = tools.toArray(tnode);

        for (let i = 0, node: this = null; node = nodes[i]; i++) {
            if (this._children && node) {
                let index = this._children.indexOf(node);
                if (index > -1) {
                    this._children.splice(index, 1);
                    node._parent = null;
                    i--;
                }
            }
        }
        // let remove = (tnode: this) => {
        //
        // };
        //
        // if(Array.isArray(tnode)){
        //     tnode.forEach(t => remove(t));
        // }else{
        //     remove(tnode);
        // }
    }


    /**
     * 通过遍历 找到需要的节点数组
     * @param {(tnode: BasicTreeNode) => boolean} filterCb
     * @param {number} maxDeep
     * @return {this[]}
     */
    find(filterCb: (tnode: this) => boolean, maxDeep = -1): this[] {
        let tnodes: this[] = null;
        this.each((t: this, deep) => {
            if (maxDeep < 0 || deep <= maxDeep) {
                if (filterCb(t)) {
                    tnodes = tnodes || [];
                    tnodes.push(t);
                }
            }
        });
        return tnodes;
    }

    /**
     * 从本身节点开始，向后查找（包含本身）
     * @param {(tnode: this) => boolean} filterCb
     * @returns {this}
     */
    backFind(filterCb: (tnode: this) => boolean): this {
        let result = this,
            deep = 0;

        while (result) {
            deep++;
            if (filterCb(result)) {
                return result
            } else {
                result = result.parent
            }

            if (deep > 100) {
                return;
            }
        }
        return null;
    }

    get root(): this {
        return this.backFind((node) => !node.parent)
    }

    // backTrack
    // static toTree(tnode: BasicTreeNode) {
    //     return new ;
    // }

    /**
     * 获取数据
     * @return {IBasicTreePara}
     */
    // dataGet() {
    //     function dataGet(tnode: TreeNodeBase){
    //         if(tnode){
    //             let treeData: IBasicTreePara = {};
    //             treeData.content = tnode.content;
    //             treeData.children = [];
    //
    //             Array.isArray(tnode.children) && tnode.children.forEach(t => {
    //                 treeData.children.push(dataGet(t));
    //             });
    //
    //             return treeData;
    //         }else{
    //             return null;
    //         }
    //     }
    //
    //     return dataGet(this);
    // }

    /**
     * 遍历树（前序遍历）
     * @param {(tnode: BasicTreeNode, deep: number) => void} cb
     */
    each(cb: (tnode: this, deep: number) => void) {

        let each = (tnode: this, cb: (tnode: this, deep: number) => void, startDeep = 0) => {
            if (tnode) {
                cb(tnode, startDeep);
                startDeep++;

                let children = tnode.children;
                Array.isArray(children) && children.forEach(t => {
                    each(t, cb, startDeep);
                })
            }
        };

        each(this, cb);
    }

    /**
     * 通过路径获取节点
     * @param {number[]} path
     * @return TreeNodeBase
     */
    nodeGetByPath(path: number[]) {
        let getByPath = (tnode: this, path: number[]) => {
            if (tnode && Array.isArray(tnode.children) && path && path.length) {
                let first = path.shift();
                return getByPath(tnode.children[first], path);
            } else {
                return tnode;
            }
        };

        return getByPath(this, path);
    }

}

