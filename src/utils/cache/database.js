const { Schema, Model } = require("mongoose");
const { redisClient } = require("../../Bot");
const { debugMsg } = require("../TinyUtils");
const env = require("../FetchEnvs")();

const ONE_HOUR = 1 * 60 * 60; // Redis uses seconds.

class Database {
  // constructor() {

  // }

  /**
   *
   * @param {Schema} schema
   * @param {Map} model
   * @param {boolean} [saveNull=false] - Optional, save null values to cache
   */
  async findOne(schema, model, saveNull = false) {
    var start = env.DEBUG_LOG ? Date.now() : undefined;
    if (!schema || !model) {
      throw new Error("Missing schema or model");
    }
    const mongoKey = Object.keys(model)[0];
    const redisKey = schema.modelName + ":" + mongoKey + ":" + model[mongoKey];
    debugMsg(`Key: ${mongoKey} -> ${redisKey}`);
    // The value of this map is the key for redis because it's unique

    debugMsg(`Fetching from cache: ${redisKey}`);
    var data = await redisClient.get(redisKey);

    if (!data) {
      debugMsg(`Cache miss fetching db:`);
      debugMsg(model);
      data = await schema.findOne(model);
      if (!data) {
        debugMsg(`Database miss no data found`);
        if (!saveNull) return null;
      }
      await redisClient.set(redisKey, JSON.stringify(data));
      await redisClient.expire(redisKey, ONE_HOUR);
      if (env.DEBUG_LOG) debugMsg(`Time taken: ${Date.now() - start}ms`);
      return data;
    }

    debugMsg(`Cache hit: ${redisKey} -> ${data}`);
    if (env.DEBUG_LOG) debugMsg(`Time taken: ${Date.now() - start}ms`);
    return JSON.parse(data);
  }

  /**
   *
   * @param {Schema} schema
   * @param {Map} model
   * @param {Map} object
   * @param {QueryOptions} [options={ upsert: true, new: true }] - Optional parameter with default value
   */
  async findOneAndUpdate(
    schema,
    model,
    object,
    options = {
      upsert: true,
      new: true,
    }
  ) {
    var start = env.DEBUG_LOG ? Date.now() : undefined;
    if (!schema || !model) {
      throw new Error("Missing schema or model");
    }
    const mongoKey = Object.keys(model)[0];
    const redisKey = schema.modelName + ":" + mongoKey + ":" + model[mongoKey];

    await schema.findOneAndUpdate(model, object, options);
    await redisClient.set(redisKey, JSON.stringify(object));
    await redisClient.expire(redisKey, ONE_HOUR);

    if (env.DEBUG_LOG) debugMsg(`Time taken: ${Date.now() - start}ms`);
    debugMsg(`Updated key: ${mongoKey} -> ${redisKey}`);
  }

  /**
   *
   * @param {Schema} schema
   * @param {Map} model
   */
  async deleteOne(schema, model) {
    var start = env.DEBUG_LOG ? Date.now() : undefined;
    if (!schema || !model) {
      throw new Error("Missing schema or model");
    }
    const mongoKey = Object.keys(model)[0];
    const redisKey = schema.modelName + ":" + mongoKey + ":" + model[mongoKey];
    debugMsg(`Deleting key: ${mongoKey} -> ${redisKey}`);

    await redisClient.del(redisKey);
    await schema.deleteOne(model);
    if (env.DEBUG_LOG) debugMsg(`Time taken: ${Date.now() - start}ms`);
  }
}

module.exports = { Database };
