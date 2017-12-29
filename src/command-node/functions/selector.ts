/**
 * Selector Node
 */

import BaseNode from './../base';
import {nbtCompletion} from './nbt';
import {indexOf} from './../../util';
import {getResources} from './../../resources';
import {advancementCompletion} from './advancements';
import {criteriaCompletion} from './criteria';

export default class SelectorNode extends BaseNode {
    single: boolean;
    constructor(single: boolean) {
        super();
        this.single = single;
    }

    getCompletion (line: string, start: number, end: number, data): [Array<string>, boolean]  {
        if (end > start && line[start] === '@') {
            if (end > start + 2 && line[start + 2] === '[') {
                let argumentList = [
                    "x", "y", "z",
                    "dx", "dy", "dz",
                    "level",
                    "distance",
                    "x_rotation", "y_rotation",
                    "limit",
                    "sort",
                    "scores",
                    "advancements",
                    "gamemode",
                    "nbt",
                    "tag",
                    "team",
                    "type",
                    "name"
                ]

                let index = start + 3;
                while (index < end) {
                    let equalSign = indexOf(line, index, end, '=');
                    if (equalSign === -1) {
                        let segment = line.substring(index, end);
                        return [argumentList.filter(n=>n.startsWith(segment)), true];
                    }
                    let key = line.substring(index, equalSign);
                    let breakLoop = false;
                    switch (key) {
                        case 'x':
                        case 'y':
                        case 'z':
                        case 'dx':
                        case 'dy':
                        case 'dz':
                        case 'level':
                        case 'distance':
                        case 'x_rotation':
                        case 'y_rotation':
                        case 'limit':
                        case 'name':
                            var result = skipArgument(line, equalSign+1, end);
                            if (result.completed) {
                                index = result.index;
                                if (result.shouldDelete) {
                                    let i = argumentList.indexOf(key);
                                    if (i !== -1)
                                        argumentList.splice(i, 1);
                                }
                            } else {
                                return [[], true];
                            }
                            break;
                        case 'team':
                            var result = skipArgument(line, equalSign+1, end);
                            if (result.completed) {
                                index = result.index;
                                if (result.shouldDelete) {
                                    let i = argumentList.indexOf(key);
                                    if (i !== -1)
                                        argumentList.splice(i, 1);
                                }
                            } else {
                                return [getResources("teams"), true];
                            }
                            break;
                        case 'sort':
                            var result = skipArgument(line, equalSign+1, end);
                            if (result.completed) {
                                index = result.index;
                                if (result.shouldDelete) {
                                    let i = argumentList.indexOf(key);
                                    if (i !== -1)
                                        argumentList.splice(i, 1);
                                }
                            } else {
                                return [["nearest", "furthest", "random", "arbitrary"], true];
                            }
                            break;
                        case "gamemode":
                            var result = skipArgument(line, equalSign+1, end);
                            if (result.completed) {
                                index = result.index;
                                if (result.shouldDelete) {
                                    let i = argumentList.indexOf(key);
                                    if (i !== -1)
                                        argumentList.splice(i, 1);
                                }
                            } else {
                                return [["survival", "creative", "spectator", "adventure"], true];
                            }
                            break;
                        case 'tag':
                            var result = skipArgument(line, equalSign+1, end);
                            if (result.completed) {
                                index = result.index;
                                if (result.shouldDelete) {
                                    let i = argumentList.indexOf(key);
                                    if (i !== -1)
                                        argumentList.splice(i, 1);
                                }
                            } else {
                                return [getResources("tags"), true];
                            }
                            break;
                        case 'type':
                            var result = skipArgument(line, equalSign+1, end);
                            if (result.completed) {
                                index = result.index;
                                if (result.shouldDelete) {
                                    let i = argumentList.indexOf(key);
                                    if (i !== -1)
                                        argumentList.splice(i, 1);
                                }
                            } else {
                                let types = getResources("#entities");
                                types.push("player")
                                return [types, true];
                            }
                            break;
                        case 'nbt':
                            let shouldDelete = true;
                            if (end > equalSign+1 && line[equalSign+1] === '!') {
                                shouldDelete = false;
                                equalSign++;
                            }
                            var result = nbtCompletion("entity", line, equalSign+1, end, data);
                            if (result.completed) {
                                index = result.index;
                                if (shouldDelete) {
                                    let i = argumentList.indexOf(key);
                                    if (i !== -1)
                                        argumentList.splice(i, 1);
                                }
                            } else {
                                return [result.data, true];
                            }
                            break;
                        case 'advancements':
                            index = equalSign+1;
                            if (line[index++] !== '{') {
                                return [[], true];
                            }
                            while (index < end && line[index] !== '}') {
                                let equalSign = indexOf(line, index, end, '=');
                                if (equalSign === -1) {
                                    return [advancementCompletion(line, index, end), true];
                                }
                                let key = line.substring(index, equalSign);
                                index = equalSign+1;
                                let criteria = criteriaCompletion(key);
                                if (index < end && line[index] === '{') {
                                    while (index < end && line[index] !== '}') {
                                        let eqSign = indexOf(line, index, end, '=');
                                        if (eqSign === -1) {
                                            let segment = line.substring(index, end);
                                            return [criteria.filter(n=>n.startsWith(segment)), true];
                                        }
                                        var result = skipArgument(line, eqSign+1, end);
                                        if (result.completed) {
                                            index = result.index;
                                            if (line[index] === ',')
                                                index++;
                                            let i = criteria.indexOf(line.substring(index, eqSign));
                                            if (i !== -1)
                                                criteria.splice(i, 1);
                                        } else {
                                            return [["true", "false"], true];
                                        }
                                    }
                                    index++;
                                } else {
                                    var result = skipArgument(line, index, end);
                                    if (result.completed) {
                                        index = result.index;
                                        if (line[index] === ',')
                                            index++;
                                    } else {
                                        return [["true", "false"], true];
                                    }
                                }
                            }
                            if (index >= end) {
                                return [advancementCompletion(line, equalSign+1, end), true];
                            }
                            var i = argumentList.indexOf(key);
                            if (i !== -1)
                                argumentList.splice(i, 1);
                            index++;
                            break;
                        case 'scores':
                            index = equalSign+1;
                            if (line[index++] !== '{') {
                                return [[], true];
                            }
                            let objectives = getResources("objectives").map(v=>v[0]);
                            while (index < end && line[index] !== '}') {
                                let equalSign = indexOf(line, index, end, '=');
                                if (equalSign === -1) {
                                    let segment = line.substring(index, end);
                                    return [objectives.filter(n=>n.startsWith(segment)), true];
                                }
                                let key = line.substring(index, equalSign);
                                let i = objectives.indexOf(key);
                                if (i !== -1)
                                    objectives.splice(i, 1);
                                var result = skipArgument(line, equalSign+1, end);
                                if (result.completed) {
                                    index = result.index;
                                    if (line[index] === ',')
                                        index++;
                                } else {
                                    return [[], true];
                                }
                            }
                            if (index === end) {
                                let segment = line.substring(index, end);
                                return [objectives.filter(n=>n.startsWith(segment)), true];
                            }
                            index++;
                            var i = argumentList.indexOf(key);
                            if (i !== -1)
                                argumentList.splice(i, 1);
                            break;
                    }
                    if (line[index] === ']') {
                        return super.getCompletion(line, index+2, end, data);
                    } else if (line[index] === ',') {
                        index++;
                    }
                }
                if (index >= end) {
                    let segment = line.substring(index, end);
                    return [argumentList.filter(n=>n.startsWith(segment)), true];
                }
            } else {
                let index = indexOf(line, start, end, ' ');
                if (index === -1) {
                    return [[], false];
                }
                return super.getCompletion(line, index+1, end, data);
            }
        } else if (end === start) {
            return [["@e", "@s", "@r", "@a", "@p"], false];
        } else {
            let index = indexOf(line, start, end, ' ');
            if (index === -1) {
                return [[], false];
            }
            return super.getCompletion(line, index+1, end, data);
        }
    }
}

export interface Result {
    //If the tag is completed (Need to parse further)
    completed: boolean;
    //If the tag is completed, its ending index (beginning of the next argument)
    index?: number;
    //Completion list if the tag is not completed
    data?: Array<string>;
    //If the tag should be deleted from the list of tags (duplicated tag)
    shouldDelete: boolean;
    //Fatal Error, cannot parse anymore
    error?: boolean;
}

export function skipArgument(line: string, start: number, end: number): Result {
    let negation = false;
    if (start === end) {
        return {
            completed: false,
            shouldDelete: true,
            data: []
        }
    }
    let index = start-1;
    let inString = false;
    let escape = false;
    if (line[index+1] === '!') {
        negation = true;
        index++;
    }
    while (++index < end) {
        if (inString) {
            if (escape) {
                escape = false;
            } else if (line[index] === '\\') {
                escape = true;
            } else if (line[index] === '"') {
                inString = false;
            }
        } else {
            switch (line[index]) {
                case '"':
                    inString = true;
                    break;
                case ',':
                    return {
                        completed: true,
                        index: index,
                        shouldDelete: !negation
                    }
                case ']':
                case '}':
                    return {
                        completed: true,
                        index: index,
                        shouldDelete: !negation
                    }
            }
        }
    }
    return {
        completed: false,
        shouldDelete: true,
        data: []
    }

}