const { env } = require("process");
const log = require("fancy-log");


require("dotenv").config();
module.exports = (envList) => {
  // TODO get the env key value array and check each env is defined, if not then throw an error depending on the env
  // TODO if the env is defined, then check if it is a valid value

    for (const key in envList) {
      if (env[key] === undefined) {
        log.error(`Env ${key} is not defined.`);
        process.exit(1);
      }
    }
  log("All envs are defined.");
}
