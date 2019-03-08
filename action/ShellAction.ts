/// <amd-module name="ShellAction"/>
import {Device} from "global/entity/Device";
import {AndroidFactory} from "../shell/factory/AndroidFactory";
import {PcFactory} from "../shell/factory/PcFactory";
import {IosFactory} from "../shell/factory/IosFactory";
import {H5Factory} from "../shell/factory/H5Factory";

/**
 * Created by zhengchao on 2017/12/5.
 * 硬件接口统一控制器
 */
export class ShellAction{

    static shellAction:ShellAction = null;
    private constructor() {
        let os = Device.get().getOs();
        switch (os) {
            case 'pc':
                return new PcFactory();
            case 'ad':
                return new AndroidFactory();
            case 'ip':
                return new IosFactory();
            default:
                return new H5Factory();
        }
    }

    static get():any {
        if (!ShellAction.shellAction)
            ShellAction.shellAction = new ShellAction();
        return ShellAction.shellAction;
    }
}
