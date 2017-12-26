/**
 * Plain text node
 */

import BaseNode from './base';
import {strStartsWith, indexOf} from './../util';

export default class PlainNode extends BaseNode {
    constructor(name:string) {
        super();
        this.content = name;
    }
    content: string;
    getCompletion (line: string, start: number, end: number, data): [Array<string>, boolean]  {
        let index = indexOf(line, start, end, ' ');
        console.log(line.substring(start, index));
        console.log(this.content);
        if (index !== -1) {
            if (line.substring(start, index) === this.content) {
                console.log("success");
                return super.getCompletion(line, index+1, end, data);
            }
        }
        let segment = line.substring(start, end);
        if (this.content.startsWith(segment))
            return [[this.content], false];
        return [[], false];
    }
}