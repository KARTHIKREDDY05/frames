import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Cross-platform in-memory fallback if storage APIs are restricted
const memoryFallback = new Map<string, string>();

/**
 * Robust cross-platform storage adapter that works across:
 * - Web (window.localStorage with memory fallback)
 * - Native iOS & Android (expo-secure-store with safe key sanitation and fallback)
 */
export const universalStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && window.localStorage) {
          const val = window.localStorage.getItem(key);
          if (val !== null) return val;
        }
        return memoryFallback.get(key) ?? null;
      }

      // Native platform
      const sanitizedKey = key.replace(/[^a-zA-Z0-9._-]/g, "_");
      const val = await SecureStore.getItemAsync(sanitizedKey);
      if (val !== null) return val;
      return memoryFallback.get(key) ?? null;
    } catch {
      return memoryFallback.get(key) ?? null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    memoryFallback.set(key, value);
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        return;
      }

      // Native platform
      const sanitizedKey = key.replace(/[^a-zA-Z0-9._-]/g, "_");
      // If payload is very large (> 2048 bytes), fallback to memory and truncated pointer
      try {
        await SecureStore.setItemAsync(sanitizedKey, value);
      } catch {
        // SecureStore item limit exceeded or native error -> memory fallback is already set
      }
    } catch {
      // Handled silently
    }
  },

  removeItem: async (key: string): Promise<void> => {
    memoryFallback.delete(key);
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        return;
      }

      const sanitizedKey = key.replace(/[^a-zA-Z0-9._-]/g, "_");
      await SecureStore.deleteItemAsync(sanitizedKey);
    } catch {
      // Handled silently
    }
  }
};

/**
 * Synchronous storage adapter for Zustand createJSONStorage on Web,
 * with async safety for native.
 */
export const zustandUniversalStorage = {
  getItem: (name: string): string | null | Promise<string | null> => {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      try {
        return window.localStorage.getItem(name);
      } catch {
        return memoryFallback.get(name) ?? null;
      }
    }
    return universalStorage.getItem(name);
  },
  setItem: (name: string, value: string): void | Promise<void> => {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(name, value);
      } catch {
        memoryFallback.set(name, value);
      }
      return;
    }
    return universalStorage.setItem(name, value);
  },
  removeItem: (name: string): void | Promise<void> => {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(name);
      } catch {
        memoryFallback.delete(name);
      }
      return;
    }
    return universalStorage.removeItem(name);
  }
};
