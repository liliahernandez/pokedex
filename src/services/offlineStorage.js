import { openDB } from 'idb';

const DB_NAME = 'offline-store';
const STORE_NAME = 'requests';

export const initDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        },
    });
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
