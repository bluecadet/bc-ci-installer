#!/usr/bin/env node

const os = require('os');
const path = require('path');
const fs = require('fs');
const fsx = require('fs-extra');

const qoa = require('qoa');
const chalk = require('chalk');

var compareVersions = require('compare-versions');
const dlrepo = require('download-git-repo');
var GitHub = require('github-api');

const creds = require('../lib/credentials.js');


// Configuration.
let config = {
  curPath: process.cwd(),
  baseTempDir: path.join(os.homedir(), '.bc-ci-install'),
  creds: {
    githubMachineToken: '',
    githubUsername: '',
    githubPassword: ''
  }
};
config.credsDir = config.baseTempDir + "/creds";
config.credsFile = config.credsDir + '/creds.json';
config.tmpRepoDir = config.baseTempDir + "/repo";


creds.invalidateCreds(config);
