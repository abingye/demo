namespace G{
    let _storage = window.localStorage;
    let user = JSON.parse(_storage.getItem("userInfo"));
    if(tools.isEmpty(user))
        user = {};
    if(typeof user === 'string')
        user = JSON.parse(<string>user);

    let LOCAL_MSG_ID = 'local_msg_' + user.userid;
    export let localMsg = (function () {
        let _notify = function(){
            let unreadMsgNum = d.query('#unreadMsgNum'),
                num = _getUnreadCount();
            if(unreadMsgNum){
                if(num > 0){
                    unreadMsgNum.classList.remove('hide');
                    unreadMsgNum.innerText = G.tools.isPc ? num + '' : '!';
                }else {
                    unreadMsgNum.classList.add('hide');
                }
            }
        };

        let _get = function () {
            let s = _storage.getItem(LOCAL_MSG_ID);
            return s ? JSON.parse(s) : [];
        };
        let _save = function (array) {
            if (!Array.isArray(array)) {
                array = [];
            }
            _storage.setItem(LOCAL_MSG_ID, JSON.stringify(array));

            _notify();
        };
        let _add = function (arr) {
            //     console.log(_get(), arr);
            //  alert(JSON.stringify(arr) + '11');
            _save(arr.concat(_get()));
        };
        let _read = function (notifyId) {
            let t = _get();
            let l = t.length;
            for (let i = 0; i < l; i++) {
                if (t[i].notifyId === notifyId) {
                    //    console.log(t[i]);
                    t[i].isread = 1;
                    break;
                }
            }
            _save(t);
        };
        let _remove = function (notifyId) {
            let t = _get();
            let l = t.length;
            for (let i = 0; i < l; i++) {
                if (t[i].notifyId === notifyId) {
                    t.splice(i, 1);
                    break;
                }
            }
            _save(t);
        };
        let _getUnreadCount = function () {
            let count = 0;
            _get().forEach(function (m) {
                if (m.isread === 0) {
                    count++;
                }
            });
            return count;
        };
        return {
            remove: _remove,
            get: _get,
            add: _add,
            read: _read,
            notify : _notify,
            getUnreadCount: _getUnreadCount
        }
    }());


    // export class IDB{
    //
    //     private dbName = 'BW';
    //     private request: IDBOpenDBRequest = null;
    //
    //     private static open() {
    //
    //     }
    //
    //
    // }
}
