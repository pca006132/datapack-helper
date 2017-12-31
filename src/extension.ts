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
		editor.edit((editBuilder)=> {
			for (const v of editor.selections) {
				editBuilder.replace(v, escape(editor.document.getText(v)));
			}
		}).then((value)=> {
		})
	})
	vscode.commands.registerTextEditorCommand("datapack.unescape", (editor, edit)=> {
		editor.edit((editBuilder)=> {
			for (const v of editor.selections) {
				editBuilder.replace(v, unescape(editor.document.getText(v)));
			}
		}).then((value)=> {
		})
	})
	vscode.commands.registerTextEditorCommand("datapack.evaluate", (editor, edit)=> {
		editor.edit((editBuilder)=> {
			for (const v of editor.selections) {
				editBuilder.replace(v, evaluate(editor.document.getText(v)));
			}
		}).then((value)=> {
			if (!value) vscode.window.showErrorMessage("replace failed");
		})
	})
	vscode.commands.registerCommand("datapack.open", ()=> {
		vscode.window.showInputBox({placeHolder:"a", prompt: "(a)dvancements or (f)unctions"}).then(choice=> {
			let extension = "";
			choice = choice.toLowerCase();
			switch (choice) {
				case "a":
				case "advancement":
					choice = "advancement";
					extension = ".json";
					break;
				case "f":
				case "function":
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
						let p = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'data', components[0], choice + "s", ...components.slice(1)) + extension;
						accessAsync(p).then(()=> {
							vscode.workspace.openTextDocument(vscode.Uri.file(p)).then(document=> {
								vscode.window.showTextDocument(document);
							});
						}).catch(()=> {
							outputFile(p, `# ${v}`, err=> {
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
	let functionWatcher = vscode.workspace.createFileSystemWatcher(vscode.workspace.workspaceFolders[0].uri.fsPath + "/data/*/functions/**/*.mcfunction");
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

	let advancementWatcher = vscode.workspace.createFileSystemWatcher(vscode.workspace.workspaceFolders[0].uri.fsPath + "/data/*/advancements/**/*.json");
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

	let tagWatcher = vscode.workspace.createFileSystemWatcher(vscode.workspace.workspaceFolders[0].uri.fsPath + "/data/*/tags/{functions,items,blocks}/**/*.json", false, true, false);
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
