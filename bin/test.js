#!/usr/bin/env node

console.log("Hello");

const args = require('yargs')
  .boolean('r')
  .default('r', false)
  .boolean('r2')
  .default('r2', false)
  .default('t', 0)
  .argv;

console.log(args);

function testFuncs(args) {
  return new Promise((resolve, reject) => {
    resolve( args );
  })
    .then((args) => {

      if (args.t == 1) {
        resolve("1");
      }

      return args;
    })
    .then((args) => {

      if (args.t == 2) {
        resolve("2");
      }

      return args;
    })
    .then((args) => {

      if (args.t == 3) {
        resolve("3");
      }

      return args;
    })
    .then((args) => {
      console.log("fell through");
      return args;
    });
}

let maya = testFuncs(args);

Promise.all([maya]).then(function (values) {
  console.log("All values:");
  console.log(values);
});




function testPromiseChain(err, err2) {
  return new Promise((resolve, reject) => {
    if (err) {
      reject("this is a rejection.");
    }
    else {
      resolve("this is a resolve.");
    }
  })
  .then((response) => {
    console.log("r: ", response);

    return chain2();
  });
}

function chain2() {
  console.log("chain2");
  return new Promise((resolve, reject) => {
    resolve({bob: "bob"});
  });
}

// let fred = testPromiseChain(args.r, args.r2)
//   .then((response) => {
//     console.log("then1");
//     console.log(response);

//     return response;
//   })
//   .then((response) => {
//     console.log("then2");
//     console.log(response);
//   })
//   .catch((error) => {
//     console.log("catch1");
//     console.log(error);
//   });

// Promise.all([fred]).then(function (values) {
//   console.log(values);
// });
