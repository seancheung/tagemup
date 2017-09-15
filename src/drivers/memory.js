const Promise = require('bluebird');
const Driver = require('../driver');
const TagSet = require('../tagset');

module.exports = class MemoryDriver extends Driver {

    /**
     * Creates an instance of MemoryDriver
     * 
     * @param {{namespace?: String, serializer?: Serializer, driver: {interval?: Number}}} [options] 
     */
    constructor(options) {
        super(options);
        this.memory = {};
        this.ttl = [];
        this.timer = setInterval(
            this.tick.bind(this),
            (options && options.driver && options.driver.interval) || 1000
        );
    }

    tick() {
        let i = this.ttl.length;
        while (i--) {
            if (this.ttl[i].ttl <= 0) {
                delete this.memory[this.ttl[i].key];
                this.ttl.splice(i, 1);
            } else {
                this.ttl[i].ttl--;
            }
        }
    }

    /**
     * Retrieve an item from the cache
     * 
     * @param {String} key 
     * @param {TagSet} [tagset] 
     * @returns {Promise<any>}
     * @memberof MemoryDriver
     */
    get(key, tagset) {
        if (tagset instanceof TagSet) {
            key = tagset.ref(key);
        }

        return Promise.resolve(this.deserialize(this.memory[key]));
    }

    /**
     * Retrieve items from the cache
     * 
     * @param {Array<String>} keys
     * @param {TagSet} [tagset] 
     * @returns {Promise<Array<any>>}
     * @memberof MemoryDriver
     */
    getMany(keys, tagset) {
        if (tagset instanceof TagSet) {
            keys = keys.map(key => tagset.ref(key));
        }

        return Promise.map(keys, key => this.deserialize(this.memory[key]));
    }

    /**
     * Store an item in the cache
     * 
     * @param {String} key 
     * @param {any} value 
     * @param {Number} ttl 
     * @param {TagSet} [tagset] 
     * @returns {Promise<void>}
     * @memberof MemoryDriver
     */
    put(key, value, ttl, tagset) {
        return Promise.try(() => {
            if (tagset instanceof TagSet) {
                const ref = tagset.ref(key);
                tagset.keys.forEach(k => {
                    if (!this.memory[k]) {
                        this.memory[k] = [];
                    }
                    if (this.memory[k].indexOf(ref) < 0) {
                        this.memory[k].push(ref);
                    }
                });
                key = ref;
            }
            this.memory[key] = this.serialize(value);
            if (ttl) {
                this.ttl.push({ key: key, ttl });
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
     * @memberof MemoryDriver
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
     * @memberof MemoryDriver
     */
    increment(key, amount, tagset) {
        return Promise.try(() => {
            if (tagset instanceof TagSet) {
                key = tagset.ref(key);
            }
            let value = this.deserialize(this.memory[key]);
            if (typeof value === undefined) {
                value = 0;
            }
            if (typeof value === 'number') {
                value += amount;
                this.memory[key] = this.serialize(value);
            } else {
                throw new Error('cannot increase a non-number value');
            }

            return value;
        });
    }

    /**
     * Decrease the value of an integer item
     * 
     * @param {String} key 
     * @param {Number} [amount] 
     * @param {TagSet} [tagset] 
     * @returns {Promise<Number>}
     * @memberof MemoryDriver
     */
    decrement(key, amount, tagset) {
        return Promise.try(() => {
            if (tagset instanceof TagSet) {
                key = tagset.ref(key);
            }
            let value = this.deserialize(this.memory[key]);
            if (typeof value === undefined) {
                value = 0;
            }
            if (typeof value === 'number') {
                value -= amount;
                this.memory[key] = this.serialize(value);
            } else {
                throw new Error('cannot decrease a non-number value');
            }

            return value;
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
     * @memberof MemoryDriver
     */
    forever(key, value, tagset) {
        return this.put(key, this.serialize(value), undefined, tagset);
    }

    /**
     *  Remove an item from the cache 
     * 
     * @param {String} key 
     * @param {TagSet} [tagset] 
     * @returns {Promise<void>}
     * @memberof MemoryDriver
     */
    forget(key, tagset) {
        return Promise.try(() => {
            if (tagset instanceof TagSet) {
                const ref = tagset.ref(key);
                tagset.keys.forEach(k => {
                    if (this.memory[k]) {
                        const i = this.memory[k].indexOf(ref);
                        if (i >= 0) {
                            this.memory[k].splice(i, 1);
                        }
                    }
                });
                key = ref;
            }
            delete this.memory[key];
            const index = this.ttl.findIndex(t => t.key === key);
            if (index >= 0) {
                this.ttl.splice(index, 1);
            }
        });
    }

    /**
     * Clear the entire cache 
     * 
     * @param {TagSet} [tagset] 
     * @returns {Promise<void>}
     * @memberof MemoryDriver
     */
    flush(tagset) {
        return Promise.try(() => {
            if (tagset instanceof TagSet) {
                tagset.keys.forEach(k => {
                    if (this.memory[k]) {
                        this.memory[k].forEach(p => delete this.memory[p]);
                    }
                    delete this.memory[k];
                });
            } else {
                this.memory = {};
                this.ttl = [];
            }
        });
    }

    /**
     * Determine if an item exists in the cache
     * 
     * @param {String} key 
     * @param {TagSet} [tagset] 
     * @returns {Promise<Boolean>}
     * @memberof MemoryDriver
     */
    has(key, tagset) {
        if (tagset instanceof TagSet) {
            key = tagset.ref(key);
        }

        return Promise.resolve(this.memory[key] !== undefined);
    }

    /**
     * Dispose allocation
     * 
     * @returns {Promise<void>}
     * @memberof MemoryDriver
     */
    dispose() {
        delete this.memory;
        delete this.ttl;
        delete this.timer;
        clearInterval(this.timer);

        return Promise.resolve();
    }

};
