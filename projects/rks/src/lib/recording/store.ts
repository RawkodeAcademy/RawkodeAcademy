type IsoPartRec = { partNo: number; bytes: number; hash: string };
export type IsoManifestRec = {
  id: string;
  sessionId: string;
  userId: string;
  kind: string;
  status: 'PENDING' | 'UPLOADING' | 'COMPLETE' | 'FAILED';
  totalBytes: number;
  totalParts: number;
  hash: string | null;
  r2Key?: string | null;
  parts: IsoPartRec[];
  updatedAt: number;
};

type DbCtx = { db: IDBDatabase };

async function openDb(): Promise<DbCtx> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('rks-recordings', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('isoManifests')) {
        const store = db.createObjectStore('isoManifests', { keyPath: 'id' });
        store.createIndex('byStatus', 'status', { unique: false });
      }
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve({ db: req.result });
  });
}

export async function putManifest(rec: IsoManifestRec): Promise<void> {
  const { db } = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('isoManifests', 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore('isoManifests').put({ ...rec, updatedAt: Date.now() });
  });
}

export async function updateManifest(id: string, patch: Partial<IsoManifestRec>): Promise<void> {
  const current = await getManifest(id);
  if (!current) return;
  await putManifest({ ...current, ...patch, updatedAt: Date.now() });
}

export async function getManifest(id: string): Promise<IsoManifestRec | null> {
  const { db } = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('isoManifests', 'readonly');
    const req = tx.objectStore('isoManifests').get(id);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve((req.result as IsoManifestRec) ?? null);
  });
}

export async function appendPartToManifest(id: string, part: IsoPartRec): Promise<void> {
  const m = await getManifest(id);
  if (!m) return;
  const parts = m.parts.slice();
  parts.push(part);
  await putManifest({ ...m, parts, totalParts: parts.length, totalBytes: m.totalBytes + part.bytes, status: 'UPLOADING' });
}

export async function getPendingManifests(): Promise<IsoManifestRec[]> {
  const { db } = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('isoManifests', 'readonly');
    const idx = tx.objectStore('isoManifests').index('byStatus');
    const req = idx.getAll(IDBKeyRange.bound('PENDING', 'UPLOADING'));
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve((req.result as IsoManifestRec[]) ?? []);
  });
}

export async function removeManifest(id: string): Promise<void> {
  const { db } = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('isoManifests', 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore('isoManifests').delete(id);
  });
}

