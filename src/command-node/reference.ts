/**
 * Reference node
 */

import {BaseNode} from './base';
import {strStartsWith} from './../util';
import {getResources} from './../resources';

export class Reference extends BaseNode {
    constructor(key:string) {
        super();
        this.key = key;
    }
    key: string;

    getCompletion = (line: string, start: number, end: number): [Array<string>, boolean] => {
        let index = -1;
        for (let i = start; i < end; i++) {
            if (line[i] === ' ') {
                index = i;
                break;
            }
        }
        if (index !== -1) {
            return super.getCompletion(line, index+1, end);
        }
        if (strStartsWith(line, start, end, 'minecraft:')) {
            return [getResources(this.key), true];
        } else {
            return [['minecraft:'], false];
        }
    }
}