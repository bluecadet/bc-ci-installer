#!/usr/bin/env node

const os = require('os');
const path = require('path');
const fsx = require('fs-extra');

const qoa = require('qoa');
const chalk = require('chalk');

var compareVersions = require('compare-versions');
const dlrepo = require('download-git-repo');
var GitHub = require('github-api');

const creds = require('../lib/credentials.js');

const args = require('yargs')
  .alias('i', 'installer')
  .describe('i', "")
  .default('i', "bc-ci-for-pantheon") // @TODO: remove this after development
  .alias('c', 'ci-version')
  .describe('c', "CI version or tag")
  .default('c', "1.0.0-alpha.1") // @TODO: remove this after development
  .epilog('copyright 2019')
  .help('h')
  .alias('h', 'help')
  .alias('V', 'version')
  .count('verbose')
  .alias('v', 'verbose')
  .default('v', 3) // @TODO: remove this after development
  .describe('verbose', "Increase the verbosity of messages: 1 for normal output, 2 for more verbose output and 3 for debug")
  .argv;

let Logger = require('../lib/logger.js');
let logger = new Logger(4);
let log = logger.log;

console.log(args)

return;

var versionPattern = /([0-9]+)(\.([0-9x]+))?(\.([0-9x]+))?(-(([a-z]+)([.-]([0-9]+))?)?)?/;

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

creds.initCreds(config)
  .then((CredsResponse) => {
    // Set credentials from saved information or user prompt.
    config.creds = CredsResponse;

    // Select project and version.
    // @TODO: remove defaults and actually figure this out.
    config.installer = args.i;
    config.version = args.c;
    config.installTestConfig = true;

    // Do IT!!
    let installFile = './lib/installers/' + config.installer + '.js';
    log(installFile);
    if (fsx.existsSync(installFile)) {
      log(chalk.green("Installer (" + config.installer + ") found."));
      const installer = require('../lib/installers/' + config.installer + '.js');
      return installer.install(config);
    }

    log(chalk.red("Installer (" + config.installer + ") does not exist."));
    return;
  })
  .then((response) => {
    if (response.status == "user_terminated") {
      log(chalk.red("User Terminated Installation."))
    }
  });






// Verify project.
// Verify we are in a project directory...
// Verify .projectconfig.js...
// Check default config files...

// Check for saved Github creds.














// let e1 = "1.x-latest";
// let e2 = "1.0.x-latest";
// let e3 = "1.0.0-beta-3";
// let e4 = "1.0.0-beta.3";
// let e5 = "1.0.0-alpha2";

// let r = e1.match(versionPattern);
// console.log(r);

// r = e2.match(versionPattern);
// console.log(r);

// r = e3.match(versionPattern);
// console.log(r);

// r = e4.match(versionPattern);
// console.log(r);

// r = e5.match(versionPattern);
// console.log(r);


// console.log();
// console.log(compareVersions('1.0.0-alpha1', '1.0.0-alpha2'));















// let versionInfo = args.c.match(versionPattern);
// console.log(versionInfo);

// let repo = gh.getRepo('bluecadet', 'bc-ci-for-pantheon');

// let githubTags = [];
// let tagPromise = repo.listTags().then(function ({ data }) {
//   // console.log(data);
//   // data.each()
//   githubTags = data.map(x => x.name);
//   // console.log(githubTags);
// });

// let githubBranches = [];
// let branchPromise = repo.listBranches().then(function ({ data }) {
//   // console.log(data);
//   // githubBranches = data.map(x => x.name);
//   data.forEach(el => {
//     if (el.name !== "master") {
//       githubBranches.push(el.name);
//     }
//   });
//   // console.log(githubBranches);
// });


// Promise.all([tagPromise, branchPromise]).then(function () {
//   console.log(githubTags, githubBranches, config.tmpRepoDir);

//   // Lets grab the repo.
//   dlrepo('bluecadet/bc-ci-for-pantheon#' + args.c, config.tmpRepoDir, { clone: true }, err => {
//     if (err) {
//       console.log(chalk.red(`ERROR @ downloading repo`));
//       throw Error(err);
//     }


//     fsx.remove(config.tmpRepoDir, function () {
//       console.log("Directory removed");
//     });
//   });

// });


