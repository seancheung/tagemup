const Serializer = require('../serializer');
const msgpack = require('msgpack5')();

msgpack.register(
    0x0d,
    Date,
    date => Buffer.from(date.toJSON()),
    buf => new Date(buf.toString())
);

module.exports = class MsgpackSerializer extends Serializer {

    serialize(value) {
        return value !== undefined
            ? msgpack.encode(value).toString('hex')
            : value;
    }

    deserialize(value) {
        return typeof value === 'string'
            ? msgpack.decode(new Buffer(value, 'hex'))
            : value;
    }

};
