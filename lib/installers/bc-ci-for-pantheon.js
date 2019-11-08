const qoa = require('qoa');

const chalk = require('chalk');
const log = console.log;

const fsx = require('fs-extra');

const dlrepo = require('download-git-repo');


// Installer specific
const repo = "bc-ci-for-pantheon";

module.exports.install = (config) => {

  return new Promise((resolve, reject) => {
    log("\nBegining installation...");
    log(config);

    log(config.tmpRepoDir);

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
      log(response);

      if (response.continue) {
        log(chalk.yellow("Continueing..."));

        // Remove contents and cereate directory.
        log(chalk.yellow("Preparing repo directory..."));
        fsx.emptydirSync(config.tmpRepoDir);

        // Download repo
        return dlrepo('bluecadet/' + repo + '#' + config.version, `${config.tmpRepoDir}`, { clone: true }, err => {
          if (err) {
            log(chalk.red(`ERROR @ downloading repo`));
            throw Error(err);
          }

          // Copy .ci folders
          log(chalk.yellow("Preparing to sync .ci folders..."));
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
          if (config.installTestConfig) {
            log(chalk.yellow("Preparing Test config files..."));
            fsx.copySync(config.tmpRepoDir + '/build/tests', './tests');
            log(chalk.green("Finished copying test default config files."));
          }
          else {
            log(chalk.yellow("Not copying any test config files..."));
          }

          // Clean up directories.
          log(chalk.yellow("Cleaning up..."));
          if (fsx.existsSync(config.tmpRepoDir)) {
            fsx.emptydirSync(config.tmpRepoDir);
            fsx.removeSync(config.tmpRepoDir);
            log(chalk.green("Repo Directory cleaned up."));
          }

          resolve({ status: "finished" });
          return ;
        });

      }

      console.log(chalk.red("Installer terminated."));
      resolve({ status: "user_terminated" });
      return response;

    });

  });
}


module.exports.getPossibleVersions = (config) => {

  return [];
}
