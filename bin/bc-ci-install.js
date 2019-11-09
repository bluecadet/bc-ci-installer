#!/usr/bin/env node

const os = require('os');
const path = require('path');
const fsx = require('fs-extra');

const chalk = require('chalk');

const creds = require('../lib/credentials.js');

const args = require('yargs')
  .usage('Usage: $0 [options]')
  .alias('i', 'installer')
  .describe('i', "")
  .default('i', "bc-ci-for-pantheon") // @TODO: remove this after development
  .choices('i', ['bc-ci-for-pantheon'])
  .alias('c', 'ci-version')
  .describe('c', "CI version or tag")
  .default('c', "^1.0.0-alpha") // @TODO: remove this after development
  .boolean('t')
  .alias('t', 'incTestConfig')
  .describe('t', "Include Deafult Test Config Files. (This will destroy any changes you may have made in them)")
  .default('t', false)
  .help('h')
  .alias('h', 'help')
  .version()
  .alias('V', 'version')
  .count('verbose')
  .alias('v', 'verbose')
  // .default('v', 3) // @TODO: remove this after development
  .describe('verbose', "Increase the verbosity of messages: 1 for normal output, 2 for more verbose output and 3 for debug")
  .epilog('Copyright 2019')
  .wrap(null)
  .argv;

let Logger = require('../lib/logger.js');
let logger = new Logger(args.verbose);
let log = logger.log;

log(args, 3);



// Configuration.
let config = {
  curPath: process.cwd(),
  baseTempDir: path.join(os.homedir(), '.bc-ci-install'),
  creds: {
    githubMachineToken: '',
    githubUsername: '',
    githubPassword: ''
  },
  versionPattern: /([0-9]+)(\.([0-9x]+))?(\.([0-9x]+))?(-(([a-z]+)([.-]([0-9]+))?)?)?/,
  incTestConfig: args.incTestConfig,
  verbose: args.verbose,
  installer: args.i,
  reqVersion: args.c
};
config.credsDir = config.baseTempDir + "/creds";
config.credsFile = config.credsDir + '/creds.json';
config.tmpRepoDir = config.baseTempDir + "/repo";

log(config, 3);

// Verify project.
// Verify we are in a project directory...
if (!fsx.existsSync('./web/sites/default/settings.php')) {
  log(chalk.white.bgRed("\nNo `settings.php`, can't continue."));
  log(chalk.white.bgRed("***Are you sure you are in the proper folder?***"));
  return;
}

// Verify .projectconfig.js...
if (!fsx.existsSync('./.projectconfig.js')) {
  log(chalk.white.bgRed("\nNo `.projectconfig.js`, can't continue."));
  log(chalk.white.bgRed("***Are you sure you are in the proper folder?***"));
  return;
}

// Check default config files...

creds.initCreds(config)
  .then((CredsResponse) => {
    // Set credentials from saved information or user prompt.
    config.creds = CredsResponse;

    // Select project and version.
    // @TODO: remove defaults and actually figure this out.
    config.version = args.c;

    // Do IT!!
    let installerModule = '../lib/installers/' + config.installer + '.js';
    log(installerModule, 2);

    try {
      const installer = require(installerModule);
      return installer.install(config);
    }
    catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') {
        log(chalk.red("Installer (" + config.installer + ") does not exist."));
        return { status: "installer_not_found" };
      }

      throw err;
    }
  })
  // Handle Status.
  .then((response) => {

    log(response, 2);

    if (response.status && response.status == "success") {
      log(chalk.green.bold("\n**********\nCONGRATS!! Files installed."));
    }

  })
  .catch((error) => {
    log(error, 2);

    if (error.status && error.status == "user_terminated") {
      log(chalk.red("User Terminated Installation."))
    }

    if (error.status && error.status == "installer_not_found") {
      log(chalk.red("Installer Not Found. Exiting Installation"))
    }

    if (error.status && error.status == "github_error") {
      log(chalk.red(error.msg))
    }
  });
















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


