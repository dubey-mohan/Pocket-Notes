import { api } from "../api.js"
import { utils } from "../utils.js"


export async function renderStatsPage(root) {

    root.innerHTML = `<p>Loading Stats Page..</p>`
    
    let allNotes = []
    try {
        allNotes = await api.list()
    } catch(err) {
        console.log(err)
        root.innerHTML = `
            <div class = "load-error">
                <p>Couldn't load stats: ${utils.escapeHTML(err)}</p>
                 <button class = "retry">Try Again</button>
            </div>
        `;
        root.querySelector(".retry").addEventListner("click", () => renderStatsPage(root));
        return;
    }

    const doneNotes = allNotes.filter((note) => note.done).length;
    const totalNotes = allNotes.length;
    const overDueNotes = allNotes.filter((note) => new Date((note.due ?? "")) > new Date()).length


    root.innerHTML = `
    <section class = "overdue-notes">
        <h1>Stats</h1>
        <main>You have ${overDueNotes} overdue notes.</main>
    </section>

    <section class = "completed-notes">
        <h2>Completed</h2>
        <main>${doneNotes} done, ${totalNotes - doneNotes} still to do</main>
    </section>

    <section class = "top-tags">
        <h3>Top Tags</h3>
        ${getProgressVisual(getTopTagsSummary(allNotes))}
    </section>
    `
};

function getTopTagsSummary(notes) {
    let topTags = {}
    notes.forEach((note) => (note.tags ?? []).forEach((tag) => {topTags[tag] = (topTags[tag] ?? 0) + 1;}));
    return Object.entries(topTags).sort((a, b) => b[1] - a[1])
}

function getProgressVisual(summary) {
    return [summary].map((record) => {
        return `
            <div class = "top-tags-progress"
                <div class = "cat-name">${summary[0]}</div>
                <div class = "progress-bar"></div>
                <div class = "cat-count">${summary[1]}</div>
            </div>
        `
    }).join('')
};

