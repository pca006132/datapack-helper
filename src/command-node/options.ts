/**
 * Option node
 */

import {BaseNode} from './base';
import {strStartsWith} from './../util';

export class OptionNode extends BaseNode {
    constructor(options:string[]) {
        super();
        this.content = options;
    }
    content: string[];
    getCompletion = (line: string, start: number, end: number): [Array<string>, boolean] => {
        for (let name of this.content) {
            if (strStartsWith(line, start, end, name) && line[start+name.length+1] === ' ') {
                return super.getCompletion(line, start + name.length+1, end);
            }
        }

        let segment = line.substring(start, end);
        return [this.content.filter(v=>v.startsWith(segment)), false];
    }
}