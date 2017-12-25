import BaseNode from './../../command-node/base';
import * as assert from 'assert';

suite("BaseNode test", ()=> {
    test("1 Success test", ()=> {
        let base = new BaseNode();
        base.children = [
            {
                children: [],
                optional: false,
                getCompletion: (line: string, start: number, end: number, data): [Array<string>, boolean] => {
                    return [["1"], true];
                }
            },
            {
                children: [],
                optional: false,
                getCompletion: (line: string, start: number, end: number, data): [Array<string>, boolean] => {
                    throw new Error("should not be executed");
                }
            }
        ]
        assert.deepEqual(base.getCompletion("", 0, 0, {}), [["1"], true]);
    })
    test("1 Fail 1 Success test", ()=> {
        let base = new BaseNode();
        base.children = [
            {
                children: [],
                optional: false,
                getCompletion: (line: string, start: number, end: number, data): [Array<string>, boolean] => {
                    throw new Error("should not be executed");
                }
            },
            {
                children: [],
                optional: false,
                getCompletion: (line: string, start: number, end: number, data): [Array<string>, boolean] => {
                    return [["1"], true];
                }
            }
        ]
        assert.deepEqual(base.getCompletion("", 0, 0, {}), [["1"], true]);
    })
    test("All fail", ()=> {
        let base = new BaseNode();
        base.children = [
            {
                children: [],
                optional: false,
                getCompletion: (line: string, start: number, end: number, data): [Array<string>, boolean] => {
                    throw new Error("should not be executed");
                }
            },
            {
                children: [],
                optional: false,
                getCompletion: (line: string, start: number, end: number, data): [Array<string>, boolean] => {
                    throw new Error("should not be executed");
                }
            }
        ]
        assert.deepEqual(base.getCompletion("", 0, 0, {}), [[], true]);
    })
})