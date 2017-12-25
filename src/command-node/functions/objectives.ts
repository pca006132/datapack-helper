/**
 * Objectives node
 */

import BaseNode from './../base';
import {getResources} from './../../resources';
import {indexOf} from './../../util';

export default class ObjectiveNode extends BaseNode {
    trigger = false;
    constructor(trigger: boolean = false) {
        super();
        this.trigger = trigger;
    }

    getCompletion (line: string, start: number, end: number, data): [Array<string>, boolean]  {
        let index = indexOf(line, start, end, ' ');
        if (index !== -1) {
            return super.getCompletion(line, index+1, end, data);
        }

        let segment = line.substring(start, end);
        return [getResources("objectives").filter(v=>v[0].startsWith(segment) && (!this.trigger || v[1] === 'trigger')).map(v=>v[0]), true];
    }
}