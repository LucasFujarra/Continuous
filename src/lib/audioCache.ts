export interface CachedAudio {
  file: File;
  folder: string;
}

async function openCache(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('continuous-audio', 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore('tracks', { keyPath: 'key' });
      store.createIndex('folder', 'folder');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => () => T): Promise<T> {
  const database = await openCache();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = database.transaction('tracks', mode);
      const result = action(tx.objectStore('tracks'));
      tx.oncomplete = () => resolve(result());
      tx.onabort = () => reject(tx.error ?? new Error('Falha no armazenamento local.'));
      tx.onerror = () => reject(tx.error);
    });
  } finally { database.close(); }
}

export function audioKey(audio: CachedAudio): string {
  return JSON.stringify([audio.folder, audio.file.name]);
}

export function loadCachedAudio(): Promise<CachedAudio[]> {
  return transaction('readonly', store => {
    const request = store.getAll();
    return () => request.result;
  });
}

export function cacheAudio(files: CachedAudio[]): Promise<void> {
  return transaction('readwrite', store => {
    for (const audio of files) store.put({ ...audio, key: audioKey(audio) });
    return () => undefined;
  });
}

export function deleteCachedAlbum(folder: string): Promise<void> {
  return transaction('readwrite', store => {
    const cursor = store.index('folder').openCursor(IDBKeyRange.only(folder));
    cursor.onsuccess = () => {
      if (!cursor.result) return;
      cursor.result.delete();
      cursor.result.continue();
    };
    return () => undefined;
  });
}
