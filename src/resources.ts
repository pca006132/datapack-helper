/**
 * Handle resources
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {pathToName} from './util';
import { isObject } from 'util';

const NAME_PATTERN = /^[a-z0-9-_.]+$/;
const OBJ_PATTERN = /^scoreboard objectives add (\S+) (\S+)/;
const LINE_DELIMITER = /\r\n|\n|\r/g;

export function initialize() {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length !== 1) {
        //Cannot handle multi-root folder right now, quit
        return;
    }
    let root = vscode.workspace.workspaceFolders[0].uri;

    vscode.window.showInputBox({
        prompt: "Description of your datapack"
    }).then((v) => {
        if (!v)
            return;
        fs.mkdir(path.join(root.fsPath, '.datapack'), (err) => {
            if (err) {
                vscode.window.showErrorMessage("Error creating .datapack folder");
                return;
            }
            fs.writeFile(path.join(root.fsPath, '.datapack', 'objectives.json'), "[]", (err) => {
                if (err) {
                    vscode.window.showErrorMessage("Error creating .datapack/objectives.json");
                }
            });
            fs.writeFile(path.join(root.fsPath, '.datapack', 'functions.json'), "{}", (err) => {
                if (err) {
                    vscode.window.showErrorMessage("Error creating .datapack/functions.json");
                }
            });
            fs.writeFile(path.join(root.fsPath, '.datapack', 'advancements.json'), "{}", (err) => {
                if (err) {
                    vscode.window.showErrorMessage("Error creating .datapack/advancements.json");
                }
            });
            fs.writeFile(path.join(root.fsPath, '.datapack', 'entity_tags.json'), "[]", (err) => {
                if (err) {
                    vscode.window.showErrorMessage("Error creating .datapack/entity_tags.json");
                }
            });
        })
        fs.writeFile(path.join(root.fsPath, 'pack.mcmeta'), `{"pack":{"pack_format":4,"description":${JSON.stringify(v)}}}`, (err) => {
            if (err) {
                vscode.window.showErrorMessage("Error creating pack.mcmeta");
            }
        });
    })
}

function readdirAsync(path) {
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
function statAsync(path) {
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
function readFileAsync(path) {
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

async function walker(p, extension, ignore_files = false) {
    let names = (await readdirAsync(p)).map(v=>path.join(p,v));
    let fit: string[] = [];
    let dir: Promise<string[]>[] = [];

    let stats = await Promise.all(names.map(v=>statAsync(v)));
    for (let i = 0; i < names.length; i++) {
        if (!ignore_files && stats[i].isFile() && names[i].endsWith(extension)) {
            fit.push(names[i]);
        } else if (stats[i].isDirectory()) {
            dir.push(walker(names[i], extension));
        }
    }
    for (let a of await Promise.all(dir)) {
        for (let b of a) {
            fit.push(b);
        }
    }
    return fit;
}

export async function loadFunctions() {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length !== 1) {
        //Cannot handle multi-root folder right now, quit
        return;
    }
    let root = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'data', 'functions');
    let objectives: Array<[string, string]> = [];
    let paths = await walker(root, ".mcfunction", true);
    let v = await Promise.all(paths.map(v=>readFileAsync(v)));

    let namespaces = {};

    for (let i = 0; i < v.length; i++) {
        let file = v[i];
        let name = pathToName(root, paths[i]);

        let nodes = name.split(":");
        nodes.push(...nodes.pop().split("/"));
        let temp = namespaces;
        for (let i = 0; i < nodes.length-1; i++) {
            if (!temp[nodes[i]])
                temp[nodes[i]] = {};
            temp = temp[nodes[i]];
        }
        if (!temp["$func"])
            temp["$func"] = [];

        temp["$func"].push(nodes[nodes.length - 1].substring(0, nodes[nodes.length - 1].length - 11));

        for (let line of file.split(LINE_DELIMITER)) {
            let m = OBJ_PATTERN.exec(line);
            if (m) {
                if (!objectives.find(v=>v[0] === m[1])) {
                    objectives.push([m[1], m[2], name]);
                }
            }
        }
    }
    fs.writeFile(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.datapack', 'objectives.json'), JSON.stringify(objectives), (err) => {
        if (err) {
            vscode.window.showErrorMessage("Error writing .datapack/objectives.json");
        }
    });
    fs.writeFile(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.datapack', 'functions.json'), JSON.stringify(namespaces), (err) => {
        if (err) {
            vscode.window.showErrorMessage("Error writing .datapack/functions.json");
        }
    });
}

export async function loadAdvancements() {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length !== 1) {
        //Cannot handle multi-root folder right now, quit
        return;
    }
    let root = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'data', 'advancements');
    let objectives: Array<[string, string]> = [];
    let paths = await walker(root, ".json", true);
    let v = await Promise.all(paths.map(v=>readFileAsync(v)));

    let namespaces = {};
    for (let i = 0; i < v.length; i++) {
        let file = v[i];
        let name = pathToName(root, paths[i]);

        let nodes = name.split(":");
        nodes.push(...nodes.pop().split("/"));
        let temp = namespaces;
        for (let i = 0; i < nodes.length-1; i++) {
            if (!temp[nodes[i]])
                temp[nodes[i]] = {};
            temp = temp[nodes[i]];
        }
        if (!temp["$adv"])
            temp["$adv"] = {};

        let criteria = temp["$adv"][nodes[nodes.length - 1].substring(0, nodes[nodes.length - 1].length - 5)] = [];

        try {
            let adv = JSON.parse(file);
            if (adv["criteria"] && isObject(adv["criteria"])) {
                criteria.push(...Object.keys(adv.criteria));
            }
        } catch (e) {
            //No processing is needed
        }

        fs.writeFile(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.datapack', 'advancements.json'), JSON.stringify(namespaces), (err) => {
            if (err) {
                vscode.window.showErrorMessage("Error writing .datapack/advancements.json");
            }
        });
    }
}