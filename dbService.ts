
import { TripLog, IssueLog } from './types';

const DB_NAME = 'SFC_Fleet_DB';
const DB_VERSION = 1;
const STORES = {
  TRIPS: 'tripLogs',
  ISSUES: 'issueLogs'
};

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.TRIPS)) {
        db.createObjectStore(STORES.TRIPS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.ISSUES)) {
        db.createObjectStore(STORES.ISSUES, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveLocalLog = async <T extends { id: string }>(storeName: string, data: T): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllLogs = async <T>(storeName: string): Promise<T[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const updateLogSyncStatus = async (storeName: string, id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const data = getRequest.result;
      if (data) {
        data.synced = true;
        store.put(data);
      }
      resolve();
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};
