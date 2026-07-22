const configuredApi = (import.meta.env.VITE_API || "").replace(/\/$/, "");
const productionApi = "https://mimes.onrender.com";
const isBadApi =
  !configuredApi ||
  configuredApi.includes("api.example.com") ||
  configuredApi.includes("sistema-inventario");
const API = isBadApi
  ? import.meta.env.DEV
    ? "http://localhost:8000"
    : productionApi
  : configuredApi;

function getToken() {
  return localStorage.getItem("mimes_token") || "";
}

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
  }
  return data;
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  register: (body) =>
    fetch(`${API}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handle),

  login: (body) =>
    fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handle),

  summary: (month) =>
    fetch(`${API}/api/tx/summary?month=${month}`, {
      headers: authHeaders(),
    }).then(handle),

  listTx: (month) =>
    fetch(`${API}/api/tx?month=${month}`, {
      headers: authHeaders(),
    }).then(handle),

  addTx: (body) =>
    fetch(`${API}/api/tx`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }).then(handle),

  addVoice: (text, occurred_at) =>
    fetch(`${API}/api/tx/voice`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ text, occurred_at }),
    }).then(handle),

  deleteTx: (id) =>
    fetch(`${API}/api/tx/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then(handle),

  budgets: (month) =>
    fetch(`${API}/api/budgets?month=${month}`, {
      headers: authHeaders(),
    }).then(handle),

  setBudget: (body) =>
    fetch(`${API}/api/budgets`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }).then(handle),
};
