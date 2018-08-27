#!/usr/bin/env node
const generateInterface = require('.').generateInterface;
const generateFauxUse = require('.').generateFauxUse;
const args = process.argv.slice(2);

if (args.indexOf('--print-use') != -1) {
    let undefinedCheck = false;
    if (args.indexOf('--undefined-check') != -1) {
        undefinedCheck = true;
    }

    console.log(generateFauxUse(args[0], args[1], undefinedCheck));
} else {
    console.log(generateInterface(args[0]));
}