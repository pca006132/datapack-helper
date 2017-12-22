'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	// The most simple completion item provider which
	// * registers for text files (`'plaintext'`), and
	// * return the 'Hello World' and
	//   a snippet-based completion item.
	vscode.languages.registerCompletionItemProvider('mcfunction', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
			console.log(document.lineAt(position.line).text.substring(0, position.character));
			return [
                new vscode.CompletionItem('Hello World!'),
			];
		}
    });
}