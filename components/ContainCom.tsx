/// <amd-module name="ContainCom"/>

import Component = G.Component;

export abstract class ContainCom extends Component {
    protected _body: HTMLElement | Component;
    get body() {
        return this._body
    }
    get childs(){
        const TREE_KEY = G.__EL_DATA_INNER_KEY__.tree;
        let currentData = G.elemData.get(this)[TREE_KEY] || {},
            childs = currentData.childs || [];
        return [...childs]
    }
}