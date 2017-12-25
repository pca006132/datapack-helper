/**
 * Handle display slot
 */

import BaseNode from './../base';
import {strStartsWith, indexOf} from './../../util';
import {getResources} from './../../resources';
import {isArray} from 'util';

const SLOTS = {
    list: {

    },
    sidebar: {
        team: [
            ...getResources("#colors")
        ]
    },
    belowName: {

    }
}

export default class DisplaySlotNode extends BaseNode {
    getCompletion (line: string, start: number, end: number, data): [Array<string>, boolean]  {
        let index = indexOf(line, start, end, ' ');
        if (index !== -1) {
            return super.getCompletion(line, index+1, end, data);
        }
        let split = line.substring(start, end).split(".");
        let temp = SLOTS;
        for (let i = 0; i < split.length - 1; i++) {
            if (temp[split[i]]) {
                temp = temp[split[i]];
            } else {
                return [[], split.length > 1];
            }
        }
        if (isArray(temp)) {
            return [temp, true];
        } else {
            return [Object.keys(temp), true];
        }
    }
}