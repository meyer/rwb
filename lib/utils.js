'use strict';

const fs = require('fs-extra');
const path = require('path');
const invariant = require('invariant');

function parseIDString(str) {
  str = str || '#.rwb';

  const bits = str.split('#');
  invariant(
    bits.length === 2 || bits[1] !== '',
    'rwb.dom_node can only be a valid ID (e.g. `#react-stuff`)'
  );

  if (bits[0] === '') {
    bits[0] = 'div';
  } else {
    invariant(
      ~['div', 'span'].indexOf(bits[0]),
      `Element can only be a div or a span (got ${bits[0]})`
    );
  }

  return bits;
}

function buildMountPoint(arr) {
  invariant(
    Array.isArray(arr) && arr.length === 2,
    'buildMountPoint expects a two-element array, homie'
  );
  return `<${arr[0]} id="${arr[1]}"></${arr[0]}>`;
}

function loadProjectPkg() {
  const projectRoot = process.cwd();
  const packageJsonFile = path.join(projectRoot, 'package.json');

  invariant(fs.existsSync(packageJsonFile), `${packageJsonFile} does not exist.`);

  const packageJsonData = fs.readJsonSync(packageJsonFile);

  invariant(
    typeof packageJsonData === 'object',
    'packageJsonData is not an object'
  );

  invariant(
    typeof packageJsonData.rwb === 'object',
    `rwb key does not exist in ${packageJsonFile}. Did you forget to run 'rwb init'?`
  );

  invariant(
    packageJsonData.rwb.main,
    `'rwb.main' key needs to be set to a module path (in ${packageJsonFile}). Have you run 'rwb init'' yet?`
  );

  return packageJsonData;
}

module.exports = {
  parseIDString,
  buildMountPoint,
  loadProjectPkg,
};
