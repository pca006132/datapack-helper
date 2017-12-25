/**
 * Handle scoreboard criteria
 */

import {BaseNode} from './../base';
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
    stat: {
        craftItem: {
            minecraft: getResources("#items")
        },
        useItem: {
            minecraft: getResources("#items")
        },
        breakItem: {
            minecraft: getResources("#items")
        },
        mineBlock: {
            minecraft: BLOCKS
        },
        killEntity: {
            minecraft: getResources("#entities")
        },
        pickup: {
            minecraft: getResources("#items")
        },
        drop: {
            minecraft: getResources("#items")
        },
        entityKilledBy: {
            minecraft: getResources("#entities")
        },
        teamkill: getResources("#colors"),
        killedByTeam: getResources("#colors")
    }
}

let stat = getResources("#stats")
for (let n of stat) {
    CRITERIA.stat[n] = {};
}

class ScbCriteriaNode extends BaseNode {
    getCompletion = (line: string, start: number, end: number, data): [Array<string>, boolean] => {
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
