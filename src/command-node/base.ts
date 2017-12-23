/**
 * class BaseNode
 */

export class BaseNode {
    children: Array<BaseNode> = [];

    getCompletion = (line: string, start: number, end: number): [Array<string>, boolean] => {
        let completion: Array<string> = [];
        for (let child of this.children) {
            try {
                let result = child.getCompletion(line, start, end);
                if (result[1]) {
                    return result;
                } else {
                    completion.push(...result[0]);
                }
            } catch (e) {
                //Nothing to handle
            }
        }
        return [completion, true];
    }
}