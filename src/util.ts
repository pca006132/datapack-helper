import * as path from 'path';

const DELIMETER_PATTERN = new RegExp("\\" + path.sep, "g");

export function pathToName(base, fPath) {
    let rel = path.relative(base, fPath);
    if (path.sep === '\\') {
        rel = rel.replace(DELIMETER_PATTERN, '/');
    }
    let first_delimeter = rel.indexOf('/');
    return rel.substring(0, first_delimeter) + ":" + rel.substring(first_delimeter+1);
}