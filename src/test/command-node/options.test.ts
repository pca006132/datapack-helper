import * as assert from 'assert';
import OptionNode from '../../command-node/options';

suite("Options Tests", () => {
    suite("getCompletion test", () => {
        test("empty test", ()=> {
            let opt = new OptionNode([]);
            assert.deepEqual(opt.getCompletion("abc", 0, "abc".length, null), [[], false]);
        })
    })
});
