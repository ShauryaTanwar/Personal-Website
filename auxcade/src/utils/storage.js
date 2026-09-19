const memory = new Map();
export let storageAvailable = true;
export function readJson(key, fallback = null, session = false) {
    try {
        const value = (session ? sessionStorage : localStorage).getItem(key);
        return value ? JSON.parse(value) : fallback;
    }
    catch {
        storageAvailable = false;
        return memory.has(key) ? memory.get(key) : fallback;
    }
}
export function writeJson(key, value, session = false) {
    memory.set(key, value);
    try {
        (session ? sessionStorage : localStorage).setItem(key, JSON.stringify(value));
        return true;
    }
    catch {
        storageAvailable = false;
        return false;
    }
}
export function removeItem(key, session = false) {
    memory.delete(key);
    try {
        (session ? sessionStorage : localStorage).removeItem(key);
    }
    catch {
        storageAvailable = false;
    }
}
