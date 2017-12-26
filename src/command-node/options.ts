/**
 * Option node
 */

import BaseNode from './base';
import {strStartsWith, indexOf} from './../util';

export default class OptionNode extends BaseNode {
    constructor(options:string[]) {
        super();
        this.content = options;
    }
    content: string[];
    getCompletion (line: string, start: number, end: number, data): [Array<string>, boolean]  {
        let index = indexOf(line, start, end, ' ');
        if (index !== -1) {
            return super.getCompletion(line, index+1, end, data);
        }

        let segment = line.substring(start, end);
        return [this.content.filter(v=>v.startsWith(segment)), false];
    }
}