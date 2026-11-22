export function renderNotFoundPage(root) {
    root.innerHTML = `
    <div class = "state">
    <p>There is no page at this address..</p>
    <a href = "#/" class = "btn">Go to notes</a>
    </div>
    `
}