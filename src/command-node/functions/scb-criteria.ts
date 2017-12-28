/**
 * Handle scoreboard criteria
 */

import BaseNode from './../base';
import {strStartsWith, indexOf} from './../../util';
import {getResources} from './../../resources';
import {isArray} from 'util';

let BLOCKS = Object.keys(getResources("#blocks"));

let CRITERIA = {
    dummy: {},
    trigger: {},
    deathCount: {},
    playerKillCount: {},
    totalKillCount: {},
    health: {},
    xp: {},
    level: {},
    food: {},
    air: {},
    armor: {},
    teamkill: [getResources("#colors")],
    killedByTeam: [getResources("#colors")],
    minecraft: {
        "broken:minecraft": getResources("#items"),
        "crafted:minecraft": getResources("#items"),
        "dropped:minecraft": getResources("#items"),
        "killed:minecraft": getResources("#entities"),
        "killed_by:minecraft": getResources("#entities"),
        "mined:minecraft": BLOCKS,
        "picked_up:minecraft": getResources("#items"),
        "used:minecraft": getResources("#items"),
        "custom:minecraft": {
        }
    }
}

let stat = getResources("#stats")
for (let n of stat) {
    CRITERIA.minecraft["custom:minecraft"][n] = {};
}

export default class ScbCriteriaNode extends BaseNode {
    getCompletion (line: string, start: number, end: number, data): [Array<string>, boolean]  {
        let index = indexOf(line, start, end, ' ');
        if (index !== -1) {
            return super.getCompletion(line, index+1, end, data);
        }

        let split = line.substring(start, end).split(".");
        let temp = CRITERIA;
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
