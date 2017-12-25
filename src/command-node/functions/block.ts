/**
 * Handle block argument
 */

import BaseNode from './../base';
import {nbtCompletion} from './nbt';
import {skipArgument} from './selector';
import {getResources} from './../../resources';
import {strStartsWith, indexOf} from './../../util';

export default class BlockNode extends BaseNode {
    getCompletion = (line: string, start: number, end: number, data): [Array<string>, boolean] => {
        let space = indexOf(line, start, end, " ");
        if (strStartsWith(line, start, end, "minecraft:")) {
            let colon = indexOf(line, start, end, ":");
            let square = indexOf(line, start, end, "[");
            let brace = indexOf(line, start, end, "{");

            if (brace !== -1) {
                //nbt
                let result = nbtCompletion("block", line, brace, end, data);
                if (result.completed) {
                    return super.getCompletion(line, result.index + 1, end, data);
                } else {
                    return [result.data, true];
                }
            } else {
                if (space !== -1) {
                    return super.getCompletion(line, space+1, end, data);
                } else {
                    if (square !== -1) {
                        let blockId = line.substring(colon+1, square);
                        let states = Object.keys(getResources("#blocks")[blockId] || {});
                        let index = square + 1;
                        while (index < end && line[index] !== ']') {
                            let eqSign = indexOf(line, index, end, "=");
                            let state = line.substring(index, eqSign);
                            if (eqSign !== -1) {
                                let result = skipArgument(line, eqSign+1, end);
                                if (result.completed) {
                                    index = result.index;
                                    let i = states.indexOf(state);
                                    if (i !== -1) {
                                        states.splice(i);
                                    }
                                } else {
                                    return [(getResources("#blocks")[blockId] || {})[state] || [], true];
                                }
                            } else {
                                return [states, true];
                            }
                        }
                    } else {
                        let segment = line.substring(colon+1);
                        return [Object.keys(getResources("#blocks")).filter(v=>v.startsWith(segment)), true];
                    }
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
