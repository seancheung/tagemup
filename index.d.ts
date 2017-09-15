import * as Promise from "bluebird";

/**
 * Create an instance of Cache
 * 
 */
declare function Leafcutter(options: Leafcutter.CacheOptions): Leafcutter.Cache;

declare namespace Leafcutter {
  interface DriverOptions {
    type: string;
    options:
      | DriverOptions.Redis
      | DriverOptions.Memcached
      | DriverOptions.Memory;
  }

  namespace DriverOptions {
    interface Redis {
      host: string;
      port: number;
      prefix?: string;
    }
    interface Memory {
      interval?: number;
    }
    interface Memcached {
      location: string;
    }
  }

  interface CacheOptions {
    driver: DriverOptions | Driver;
    serializer: string | Serializer;
    debug?: IDebugger;
    ttl?: number;
    namespace?: string;
  }
  /**
   * Cache serializer
   *
   */
  export class Serializer {
    /**
     * Serialize a value
     *
     */
    serialize(value: any): string;

    /**
     * Deserialize a string
     *
     */
    deserialize(value: string): any;
  }

  /**
   * Tagset
   *
   */
  interface TagSet {
    /**
     * Creates an instance of TagSet
     *
     */
    new (...names: string[]): TagSet;
    /**
     * Tag names
     *
     */
    readonly names: string[];

    /**
     * Tag keys
     *
     */
    readonly keys: string[];

    /**
     * Tag names
     *
     */
    readonly namespace: string;

    /**
     * Tag hash
     *
     */
    readonly hash: string;

    /**
     * Get a reference key
     *
     */
    ref(key: string): string;
  }

  /**
   * Cache driver
   *
   */
  export class Driver {
    /**
     * Creates an instance of Driver
     */
    new(options?: { namespace?: string; serializer?: Serializer }): Driver;

    /**
     * Get scoped key
     *
     */
    scope(...keys: string[]): string;

    /**
     * Retrieve an item from the cache
     *
     */
    get(key: string, tagset?: TagSet): Promise<any>;

    /**
     * Retrieve items from the cache
     *
     */
    getMany(keys: string[], tagset?: TagSet): Promise<any[]>;

    /**
     * Store an item in the cache
     *
     */
    put(key: string, value: any, ttl: number, tagset?: TagSet): Promise<void>;

    /**
     * Store items in the cache
     *
     */
    putMany(
      array: { key: string; value: any }[],
      ttl: number,
      tagset?: TagSet
    ): Promise<void>;

    /**
     * Increase the value of an integer item
     *
     */
    increment(key: string, amount?: number, tagset?: TagSet): Promise<number>;

    /**
     * Decrease the value of an integer item
     *
     */
    decrement(key: string, amount?: number, tagset?: TagSet): Promise<number>;

    /**
     * Store an item in the cache permanently.
     * It must be manually removed from the cache using the 'forget' method
     *
     */
    forever(key: string, value: any, tagset?: TagSet): Promise<void>;

    /**
     * Remove an item from the cache
     *
     */
    forget(key: string, tagset?: TagSet): Promise<void>;

    /**
     * Clear the entire cache
     *
     */
    flush(tagset?: TagSet): Promise<void>;

    /**
     * Determine if an item exists in the cache
     *
     */
    has(key: string, tagset?: TagSet): Promise<boolean>;

    /**
     * Serialize a value
     *
     */
    serialize(value: any): string;

    /**
     * Deserialize a value
     *
     */
    deserialize(value: string): any;

    /**
     * Dispose connection
     *
     */
    dispose(): Promise<any>;
  }

  type IDebugger = (...args: any[]) => void;
  type Func<T> = () => T | Promise<T>;

  /**
   * Cache
   *
   */
  export class Cache {
    /**
     * Creates an instance of Cache
     */
    new(options?: {
      driver: Driver;
      ttl?: number;
      tags?: string[];
      debug?: IDebugger;
    });

    /**
     * Retrieve an item from the cache
     *
     */
    get<T>(key: string, fallback?: T | Func<T>): Promise<T>;

    /**
     * Determine if an item exists in the cache
     *
     */
    has(key: string): Promise<boolean>;

    /**
     * Increase the value of an integer item
     *
     */
    increment(key: string, amount?: number): Promise<number>;

    /**
     * Decrease the value of an integer item
     *
     */
    decrement(key: string, amount?: number): Promise<number>;

    /**
     * Retrieve an item from the cache or, if it doesn't exist, resolve the func and add its return value to the cache
     *
     */
    remember<T>(key: string, func: Func<T>, ttl?: number): Promise<T>;

    /**
     * Retrieve an item from the cache and then delete the item
     *
     */
    pull(key: string): Promise<any>;

    /**
     * Store an item in the cache
     *
     */
    put(key: string, value: string, ttl?: number): Promise<void>;

    /**
     * Add the item to the cache if it does not already exist.
     * The method will return true if the item is actually added to the cache
     *
     */
    add(key: string, value: string, ttl?: number): Promise<boolean>;

    /**
     * Store an item in the cache permanently.
     * It must be manually removed from the cache using the 'forget' method
     *
     */
    forever(key: string, value: string): Promise<void>;

    /**
     * Remove an item from the cache
     *
     */
    forget(key: string): Promise<void>;

    /**
     * Clear the entire cache
     *
     */
    flush(): Promise<void>;

    /**
     * Tags allow you to tag related items in the cache and then flush all cached values that have been assigned a given tag
     *
     */
    tags(...tags: string[]): Cache;

    /**
     * Dispose driver connections
     *
     */
    dispose(): Promise<void>;
  }
}

export = Leafcutter;
