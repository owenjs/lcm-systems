'use strict'

const fs = require('fs');
const path = require('path');

import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const SERVE = process.env.SERVE === 'true';

const INPUT_FILE_DIRECTORY        = '../src/';
const INPUT_FILE_EXTENTION        = '.rollup.js';

const SERVE_DIRECTORY             = '../public/js';
const BUILD_DIRECTORY             = '../build/js';

const OUTPUT_FILE_EXTENTION       = '.bundle.js';
const OUTPUT_FILE_EXTENTION_MIN   = '.bundle.min.js';

const GLOBALS   = { jquery: '$' };
const EXTERNAL  = [ 'jquery' ];
const FORMAT    = 'umd';

const buildServeFileOutput = (name, sourcePath) => {
  return {
    file: path.join(sourcePath, name + OUTPUT_FILE_EXTENTION_MIN),
    format: FORMAT,
    name: name,
    globals: GLOBALS,
    sourcemap: true,
    plugins: [terser()]
  }
}

const buildFileOutput = (name, sourcePath) => {
  return [
    {
      file: path.join(sourcePath, name + OUTPUT_FILE_EXTENTION),
      format: FORMAT,
      name: name,
      globals: GLOBALS,
      sourcemap: true
    },
    {
      file: path.join(sourcePath, name + OUTPUT_FILE_EXTENTION_MIN),
      format: FORMAT,
      name: name,
      globals: GLOBALS,
      sourcemap: true,
      plugins: [terser()]
    }
  ];
};

export default () => {
  const inputFilePath = path.resolve(__dirname, INPUT_FILE_DIRECTORY);
  if(!inputFilePath) {
    console.log(`No Directory Found: ${INPUT_FILE_DIRECTORY}`);
    return;
  }

  // Find all Files in the JS directory with the .rollup.js extention
  let filesToBundle = fs.readdirSync(inputFilePath)
    .filter(file => file.endsWith(INPUT_FILE_EXTENTION))
    .map(file => file);

  let sourcePath = path.resolve(__dirname, (SERVE) ? SERVE_DIRECTORY : BUILD_DIRECTORY);
  if(fs.existsSync(sourcePath)) {
    // Delete the directory, to avoid leftover files
    fs.rmdirSync(sourcePath, { recursive: true });
  }

  // Create Rollup Exports for Each File
  let rollupExports = filesToBundle.map(fileToBundle => {
    let name = fileToBundle.replace(INPUT_FILE_EXTENTION, ""),
      fileOutputs;
    
    if(SERVE) {
      fileOutputs = buildServeFileOutput(name, sourcePath);
    } else {
      fileOutputs = buildFileOutput(name, sourcePath);
    }

    return {
      input: path.join(inputFilePath, fileToBundle),
      output: fileOutputs,
      plugins: [
        resolve(),
        commonjs(),
        babel({ babelHelpers: 'bundled' })
      ],
      external: EXTERNAL
    };
  });

  return rollupExports;
};
