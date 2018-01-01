/**
 * Generate nodes from JSON
 */

import BaseNode from "./base";
import FormatNode from "./format";
import OptionNode from "./options";
import PlainNode from "./plain";
import ReferenceNode from "./reference";
import AdvancementNode from "./functions/advancements";
import BlockNode from "./functions/block";
import CriteriaNode from "./functions/criteria";
import DisplaySlotNode from "./functions/display-slot";
import FunctionNode from "./functions/functions";
import ItemNode from "./functions/item";
import NbtPathNode from "./functions/nbt-path";
import NbtNode from "./functions/nbt";
import ObjectiveNode from "./functions/objectives";
import ScbCriteriaNode from "./functions/scb-criteria";
import SelectorNode from "./functions/selector";
import SlotNode from "./functions/slot";
import SoundNode from "./functions/sounds";
import EntityTagNode from "./functions/entity-tag";
import TeamNode from "./functions/teams";
import { isArray } from "util";

function parseNode(obj, base: BaseNode): BaseNode {
    let result: BaseNode;
    if (obj["data"] && !obj["function"]) {
        result = new PlainNode(obj["data"]);
    } else if (obj["options"]) {
        result = new OptionNode(obj["options"]);
    } else if (obj["key"]) {
        result = new ReferenceNode(obj["key"]);
    } else if (obj["format"]) {
        result = new FormatNode(obj["format"]);
    } else if (obj["function"]) {
        switch (obj["function"]) {
            case "command":
                return base;
            case "target":
                result = new SelectorNode(true);
                break;
            case "targets":
                result = new SelectorNode(true);
                break;
            case "block nbt":
                result = new NbtNode("block");
                break;
            case "entity nbt":
                result = new NbtNode("entity");
                break;
            case "item tag nbt":
                result = new NbtNode("item");
                break;
            case "advancements":
                result = new AdvancementNode();
                break;
            case "advancements-criterion":
                result = new CriteriaNode();
                break;
            case "functions":
                result = new FunctionNode();
                break;
            case "objectives":
                result = new ObjectiveNode(false);
                break;
            case "teams":
                result = new TeamNode();
                break;
            case "sounds":
                result = new SoundNode();
                break;
            case "block":
                result = new BlockNode((obj.data||{})["test"] || true);
                break;
            case "tags":
                result = new EntityTagNode();
                break;
            case "item":
                result = new ItemNode((obj.data||{})["test"] || true);
                break;
            case "block path":
                result = new NbtPathNode("block");
                break;
            case "entity path":
                result = new NbtPathNode("entity");
                break;
            case "slot":
                result = new SlotNode();
                break;
            case "display-slot":
                result = new DisplaySlotNode();
                break;
            case "scb-criteria":
                result = new ScbCriteriaNode();
                break;
            case "trigger":
                result = new ObjectiveNode(true);
                break;
            default:
                throw new Error(`Unknown function type: ${obj["function"]}`);
        }
    }
    result.children = parseChildren(obj["children"], base);
    if (obj["optional"])
        result.optional = true;
    return result;
}

function parseChildren(children: Array<object>, base: BaseNode): Array<BaseNode> {
    let result = [];
    for (let c of children) {
        if (isArray(c)) {
            let result = parseChildren(c, base);
            for (let i of result) {
                setChildren(i, result);
            }
            return result;
        } else {
            result.push(parseNode(c, base));
        }
    }
    return result;
}

function setChildren(node: BaseNode, children: Array<BaseNode>) {
    if (node.children.length === 0) {
        node.children = children;
    } else {
        for (let i of node.children) {
            setChildren(i, children);
        }
    }
}

export default function getBaseNode(text: string): BaseNode {
    let obj = JSON.parse(text);
    let base = new BaseNode();
    base.children = parseChildren(obj["nodes"], base);
    return base;
}