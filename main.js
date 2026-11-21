import { ApiError } from "./errors.js";
import { api } from "./api.js";
import { utils } from "./utils.js";

const noteSearch = document.querySelector('#note-search')
const app = document.querySelector('#app')
const toast = document.querySelector("#toast")
let allNotes = []
let query = ""
let toastTimer;
let activeTags = new Set()

app.addEventListener("change", (event) => {
    if (!event.target.matches(".done-toggle")) return;

    const id = Number(event.target.closest(".note").dataset.id);
    toggleDone(id, event.target.checked)
});

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
    return allNotes.filter((note) => matchesSearch(note) && hasActiveTags(note))
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
        renderAllNotes(allNotes)
        showToast(`Couldn't update the note: ${err.message}`);
    }
}

function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {toast.hidden = true}, 3000);
} 

function updateDoneCount() {
  const totalDone = allNotes.filter((n) => n.done).length;
  noteSearch.querySelector(".done-count").textContent = `${totalDone} of ${allNotes.length} done`;
}

async function loadNotes() {
    app.innerHTML = `<p>Loading Notes...</p>`

    try {
        allNotes = await api.list()
        renderPage(allNotes);
    } catch(err) {
        console.log(err)
        app.innerHTML = `
        <div class = "load-error">
        <p> Couldn't Load Notes :( </p>
        <button class = "retry">Try Again</button>
        </div>
        `
        document.querySelector('.retry').addEventListener("click", loadNotes)
    }
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
    app.innerHTML = notes.map((note) => renderNote(note)).join('')
}

function allActiveTags() {
    const allTags = new Set()
    allNotes.forEach((note) => (note.tags ?? []).forEach((tag) => allTags.add(tag)));

    noteSearch.querySelector('.all-tags').innerHTML = [...allTags]
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

    noteSearch.innerHTML =  `
    <section class = "notes-search">
        <header>
            <h1>Notes</h1>
            <div class = "done-count">${totalDone} of ${notes.length} done</div>
        </header>
        <div>
            <input type = "search" class = "search-notes" placeholder = "Please search required notes">
            <div class = "all-tags"></div>
        </div>
    </section>
    `
    const search = document.querySelector('.search-notes')
    search.addEventListener("input", utils.debounce((event) => {
        query = event.target.value.trim().toLowerCase()
        renderFilterNotes()
    }, 300))

    allActiveTags()
    getActiveTags()
}

function renderPage(notes) {

    const totalNotes = notes.length

    if (totalNotes === 0) {
        app.innerHTML = `
        <p> You don't have any Notes ! <br><br> Would you like to <a class = "new-note-link">Create</a> one</p>
        `
        return;   
    }
    toast.hidden = true

    renderNoteSearch(notes)
    renderFilterNotes()
}

loadNotes()