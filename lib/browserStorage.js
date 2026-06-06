const getStorage = () => {
    if (typeof window === 'undefined') return null

    const storage = window.localStorage
    if (
        !storage ||
        typeof storage.getItem !== 'function' ||
        typeof storage.setItem !== 'function' ||
        typeof storage.removeItem !== 'function'
    ) {
        return null
    }

    return storage
}

export const readStorage = (key, fallback) => {
    const storage = getStorage()
    if (!storage) return fallback

    try {
        const value = storage.getItem(key)
        return value ? JSON.parse(value) : fallback
    } catch {
        return fallback
    }
}

export const writeStorage = (key, value) => {
    const storage = getStorage()
    if (!storage) return

    try {
        storage.setItem(key, JSON.stringify(value))
    } catch {
    }
}

export const removeStorage = (key) => {
    const storage = getStorage()
    if (!storage) return

    try {
        storage.removeItem(key)
    } catch {
    }
}
