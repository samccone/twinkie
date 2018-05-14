#!/usr/bin/env node
const generateInterface = require('.').generateInterface;
const generateFauxUse = require('.').generateFauxUse;
const args = process.argv.slice(2);

if (args.indexOf('--print-use') != -1) {
    console.log(generateFauxUse(args[0], args[1]));
} else {
    console.log(generateInterface(args[0]));
}