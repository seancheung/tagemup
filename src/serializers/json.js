const Serializer = require('../serializer');

module.exports = class JsonSerializer extends Serializer {

    serialize(value) {
        return value !== undefined ? JSON.stringify(value) : value;
    }

    deserialize(value) {
        return typeof value === 'string' ? JSON.parse(value) : value;
    }

};
