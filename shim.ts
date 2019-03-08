DOMTokenList.prototype.toggle = function (token: string, force: boolean = !this.contains(token)) {
    force = !!force; // false
    let result = this.contains(token), // false
        method = result ? force !== true && "remove" : force !== false && "add";

    if (method) {
        this[method](token);
    }

    return force;
};
