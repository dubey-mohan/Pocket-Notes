// api.js: a FAKE server that lives in the browser.
// You don't need to understand the inside yet. Just use it:
//
//   import { api } from "./api.js";
//   const notes = await api.list();
//
// It waits a little (like a real network) and fails about 1 time in 10
// (like a real server), so you can practise loading and error messages.
// Data is saved in the browser, so it survives a page refresh.

import { ApiError } from "./errors.js"; // you write errors.js yourself

const DB_KEY = "pocket-notes";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function readDb() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY)) ?? [];
  } catch {
    return [];
  }
}

function writeDb(notes) {
  localStorage.setItem(DB_KEY, JSON.stringify(notes));
}

async function request(work) {
  await wait(300 + Math.random() * 500);
  if (Math.random() < 0.1) throw new ApiError("Server hiccup, try again", 500);
  return structuredClone(work());
}

export const api = {
  // api.list() → all notes
  list: () => request(() => readDb()),

  // api.get(42) → one note, or throws ApiError with status 404
  get: (id) => request(() => {
    const note = readDb().find((n) => n.id === id);
    if (!note) throw new ApiError(`Note ${id} not found`, 404);
    return note;
  }),

  // api.create({ title, body, tags, due }) → the new note (with id and createdAt)
  create: (data) => request(() => {
    const note = {
      id: Date.now(),
      done: false,
      tags: [],
      due: null,
      createdAt: new Date().toISOString(),
      ...data,
    };
    writeDb([...readDb(), note]);
    return note;
  }),

  // api.update(42, { done: true }) → the updated note
  update: (id, changes) => request(() => {
    const notes = readDb();
    if (!notes.some((n) => n.id === id)) throw new ApiError(`Note ${id} not found`, 404);
    const updated = notes.map((n) =>
      n.id === id ? { ...n, ...changes, updatedAt: new Date().toISOString() } : n
    );
    writeDb(updated);
    return updated.find((n) => n.id === id);
  }),

  // api.remove(42) → { ok: true }
  remove: (id) => request(() => {
    writeDb(readDb().filter((n) => n.id !== id));
    return { ok: true };
  }),
};