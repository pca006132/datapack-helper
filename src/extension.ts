'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as resources from './resources';
import * as fs from 'fs';
import * as path from 'path';
import getBaseNode from './command-node/node-factory';
import {escape, unescape} from './command-node/functions/nbt';
import { Position } from 'vscode';
import {indexOf, getResourceComponents, pathToName, accessAsync} from './util';
import {evaluate} from './script-runner';
import {outputFile} from 'fs-extra';

export function activate(context: vscode.ExtensionContext) {
	let enabled = true;

	vscode.commands.registerTextEditorCommand("datapack.escape", (editor, edit)=> {
		if (!enabled)
			return;
		editor.edit((editBuilder)=> {
			for (const v of editor.selections) {
				editBuilder.replace(v, escape(editor.document.getText(v)));
			}
		}).then((value)=> {
		})
	})
	vscode.commands.registerTextEditorCommand("datapack.unescape", (editor, edit)=> {
		if (!enabled)
			return;
		editor.edit((editBuilder)=> {
			for (const v of editor.selections) {
				editBuilder.replace(v, unescape(editor.document.getText(v)));
			}
		}).then((value)=> {
		})
	})
	vscode.commands.registerTextEditorCommand("datapack.evaluate", (editor, edit)=> {
		if (!enabled)
			return;
		editor.edit((editBuilder)=> {
			for (const v of editor.selections) {
				editBuilder.replace(v, evaluate(editor.document.getText(v)));
			}
		}).then((value)=> {
			if (!value) vscode.window.showErrorMessage("replace failed");
		})
	})
	vscode.commands.registerCommand("datapack.open", ()=> {
		if (!enabled)
			return;
		vscode.window.showInputBox({placeHolder:"a/l/bt/it/ft/f/r", prompt: "a: advancements, l: loot-tables, bt: block-tag, it: item-tag, ft: function-tag, f: functions, r: recipe"}).then(choice=> {
			let extension = "";
			let tag = "";
			choice = choice.toLowerCase();
			switch (choice) {
				case "a":
					choice = "advancement";
					extension = ".json";
					break;
				case "l":
					choice = "loot_tables";
					extension = ".json";
					break;
				case "r":
					choice = "recipes";
					extension = ".json";
					break;
				case "bt":
					tag = "blocks/";
					choice = "tags";
					extension = ".json";
					break;
				case "it":
					tag = "items/";
					choice = "tags";
					extension = ".json";
					break;
				case "ft":
					tag = "functions";
					choice = "tags";
					extension = ".json";
					break;
				case "f":
					choice = "function";
					extension = ".mcfunction"
					break;
				default:
					vscode.window.showErrorMessage("Invalid mode, either a or f");
					return;
			}
			vscode.window.showInputBox({placeHolder: `example:${choice}_a`, prompt: `Name of the ${choice}`}).then(v=> {
				if (v) {
					let components = getResourceComponents(v);
					if (components.length === 0) {
						vscode.window.showErrorMessage("Invalid name");
					} else {
						if (tag !== "")
							components.splice(1, 0, tag);
						let p = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'data', components[0], choice + "s", ...components.slice(1)) + extension;
						accessAsync(p).then(()=> {
							vscode.workspace.openTextDocument(vscode.Uri.file(p)).then(document=> {
								vscode.window.showTextDocument(document);
							});
						}).catch(()=> {
							outputFile(p, extension == ".mcfunction"? `# ${v}` : "{}", err=> {
								if (err) {
									vscode.window.showErrorMessage(`Error creating the ${choice} file`);
								} else {
									vscode.workspace.openTextDocument(vscode.Uri.file(p)).then(document=> {
										vscode.window.showTextDocument(document);
									});
								}
							})
						})
					}
				}
			})
		})
	})
	vscode.commands.registerCommand("datapack.addTag", ()=> {
		if (!vscode.window.activeTextEditor || vscode.window.activeTextEditor.document.isUntitled || !vscode.window.activeTextEditor.document.uri.fsPath.endsWith(".mcfunction"))
			return;
		vscode.window.showInputBox({prompt: "List of tags to add to the current function, use `,` to seperate different tags.", value: "minecraft:tick"}).then(v=> {
			if (!v)
				return;
			let current = pathToName(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'data'), vscode.window.activeTextEditor.document.uri.fsPath);
			for (let tag of v.split(",").map(x=>x.trim())) {
				let components = getResourceComponents(tag);
				if (components.length === 0) {
					vscode.window.showErrorMessage("Invalid name: " + tag);
					continue;
				}
				let p = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'data', components[0], 'tags', 'functions', ...components.slice(1)) + ".json";
				fs.readFile(p, "utf-8", (err, data)=> {
					let functions = [];
					let replace = false;
					if (!err) {
						try {
							let d = JSON.parse(data);
							replace = d.replace || false;
							functions = d.values || [];
						} catch (e) {
							vscode.window.showErrorMessage("Error reading tag file: " + p);
						}
					}
					if (functions.indexOf(current) === -1)
						functions.push(current);
					outputFile(p, JSON.stringify({replace: replace, values: functions}), err=> {
						if (err)
							vscode.window.showErrorMessage("Error writing tag file" + p);
					})
				})
			}
		})
	})

	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length !== 1) {
		vscode.window.showErrorMessage("There must be 1 and only 1 workspace folder for the datapack");
		enabled = false;
	} else {
		fs.access(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '/pack.mcmeta'), err=> {
			if (!err) {
				fs.access(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '/.datapack/'), err=> {
					if (!err) {
						enabled = true;
						resources.loadFiles();
					} else {
						resources.initialize();
					}
				})
			}
		})
	}
	//file change watcher
	let functionWatcher = vscode.workspace.createFileSystemWatcher(vscode.workspace.workspaceFolders[0].uri.fsPath + "/data/*/functions/**.mcfunction");
	functionWatcher.onDidChange(e=> {
		if (!enabled)
			return;
		resources.reloadFunction(e.fsPath);
	})
	functionWatcher.onDidCreate(e=> {
		if (!enabled)
			return;
		resources.reloadFunction(e.fsPath);
	})
	functionWatcher.onDidDelete(e=> {
		if (!enabled)
			return;
		setImmediate(()=> {
			resources.readFunctions().catch(err=>{
				if (err) vscode.window.showErrorMessage("Error reading functions: " + err);
			})
		})
	})

	let advancementWatcher = vscode.workspace.createFileSystemWatcher(vscode.workspace.workspaceFolders[0].uri.fsPath + "/data/*/advancements/**.json");
	advancementWatcher.onDidChange(e=> {
		if (!enabled)
			return;
		resources.reloadAdvancement(e.fsPath);
	})
	advancementWatcher.onDidCreate(e=> {
		if (!enabled)
			return;
		resources.reloadAdvancement(e.fsPath);
	})
	advancementWatcher.onDidDelete(e=> {
		if (!enabled)
			return;
		setImmediate(()=> {
			resources.readAdvancements().catch(err=>{
				if (err) vscode.window.showErrorMessage("Error reading advancements: " + err);
			})
		})
	})

	let configWatcher = vscode.workspace.createFileSystemWatcher(vscode.workspace.workspaceFolders[0].uri.fsPath + "/.datapack/*.json", true, false, true);
	configWatcher.onDidChange(e=> {
		if (!enabled)
			return;
		if (e.fsPath.endsWith("sounds.json") || e.fsPath.endsWith("entity_tags.json")) {
			setImmediate(()=> {
				resources.loadFiles();
			})
		}
	})

	let tagWatcher = vscode.workspace.createFileSystemWatcher(vscode.workspace.workspaceFolders[0].uri.fsPath + "/data/*/tags/**/*.json", false, true, false);
	tagWatcher.onDidCreate(e=> {
		if (!enabled)
			return;
		resources.reloadTags(e.fsPath);
	})
	tagWatcher.onDidDelete(e=> {
		if (!enabled)
			return;
		let t = getResourceComponents(pathToName(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, "data"), e.fsPath))[1];
		setImmediate(()=> {
			resources.readTags(t).catch(err=>{
				if (err) vscode.window.showErrorMessage("Error reading tags: " + err);
			})
		})
	})

	let baseNode = getBaseNode(fs.readFileSync(path.join(__dirname + "./../ref/command-format.json"), "utf-8"));

	vscode.languages.registerCompletionItemProvider('mcfunction', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
			if (!enabled)
				return [];
			if (document.lineAt(position.line).text.length !== 0) {
				let char = document.lineAt(position.line).text.charCodeAt(0);
				if (char < 97 || char > 122)
					return [];
			}
			return baseNode.getCompletion(document.lineAt(position.line).text, 0, position.character, {})[0].map(v=>new vscode.CompletionItem(v));
		}
	}, ...[".", ",", "[", "{", " ", "/", ":", "=", "!", "_", "#"]);

	vscode.commands.registerCommand("datapack.initialize", ()=> {
		if (!enabled)
			return;
		resources.initialize();
		vscode.commands.executeCommand("datapack.reload");

	})
	vscode.commands.registerCommand("datapack.reload", ()=> {
		if (!enabled)
			return;
		resources.readFunctions().then().catch(err=>{
			if (err) vscode.window.showErrorMessage("Error reading functions: " + err);
		})
		resources.readAdvancements().then().catch(err=>{
			if (err) vscode.window.showErrorMessage("Error reading advancements: " + err);
		})

		resources.readTags("functions").then().catch(err=> {
			if (err) vscode.window.showErrorMessage("Error reading function tags: " + err);
		})
		resources.readTags("blocks").then().catch(err=> {
			if (err) vscode.window.showErrorMessage("Error reading block tags: " + err);
		})
		resources.readTags("items").then().catch(err=> {
			if (err) vscode.window.showErrorMessage("Error reading item tags: " + err);
		})
	})

	vscode.workspace.onDidChangeWorkspaceFolders(e=>{
		if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length !== 1) {
			vscode.window.showErrorMessage("There must be 1 and only 1 workspace folder for the datapack");
			enabled = false;
		} else {
			fs.access(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '/pack.mcmeta'), err=> {
				if (!err) {
					fs.access(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '/.datapack/'), err=> {
						if (!err) {
							enabled = true;
							resources.loadFiles();
						} else {
							resources.initialize();
						}
					})
				}
			})
		}
	})
}
