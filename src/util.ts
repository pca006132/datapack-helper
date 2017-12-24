import * as path from 'path';
import * as fs from 'fs';

const DELIMETER_PATTERN = new RegExp("\\" + path.sep, "g");
const PATTERN = /^(([a-z0-9_\-.]+):)?((([a-z0-9_\-.]+)\/)*([a-z0-9_\-.]+))$/;

export function pathToName(base, fPath) {
    let rel = path.relative(base, fPath);
    if (path.sep === '\\') {
        rel = rel.replace(DELIMETER_PATTERN, '/');
    }
    let first_delimeter = rel.indexOf('/');
    return rel.substring(0, first_delimeter) + ":" + rel.substring(first_delimeter+1);
}

export function getResourceComponents(str: string) {
    let m = PATTERN.exec(str);
    if (m) {
        return [m[2] || 'minecraft', ...m[3].split('/')];
    }
    return [];
}

export function readdirAsync(path: string) {
    return new Promise<string[]>(function (resolve, reject) {
        fs.readdir(path, function (err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}
export function statAsync(path: string) {
    return new Promise<fs.Stats>(function (resolve, reject) {
        fs.stat(path, (err, stats) => {
            if (err) {
                reject(err);
            } else {
                resolve(stats);
            }
        })
    })
}
export function readFileAsync(path: string) {
    return new Promise<string>(function (resolve, reject) {
        fs.readFile(path, "utf-8", (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        })
    })
}

export function strStartsWith(str: string, start: number, end: number, startswith: string) {
    if (end - start < startswith.length)
        return false;

    for (let i = 0; i < startswith.length; i++) {
        if (str[i+start] !== startswith[i])
            return false;
    }
    return true;
}

export function indexOf(line: string, start: number, end: number, char: string) {
    let index = -1;
    for (let i = start; i < end; i++) {
        if (line[i] === char) {
            index = i;
            break;
        }
    }
    return index;
}