#!/usr/bin/env node
const generateInterface = require('.').generateInterface;
const args = process.argv.slice(2);


console.log(generateInterface(args[0]));
