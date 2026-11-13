export const utils = {
    
    escapeHTML: (str) => {
        return String(str)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    }
}