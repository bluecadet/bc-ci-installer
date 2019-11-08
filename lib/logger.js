
// let log = console.log

// let config;

function Logger(config) {
  this.verboseLvl = config;

  this.log = (message, lvl=0) => {
    // console.log(message, lvl, this.verboseLvl);

    if (lvl <= this.verboseLvl) {
      console.log(message);
    }
  }
}

// module.exports.setlevel = function (lvl) {
//   config = config;

//   return this;
// }

module.exports = Logger;

// module.exports.log = (message, lvl) => {
//   console.log(message, lvl, config);
// }
