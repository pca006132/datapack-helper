/**
 * Parse NBT
 */


import BaseNode from './../base';
import {Result} from './selector';

const ESCAPE_PATTERN = /("|\\)/g;
const UNESCAPE_PATTERN = /\\("|\\)/g;
const ACCEPTED_CHAR = /[a-zA-Z0-9._+-]/;
const TERMINATING_CHAR = /[,}\s\]:]/;

export default class NbtNode extends BaseNode {
    base: string;
    constructor(base: string) {
        super();
        this.base = base;
    }
    getCompletion (line: string, start: number, end: number, data): [Array<string>, boolean]  {
        let result = nbtCompletion(this.base, line, start, end, data);
        if (result.completed) {
            return super.getCompletion(line, result.index+1, end, data);
        }
        return [result.data, true];
    }
}

export function nbtCompletion(base: string, line: string, start: number, end: number, data): Result {
    let result = getCompoundTagNames(line, start, end);
    if (result.end) {
        return {
            completed: true,
            index: result.endingIndex,
            shouldDelete: false
        }
    }
    return {
        completed: false,
        data: [],
        shouldDelete: false
    }
}

export function escape(data: string) {
    return data.replace(ESCAPE_PATTERN, "\\$1");
}
export function unescape(data: string) {
    return data.replace(UNESCAPE_PATTERN, "$1");
}

function getSegment(data: string, index: number) {
    if (index-15 > 0) {
        return "..." + data.substring(index-15, index+1);
    } else {
        return data.substring(0, index+1);
    }
}

function skipSpaces(data: string, start: number, end: number) {
    let index = start - 1;
    while (++index < end) {
        if (data[index] !== ' ')
            break;
    }
    return index;
}

function skipQuotedString(data: string, start: number, end: number) {
    //Starting character must be '"' character
    if (data[start] !== '"')
        throw new Error(`Expected \" character at ${start}: ${getSegment(data, start)}`);

    let escape = false;
    let index = start;
    while (++index < end) {
        if (escape) {
            escape = false;
            continue;
        } else {
            if (data[index] === '\\') {
                escape = true;
            } else if (data[index] === '"') {
                return index+1;
            }
        }
    }
    throw new Error("Non-terminated string");
}

function skipUnquotedString(data: string, start: number, end: number) {
    let index = start-1;
    while (++index < end) {
        if (!ACCEPTED_CHAR.exec(data[index])) {
            if (TERMINATING_CHAR.exec(data[index])) {
                break;
            } else {
                throw new Error(`Character not accpeted at ${index}: ${getSegment(data, index)}`);
            }
        }
    }
    if (index === start)
        throw new Error(`No tag at ${index}: ${getSegment(data, index)}`);
    return index;
}

function skipTag(data: string, start: number, end: number) {
    let index = skipSpaces(data, start, end);
    if (index === end)
        return index;

    switch (data[index]) {
        case '"':
            return skipQuotedString(data, index, end);
        default:
            return skipUnquotedString(data, index, end);
    }
}

export interface NameResult {
    //If the tag is ended (a complete tag)
    end: boolean;
    //Tags stack, number for list/array index, string for tag name
    tags?: Array<string|number>;
    //If the user is typing the tag name, or the value
    completingName: boolean;
    //If the autocomplete should be triggered
    complete: boolean;
    endingIndex?: number;
}

export function getCompoundTagNames(data: string, start: number, end: number): NameResult {
    let index = start + 1;
    while (index < end) {
        index = skipSpaces(data, index, end);
        //name part
        let newIndex: number;
        try {
            newIndex = skipTag(data, index, end);
        } catch (e) {
            //Non-terminated quoted key
            return {
                end: false,
                tags: [],
                completingName: true,
                complete: true
            }
        }
        let tag = data.substring(index, newIndex);
        let quoted = false;
        if (tag.length >= 2 && tag[0] === '"') {
            quoted = true;
            tag = unescape(tag.substring(1, tag.length - 1));
        }
        index = newIndex;
        if (index === end) {
            return {
                end: false,
                tags: [],
                completingName: true,
                //If it is after a quoted key, don't do autocomplete
                complete: !quoted
            }
        }

        index = skipSpaces(data, index, end);
        if (index === end || data[index++] !== ':') {
            return {
                end: false,
                tags: [],
                completingName: true,
                complete: false
            }
        }
        //value part
        index = skipSpaces(data, index, end);

        if (index < end && data[index] === '{') {
            let result = getCompoundTagNames(data, index, end);
            if (result.end) {
                index = result.endingIndex;
            } else {
                return {
                    end: false,
                    tags: [tag, ...result.tags],
                    completingName: result.completingName,
                    complete: result.complete
                }
            }
        } else if (index < end && data[index] === '[') {
            if (index+2 < end && (data[index+1] === 'I' || data[index+1] === 'L' || data[index+1] === 'B') && data[index+2] === ';') {
                //array
                while (++index < end) {
                    if (data[index] === ']') {
                        break;
                    }
                }
                if (index === end) {
                    return {
                        end: false,
                        tags: [],
                        completingName: false,
                        complete: false
                    }
                }
            } else {
                let result = getListTagNames(data, index, end);
                if (result.end) {
                    index = result.endingIndex;
                } else {
                    return {
                        end: false,
                        tags: [tag, ...result.tags],
                        completingName: result.completingName,
                        complete: result.complete
                    }
                }
            }
        } else {
            let quoted = index < end && data[index] === '"';
            try {
                index = skipTag(data, index, end);
            } catch (e) {
                return {
                    end: false,
                    tags: [tag],
                    completingName: false,
                    complete: true,
                }
            }
            if (index === end) {
                return {
                    end: false,
                    tags: [tag],
                    completingName: false,
                    complete: !quoted
                }
            }
        }
        index = skipSpaces(data, index, end);

        if (index === end) {
            return {
                end: false,
                tags: [],
                completingName: true,
                complete: false
            }
        }
        if (data[index] === '}') {
            return {
                end: true,
                tags: [],
                completingName: false,
                complete: false,
                endingIndex: index+1
            }
        }
        if (data[index++] !== ',') {
            //error
            return {
                end: false,
                tags: [],
                completingName: true,
                complete: false
            }
        }
    }
    //after the , character
    return {
        end: false,
        tags: [],
        completingName: true,
        complete: true
    }
}

function getListTagNames(data: string, start: number, end: number): NameResult {
    let index = start + 1;
    let i = 0;
    while (index < end) {
        index = skipSpaces(data, index, end);
        if (index < end && data[index] === '{') {
            let result = getCompoundTagNames(data, index, end);
            if (result.end) {
                index = result.endingIndex;
            } else {
                return {
                    end: false,
                    tags: [i, ...result.tags],
                    completingName: result.completingName,
                    complete: result.complete
                }
            }
        } else if (index < end && data[index] === '[') {
            if (index+2 < end && (data[index+1] === 'I' || data[index+1] === 'L' || data[index+1] === 'B') && data[index+2] === ';') {
                //array
                while (++index < end) {
                    if (data[index] === ']') {
                        break;
                    }
                }
                if (index === end) {
                    return {
                        end: false,
                        tags: [],
                        completingName: false,
                        complete: false
                    }
                }
            } else {
                let result = getListTagNames(data, index, end);
                if (result.end) {
                    index = result.endingIndex;
                } else {
                    return {
                        end: false,
                        tags: [i, ...result.tags],
                        completingName: result.completingName,
                        complete: result.complete
                    }
                }
            }
        } else {
            let quoted = index < end && data[index] === '"';
            try {
                index = skipTag(data, index, end);
            } catch (e) {
                return {
                    end: false,
                    tags: [i],
                    completingName: false,
                    complete: true
                }
            }
            if (index === end) {
                return {
                    end: false,
                    tags: [i],
                    completingName: false,
                    complete: !quoted
                }
            }
        }
        index = skipSpaces(data, index, end);

        if (index === end) {
            return {
                end: false,
                tags: [],
                completingName: false,
                complete: false
            }
        }
        if (data[index] === ']') {
            return {
                end: true,
                tags: [],
                completingName: false,
                complete: false,
                endingIndex: index+1
            }
        }
        if (data[index++] !== ',') {
            //error
            return {
                end: false,
                tags: [],
                completingName: false,
                complete: false
            }
        }
        i++;
    }
    return {
        end: false,
        tags: [],
        completingName: false,
        complete: true
    }
}