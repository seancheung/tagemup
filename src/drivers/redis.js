const Promise = require('bluebird');
const { RedisClient } = require('redis');
const Driver = require('../driver');
const TagSet = require('../tagset');

module.exports = class RedisDriver extends Driver {

    /**
     * Creates an instance of RedisDriver
     * 
     * @param {{namespace?: String, serializer?: Serializer, driver: {host: String, port: Number, prefix?: String}}} [options] 
     */
    constructor(options) {
        if (options) {
            if (options.namespace && options.driver) {
                options.driver.prefix = options.namespace;
            } else if (options.driver && !options.namespace) {
                options.namespace = options.driver.prefix;
            }
        }
        super(options);
        this.redis = new RedisClient(options && options.driver);
    }

    /**
     * Retrieve an item from the cache
     * 
     * @param {String} key 
     * @param {TagSet} [tagset] 
     * @returns {Promise<any>}
     * @memberof RedisDriver
     */
    get(key, tagset) {
        return new Promise((resolve, reject) => {
            if (tagset instanceof TagSet) {
                key = tagset.ref(key);
            }
            this.redis.get(key, (err, value) => {
                if (err) {
                    return reject(err);
                }
                resolve(this.deserialize(value));
            });
        });
    }

    /**
     * Retrieve items from the cache
     * 
     * @param {Array<String>} keys
     * @param {TagSet} [tagset] 
     * @returns {Promise<Array<any>>}
     * @memberof RedisDriver
     */
    getMany(keys, tagset) {
        return new Promise((resolve, reject) => {
            if (tagset instanceof TagSet) {
                keys = keys.map(key => tagset.ref(key));
            }
            this.redis.mget(keys, (err, values) => {
                if (err) {
                    return reject(err);
                }
                resolve(values && values.map(value => this.deserialize(value)));
            });
        });
    }

    /**
     * Store an item in the cache
     * 
     * @param {String} key 
     * @param {any} value 
     * @param {Number} ttl 
     * @param {TagSet} [tagset] 
     * @returns {Promise<void>}
     * @memberof RedisDriver
     */
    put(key, value, ttl, tagset) {
        return new Promise((resolve, reject) => {
            if (tagset instanceof TagSet) {
                const multi = this.redis.multi();
                const ref = tagset.ref(key);
                tagset.keys.forEach(k => multi.sadd(k, ref));
                multi.set(ref, this.serialize(value), 'EX', ttl);
                multi.exec(err => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            } else {
                this.redis.set(key, this.serialize(value), 'EX', ttl, err => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            }
        });
    }

    /**
     * Store items in the cache
     * 
     * @param {Array<{key:String, value:any}>} array 
     * @param {Number} ttl 
     * @param {TagSet} [tagset] 
     * @returns {Promise<void>}
     * @memberof RedisDriver
     */
    putMany(array, ttl, tagset) {
        return new Promise((resolve, reject) => {
            const multi = this.redis.multi();
            if (tagset instanceof TagSet) {
                array.forEach(item => {
                    const ref = tagset.ref(item.key);
                    tagset.keys.forEach(k => multi.sadd(k, ref));
                    multi.set(ref, this.serialize(item.value), 'EX', ttl);
                });
            } else {
                array.forEach(item =>
                    multi.set(item.key, this.serialize(item.value), 'EX', ttl)
                );
            }
            multi.exec(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }

    /**
     * Increase the value of an integer item
     * 
     * @param {String} key 
     * @param {Number} [amount] 
     * @param {TagSet} [tagset] 
     * @returns {Promise<Number>}
     * @memberof RedisDriver
     */
    increment(key, amount, tagset) {
        return new Promise((resolve, reject) => {
            if (tagset instanceof TagSet) {
                key = tagset.ref(key);
            }
            this.redis.get(key, (err, value) => {
                if (err) {
                    return reject(err);
                }
                if (value == undefined) {
                    value = 0;
                } else {
                    value = this.deserialize(value);
                }
                if (Number.isNaN(value)) {
                    return reject(
                        new Error('cannont increase a non-number value')
                    );
                }
                value += amount;
                this.redis.set(key, this.serialize(value), err => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(value);
                });
            });
        });
    }

    /**
     * Decrease the value of an integer item
     * 
     * @param {String} key 
     * @param {Number} [amount] 
     * @param {TagSet} [tagset] 
     * @returns {Promise<Number>}
     * @memberof RedisDriver
     */
    decrement(key, amount, tagset) {
        return new Promise((resolve, reject) => {
            if (tagset instanceof TagSet) {
                key = tagset.ref(key);
            }
            this.redis.get(key, (err, value) => {
                if (err) {
                    return reject(err);
                }
                if (value == undefined) {
                    value = 0;
                } else {
                    value = this.deserialize(value);
                }
                if (Number.isNaN(value)) {
                    return reject(
                        new Error('cannont decrease a non-number value')
                    );
                }
                value -= amount;
                this.redis.set(key, this.serialize(value), err => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(value);
                });
            });
        });
    }

    /**
     * Store an item in the cache permanently.
     * It must be manually removed from the cache using the 'forget' method
     * 
     * @param {String} key 
     * @param {any} value 
     * @param {TagSet} [tagset] 
     * @returns {Promise<void>}
     * @memberof RedisDriver
     */
    forever(key, value, tagset) {
        return new Promise((resolve, reject) => {
            if (tagset instanceof TagSet) {
                const multi = this.redis.multi();
                const ref = tagset.ref(key);
                tagset.keys.forEach(k => multi.sadd(k, ref));
                multi.set(ref, this.serialize(value));
                multi.exec(err => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            } else {
                this.redis.set(key, this.serialize(value), err => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            }
        });
    }

    /**
     *  Remove an item from the cache 
     * 
     * @param {String} key 
     * @param {TagSet} [tagset] 
     * @returns {Promise<void>}
     * @memberof RedisDriver
     */
    forget(key, tagset) {
        return new Promise((resolve, reject) => {
            if (tagset instanceof TagSet) {
                const multi = this.redis.multi();
                const ref = tagset.ref(key);
                tagset.keys.forEach(k => multi.srem(k, ref));
                multi.del(ref);
                multi.exec(err => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            } else {
                this.redis.del(key, err => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            }
        });
    }

    /**
     * Clear the entire cache 
     * 
     * @param {TagSet} [tagset] 
     * @returns {Promise<void>}
     * @memberof RedisDriver
     */
    flush(tagset) {
        return new Promise((resolve, reject) => {
            if (tagset instanceof TagSet) {
                this.redis.eval(
                    'local refs = redis.call("SUNION", unpack(KEYS)); local t = {}; for i,v in ipairs(KEYS) do table.insert(t, v) end; for i,v in ipairs(refs) do table.insert(t, ARGV[1]..v) end; return redis.call("DEL", unpack(t))',
                    tagset.keys.length,
                    ...tagset.keys,
                    this.namespace || '',
                    (err, result) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(result);
                    }
                );
            } else {
                this.redis.flushall((err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(result);
                });
            }
        });
    }

    /**
     * Determine if an item exists in the cache
     * 
     * @param {String} key 
     * @param {TagSet} [tagset] 
     * @returns {Promise<Boolean>}
     * @memberof RedisDriver
     */
    has(key, tagset) {
        return new Promise((resolve, reject) => {
            if (tagset instanceof TagSet) {
                key = tagset.ref(key);
            }
            this.redis.exists(key, (err, exists) => {
                if (err) {
                    return reject(err);
                }
                resolve(exists);
            });
        });
    }

    /**
     * Dispose connection
     * 
     * @returns {Promise<void>}
     * @memberof RedisDriver
     */
    dispose() {
        return new Promise((resolve, reject) => {
            this.redis.quit(err => {
                if (err) {
                    reject(err);
                } else {
                    delete this.redis;
                    resolve();
                }
            });
        });
    }

};
