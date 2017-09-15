const Cache = require('./src/cache');
const Driver = require('./src/driver');
const Serializer = require('./src/serializer');

/**
 * Create a Cache instance
 * 
 * @param {{driver: {type: String, options: Object}|Driver, debug?: Function, serializer?: String|Serializer, ttl?: Number, namespace?: String}} options 
 * @returns {Cache}
 */
function factory(options) {
    if (!options) {
        throw new Error('options must be provided');
    }
    let serializer, driver;
    if (options.serializer instanceof Serializer) {
        serializer = options.serializer;
    } else if (typeof options.serializer === 'string') {
        let Serializer;
        switch (options.serializer) {
        case 'json':
            Serializer = require('./src/serializers/json');
            break;
        case 'msgpack':
            Serializer = require('./src/serializers/msgpack');
            break;
        default:
            throw new Error('Unknown serializer');
        }
        serializer = new Serializer();
    } else {
        throw new Error('A valid serializer must be provided');
    }
    if (options.driver instanceof Driver) {
        driver = options.driver;
    } else if (typeof options.driver === 'object' && options.driver.type) {
        let Driver;
        switch (options.driver.type) {
        case 'redis':
            Driver = require('./src/drivers/redis');
            break;
        case 'memcached':
            Driver = require('./src/drivers/memcached');
            break;
        case ':memory:':
            Driver = require('./src/drivers/memory');
            break;
        default:
            throw new Error('Unknown driver');
        }
        driver = new Driver({
            namespace: options.namespace,
            serializer,
            driver: options.driver.options
        });
    } else {
        throw new Error('A valid driver must be provided');
    }

    return new Cache({ driver, ttl: options.ttl, debug: options.debug });
}

factory.Cache = Cache;
factory.Driver = Driver;
factory.Serializer = Serializer;

module.exports = factory;
