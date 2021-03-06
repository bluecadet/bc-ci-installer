const qoa = require('qoa');

let Logger = require('../../lib/logger.js');
const chalk = require('chalk');

let BcCiInstallerError = require('../BcCiInstallerError.js');

const fsx = require('fs-extra');

const dlrepo = require('download-git-repo');
const GitHub = require('github-api');
const semver = require('semver')


// Installer specific
const repo = "bc-ci-for-pantheon";


module.exports.install = (config) => {

  let logger = new Logger(config.verbose);
  let log = logger.log;

  return new Promise((resolve, reject) => {
    log("\nBegining installation...");

    // Figure out Version.
    log(chalk.yellow("Figure out Version from " + config.reqVersion));

    resolve(getPossibleVersions(config));
  })
    .then((possibleVersions) => {

      log(possibleVersions, 3);
      let found = true;

      if (possibleVersions.tags) {
        let i = 0;
        while (found === true) {
          if (possibleVersions.tags[i] !== undefined) {
            log(possibleVersions.tags[i], 3);
            if (semver.satisfies(possibleVersions.tags[i], config.reqVersion)) {
              log(chalk.yellow("Found version: " + possibleVersions.tags[i]), 2);
              found = possibleVersions.tags[i];
            }
          }
          else {
            log(chalk.red("END LOOP"), 1);
            found = false;
          }
          i++;
        }
      } else if (possibleVersions.branch) {

        log(chalk.yellow("Found branch: " + possibleVersions.branch), 2);
        found = possibleVersions.branch;
      }

      log(found, 3);

      if (!found) {
        throw new BcCiInstallerError("No version found", 'no_version_found');
      }

      config.installVersion = found;

      let contStr = chalk.blue('\nInstall version ' + config.installVersion ) + "\nAre you sure you want to overwrite your ci configuration?";
      let continuePrompt = [
        {
          type: 'confirm',
          query: contStr,
          handle: 'continue',
          accept: 'Yes',
          deny: 'n'
        }
      ];

      return qoa.prompt(continuePrompt);
    })
    .then((response) => {
      log("\n");

      if (!response.continue) {
        throw new BcCiInstallerError("User Terminated", 'user_terminated');
      }

      log(chalk.yellow("Continueing..."), 1);

      // Remove contents and cereate directory.
      log(chalk.yellow("Preparing repo directory..."), 1);
      fsx.emptydirSync(config.tmpRepoDir);

      // Download repo
      log(chalk.yellow("Repo: bluecadet/" + repo + '#' + config.installVersion), 1);

      return new Promise((resolve, reject) => {
        let dl = 'bluecadet/' + repo + '#' + config.installVersion;
        log(dl, 1);

        dlrepo(dl, `${config.tmpRepoDir}`, { clone: true }, err => {
          if (err) {
            log(chalk.red(`ERROR @ downloading repo`));
            // throw Error(err);
            reject();
          }

          resolve();
        });

      }).then(() => { return [] });
    })
    .then(() => {

      // Copy .ci folders
      log(chalk.yellow("Preparing to sync .ci folders..."), 1);
      if (fsx.existsSync('./.ci')) {
        fsx.emptydirSync('./.ci');
        fsx.removeSync('./.ci');
        log(chalk.green("Cleaned out .ci directory."));
      }
      if (fsx.existsSync('./.circleci')) {
        fsx.emptydirSync('./.circleci');
        fsx.removeSync('./.circleci');
        log(chalk.green("Cleaned out .circleci directory."));
      }
      fsx.copySync(config.tmpRepoDir + '/build/.ci', './.ci');
      fsx.copySync(config.tmpRepoDir + '/build/.circleci', './.circleci');

      // Copy tests config if needed.
      if (config.incTestConfig) {
        log(chalk.yellow("Preparing Test config files..."), 1);
        fsx.copySync(config.tmpRepoDir + '/build/tests', './tests');
        log(chalk.green("Finished copying test default config files."));
      }
      else {
        log(chalk.yellow("Not copying any test config files."));
        log(chalk.white("-- Re-run command with the `--incTestConfig` option if you wanted to.\n"));
      }

      // Clean up directories.
      log(chalk.yellow("Cleaning up..."), 1);
      if (fsx.existsSync(config.tmpRepoDir)) {
        fsx.emptydirSync(config.tmpRepoDir);
        fsx.removeSync(config.tmpRepoDir);
        log(chalk.green("Tmp Repo Directory cleaned up."));
      }

      return {status: "success"}
    })
    .catch((error) => {
      log("Error in Main bc-ci-for-pantheon", 1);
      log(error, 1);

      if (error.request && error.response.status == 401) {
        throw new BcCiInstallerError("Github error: " + error.response.data.message, 'github_error');
      }

      throw error;
    });
}

function getPossibleVersions (config) {

  // Basic Auth
  let gh;
  if (config.creds.githubMachineToken) {
    gh = new GitHub({
      token: config.creds.githubMachineToken
    });
  } else {
    gh = new GitHub({
      username: config.creds.githubUsername,
      password: config.creds.githubPassword
    });
  }

  let repoObj = gh.getRepo('bluecadet', repo);

  let githubTags = [];
  let tagPromise = repoObj.listTags().then(function ({ data }) {
    githubTags = data.map(x => semver.clean(x.name));
  });

  let githubBranches = [];
  let branchPromise = repoObj.listBranches().then(function ({ data }) {
    data.forEach(el => {
      if (el.name !== "master") {
        githubBranches.push(el.name);
      }
    });
  });


  return Promise.all([tagPromise, branchPromise]).then(function () {

    let branchPattern = /(.*)-latest$/;
    let matches = config.reqVersion.match(branchPattern);
    log(matches, 1);

    if (matches && matches[1]) {
      return { branch: matches[1]};
    }
    else {
      let allVersions = githubTags;

      allVersions.sort((a, b) => {
        return semver.rcompare(a, b);
      });

      return { tags: allVersions };
    }
  });
}
