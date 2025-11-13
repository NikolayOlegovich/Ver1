// Placeholder for Capacitor SQLite adapter. For now, reuse web storage
// to keep the code isomorphic when running in web build.
import { createDexieStorage } from '../dexie/storage';
export const createSQLiteStorage = createDexieStorage;

