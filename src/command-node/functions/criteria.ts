/**
 * Criteria node
 */

import {BaseNode} from './../base';
import {getResources} from './../../resources';
import {indexOf, getResourceComponents} from './../../util';

class Criteria extends BaseNode {
    getCompletion = (line: string, start: number, end: number, data): [Array<string>, boolean] => {
        let index = indexOf(line, start, end, ' ');
        if (index !== -1) {
            return super.getCompletion(line, index+1, end, data);
        }

        let segment = line.substring(start, end);
        let components = getResourceComponents(data["advancement"] || "");
        let temp = getResources("advancements");
        for (let i = 0; i < components.length - 1; i++) {
            if (temp[components[i]]) {
                temp = temp[components[i]];
            } else {
                return [[], true];
            }
        }
        temp = temp["$adv"][components[components.length - 1]];
        if (temp) {
            return [temp.filter(n=>n.startsWith(segment)), false];
        }
        return [[], false];
    }
}