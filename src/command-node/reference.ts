/**
 * Reference node
 */

import BaseNode from './base';
import {strStartsWith, indexOf} from './../util';
import {getResources} from './../resources';

export default class Reference extends BaseNode {
    constructor(key:string) {
        super();
        this.key = key;
    }
    key: string;

    getCompletion = (line: string, start: number, end: number, data): [Array<string>, boolean] => {
        let index = indexOf(line, start, end, ' ');
        if (index !== -1) {
            return super.getCompletion(line, index+1, end, data);
        }
        if (strStartsWith(line, start, end, 'minecraft:')) {
            return [getResources(this.key), true];
        } else {
            return [['minecraft:'], false];
        }
    }
}