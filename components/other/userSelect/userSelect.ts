/// <amd-module name="UserSelect"/>
import d = G.d;
interface UserSelectPara{
    target : HTMLElement,
    className? : string
}
export class UserSelect {
    private handle;
    constructor( private para : UserSelectPara){
        para.target.classList.add('user-select-text');
        para.className && para.target.classList.add(para.className);

        this.handle = (e) => {
            document.body.classList.add('user-select-none');
            d.once(document, 'mouseup', () => {
                document.body.classList.remove('user-select-none');
            })
        };
        this.on();
    }

    on() {
        d.on(this.para.target, 'mousedown', this.handle);
    }
    off() {
        d.off(this.para.target, 'mousedown', this.handle);
    }
}