import { api } from "../api.js"

export function renderStatsPage(root) {
    root.innerHTML = `<div>Loading Stats...</div>



    <h2>Stats</h2>
    <div class = "overdue-stats">You have ${getOverdueStats(allNotes)} overdue notes.</div>
    <br>
    <h2>Completed</h2>
    <h2>${Math.round(getDoneStats()*100 / allNotes.length, 0)}%</h2>
    <div>${getDoneStats()} done, ${allNotes.length - getDoneStats()} still to do.</div>
    `
}

async function loadNotes(root) {
    root.innerHTML = `<div>Loading Stats...</div>`

    try {
        allNotes = await api.list()
    } catch(err) {
        console.log(err)
        root.innerHTML `Oops ! Something went wrong while loading Notes. <a href = '#/stats'>Try Again</a>`
        return
    }

    return allNotes
}

const allNotes = loadNotes()


function getOverdueStats(allNotes) {
    return allNotes.filter((note) => new Date(due) > new Date()).length
}

function getDoneStats(allNotes) {
    return allNotes.filter((note) => note.done).length
}


