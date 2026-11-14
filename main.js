import { ApiError } from "./errors.js";
import { api } from "./api.js";
import { utils } from "./utils.js";

const noteSearch = document.querySelector('#note-search')
const app = document.querySelector('#app')
const toast = document.querySelector("#toast")
let allNotes = []
let query = ""

app.addEventListener("change", (event) => {
    if (!event.target.matches(".done-toggle")) return;

    const id = Number(event.target.closest(".note").dataset.id);
    toggleDone(id, event.target.checked)
});

function getVisibleNotes() {
    if (query === "") return allNotes;

    return allNotes.filter((note) => {
        const title = (note.title ?? "").toLowerCase();
        const body = (note.body ?? "").toLowerCase();
        
        return title.includes(query) || body.includes(query)
    })
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
        showToast(`Couldn't update the note ${err.message}`);
    }
}

let toastTimer;
function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => {toast.hidden = true;}, 3000)
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
            <main class = "note-body">
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
            </main>
        </section>
    `
}

function renderAllNotes(notes) {
    app.innerHTML = notes.map((note) => renderNote(note)).join('')
}


function renderNoteSearch(notes) {

    const allTags = new Set()
    notes.forEach((note) => {note.tags ?? [].forEach((tag) => allTags.add(tag))})

    const allTagsHTML  = [...allTags].map((tag) => `<div class = "tag">${utils.escapeHTML(tag)}</div>`).join('')
    const totalDone = notes.filter(n => n.done).length

    noteSearch.innerHTML =  `
    <section class = "notes-search">
        <header>
            <h1>Notes</h1>
            <div class = "done-count">${totalDone} of ${notes.length} done</div>
        </header>
        <main>
            <input type = "search" class = "search-notes" placeholder = "Please search required notes">
            <div class = "all-tags">${allTagsHTML}</div>
        </main>
    </section>
    `
    const search = document.querySelector('.search-notes')
    search.addEventListener("input", utils.debounce((event) => {
        query = event.target.value.trim().toLowerCase()
        renderFilterNotes()
    }, 300))

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
    renderAllNotes(notes)
}

loadNotes()
