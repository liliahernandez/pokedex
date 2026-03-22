import { openDB } from 'idb';

const DB_NAME = 'offline-store';
const STORE_NAME = 'requests';
const AUTH_STORE = 'auth';

export const initDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(AUTH_STORE)) {
                db.createObjectStore(AUTH_STORE);
            }
        },
    });
};

export const saveAuthToken = async (token) => {
    const db = await initDB();
    return db.put(AUTH_STORE, token, 'token');
};

export const getAuthToken = async () => {
    const db = await initDB();
    return db.get(AUTH_STORE, 'token');
};

export const saveRequest = async (request) => {
    const db = await initDB();
    return db.add(STORE_NAME, request);
};

export const getRequests = async () => {
    const db = await initDB();
    return db.getAll(STORE_NAME);
};

export const deleteRequest = async (id) => {
    const db = await initDB();
    return db.delete(STORE_NAME, id);
};
