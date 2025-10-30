declare module 'dexie' {
  export class Table<T, Key = string> {
    put(item: T): Promise<Key>;
    get(key: Key): Promise<T | undefined>;
    delete(key: Key): Promise<void>;
    where(index: string): {
      below(value: number): {
        reverse(): {
          limit(count: number): {
            toArray(): Promise<T[]>;
          };
        };
      };
    };
    orderBy(index: string): {
      reverse(): {
        limit(count: number): {
          toArray(): Promise<T[]>;
        };
        toArray(): Promise<T[]>;
      };
    };
  }

  export default class Dexie {
    constructor(name: string);
    version(versionNumber: number): {
      stores(schema: Record<string, string>): void;
    };
    table<T, Key = string>(name: string): Table<T, Key>;
  }
}

