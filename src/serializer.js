/*eslint no-unused-vars: off */
module.exports = class Serializer {

    /**
     * Serialize a value
     * 
     * @param {any} value 
     * @returns {String}
     */
    serialize(value) {
        throw new Error('NOT IMPLEMENTED');
    }

    /**
     * Deserialize a string
     * 
     * @param {String} value 
     * @returns {any}
     */
    deserialize(value) {
        throw new Error('NOT IMPLEMENTED');
    }

};
