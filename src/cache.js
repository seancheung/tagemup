const Promise = require('bluebird');
const Driver = require('./driver');
const TagSet = require('./tagset');

module.exports = class Cache {

    /**
     * Creates an instance of Cache
     * 
     * @param {{driver: Driver, ttl?: Number, tags?: Array<String>, debug?: Function}} [options] 
     * @memberof Cache
     */
    constructor(options) {
        if (options) {
            const { driver, ttl, tags } = options;
            if (driver && !(driver instanceof Driver)) {
                throw new Error('Invalid driver');
            }
            this.driver = driver;
            this.ttl = ttl || 3600;
            if (tags) {
                if (tags instanceof TagSet) {
                    this.tagset = tags;
                } else if (typeof tags === 'string') {
                    this.tagset = new TagSet(tags);
                } else if (Array.isArray(tags)) {
                    this.tagset = new TagSet(...tags);
                }
            }
            if (options.debug) {
                this.debugger = options.debug;
            }
        }
    }

    debug(method, key, info) {
        if (this.debugger) {
            let log = '';
            if (this.tagset) {
                log += `[${this.tagset.names.join()}]`;
            }
            log += `${method}`;
            if (key) {
                log += `(${key})`;
            }
            if (info) {
                log += `: ${info}`;
            }
            this.debugger(log);
        }
    }

    /**
     * Retrieve an item from the cache
     * 
     * @param {String} key 
     * @param {any}  [fallback]
     * @returns {Promise<any>}
     * @memberof Cache
     */
    get(key, fallback) {
        if (!this.driver) {
            return Promise.resolve(
                typeof fallback === 'function' ? fallback() : fallback
            );
        }

        this.debug('get', key);

        return this.driver.get(key, this.tagset).then(value => {
            if (!value) {
                this.debug('get', key, 'fallback');

                if (typeof fallback === 'function') {
                    return fallback();
                }

                return fallback;
            }

            return value;
        });
    }

    /**
     * Determine if an item exists in the cache
     * 
     * @param {String} key 
     * @returns {Promise<Boolean>}
     * @memberof Cache
     */
    has(key) {
        if (!this.driver) {
            return Promise.resolve(false);
        }

        this.debug('has', key);

        return this.driver.has(key, this.tagset);
    }

    /**
     * Increase the value of an integer item
     * 
     * @param {String} key 
     * @param {Number} [amount=1] 
     * @returns {Promise<Number>}
     * @memberof Cache
     */
    increment(key, amount = 1) {
        if (!this.driver) {
            return Promise.resolve(amount);
        }

        this.debug('increment', key, amount);

        return this.driver.increment(key, amount || 1, this.tagset);
    }

    /**
     * Decrease the value of an integer item
     * 
     * @param {String} key 
     * @param {Number} [amount=1] 
     * @returns {Promise<Number>}
     * @memberof Cache
     */
    decrement(key, amount) {
        if (!this.driver) {
            return Promise.resolve(-amount);
        }

        this.debug('decrement', key, amount);

        return this.driver.decrement(key, amount || 1, this.tagset);
    }

    /**
     * Retrieve an item from the cache or, if it doesn't exist, resolve the func and add its return value to the cache
     * 
     * @param {String} key 
     * @param {Function} func 
     * @param {Number} [ttl] 
     * @returns {Promise<any>}
     * @memberof Cache
     */
    remember(key, func, ttl) {
        if (!this.driver) {
            return Promise.resolve(func());
        }

        this.debug('remember', key);

        return this.driver.get(key, this.tagset).then(value => {
            if (!value) {
                this.debug('remember', key, 'callback');

                return Promise.resolve(func()).then(result => {
                    if (result !== undefined) {
                        return this.driver
                            .put(key, result, ttl || this.ttl, this.tagset)
                            .then(() => result);
                    }

                    return result;
                });
            }

            return value;
        });
    }

    /**
     * Retrieve an item from the cache and then delete the item
     * 
     * @param {String} key 
     * @returns {Promise<any>}
     * @memberof Cache
     */
    pull(key) {
        if (!this.driver) {
            return Promise.resolve();
        }
        this.debug('pull', key);

        return this.driver.get(key, this.tagset).then(value => {
            return this.driver.forget(key, this.tagset).then(() => value);
        });
    }

    /**
     * Store an item in the cache
     * 
     * @param {String} key 
     * @param {any} value 
     * @param {Number} [ttl] 
     * @returns {Promise<void>}
     * @memberof Cache
     */
    put(key, value, ttl) {
        if (!this.driver) {
            return Promise.resolve();
        }

        if (Array.isArray(key)) {
            this.debug('put', key.join());

            return this.driver.putMany(key, value, this.tagset);
        }
        this.debug('put', key);

        return this.driver.put(key, value, ttl || this.ttl, this.tagset);
    }

    /**
     * Add the item to the cache if it does not already exist.
     * The method will return true if the item is actually added to the cache
     * 
     * @param {String} key 
     * @param {any} value 
     * @param {Number} [ttl] 
     * @returns {Promise<Boolean>}
     * @memberof Cache
     */
    add(key, value, ttl) {
        if (!this.driver) {
            return Promise.resolve(false);
        }

        this.debug('add', key);

        this.driver.has(key, this.tagset).then(exists => {
            if (!exists) {
                return this.driver
                    .put(key, value, ttl || this.ttl, this.tagset)
                    .then(() => true);
            }

            this.debug('add', key, 'exists');

            return false;
        });
    }

    /**
     * Store an item in the cache permanently.
     * It must be manually removed from the cache using the 'forget' method
     * 
     * @param {String} key 
     * @param {any} value 
     * @returns {Promise<void>}
     * @memberof Cache
     */
    forever(key, value) {
        if (!this.driver) {
            return Promise.resolve();
        }

        this.debug('forever', key);

        return this.driver.forever(key, value, this.tagset);
    }

    /**
     *  Remove an item from the cache 
     * 
     * @param {String} key 
     * @returns {Promise<void>}
     * @memberof Cache
     */
    forget(key) {
        if (!this.driver) {
            return Promise.resolve();
        }

        this.debug('forget', key);

        return this.driver.forget(key, this.tagset);
    }

    /**
     * Clear the entire cache 
     * 
     * @returns {Promise<void>}
     * @memberof Cache
     */
    flush() {
        if (!this.driver) {
            return Promise.resolve();
        }

        this.debug('flush');

        return this.driver.flush(this.tagset);
    }

    /**
     * Tags allow you to tag related items in the cache and then flush all cached values that have been assigned a given tag
     * 
     * @param {Array<String>} tags 
     * @returns {Cache}
     * @memberof Cache
     */
    tags(...tags) {
        return new Cache({
            driver: this.driver,
            ttl: this.ttl,
            tags,
            debug: this.debugger
        });
    }

    /**
     * Dispose driver connections
     * 
     * @returns {Promise<void>}
     * @memberof Cache
     */
    dispose() {
        if (!this.driver) {
            return Promise.resolve();
        }

        return this.driver.dispose().then(() => delete this.driver);
    }

};
