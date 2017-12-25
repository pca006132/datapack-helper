/**
 * Criteria node
 */

import BaseNode from './../base';
import {getResources} from './../../resources';
import {indexOf, getResourceComponents} from './../../util';

export default class CriteriaNode extends BaseNode {
    getCompletion (line: string, start: number, end: number, data): [Array<string>, boolean]  {
        let index = indexOf(line, start, end, ' ');
        if (index !== -1) {
            return super.getCompletion(line, index+1, end, data);
        }

        let segment = line.substring(start, end);
        return [criteriaCompletion(data["advancement"]).filter(v=>v.startsWith(segment)), true];
    }
}

export function criteriaCompletion(advancement: string): Array<string> {
    let components = getResourceComponents(advancement);
    let temp = getResources("advancements");
    for (let i = 0; i < components.length - 1; i++) {
        if (temp[components[i]]) {
            temp = temp[components[i]];
        } else {
            return [];
        }
    }
    temp = temp["$adv"][components[components.length - 1]];
    return temp || [];
}