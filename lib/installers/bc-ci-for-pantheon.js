const qoa = require('qoa');

let Logger = require('../../lib/logger.js');
const chalk = require('chalk');

const fsx = require('fs-extra');

const dlrepo = require('download-git-repo');


// Installer specific
const repo = "bc-ci-for-pantheon";

module.exports.install = (config) => {

  let logger = new Logger(config.verbose);
  let log = logger.log;

  return new Promise((resolve, reject) => {
    log("\nBegining installation...");

    let continuePromtp = [
      {
        type: 'confirm',
        query: 'Are you sure you want to overwrite your ci configuration?',
        handle: 'continue',
        accept: 'Yes',
        deny: 'n'
      }
    ];

    log("");

    return qoa.prompt(continuePromtp).then((response) => {
      log("");

      if (response.continue) {
        log(chalk.yellow("Continueing..."), 1);

        // Remove contents and cereate directory.
        log(chalk.yellow("Preparing repo directory..."), 1);
        fsx.emptydirSync(config.tmpRepoDir);

        // Download repo
        return dlrepo('bluecadet/' + repo + '#' + config.version, `${config.tmpRepoDir}`, { clone: true }, err => {
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

module.exports.getPossibleVersions = (config) => {

  return [];
}
