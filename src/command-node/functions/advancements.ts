/**
 * Advancement noed
 */

import BaseNode from './../base';
import {getResources} from './../../resources';
import {indexOf, getResourceComponents} from './../../util';

export default class AdvancementNode extends BaseNode {
    getCompletion (line: string, start: number, end: number, data): [Array<string>, boolean]  {
        let index = indexOf(line, start, end, ' ');
        if (index !== -1) {
            data["advancement"] = line.substring(start, index);
            return super.getCompletion(line, index+1, end, data);
        }

        return [advancementCompletion(line, start, end), true];
    }
}

export function advancementCompletion(line: string, start: number, end: number): Array<string> {
    let components = getResourceComponents(line.substring(start, end));
    let temp = getResources("advancements");

    if (components.length === 2 && indexOf(line, start, end, ':') === -1) {
        //probably completing namespace
        let children = Object.keys(temp);
        temp = temp["minecraft"] || {};
        children.push(...Object.keys(temp).filter(n=>n!=='$adv'));
        children.push( ...Object.keys((temp["$adv"]||{})) );
        return children;
    }
    for (let i = 0; i < components.length - 1; i++) {
        if (temp[components[i]]) {
            temp = temp[components[i]];
        } else {
            return [];
        }
    }
    let children = Object.keys(temp).filter(n=>n!=='$adv');
    children.push( ...Object.keys((temp["$adv"]||{})) );
    return children;
}