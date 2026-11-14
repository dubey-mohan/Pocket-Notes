export const utils = {
    
    escapeHTML: (str) => {
        return String(str)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    },

    debounce: (fn, delay = 300) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => {fn(...args)}, delay);
        };
    }
}