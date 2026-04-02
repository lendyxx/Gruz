type StorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

function createWebStorage(): StorageLike {
  return {
    async getItem(key) {
      try {
        return globalThis?.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    async setItem(key, value) {
      try {
        globalThis?.localStorage?.setItem(key, value);
      } catch {
        // ignore
      }
    },
    async removeItem(key) {
      try {
        globalThis?.localStorage?.removeItem(key);
      } catch {
        // ignore
      }
    },
  };
}

function getNativeAsyncStorage(): StorageLike | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-async-storage/async-storage');
    const asyncStorage = mod?.default ?? mod;
    if (
      asyncStorage &&
      typeof asyncStorage.getItem === 'function' &&
      typeof asyncStorage.setItem === 'function' &&
      typeof asyncStorage.removeItem === 'function'
    ) {
      return asyncStorage as StorageLike;
    }
    return null;
  } catch {
    return null;
  }
}

const storage: StorageLike = getNativeAsyncStorage() ?? createWebStorage();

export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await storage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  await storage.setItem(key, JSON.stringify(value));
}

export async function remove(key: string): Promise<void> {
  await storage.removeItem(key);
}

