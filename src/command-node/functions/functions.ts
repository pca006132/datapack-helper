/**
 * command function node
 */

import BaseNode from './../base';
import {getResources} from './../../resources';
import {indexOf, getResourceComponents} from './../../util';

export default class FunctionNode extends BaseNode {
    getCompletion (line: string, start: number, end: number, data): [Array<string>, boolean]  {
        let index = indexOf(line, start, end, ' ');
        if (index !== -1) {
            return super.getCompletion(line, index+1, end, data);
        }

        return [functionCompletion(line, start, end), true];
    }
}

export function functionCompletion(line: string, start: number, end: number): Array<string> {
    let components = getResourceComponents(line.substring(start, end));
    let temp = getResources("functions");
    console.log(components);
    if (components.length === 2 && indexOf(line, start, end, ':') === -1) {
        //probably completing namespace
        let children = Object.keys(temp);
        temp = temp["minecraft"] || {};
        children.push(...Object.keys(temp).filter(n=>n!=='$func'));
        children.push( ...(temp["$func"]||[]) );
        return children;
    }
    for (let i = 0; i < components.length - 1; i++) {
        if (temp[components[i]]) {
            temp = temp[components[i]];
        } else {
            return [];
        }
    }
    let children = Object.keys(temp).filter(n=>n!=='$func');
    children.push( ...(temp["$func"]||[]) );
    return children;
}