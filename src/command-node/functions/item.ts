/**
 * Handle item arguments
 */

import {BaseNode} from './../base';
import {nbtCompletion} from './nbt';
import {getResources} from './../../resources';
import {strStartsWith, indexOf} from './../../util';

class ItemNode extends BaseNode {
    getCompletion = (line: string, start: number, end: number, data): [Array<string>, boolean] => {
        let space = indexOf(line, start, end, " ");
        if (strStartsWith(line, start, end, "minecraft:")) {
            let colon = indexOf(line, start, end, ":");
            let brace = indexOf(line, start, end, "{");

            if (brace !== -1) {
                //nbt
                let result = nbtCompletion("item", line, brace, end, data);
                if (result.completed) {
                    return super.getCompletion(line, result.index + 1, end, data);
                } else {
                    return [result.data, true];
                }
            } else {
                if (space !== -1) {
                    return super.getCompletion(line, space+1, end, data);
                } else {
                    let segment = line.substring(colon+1);
                    return [getResources("#items").filter(v=>v.startsWith(segment)), true];
                }
            }
        } else {
            if (space !== -1) {
                return super.getCompletion(line, space+1, end, data);
            } else {
                return [["minecraft:"], true];
            }
        }
    }
}
