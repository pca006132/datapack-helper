/**
 * Plain text node
 */

import BaseNode from './base';
import {strStartsWith} from './../util';

export default class PlainNode extends BaseNode {
    constructor(name:string) {
        super();
        this.content = name;
    }
    content: string;
    getCompletion (line: string, start: number, end: number, data): [Array<string>, boolean]  {
        if (strStartsWith(line, start, end, this.content)) {
            let result = super.getCompletion(line, start + this.content.length + 1, end, data);
            return result;
        }

        let segment = line.substring(start, end);
        if (this.content.startsWith(segment))
            return [[this.content], false];
        return [[], false];
    }
}