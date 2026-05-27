const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
export async function apiRequest(path, options = {}, token) {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Request failed");
    }
    return res.json();
}
