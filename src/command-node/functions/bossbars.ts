/*
 * Bossbars node
 *
*/

import BaseNode from './../base'
import {getResources} from './../../resources'
import {indexOf, getResourceComponents} from './../../util'

export default class BossbarNode extends BaseNode {
    getCompletion (line: string, start: number, end: number, data): [Array<string>, boolean] {
        let index = indexOf(line, start, end, ' ');
        if(index !== -1) {
            return super.getCompletion(line, index+1, end, data);
        }
        let segment = line.substring(start, end);
        return [bossbarCompletion(line, start, end), true];
    }
}

export function bossbarCompletion(line: string, start: number, end: number): Array<string> {
    let components = getResourceComponents(line.substring(start, end));
    let temp = getResources("bossbars");
    if(components.length === 2 && indexOf(line, start, end, ':') === -1) {
        let children = Object.keys(temp);
        temp = temp["minecraft"] || [];
        children.push(...temp.map(v=>v[0]));
        return children;
    }
    let children = [];
    for(let i = 0; i < components.length-1; i++) {
        if(temp[components[i]]) {
            children.push(...(temp[components[i]].map(v=>v[0])));
        } else {
            return [];
        }
    }
    return children;
}