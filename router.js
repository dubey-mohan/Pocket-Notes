import { renderNotesPage } from "./pages/list";
import { renderStatsPage } from "./pages/stats";
import { renderNotFoundPage } from "./pages/nof-found";

const routes = [
    {pattern: /^\/$/, page: renderNotesPage},
    {pattern: /^\/stats$/, page: renderStatsPage}
];

function matchRoute(path) {
    for (const route of routes) {
        const match = path.match(route.pattern);
        if (match) {
            return {page: route.page, params: match.groups ?? {}}
        }
    }
    return {page: renderNotFoundPage, params: {}}
}

export function startRouter(root) {
    function showCurrentPage() {
        const path = location.hash.slice(1) || "/";
        const { page, params } = matchRoute(path);
        page(root, params)
    }

    window.addEventListener("hashchange", showCurrentPage);
    showCurrentPage()
}