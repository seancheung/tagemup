# Tag'em Up!
Tagged caching which supports various drivers(memory, redis, memcached)

## Install

```bash
npm i tagemup
```

### Usage

```javascript
const tagemup = require('tagemup')({
        driver: { type: 'redis', options: { host: 'localhost', port: 3306 } }, 
        serializer: 'json', 
        namespace: 'may-app',
        debug: console.log,
        ttl: 3600
    });

//Store an item in the cache
tagemup.put(key, value, ttl).then(/**/);
tagemup.tags(tags).put(key, value, ttl).then(/**/);

//Retrieve an item from the cache
tagemup.get(key, fallback).then(/**/);
tagemup.tags(tags).get(key, fallback).then(/**/);

//Retrieve an item from the cache or, if it doesn't exist, resolve the func and add its return value to the cache
tagemup.remember(key, func, ttl).then(/**/);
tagemup.tags(tags).remember(key, func, ttl).then(/**/);

//Retrieve an item from the cache and then delete the item
tagemup.pull(key).then(/**/);
tagemup.tags(tags).pull(key).then(/**/);

//Store an item in the cache permanently. It must be manually removed from the cache using the 'forget' method
tagemup.forever(key, value).then(/**/);
tagemup.tags(tags).forever(key, value).then(/**/);

//Remove an item from the cache
tagemup.forget(key).then(/**/);Ï
tagemup.tags(tags).forget(key).then(/**/);

//Clear the entire cache
tagemup.flush().then(/**/);
tagemup.tags(tags).flush().then(/**/);
```