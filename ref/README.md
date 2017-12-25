# Resources needed

Please put the following resources in the `resources.json` file.

* `#blocks`: Blocks, refer to the format below
* `#effects`: Effect ID list
* `#entities`: Entity ID list
* `#items`: Item ID list
* `#particles`: Particle ID list
* `#stat`: Player statistic ID list
* `#recipes`: Recipe ID list

> Note that all IDs cannot have `minecraft:` before it.

## Blocks format
`"<>"`: **Replace** this with an appropriate value.

```
"<id>": {
    "<block state key>": [
        "<value1>", "<value2>" ...
    ]
}
```