/*eslint no-unused-vars: off */
const TagSet = require('./tagset');
const Serializer = require('./serializer');

module.exports = class Driver {

    /**
     * Creates an instance of Driver
     * 
     * @param {{namespace?: String, serializer?: Serializer}} [options] 
     */
    constructor(options) {
        this.namespace = options && options.namespace;
        this.serializer = options && options.serializer;
    }

    /**
     * Get scoped key
     * 
     * @param {Array<String>} keys 
     * @returns 
     * @memberof Driver
     */
    scope(...keys) {
        const key = keys.join(':');

        return this.namespace ? `${this.namespace}:${key}` : key;
    }

    /**
     * Retrieve an item from the cache
     * 
     * @param {String} key 
     * @param {TagSet} [tagset] 
     * @returns {Promise<any>}
     * @memberof Driver
     */
    get(key, tagset) {
        throw new Error('NOT IMPLEMENTED');
    }

    /**
     * Retrieve items from the cache
     * 
     * @param {Array<String>} keys
     * @param {TagSet} [tagset] 
     * @returns {Promise<Array<any>>}
     * @memberof Driver
     */
    getMany(keys, tagset) {
        throw new Error('NOT IMPLEMENTED');
    }

    /**
     * Store an item in the cache
     * 
     * @param {String} key 
     * @param {any} value 
     * @param {Number} ttl 
     * @param {TagSet} [tagset] 
     * @returns {Promise<void>}
     * @memberof Driver
     */
    put(key, value, ttl, tagset) {
        throw new Error('NOT IMPLEMENTED');
    }

    /**
     * Store items in the cache
     * 
     * @param {Array<{key:String, value:any}>} array 
     * @param {Number} ttl 
     * @param {TagSet} [tagset] 
     * @returns {Promise<void>}
     * @memberof Driver
     */
    putMany(array, ttl, tagset) {
        throw new Error('NOT IMPLEMENTED');
    }

    /**
     * Increase the value of an integer item
     * 
     * @param {String} key 
     * @param {Number} [amount] 
     * @param {TagSet} [tagset] 
     * @returns {Promise<Number>}
     * @memberof Driver
     */
    increment(key, amount, tagset) {
        throw new Error('NOT IMPLEMENTED');
    }

    /**
     * Decrease the value of an integer item
     * 
     * @param {String} key 
     * @param {Number} [amount] 
     * @param {TagSet} [tagset] 
     * @returns {Promise<Number>}
     * @memberof Driver
     */
    decrement(key, amount, tagset) {
        throw new Error('NOT IMPLEMENTED');
    }

    /**
     * Store an item in the cache permanently.
     * It must be manually removed from the cache using the 'forget' method
     * 
     * @param {String} key 
     * @param {any} value 
     * @param {TagSet} [tagset] 
     * @returns {Promise<void>}
     * @memberof Driver
     */
    forever(key, value, tagset) {
        throw new Error('NOT IMPLEMENTED');
    }

    /**
     *  Remove an item from the cache 
     * 
     * @param {String} key 
     * @param {TagSet} [tagset] 
     * @returns {Promise<void>}
     * @memberof Driver
     */
    forget(key, tagset) {
        throw new Error('NOT IMPLEMENTED');
    }

    /**
     * Clear the entire cache 
     * 
     * @param {TagSet} [tagset] 
     * @returns {Promise<void>}
     * @memberof Driver
     */
    flush(tagset) {
        throw new Error('NOT IMPLEMENTED');
    }

    /**
     * Determine if an item exists in the cache
     * 
     * @param {String} key 
     * @param {TagSet} [tagset] 
     * @returns {Promise<Boolean>}
     * @memberof Driver
     */
    has(key, tagset) {
        throw new Error('NOT IMPLEMENTED');
    }

    /**
     * Serialize a value
     * 
     * @param {any} value 
     * @returns 
     * @memberof Driver
     */
    serialize(value) {
        return this.serializer instanceof Serializer
            ? this.serializer.serialize(value)
            : value;
    }

    /**
     * Deserialize a value
     * 
     * @param {any} value 
     * @returns 
     * @memberof Driver
     */
    deserialize(value) {
        return this.serializer instanceof Serializer
            ? this.serializer.deserialize(value)
            : value;
    }

    /**
     * Dispose connection
     * 
     * @returns {Promise<any>}
     * @memberof Driver
     */
    dispose() {
        throw new Error('NOT IMPLEMENTED');
    }

};
