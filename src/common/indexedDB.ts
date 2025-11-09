const DB_NAME = "midset-coach-db";
const DB_VERSION = 1;
const REVIEW_NOTES_STORE = "review-notes";

interface IndexDefinition {
  name: string;
  keyPath: string | string[];
  options?: IDBIndexParameters;
}

interface StoreDefinition {
  name: string;
  keyPath: string;
  indexes: IndexDefinition[];
}

const STORES: StoreDefinition[] = [
  {
    name: REVIEW_NOTES_STORE,
    keyPath: "id",
    indexes: [
      { name: "replayFileName", keyPath: "replayFileName" },
      { name: "playerCharacter", keyPath: "replayMetadata.playerCharacter" },
      { name: "opponentCharacter", keyPath: "replayMetadata.opponentCharacter" },
      { name: "date", keyPath: "replayMetadata.date" },
      {
        name: "matchupDate",
        keyPath: [
          "replayMetadata.playerCharacter",
          "replayMetadata.opponentCharacter",
          "replayMetadata.date",
        ],
      },
    ],
  },
];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise !== null) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      STORES.forEach((store) => {
        if (!db.objectStoreNames.contains(store.name)) {
          const objectStore = db.createObjectStore(store.name, {
            keyPath: store.keyPath,
          });
          store.indexes.forEach((index) => {
            objectStore.createIndex(index.name, index.keyPath, index.options);
          });
        }
      });
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
      };
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open IndexedDB"));
    };
  });

  return dbPromise;
}

export async function putRecord<T>(
  storeName: string,
  value: T
): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error(`Failed to write record to ${storeName}`));
    tx.onabort = () =>
      reject(tx.error ?? new Error(`Transaction aborted for ${storeName}`));
    tx.objectStore(storeName).put(value as unknown);
  });
}

export async function deleteRecord(
  storeName: string,
  key: IDBValidKey
): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error(`Failed to delete record from ${storeName}`));
    tx.onabort = () =>
      reject(tx.error ?? new Error(`Transaction aborted for ${storeName}`));
    tx.objectStore(storeName).delete(key);
  });
}

export async function getAllRecords<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () =>
      reject(request.error ?? new Error(`Failed to read from ${storeName}`));
  });
}

export async function getRecordsByIndex<T>(
  storeName: string,
  indexName: string,
  query: IDBValidKey | IDBKeyRange
): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(query);
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () =>
      reject(
        request.error ??
          new Error(`Failed to read from index ${indexName} in ${storeName}`)
      );
  });
}

export function reviewNotesStoreName(): string {
  return REVIEW_NOTES_STORE;
}

export async function clearDatabase(): Promise<void> {
  const db = await openDatabase();
  const clearPromises = STORES.map(
    (store) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(store.name, "readwrite");
        const objectStore = tx.objectStore(store.name);
        const request = objectStore.clear();
        request.onsuccess = () => resolve();
        request.onerror = () =>
          reject(request.error ?? new Error(`Failed to clear ${store.name}`));
      })
  );
  await Promise.all(clearPromises);
}
