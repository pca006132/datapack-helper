/**
 * Objectives node
 */

import {BaseNode} from './../base';
import {getResources} from './../../resources';
import {indexOf} from './../../util';

class ObjectiveNode extends BaseNode {
    getCompletion = (line: string, start: number, end: number, data): [Array<string>, boolean] => {
        let index = indexOf(line, start, end, ' ');
        if (index !== -1) {
            return super.getCompletion(line, index+1, end, data);
        }

        let segment = line.substring(start, end);
        return [getResources("objectives").map(v=>v[0]).filter(v=>v.startsWith(segment)), true];
    }
}