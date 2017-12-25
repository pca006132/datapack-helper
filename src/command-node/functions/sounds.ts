/**
 * Handle sounds.json completion
 */

import {BaseNode} from './../base';
import {strStartsWith, indexOf} from './../../util';
import {getResources} from './../../resources';

class SoundNode extends BaseNode {
    getCompletion = (line: string, start: number, end: number, data): [Array<string>, boolean] => {
        let index = indexOf(line, start, end, ' ');
        if (index !== -1) {
            return super.getCompletion(line, index+1, end, data);
        }
        let split = line.substring(start, end).split(".");
        let temp = getResources("sounds");
        for (let i = 0; i < split.length - 1; i++) {
            if (temp[split[i]]) {
                temp = temp[split[i]];
            } else {
                return [[], split.length > 1];
            }
        }

        return [Object.keys(temp), split.length > 1];
    }
}