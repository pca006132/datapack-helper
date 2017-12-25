/**
 * Handle NBT path
 */

import BaseNode from './../base';
export default class NbtPathNode extends BaseNode {
    base: string;
    constructor(base: string) {
        super();
        this.base = base;
    }
    getCompletion = (line: string, start: number, end: number, data): [Array<string>, boolean] => {
        let index = start-1;
        let inString = false;
        let escape = false;
        while (++index < end) {
            if (inString) {
                if (escape) {
                    escape = false;
                } else {
                    switch (line[index]) {
                        case '"':
                            inString = false;
                            break;
                        case '\\':
                            escape = true;
                            break;
                    }
                }
            } else {
                switch (line[index]) {
                    case '"':
                        inString = true;
                        break;
                    case ' ':
                        return super.getCompletion(line, index+1, end, data);
                }
            }
        }
        return [[], false];
    }
}