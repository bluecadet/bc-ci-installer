const qoa = require('qoa');

let Logger = require('../../lib/logger.js');
const chalk = require('chalk');

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

    return getPossibleVersions(config)
      .then((response) => {
        log(response, 3);

        let found = true;
        let i = 0;
        while (found === true) {
          if (response[i] !== undefined) {
            if (semver.satisfies(response[i], config.reqVersion)) {
              log(chalk.yellow("Found version: " + response[i]), 2);
              found = response[i];
            }
          }
          else {
            log(chalk.red("Found version: " + response[i]), 1);
            found = false;
          }
          i++;
        }

        log(found, 3);

        if (!found) {
          resolve({ status: "no_version_found" });
          return;
        }

        config.installVersion = found;

        let contStr = 'Install version ' + config.installVersion + "\nAre you sure you want to overwrite your ci configuration?";

        let continuePrompt = [
          {
            type: 'confirm',
            query: contStr,
            handle: 'continue',
            accept: 'Yes',
            deny: 'n'
          }
        ];

        log("");

        return qoa.prompt(continuePrompt);
      })
      .then((response) => {
        log("");

        if (response.continue) {
          log(chalk.yellow("Continueing..."), 1);

          // Remove contents and cereate directory.
          log(chalk.yellow("Preparing repo directory..."), 1);
          fsx.emptydirSync(config.tmpRepoDir);

          // Download repo
          log(chalk.yellow("Repo: bluecadet/" + repo + '#' + config.installVersion), 1);
          return dlrepo('bluecadet/' + repo + '#' + config.installVersion, `${config.tmpRepoDir}`, { clone: true }, err => {
            if (err) {
              log(chalk.red(`ERROR @ downloading repo`));
              throw Error(err);
            }

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

            resolve({ status: "finished" });
            return ;
          });

        }

        log(chalk.red("Installer terminated."), 1);
        resolve({ status: "user_terminated" });
        return response;

      });

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
    // let allVersions = [...githubTags, ...githubBranches];
    let allVersions = githubTags;

    allVersions.sort((a, b) => {
      return semver.rcompare(a, b);
    });

    return allVersions;
  });
}
