import * as assert from 'assert';

import * as util from '../util';

suite("Util Tests", () => {
    suite("getResourceComponents test", ()=> {
        test("Normal tests", ()=> {
            assert.deepEqual(util.getResourceComponents("a:1"), ["a", "1"]);
            assert.deepEqual(util.getResourceComponents("a:1.2/34"), ["a", "1.2", "34"]);
            assert.deepEqual(util.getResourceComponents("a:1.2/34/abc"), ["a", "1.2", "34", "abc"]);
        })
        test("Default namespace test", ()=> {
            assert.deepEqual(util.getResourceComponents("1.2/34/abc"), ["minecraft", "1.2", "34", "abc"]);
        })
        test("Invalid pattern test", ()=> {
            assert.deepEqual(util.getResourceComponents("aBc:1"), []);
        })
    })
    suite("strStartsWith test", ()=> {
        test("Success tests", ()=> {
            assert.equal(util.strStartsWith("ab", 0, 2, "a"), true);
            assert.equal(util.strStartsWith("abcde", 0, 3, "abc"), true);
            assert.equal(util.strStartsWith("abc", 0, 3, "abc"), true)
        })
        test("Fail tests", ()=> {
            assert.equal(util.strStartsWith("ab", 1, 2, "a"), false);
            assert.equal(util.strStartsWith("abcde", 0, 2, "abc"), false);
            assert.equal(util.strStartsWith("abc", 0, 3, "bc"), false)
            assert.equal(util.strStartsWith("abc", 0, 3, "abcd"), false)
        })
    })
    suite("indexOf test", ()=> {
        test("Success tests", ()=> {
            assert.equal(util.indexOf("abcd", 0, 4, "b"), 1);
            assert.equal(util.indexOf("abcd", 0, 4, "d"), 3);
            assert.equal(util.indexOf("abcd", 2, 4, "c"), 2);
        })
        test("Fail tests", ()=> {
            assert.equal(util.indexOf("abcd", 0, 4, "e"), -1);
            assert.equal(util.indexOf("abcd", 0, 3, "d"), -1);
            assert.equal(util.indexOf("abcd", 3, 4, "c"), -1);
        })
    })
});
