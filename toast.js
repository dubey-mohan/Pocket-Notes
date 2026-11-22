const toast = document.querySelector("#toast");
let toastTimer;

export function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {toast.hidden = true}, 3000);
} 