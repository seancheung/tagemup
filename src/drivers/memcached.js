const Promise = require('bluebird');
const Memcached = require('memcached');
const Driver = require('../driver');
const TagSet = require('../tagset');

module.exports = class MemcachedDriver extends Driver {

    /**
     * Creates an instance of MemcachedDriver
     * 
     * @param {{namespace?: String, serializer?: Serializer, driver: { location: String|Array<String>|Object }}} [options] 
     */
    constructor(options) {
        super(options);
        this.memcached = new Memcached(
            options && options.driver && options.driver.location,
            options && options.driver
        );
    }

    /**
     * Retrieve an item from the cache
     * 
     * @param {String} key 
     * @param {TagSet} [tagset] 
     * @returns {Promise<any>}
     * @memberof MemcachedDriver
     */
    get(key, tagset) {
        return new Promise((resolve, reject) => {
            if (tagset instanceof TagSet) {
                key = tagset.ref(key);
            }
            this.memcached.get(key, (err, value) => {
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
     * @memberof MemcachedDriver
     */
    getMany(keys, tagset) {
        return new Promise((resolve, reject) => {
            if (tagset instanceof TagSet) {
                keys = keys.map(key => tagset.ref(key));
            }
            this.memcached.getMulti(keys, (err, values) => {
                if (err) {
                    return reject(err);
                }
                resolve(
                    values &&
                        Object.keys(values).map(key =>
                            this.deserialize(values[key])
                        )
                );
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
     * @memberof MemcachedDriver
     */
    put(key, value, ttl, tagset) {
        return new Promise((resolve, reject) => {
            if (tagset instanceof TagSet) {
                const ref = tagset.ref(key);
                this.getMany(tagset.keys)
                    .then(values => {
                        return Promise.map(values, (value, index) => {
                            if (Array.isArray(value)) {
                                const set = new Set(value);
                                set.add(ref);

                                return this.put(
                                    tagset.keys[index],
                                    Array.from(set),
                                    ttl
                                );
                            }

                            return this.put(tagset.keys[index], [ref], ttl);
                        });
                    })
                    .then(() => {
                        return this.put(ref, value, ttl);
                    })
                    .then(resolve)
                    .catch(reject);
            } else {
                this.memcached.set(key, this.serialize(value), ttl, err => {
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
     * @memberof MemcachedDriver
     */
    putMany(array, ttl, tagset) {
        return Promise.map(array, item =>
            this.put(item.key, item.value, ttl, tagset)
        );
    }

    /**
     * Increase the value of an integer item
     * 
     * @param {String} key 
     * @param {Number} [amount] 
     * @param {TagSet} [tagset] 
     * @returns {Promise<Number>}
     * @memberof MemcachedDriver
     */
    increment(key, amount, tagset) {
        return new Promise((resolve, reject) => {
            if (tagset instanceof TagSet) {
                key = tagset.ref(key);
            }
            this.memcached.get(key, (err, value) => {
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
                this.memcached.set(key, this.serialize(value), 0, err => {
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
     * @memberof MemcachedDriver
     */
    decrement(key, amount, tagset) {
        return new Promise((resolve, reject) => {
            if (tagset instanceof TagSet) {
                key = tagset.ref(key);
            }
            this.memcached.get(key, (err, value) => {
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
                this.memcached.set(key, this.serialize(value), 0, err => {
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
     * @memberof MemcachedDriver
     */
    forever(key, value, tagset) {
        return this.put(key, value, 0, tagset);
    }

    /**
     *  Remove an item from the cache 
     * 
     * @param {String} key 
     * @param {TagSet} [tagset] 
     * @returns {Promise<void>}
     * @memberof MemcachedDriver
     */
    forget(key, tagset) {
        return new Promise((resolve, reject) => {
            if (tagset instanceof TagSet) {
                const ref = tagset.ref(key);
                this.getMany(tagset.keys)
                    .then(values => {
                        return Promise.map(values, (value, index) => {
                            if (Array.isArray(value)) {
                                const set = new Set(value);
                                set.delete(ref);

                                if (set.size === 0) {
                                    return this.forget(tagset.keys[index]);
                                }

                                return this.put(
                                    tagset.keys[index],
                                    Array.from(set),
                                    0
                                );
                            }

                            return this.forget(tagset.keys[index]);
                        });
                    })
                    .then(() => {
                        return this.forget(ref);
                    })
                    .then(resolve)
                    .catch(reject);
            } else {
                this.memcached.del(key, err => {
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
     * @memberof MemcachedDriver
     */
    flush(tagset) {
        return new Promise((resolve, reject) => {
            if (tagset instanceof TagSet) {
                this.getMany(tagset.keys)
                    .then(values => {
                        return Promise.map(values, (value, index) => {
                            const promises = [this.forget(tagset.keys[index])];
                            if (Array.isArray(value)) {
                                promises.push(
                                    Promise.map(value, key => this.forget(key))
                                );
                            }

                            return Promise.all(promises);
                        });
                    })
                    .then(resolve)
                    .catch(reject);
            } else {
                this.memcached.flush((err, result) => {
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
     * @memberof MemcachedDriver
     */
    has(key, tagset) {
        return new Promise((resolve, reject) => {
            if (tagset instanceof TagSet) {
                key = tagset.ref(key);
            }
            this.memcached.get(key, (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data !== undefined);
            });
        });
    }

    /**
     * Dispose connection
     * 
     * @returns {Promise<void>}
     * @memberof MemcachedDriver
     */
    dispose() {
        return Promise.try(() => {
            this.memcached.end();
            delete this.memcached;
        });
    }

};
