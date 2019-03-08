/// <amd-module name="GlobalTestModule"/>
/// <amd-dependency path="D3" name="D3"/>

import {RingProgress} from "./components/ui/progress/ringProgress";
import {Progress} from "./components/ui/progress/progress";
import {Modal} from "./components/feedback/modal/Modal";
import {SvgDraw} from "./utils/svgDraw";
import {SelectBox} from "./components/form/selectBox/selectBox";
import {RadioBoxGroup} from "./components/form/selectBoxGroup/selectBoxGroup";
import {RadioBox} from "./components/form/radiobox/radioBox";

function fn(string, substitute) {
    if(substitute === 'ES6') {
        substitute = 'ES2015'
    }
    return substitute + string[1];
}

const version = 'ES6';
const result = fn`${version} was a major update`;

console.log(result);

