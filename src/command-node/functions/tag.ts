/**
 * Datapack tag node
 */

import {getResources} from './../../resources';
import {indexOf, getResourceComponents} from './../../util';

export function tagCompletion(type: string, line: string, start: number, end: number): Array<string> {
    let components = getResourceComponents(line.substring(start, end));
    let temp;
    switch (type) {
        case 'functions':
            temp = getResources("functionTags");
            break;
        case 'blocks':
            temp = getResources("blockTags");
            break;
        case 'items':
            temp = getResources("itemTags");
            break;
        default:
            console.log("Invalid type");
            return [];
    }

    if (components.length === 2 && indexOf(line, start, end, ':') === -1) {
        //probably completing namespace
        let children = Object.keys(temp);
        temp = temp["minecraft"] || {};
        children.push(...Object.keys(temp).filter(n=>n!=='$tags'));
        children.push( ...(temp["$tags"]||[]) );
        return children;
    }
    for (let i = 0; i < components.length - 1; i++) {
        if (temp[components[i]]) {
            temp = temp[components[i]];
        } else {
            return [];
        }
    }
    let children = Object.keys(temp).filter(n=>n!=='$tags');
    children.push( ...(temp["$tags"]||[]) );
    return children;
}