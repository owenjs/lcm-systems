'use strict'

const fs = require('fs');
const path = require('path');
const { Bundler } = require('scss-bundle');

const NODE_MODULES_PATH       = '..';

const IMPORT_PATTERN          = /@import\s+['"](.+)['"];/g;
const FILE_EXTENSION_REGEX    = /\..+$/g;

const INPUT_FILE_DIRECTORY    = '../scss/';
const INPUT_FILE_IGNORE       = [];

const OUTPUT_FILE_DIRECTORY   = '../build/scss';
const OUTPUT_FILE_EXTENSION   = 'bundled.scss';

(async () => {
  const projectDirectory = path.resolve(__dirname, NODE_MODULES_PATH);
  //const bundler = new Bundler(undefined, projectDirectory);

  const inputFilePath = path.resolve(__dirname, INPUT_FILE_DIRECTORY);
  if(!inputFilePath) {
    console.log(`No Directory Found: ${INPUT_FILE_DIRECTORY}`);
    return;
  }

  // Find all Files in the SCSS directory without an _ at the start of their name
  const filesToBundle = fs.readdirSync(inputFilePath)
    .filter(file => !file.startsWith('_'))
    .map(file => file);

  // Bundle all the Files, ready to be written
  const filesToWrite = await Promise.all(filesToBundle.map(async fileToBundle => {
    const bundler = new Bundler(undefined, projectDirectory);
    // Bundle the File
    let result = await bundler.bundle(path.join(inputFilePath, fileToBundle), [], [], INPUT_FILE_IGNORE);

    // Remove the left over @import lines
    // If files are been ignored, using INPUT_FILE_IGNORE array, then this has 
    // to be done as the CMS will throw an error if it sees a leftover @import
    let fileToWrite = result.bundledContent.replace(IMPORT_PATTERN, "");
    let fileName = fileToBundle.replace(FILE_EXTENSION_REGEX, "");

    return {
      name: fileName,
      bundle: fileToWrite
    };
  }));
 
  const fileToWritePath = path.resolve(__dirname, OUTPUT_FILE_DIRECTORY);
  // If this file path doesn't already exist, create it!
  if(!fs.existsSync(fileToWritePath)) {
    fs.mkdirSync(fileToWritePath, { recursive: true });
  }

  // Write all the new bundles
  filesToWrite.forEach(fileToWrite => {
    let fileNameToWrite = fileToWrite.name + '.' + OUTPUT_FILE_EXTENSION;
    // Write new Bundled File
    fs.writeFile(path.join(fileToWritePath, fileNameToWrite), fileToWrite.bundle, 'utf8', (err) => {
      if(err) throw err;

      console.log(`Bundled File Created: ${fileNameToWrite}`);
    });
  });
})();