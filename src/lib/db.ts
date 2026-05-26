/**
 * A lightweight, promise-based wrapper over native IndexedDB
 * to handle offline persistent storage for large book contents.
 */
import { Book } from "../types";

const DB_NAME = "BookReaderMinimalistDB";
const STORE_NAME = "books";
const DB_VERSION = 1;

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };
  });
}

export async function saveBook(book: Book): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(book);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export async function getBook(id: string): Promise<Book | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export async function getAllBooks(): Promise<Book[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const books = request.result || [];
      // Sort with newest books first
      resolve(books.sort((a, b) => b.addedAt - a.addedAt));
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export async function deleteBook(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}
