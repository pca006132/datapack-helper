/**
 * Handle resources
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {pathToName, readdirAsync, readFileAsync, statAsync, accessAsync} from './util';
import { isObject, isArray, isString } from 'util';
import { setImmediate } from 'timers';

const NAME_PATTERN = /^[a-z0-9-_.]+$/;
const OBJ_PATTERN = /^scoreboard objectives add (\S+) (\S+)/;
const TEAM_PATTERN = /^team add (\S+)/;
const LINE_DELIMITER = /\r\n|\n|\r/g;

export function initialize() {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length !== 1) {
        //Cannot handle multi-root folder right now, quit
        return;
    }
    let root = vscode.workspace.workspaceFolders[0].uri;

    fs.open(path.join(root.fsPath, 'pack.mcmeta'), "wx", (err, fd) => {
        if (err) {
            if (err.code !== 'EEXIST') {
                vscode.window.showErrorMessage("Error opening pack.mcmeta");
            }
            return;
        }
        vscode.window.showInputBox({
            prompt: "Description of your datapack"
        }).then(v=> {
            fs.write(fd, `{"pack":{"pack_format":4,"description":${JSON.stringify(v)}}}`, err=> {
                if (err)
                    vscode.window.showErrorMessage("Error opening pack.mcmeta");
            })
        })
    })
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
        fs.writeFile(path.join(root.fsPath, '.datapack', 'teams.json'), "[]", (err) => {
            if (err) {
                vscode.window.showErrorMessage("Error creating .datapack/teams.json");
            }
        });
        fs.writeFile(path.join(root.fsPath, '.datapack', 'sounds.json'), "{}", (err) => {
            if (err) {
                vscode.window.showErrorMessage("Error creating .datapack/sounds.json");
            }
        });
        fs.writeFile(path.join(root.fsPath, '.datapack', 'functionsTag.json'), "{}", (err) => {
            if (err) {
                vscode.window.showErrorMessage("Error creating .datapack/functionsTag.json");
            }
        });
        fs.writeFile(path.join(root.fsPath, '.datapack', 'blocksTag.json'), "{}", (err) => {
            if (err) {
                vscode.window.showErrorMessage("Error creating .datapack/blocksTag.json");
            }
        });
        fs.writeFile(path.join(root.fsPath, '.datapack', 'itemsTag.json'), "{}", (err) => {
            if (err) {
                vscode.window.showErrorMessage("Error creating .datapack/itemsTag.json");
            }
        });
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

let resources = {
    advancements: {},
    functions: {},
    objectives: [],
    tags: [],
    sounds: {},
    teams: [],
    functionTags: {},
    blockTags: {},
    itemTags: {}
}

export async function readFunctions() {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length !== 1) {
        //Cannot handle multi-root folder right now, quit
        return;
    }
    resources.functions = {};
    resources.teams = [];
    let root = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'data');
    try {
        await accessAsync(root);
    } catch (err) {
        //No such path, or can't access
        return;
    }

    let paths = (await vscode.workspace.findFiles("data/*/functions/**/*.mcfunction")).map(v=>v.fsPath);
    let v = await Promise.all(paths.map(v=>readFileAsync(v)));

    for (let i = 0; i < v.length; i++) {
        let file = v[i];
        let name = pathToName(root, paths[i]);

        let nodes = name.split(":");
        if (nodes[1].length === 0) {
            continue;
        }
        nodes.push(...nodes.pop().split("/"));

        let skip = false;
        for (let n of nodes) {
            if (!NAME_PATTERN.exec(n)) {
                skip = true;
                break;
            }
        }
        if (skip)
            continue;

        let temp = resources.functions;
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
                if (!resources.objectives.find(v=>v[0] === m[1])) {
                    resources.objectives.push([m[1], m[2], name]);
                }
            }
            m = TEAM_PATTERN.exec(line);
            if (m) {
                if (!resources.teams.find(v=>v===m[1])) {
                    resources.teams.push(m[1]);
                }
            }
        }
    }
    fs.writeFile(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.datapack', 'objectives.json'), JSON.stringify(resources.objectives), (err) => {
        if (err) {
            vscode.window.showErrorMessage("Error writing .datapack/objectives.json");
        }
    });
    fs.writeFile(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.datapack', 'functions.json'), JSON.stringify(resources.functions), (err) => {
        if (err) {
            vscode.window.showErrorMessage("Error writing .datapack/functions.json");
        }
    });
    fs.writeFile(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.datapack', 'teams.json'), JSON.stringify(resources.teams), (err) => {
        if (err) {
            vscode.window.showErrorMessage("Error writing .datapack/teams.json");
        }
    })
}

export async function readAdvancements() {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length !== 1) {
        //Cannot handle multi-root folder right now, quit
        return;
    }
    let root = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'data');
    try {
        await accessAsync(root);
    } catch (err) {
        //No such path, or can't access
        return;
    }

    resources.advancements = {};
    let paths = (await vscode.workspace.findFiles("data/*/advancements/**/*.json")).map(v=>v.fsPath);
    let v = await Promise.all(paths.map(v=>readFileAsync(v)));

    for (let i = 0; i < v.length; i++) {
        let file = v[i];
        let name = pathToName(root, paths[i]);

        let nodes = name.split(":");
        if (nodes[1].length === 0) {
            continue;
        }
        nodes.push(...nodes.pop().split("/"));

        let skip = false;
        for (let n of nodes) {
            if (!NAME_PATTERN.exec(n)) {
                skip = true;
                break;
            }
        }
        if (skip)
            continue;

        let temp = resources.advancements;
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

        fs.writeFile(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.datapack', 'advancements.json'), JSON.stringify(resources.advancements), (err) => {
            if (err) {
                vscode.window.showErrorMessage("Error writing .datapack/advancements.json");
            }
        });
    }
}

export async function readTags(t: string){
    let base;
    switch (t) {
        case 'functions':
            resources.functionTags = {};
            base = resources.functionTags;
            break;
        case 'items':
            resources.itemTags = {};
            base = resources.itemTags;
            break;
        case 'blocks':
            resources.blockTags = {};
            base = resources.blockTags;
            break;
        default:
            throw new Error("WTf is type " + t);
    }
    let root = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'data');
    let paths = (await vscode.workspace.findFiles(`data/*/tags/${t}/**/*.json`)).map(v=>v.fsPath);
    for (let p of paths) {
        let name = pathToName(root, p);
        let nodes = name.split(":");
        nodes.push(...nodes.pop().split("/"));
        nodes.splice(1, 1);
        if (nodes.length <= 1) {
            continue;
        }
        let skip = false;
        for (let n of nodes) {
            if (!NAME_PATTERN.exec(n)) {
                skip = true;
                break;
            }
        }
        if (skip)
            continue;

        let temp = base;
        for (let i = 0; i < nodes.length-1; i++) {
            if (!temp[nodes[i]])
                temp[nodes[i]] = {};
            temp = temp[nodes[i]];
        }
        if (!temp["$tags"])
            temp["$tags"] = [];

        temp["$tags"].push(nodes[nodes.length - 1].substring(0, nodes[nodes.length - 1].length - 5));
    }
    fs.writeFile(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.datapack', `${t}Tag.json`), JSON.stringify(base), (err) => {
        if (err) {
            vscode.window.showErrorMessage(`Error writing .datapack/${t}Tag.json`);
        }
    });
}

export async function loadFiles() {
    async function loadJson(path: string) {
        let v = await readFileAsync(path);
        return JSON.parse(v);
    }

    let root = vscode.workspace.workspaceFolders[0].uri;

    try {
        let raw = await loadJson(path.join(root.fsPath, '.datapack','entity_tags.json'));
        if (!isArray(raw) || raw.find(v=>!isString(v))) {
            vscode.window.showErrorMessage("Invalid format: .datapack/entity_tags.json. Should be array with strings");
        } else {
            resources.tags = raw;
        }
    } catch (e) {
        if (e.code === 'ENOENT') {
            fs.writeFile(path.join(root.fsPath, '.datapack', 'entity_tags.json'), "[]", (err) => {
                if (err) {
                    vscode.window.showErrorMessage("Error creating .datapack/entity_tags.json");
                }
            });
            return;
        }
        vscode.window.showErrorMessage("Error loading .datapack/entity_tags.json");
    }

    try {
        let raw = await loadJson(path.join(root.fsPath, '.datapack','advancements.json'));
        resources.advancements = raw;
    } catch (e) {
        if (e.code === 'ENOENT') {
            fs.writeFile(path.join(root.fsPath, '.datapack', 'advancements.json'), "{}", (err) => {
                if (err) {
                    vscode.window.showErrorMessage("Error creating .datapack/advancements.json");
                }
            });
            return
        }
        vscode.window.showErrorMessage("Error loading .datapack/advancements.json");
    }

    try {
        let raw = await loadJson(path.join(root.fsPath, '.datapack','functions.json'));
        resources.functions = raw;
    } catch (e) {
        if (e.code === 'ENOENT') {
            fs.writeFile(path.join(root.fsPath, '.datapack', 'functions.json'), "{}", (err) => {
                if (err) {
                    vscode.window.showErrorMessage("Error creating .datapack/functions.json");
                }
            });
            return
        }
        vscode.window.showErrorMessage("Error loading .datapack/functions.json");
    }

    try {
        let raw = await loadJson(path.join(root.fsPath, '.datapack','objectives.json'));
        resources.objectives = raw;
    } catch (e) {
        if (e.code === 'ENOENT') {
            fs.writeFile(path.join(root.fsPath, '.datapack', 'objectives.json'), "{}", (err) => {
                if (err) {
                    vscode.window.showErrorMessage("Error creating .datapack/objectives.json");
                }
            });
            return
        }
        vscode.window.showErrorMessage("Error loading .datapack/objectives.json");
    }

    try {
        let raw = await loadJson(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.datapack','teams.json'));
        resources.teams = raw;
    } catch (e) {
        if (e.code === 'ENOENT') {
            fs.writeFile(path.join(root.fsPath, '.datapack', 'teams.json'), "[]", (err) => {
                if (err) {
                    vscode.window.showErrorMessage("Error creating .datapack/teams.json");
                }
            });
            return
        }
        vscode.window.showErrorMessage("Error loading .datapack/teams.json");
    }
    try {
        let raw = await loadJson(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.datapack','functionsTag.json'));
        resources.functionTags = raw;
    } catch (e) {
        if (e.code === 'ENOENT') {
            fs.writeFile(path.join(root.fsPath, '.datapack', 'functionsTag.json'), "{}", (err) => {
                if (err) {
                    vscode.window.showErrorMessage("Error creating .datapack/functionsTag.json");
                }
            });
            return
        }
        vscode.window.showErrorMessage("Error loading .datapack/functionsTag.json");
    }
    try {
        let raw = await loadJson(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.datapack','itemsTag.json'));
        resources.itemTags = raw;
    } catch (e) {
        if (e.code === 'ENOENT') {
            fs.writeFile(path.join(root.fsPath, '.datapack', 'itemsTag.json'), "{}", (err) => {
                if (err) {
                    vscode.window.showErrorMessage("Error creating .datapack/itemsTag.json");
                }
            });
            return
        }
        vscode.window.showErrorMessage("Error loading .datapack/itemsTag.json");
    }
    try {
        let raw = await loadJson(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.datapack','blocksTag.json'));
        resources.blockTags = raw;
    } catch (e) {
        if (e.code === 'ENOENT') {
            fs.writeFile(path.join(root.fsPath, '.datapack', 'blocksTag.json'), "{}", (err) => {
                if (err) {
                    vscode.window.showErrorMessage("Error creating .datapack/blocksTag.json");
                }
            });
            return
        }
        vscode.window.showErrorMessage("Error loading .datapack/blocksTag.json");
    }

    try {
        let raw = await loadJson(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.datapack','sounds.json'));
        for (let n of Object.keys(raw)) {
            let parts = n.split(".");
            let temp = resources.sounds;
            for (let k of parts) {
                if (!temp[k]) {
                    temp[k] = {};
                }
                temp = temp[k];
            }
        }
    } catch (e) {
        if (e.code === 'ENOENT') {
            fs.writeFile(path.join(root.fsPath, '.datapack', 'sounds.json'), "{}", (err) => {
                if (err) {
                    vscode.window.showErrorMessage("Error creating .datapack/sounds.json");
                }
            });
            return
        }
        vscode.window.showErrorMessage("Error loading .datapack/sounds.json");
    }
}

export function getResources(key: string) {
    return resources[key];
}

export async function reloadAdvancement(p: string) {
    let v = await readFileAsync(p);
    let root = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'data');
    let name = pathToName(root, p);
    let nodes = name.split(":");
    if (nodes[1].length === 0) {
        return;
    }
    nodes.push(...nodes.pop().split("/"));
    for (let n of nodes) {
        if (!NAME_PATTERN.exec(n)) {
            return;
        }
    }
    let temp = resources.advancements;
    for (let i = 0; i < nodes.length-1; i++) {
        if (!temp[nodes[i]])
            temp[nodes[i]] = {};
        temp = temp[nodes[i]];
    }
    if (!temp["$adv"])
        temp["$adv"] = {};

    let criteria = temp["$adv"][nodes[nodes.length - 1].substring(0, nodes[nodes.length - 1].length - 5)] = [];

    try {
        let adv = JSON.parse(v);
        if (adv["criteria"] && isObject(adv["criteria"])) {
            criteria.push(...Object.keys(adv.criteria));
        }
    } catch (e) {
        //No processing is needed
    }

    setImmediate(()=> {
        fs.writeFile(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.datapack', 'advancements.json'), JSON.stringify(resources.advancements), (err) => {
            if (err) {
                vscode.window.showErrorMessage("Error writing .datapack/advancements.json");
            }
        });
    })
}

export async function reloadFunction(p: string) {
    let root = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'data');
    let name = pathToName(root, p);
    let file = await readFileAsync(p);

    let nodes = name.split(":");
    if (nodes[1].length === 0) {
        return;
    }
    nodes.push(...nodes.pop().split("/"));
    for (let n of nodes) {
        if (!NAME_PATTERN.exec(n)) {
            return;
        }
    }
    let temp = resources.functions;
    for (let i = 0; i < nodes.length-1; i++) {
        if (!temp[nodes[i]])
            temp[nodes[i]] = {};
        temp = temp[nodes[i]];
    }
    if (!temp["$func"])
        temp["$func"] = [];

    if (temp["$func"].indexOf(nodes[nodes.length - 1].substring(0, nodes[nodes.length - 1].length - 11)) === -1)
        temp["$func"].push(nodes[nodes.length - 1].substring(0, nodes[nodes.length - 1].length - 11));
    for (let line of file.split(LINE_DELIMITER)) {
        let m = OBJ_PATTERN.exec(line);
        if (m) {
            if (!resources.objectives.find(v=>v[0] === m[1])) {
                resources.objectives.push([m[1], m[2], name]);
            }
        }
        m = TEAM_PATTERN.exec(line);
        if (m) {
            if (!resources.teams.find(v=>v===m[1])) {
                resources.teams.push(m[1]);
            }
        }
    }
    setImmediate(()=> {
        fs.writeFile(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.datapack', 'objectives.json'), JSON.stringify(resources.objectives), (err) => {
            if (err) {
                vscode.window.showErrorMessage("Error writing .datapack/objectives.json");
            }
        });
        fs.writeFile(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.datapack', 'functions.json'), JSON.stringify(resources.functions), (err) => {
            if (err) {
                vscode.window.showErrorMessage("Error writing .datapack/functions.json");
            }
        });
        fs.writeFile(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.datapack', 'teams.json'), JSON.stringify(resources.teams), (err) => {
            if (err) {
                vscode.window.showErrorMessage("Error writing .datapack/teams.json");
            }
        })
    })
}

export async function reloadTags(p: string) {
    let root = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'data');
    let name = pathToName(root, p);
    let nodes = name.split(":");
    nodes.push(...nodes.pop().split("/"));
    let [t] = nodes.splice(1, 1);
    if (nodes.length <= 1)
        return;
    let base;
    switch (t) {
        case 'functions':
            base = resources.functionTags;
            break;
        case 'items':
            base = resources.itemTags;
            break;
        case 'blocks':
            base = resources.blockTags;
            break;
        default:
            throw new Error("Wrong tag type " + t);
    }
    for (let n of nodes) {
        if (!NAME_PATTERN.exec(n)) {
            return;
        }
    }
    let temp = base;
    for (let i = 0; i < nodes.length-1; i++) {
        if (!temp[nodes[i]])
            temp[nodes[i]] = {};
        temp = temp[nodes[i]];
    }
    if (!temp["$tags"])
        temp["$tags"] = [];

    if (temp["$tags"].indexOf(nodes[nodes.length - 1].substring(0, nodes[nodes.length - 1].length - 5)) === -1)
        temp["$tags"].push(nodes[nodes.length - 1].substring(0, nodes[nodes.length - 1].length - 5));
    setImmediate(()=> {
        fs.writeFile(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.datapack', `${t}Tag.json`), JSON.stringify(base), (err) => {
            if (err) {
                vscode.window.showErrorMessage(`Error writing .datapack/${t}Tag.json`);
            }
        });
    })
}

//Read resources.json
//blocking, as it is the initialization
let data = JSON.parse(fs.readFileSync(path.join(__dirname + "./../ref/resources.json"), "utf-8"));
for (let key of Object.keys(data)) {
    resources[key] = data[key];
}
