/**
 * Run scripts
 */

import * as vm from 'vm';
import { isNumber, isArray } from 'util';

let context = vm.createContext({
    range: function(a: number, b: number = null, c: number = null) {
        let list = [];
        if (b === null) {
            [a, b] = [b, a]; //swap
            a = 0;
        }
        if (c === null) {
            c = a > b? -1 : 1;
        }

        let compare = (n: number) => {
            if (a < b)
                return n < b;
            return n > b;
        }

        for (let i = a; compare(i); i += c)
            list.push(i);
        return list;
    }
});

function toString(obj: any) {
    if (isNumber(obj) && !Number.isInteger(obj)) {
        return obj.toFixed(5);
    }
    return obj.toString();
}

export function evaluate(code: string) {
    let result = vm.runInContext(code, context);
    if (isArray(result)) {
        return result.map(v=>toString(v)).join("\n");
    }
    return result.toString();
}