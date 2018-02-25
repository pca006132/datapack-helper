/**
 * Format node
 */

import BaseNode from './base';

const NUMBER = /^[+-]?\d+(\.\d+)?/;
const INT = /^[+-]?\d+/;
const LOCATION = /^((((~?[+-]?(\d+(\.\d+)?)|\.\d+)|(~))(\s|$)){3}|(\^([+-]?(\d+(\.\d+)?|\.\d+))?(\s|$)){3})/;
const ROTATION = /^((((~?[+-]?(\d+(\.\d+)?)|\.\d+)|(~))(\s|$)){2})/;
const BOOLEAN = /^(true|false)/;

export default class FormatNode extends BaseNode {
    constructor(pattern:string) {
        super();

        switch (pattern) {
            case 'number':
                this.content = NUMBER;
                break;
            case 'int':
                this.content = INT;
                break;
            case 'location':
                this.content = LOCATION;
                break;
            case 'rotation':
                this.content = ROTATION;
                break;
            case 'bool':
                this.content = BOOLEAN;
                break;
            default:
                if (!pattern.startsWith("^")) {
                    throw new Error("Invalid useless pattern");
                }
                this.content = new RegExp(pattern);
                break;
        }
    }
    content: RegExp;
    getCompletion (line: string, start: number, end: number, data): [Array<string>, boolean]  {
        let segment = line.substring(start, end);
        let m = this.content.exec(segment);
        if (m) {
            let length = m[0].length;
            if (length > 0 && m[0][length - 1] !== ' ') {
                length++;
            }
            return super.getCompletion(line, start + length, end, data);
        }
        return [[], false];
    }
}