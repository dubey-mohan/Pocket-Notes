import { ApiError } from "../errors.js";
import { api } from "../api.js";
import { utils } from "../utils.js";
import { showToast } from "../toast.js";

let allNotes = []
let query = ""
let activeTags = new Set()
let sortBy = "newest"
let controlsEl;
let notesEl;

export function renderNotesPage(root) {
  root.innerHTML = `
    <div class="list-controls"></div>
    <div class="list-notes"></div>
  `;
  controlsEl = root.querySelector(".list-controls");
  notesEl = root.querySelector(".list-notes");

  notesEl.addEventListener("change", (event) => {
    if (!event.target.matches(".done-toggle")) return;
    const id = Number(event.target.closest(".note").dataset.id);
    toggleDone(id, event.target.checked);
  });

  loadNotes();
}

function matchesSearch(note) {
    if (query === "") return true;
    const title = (note.title ?? "").toLowerCase()
    const body = (note.body ?? "").toLowerCase()

    return title.includes(query) || body.includes(query)
}

function hasActiveTags(note) {
    if (activeTags.size === 0) return true;
    return [...activeTags].some((tag) => (note.tags ?? []).includes(tag));
}

function getVisibleNotes() {
    const visible =  allNotes.filter((note) => matchesSearch(note) && hasActiveTags(note))

    if (sortBy === "newest") {
        return [...visible].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    if (sortBy === "oldest") {
        return [...visible].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    }

    if (sortBy === "due") {
        return [...visible].sort((a, b) => {
            if (!a.due && !b.due) return 0;
            if (!a.due) return 1;
            if (!b.due) return -1;
            return new Date(a.due) - new Date(b.due)
        })
    }

    if (sortBy === "title") {
        return [...visible].sort((a, b) => a.title.localeCompare(b.title))
    }

    return visible
}

function renderFilterNotes() {
    renderAllNotes(getVisibleNotes());
}

async function toggleDone(id, done) {
    const before = allNotes;

    allNotes = allNotes.map((note) => note.id === id ? {...note, done} : note);
    updateDoneCount();
    
    try {
        await api.update(id, { done });
    } catch (err) {
        allNotes = before;
        renderFilterNotes()
        showToast(`Couldn't update the note: ${err.message}`);
    }
}

function updateDoneCount() {
  const totalDone = allNotes.filter((n) => n.done).length;
  controlsEl.querySelector(".done-count").textContent = `${totalDone} of ${allNotes.length} done`;
}

async function loadNotes() {
    notesEl.innerHTML = `<p>Loading Notes...</p>`

    try {
        allNotes = await api.list()
    } catch(err) {
        console.error(err)
        notesEl.innerHTML = `
        <div class = "load-error">
        <p> Couldn't Load Notes :( </p>
        <button class = "retry">Try Again</button>
        </div>
        `
        document.querySelector('.retry').addEventListener("click", loadNotes)
        return;
    }
    renderPage(allNotes);
}

function renderNote(note){
    const {id, title, body, tags = [], done, createdAt}  = note

    const tagHTML = tags.map((tag) => `<div class = "tag">${utils.escapeHTML(tag)}</div>`).join("")

    return `
        <section class = "note" data-id = "${id}">
            <input class="done-toggle" type = "checkbox" ${done ? "checked" : ""}>
            <div class = "note-body">
                <h3>${utils.escapeHTML(title)}</h3>
                <p>${utils.escapeHTML(body)}</p>
                <footer>
                    <div class = "note-tags">${tagHTML}</div>
                    <div class = "note-created-at">Created On: ${new Date(createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    })}</div>
                </footer>
            </div>
        </section>
    `
}

function renderAllNotes(notes) {
    notesEl.innerHTML = notes.map((note) => renderNote(note)).join('')
}

function allActiveTags() {
    const allTags = new Set()
    allNotes.forEach((note) => (note.tags ?? []).forEach((tag) => allTags.add(tag)));

    controlsEl.querySelector('.all-tags').innerHTML = [...allTags]
    .sort()
    .map((tag) => {
        const isActive = activeTags.has(tag);
        return `
        <button type = "button"
                class = "tag tag-filter ${isActive ? "is-active" : ""}"
                data-tag = "${utils.escapeHTML(tag)}"
                aria-pressed = "${isActive}">
        ${utils.escapeHTML(tag)}
        </button>
        `
    })
    .join("")
}

function getActiveTags() {
    const allTags = document.querySelector('.all-tags')
    allTags.addEventListener('click', (event) => {
        
        const button = event.target.closest('.tag-filter')
        
        if (!button) return;

        const tag = button.dataset.tag

        if (activeTags.has(tag)) {
            activeTags.delete(tag)
        } else {
            activeTags.add(tag)
        }

        allActiveTags()
        renderFilterNotes()
    })
}

function renderNoteSearch(notes) {

    const totalDone = notes.filter(n => n.done).length

    controlsEl.innerHTML =  `
     <header class = "search-header">
            <h1>Notes</h1>
            <div class = "done-count">${totalDone} of ${notes.length} done</div>
    </header>
    <section class = "notes-search">
        <div class = "search-panel">
            <input type = "search" class = "search-notes" placeholder = "Please search required notes">
            <div class = "all-tags"></div>
        </div>
        <select class = "sort-notes" aria-label="Sort Notes">
            <option value = "newest">Newest First</option>
            <option value = "oldest">Oldest First</option>
            <option value = "title">Title A-Z</option>
            <option value = "due">Due Soonest</option> 
        </select>
    </section>
    `
    const search = document.querySelector('.search-notes')
    search.addEventListener("input", utils.debounce((event) => {
        query = event.target.value.trim().toLowerCase()
        renderFilterNotes()
    }, 300))

    document.querySelector(".sort-notes").addEventListener("change", (event) => {
    sortBy = event.target.value
    renderFilterNotes()
    })

    allActiveTags()
    getActiveTags()
}

function renderPage(notes) {

    const totalNotes = notes.length

    if (totalNotes === 0) {
        notesEl.innerHTML = `
        <p> You don't have any Notes ! <br><br> Would you like to <a class = "new-note-link">Create</a> one</p>
        `
        return;   
    }
    toast.hidden = true

    renderNoteSearch(notes)
    renderFilterNotes()
}