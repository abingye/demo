/// <amd-module name="Virtual"/>
import {FormCom} from "./basic";
export class Virtual extends FormCom {

    protected wrapperInit(): HTMLElement {
        return undefined;
    }
    onSet: (val) => void;
    get() {
        return this.data;
    }
    set(data : any): void {
         this.data = data;
    }
    get value() {
        return this.data;
    }
    set value(data : any) {
        this.data = data;
    }
}