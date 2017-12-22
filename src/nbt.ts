import { accessSync } from "fs";

/**
 * Parse NBT
 */

const ESCAPE_PATTERN = /("|\\)/g;
const UNESCAPE_PATTERN = /\\("|\\)/g;
const ACCEPTED_CHAR = /[a-zA-Z._+-]/;
const TERMINATING_CHAR = /[,}\s\]:]/;

function escape(data: string) {
    return data.replace(ESCAPE_PATTERN, "\\$1");
}
function unescape(data: string) {
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
                break;
            }
        }
    }
    if (index === end) {
        throw new Error("Non-terminated string");
    }
    return index;
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
    return index+1;
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

interface NameResult {
    //If the tag is ended (a complete tag)
    end: boolean;
    //Tags stack, number for
    tags?: Array<string|number>;
    completingName: boolean;
    data: string;
}

function getCompoundTagNames(data: string, start: number, end: number): NameResult {
    let tags: Array<string|number> = [];

    let index = start + 1;
    while (index < end) {
        index = skipSpaces(data, index, end);
        if (index === end) {
            return {
                end: false,
                tags: [],
                completingName: true,
                data: ""
            }
        }
        //name part
        let newIndex: number;
        try {
            newIndex = skipTag(data, index, end);
        } catch (e) {
            let temp = data.substring(index, end);
            if (temp.length >= 1 && temp[0] === '"') {
                temp = unescape(temp.substring(1));
            }
            return {
                end: false,
                tags: [],
                completingName: true,
                data: temp
            }
        }
        let tag = data.substring(index, newIndex);
        if (tag.length >= 2 && tag[0] === '"') {
            tag = unescape(tag.substring(1, tag.length - 1));
        }
        index = newIndex;

        index = skipSpaces(data, index, end);
        if (index === end) {
            return {
                end: false,
                tags: [],
                completingName: true,
                data: tag
            }
        }


        //value part


    }
}
