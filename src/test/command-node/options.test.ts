import * as assert from 'assert';
import OptionNode from './../../command-node/options';

/**
 * vscode渣渣
 */
suite("Options Tests", () => {
    let opt = new OptionNode([]);
    suite("getCompletion test", () => {
        assert.deepEqual(opt.getCompletion("abc", 0, "abc".length, null), [[], false]);
    })
});