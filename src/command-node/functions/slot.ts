/**
 * Slot function Node
 */

import BaseNode from './../base';
import {strStartsWith, indexOf} from './../../util';
import { isArray } from 'util';

const SLOT = {
    armor: [
        "chest", "feet", "head"
    ],
    weapon: [
        "mainhand", "offhand"
    ],
    enderchest: range(26),
    hotbar: range(8),
    inventory: range(26),
    horse: [
        "saddle", "chest", "armor", ...range(14)
    ],
    villager: range(7)
}

function range(end: number) {
    let result: Array<string> = [];
    for (let i = 0; i <= end; i++) {
        result.push(i.toString());
    }
    return result;
}

export default class SlotNode extends BaseNode {
    getCompletion (line: string, start: number, end: number, data): [Array<string>, boolean]  {
        let index = indexOf(line, start, end, ' ');
        if (index !== -1) {
            return super.getCompletion(line, index+1, end, data);
        }
        let split = line.substring(start, end).split(".");
        let temp = SLOT;
        for (let i = 0; i < split.length - 1; i++) {
            if (temp[split[i]]) {
                temp = temp[split[i]];
            } else {
                return [[], split.length > 1];
            }
        }
        if (isArray(temp)) {
            return [temp, split.length > 1];
        } else {
            return [Object.keys(temp), split.length > 1];
        }
    }
}