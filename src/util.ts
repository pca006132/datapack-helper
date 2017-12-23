import * as path from 'path';
import * as fs from 'fs';

const DELIMETER_PATTERN = new RegExp("\\" + path.sep, "g");

export function pathToName(base, fPath) {
    let rel = path.relative(base, fPath);
    if (path.sep === '\\') {
        rel = rel.replace(DELIMETER_PATTERN, '/');
    }
    let first_delimeter = rel.indexOf('/');
    return rel.substring(0, first_delimeter) + ":" + rel.substring(first_delimeter+1);
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