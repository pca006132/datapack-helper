/**
 * command function node
 */

import {BaseNode} from './../base';
import {getResources} from './../../resources';
import {indexOf, getResourceComponents} from './../../util';

export class FunctionNode extends BaseNode {
    getCompletion = (line: string, start: number, end: number, data): [Array<string>, boolean] => {
        let index = indexOf(line, start, end, ' ');
        if (index !== -1) {
            return super.getCompletion(line, index+1, end, data);
        }

        return [functionCompletion(line, start, end), true];
    }
}

export function functionCompletion(line: string, start: number, end: number): Array<string> {
    let segment = getResourceComponents(line.substring(start, end));
    let temp = getResources("functions");
    for (let i = 0; i < segment.length - 1; i++) {
        if (temp[segment[i]]) {
            temp = temp[segment[i]];
        } else {
            return [];
        }
    }
    let children = Object.keys(temp).filter(n=>n!=='$func');
    children.push( ...(temp["$func"]||[]) );
    return children;
}