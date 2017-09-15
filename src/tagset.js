const crypto = require('crypto');

module.exports = class TagSet {

    /**
     * Creates an instance of TagSet
     * 
     * @param {Array<String>} names 
     */
    constructor(...names) {
        this.names = names;
        this.keys = this.names.map(name => `tags:${name}`);
        this.namespace = this.keys.join('|');
        const shasum = crypto.createHash('sha1');
        this.hash = shasum.update(this.namespace).digest('hex');
    }

    /**
     * Get a reference key
     * 
     * @param {String} key 
     * @returns 
     */
    ref(key) {
        return `${this.hash}:${key}`;
    }

};
