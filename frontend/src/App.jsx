import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { api } from "./lib/api";

const COLORS = ["#2563eb", "#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];
const EXPENSE_CATEGORIES = [
  { id: 1, name: "Alimentación" },
  { id: 2, name: "Transporte" },
  { id: 3, name: "Servicios" },
  { id: 4, name: "Educación" },
  { id: 5, name: "Ocio" },
  { id: 6, name: "Salud" },
  { id: 7, name: "Vivienda" },
  { id: 8, name: "Otros" },
];



function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function money(n) {
  return `S/ ${Number(n || 0).toFixed(2)}`;
}

export default function App() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [section, setSection] = useState("overview");
  const [budgets, setBudgets] = useState([]);
  const [token, setToken] = useState(() => localStorage.getItem("mimes_token") || "");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("mimes_user") || "null");
    } catch {
      return null;
    }
  });

  async function removeTx(id) {
    if (!confirm("¿Estás seguro de querer eliminar este movimiento?")) return;
    try {
      await api.deleteTx(id);
      await refresh(month);
    } catch (e) {
      setError(e.message || "No se pudo eliminar");
    }
  }

  async function refresh(m = month) {
    setLoading(true);
    setError("");
    try {
      const [s, list, b] = await Promise.all([
        api.summary(m),
        api.listTx(m),
        api.budgets(m),
      ]);
      setSummary(s);
      setRows(list);
      setBudgets(b);
    } catch (e) {
      const msg = e.message || "No se pudo cargar el resumen";
      setError(msg);
      setSummary(null);
      setRows([]);
      setBudgets([]);
      if (msg.includes("Sesión expirada") || !localStorage.getItem("mimes_token")) {
        setToken("");
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) refresh(month);
  }, [month, token]);

  const maxCat = Math.max(1, ...(summary?.byCat || []).map((c) => c.total));

  if (!token) {
    return (
      <LoginScreen
        onAuth={({ token: nextToken, user: nextUser }) => {
          localStorage.setItem("mimes_token", nextToken);
          localStorage.setItem("mimes_user", JSON.stringify(nextUser));
          setToken(nextToken);
          setUser(nextUser);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-[var(--line)] bg-white p-4 transition lg:static lg:translate-x-0 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8">
          <div className="text-xs font-semibold tracking-[0.2em] text-[var(--brand)]">MIMES</div>
          <h1 className="mt-1 text-xl font-bold">Gastos & control</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Local · mes a mes</p>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          {[
            ["overview", "Overview"],
            ["add", "Anotar gasto"],
            ["budgets", "Topes"],
            ["tips", "Ahorrar este mes"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setSection(id);
                setNavOpen(false);
              }}
              className={`rounded-lg px-3 py-2 text-left ${
                section === id ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand)]" : "hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className="mt-4 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          onClick={() => {
            localStorage.removeItem("mimes_token");
            localStorage.removeItem("mimes_user");
            setToken("");
            setUser(null);
          }}
        >
          Cerrar sesión ({user?.name})
        </button>
      </aside>

      {navOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}

      <main className="min-w-0 p-4 sm:p-6">
        <header className="mb-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 lg:hidden"
            onClick={() => setNavOpen(true)}
          >
            ☰
          </button>
          <div className="mr-auto">
            <h2 className="text-2xl font-bold tracking-tight">
              {section === "overview" && "Overview"}
              {section === "add" && "Anotar gasto"}
              {section === "budgets" && "Topes del mes"}
              {section === "tips" && "Dónde ahorrar"}
            </h2>
            <p className="text-sm text-[var(--muted)]">Mirá en qué se te va la plata y anotá al momento</p>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm">
            <span className="text-[var(--muted)]">Mes</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border-0 bg-transparent outline-none"
            />
          </label>
        </header>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {section === "overview" && (
          <>
            {budgets.some((b) => b.over) && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Pasaste el tope en:{" "}
                {budgets.filter((b) => b.over).map((b) => b.category_name).join(", ")}
              </div>
            )}

            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <Stat title="Ingresos" value={money(summary?.total_income)} />
              <Stat title="Gastos" value={money(summary?.total_expense)} accent="bad" />
              <Stat
                title="Ahorro"
                value={money(summary?.saving)}
                accent={(summary?.saving || 0) >= 0 ? "good" : "bad"}
              />
            </div>

            <div className="mb-4 grid gap-4 xl:grid-cols-[1.1fr_1fr]">
              <Panel title="Gastos por categoría">
                {loading ? (
                  <Empty>Cargando…</Empty>
                ) : summary?.byCat?.length ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={summary.byCat} dataKey="total" nameKey="name" innerRadius={48} outerRadius={80}>
                            {summary.byCat.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => money(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="space-y-2 self-center text-sm">
                      {summary.byCat.map((c, i) => (
                        <li key={c.name} className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: COLORS[i % COLORS.length] }}
                          />
                          <span className="flex-1 text-[var(--muted)]">{c.name}</span>
                          <strong>{money(c.total)}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <Empty>Sin gastos este mes. Anotá el primero.</Empty>
                )}
              </Panel>

              <Panel title="Tendencia del mes">
                {summary?.byDay?.length ? (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={summary.byDay}>
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(8)} />
                        <YAxis tick={{ fontSize: 11 }} width={40} />
                        <Tooltip formatter={(v) => money(v)} labelFormatter={(d) => d} />
                        <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <Empty>Cuando haya gastos diarios, acá ves el ritmo.</Empty>
                )}
              </Panel>
            </div>

            <Panel title="Detalle por categoría">
              {(summary?.byCat || []).length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                      <tr>
                        <th className="py-2 font-medium">Categoría</th>
                        <th className="py-2 font-medium">Total</th>
                        <th className="py-2 font-medium">Participación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.byCat.map((c) => {
                        const pct = summary.total_expense
                          ? Math.round((c.total / summary.total_expense) * 100)
                          : 0;
                        const bar = Math.round((c.total / maxCat) * 100);
                        return (
                          <tr key={c.name} className="border-b border-[var(--line)] last:border-0">
                            <td className="py-3 font-medium">{c.name}</td>
                            <td className="py-3">{money(c.total)}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <div className="h-2 flex-1 rounded-full bg-slate-100">
                                  <div
                                    className="h-2 rounded-full bg-[var(--brand)]"
                                    style={{ width: `${bar}%` }}
                                  />
                                </div>
                                <span className="w-10 text-right text-[var(--muted)]">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty>Todavía no hay categorías para mostrar.</Empty>
              )}
            </Panel>

            <Panel title="Últimos movimientos" className="mt-4">
              {rows.length ? (
                <ul className="divide-y divide-[var(--line)] text-sm">
                  {rows.slice(0, 12).map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center gap-2 py-3">
                      <span className="text-[var(--muted)]">{String(r.occurred_at).slice(0, 10)}</span>
                      <span className="font-medium">{r.description || "Sin descripción"}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-[var(--muted)]">
                        {r.category_name || "Sin categoría"}
                      </span>
                      <strong
                        className={`ml-auto ${r.type === "income" ? "text-[var(--good)]" : "text-[var(--bad)]"}`}
                      >
                        {r.type === "income" ? "+" : "-"}
                        {money(r.amount)}
                      </strong>
                      <button
                        type="button"
                        onClick={() => removeTx(r.id)}
                        className="rounded-lg border border-[var(--line)] px-2 py-1 text-xs text-[var(--muted)] hover:border-red-300 hover:text-red-600"
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>Sin movimientos.</Empty>
              )}
            </Panel>
          </>
        )}

        {section === "add" && <AddPanel onSaved={() => refresh(month)} />}

        {section === "budgets" && (
          <BudgetsPanel month={month} budgets={budgets} onSaved={() => refresh(month)} />
        )}

        {section === "tips" && (
          <Panel title="Consejos del mes (sin API key)">
            <ul className="space-y-3 text-sm leading-relaxed">
              {(summary?.tips || ["Cargá gastos para recibir tips."]).map((t) => (
                <li key={t} className="rounded-xl bg-[var(--brand-soft)] px-4 py-3 text-[var(--ink)]">
                  {t}
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </main>
    </div>
  );
}

function Stat({ title, value, accent }) {
  const color =
    accent === "good" ? "text-[var(--good)]" : accent === "bad" ? "text-[var(--bad)]" : "text-[var(--ink)]";
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
      <div className="text-sm text-[var(--muted)]">{title}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function Panel({ title, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm ${className}`}>
      <h3 className="mb-3 text-sm font-semibold tracking-wide text-[var(--muted)] uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Empty({ children }) {
  return <p className="py-10 text-center text-sm text-[var(--muted)]">{children}</p>;
}

function AddPanel({ onSaved }) {
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [txType, setTxType] = useState("expense");
  const [voiceText, setVoiceText] = useState("");
  const [listening, setListening] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveManual() {
    setBusy(true);
    setMsg("");
    try {
      await api.addTx({
        type: txType,
        amount: Number(amount),
        description: desc,
        occurred_at: new Date().toISOString().slice(0, 10),
      });
      setAmount("");
      setDesc("");
      setMsg(txType === "income" ? "Ingreso guardado." : "Gasto guardado.");
      onSaved?.();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveVoice(text) {
    const phrase = (text || voiceText).trim();
    if (!phrase) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await api.addVoice(phrase, new Date().toISOString().slice(0, 10));
      setVoiceText("");
      setMsg(`Listo: ${res.count} gasto(s) anotado(s).`);
      onSaved?.();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  function startListen() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMsg("Este navegador no soporta voz. Escribí la frase abajo (Chrome recomendado).");
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "es-PE";
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      setMsg("No se pudo escuchar. Probá de nuevo o escribí la frase.");
    };
    rec.onresult = (ev) => {
      const text = ev.results[0][0].transcript;
      setVoiceText(text);
      saveVoice(text);
    };
    rec.start();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Por voz (sin Alexa / sin API key)">
        <p className="mb-3 text-sm text-[var(--muted)]">
          Ejemplo: <em>gasté 2 soles en agua, 1 sol en comida, 10 soles en cerveza</em>
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={startListen}
            className={`rounded-xl px-4 py-3 font-semibold text-white ${
              listening ? "bg-[var(--bad)]" : "bg-[var(--brand)]"
            }`}
          >
            {listening ? "Escuchando…" : "Hablar ahora"}
          </button>
          <button
            type="button"
            disabled={busy || !voiceText.trim()}
            onClick={() => saveVoice()}
            className="rounded-xl border border-[var(--line)] bg-white px-4 py-3"
          >
            Guardar frase
          </button>
        </div>
        <textarea
          className="mt-3 min-h-24 w-full rounded-xl border border-[var(--line)] p-3 text-sm outline-none focus:border-[var(--brand)]"
          placeholder="O escribí la misma frase acá…"
          value={voiceText}
          onChange={(e) => setVoiceText(e.target.value)}
        />
        {msg && <p className="mt-3 text-sm text-[var(--muted)]">{msg}</p>}
      </Panel>

      <Panel title="Formulario rápido">
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setTxType("expense")}
            className={`rounded-xl px-4 py-2 ${
              txType === "expense" ? "bg-slate-900 text-white" : "border border-[var(--line)] bg-white"
            }`}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() => setTxType("income")}
            className={`rounded-xl px-4 py-2 ${
              txType === "income" ? "bg-emerald-700 text-white" : "border border-[var(--line)] bg-white"
            }`}
          >
            Ingreso
          </button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="w-full rounded-xl border border-[var(--line)] p-3 sm:w-28"
            placeholder="S/ 0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            className="w-full flex-1 rounded-xl border border-[var(--line)] p-3"
            placeholder={txType === "income" ? "Ej. sueldo" : "Ej. almuerzo"}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={saveManual}
            className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white"
          >
            Guardar
          </button>
        </div>
      </Panel>
    </div>
  );
}

function BudgetsPanel({ month, budgets, onSaved }) {
  const [categoryId, setCategoryId] = useState("5");
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      await api.setBudget({
        category_id: Number(categoryId),
        month,
        amount: Number(amount),
      });
      setAmount("");
      setMsg("Tope guardado.");
      onSaved?.();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Definir tope">
        <p className="mb-3 text-sm text-[var(--muted)]">
          Mes: <strong>{month}</strong>. Ej: Ocio máx S/ 100.
        </p>
        <div className="flex flex-col gap-2">
          <select
            className="rounded-xl border border-[var(--line)] p-3"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            className="rounded-xl border border-[var(--line)] p-3"
            placeholder="Tope S/ 0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={save}
            className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white"
          >
            Guardar tope
          </button>
          {msg && <p className="text-sm text-[var(--muted)]">{msg}</p>}
        </div>
      </Panel>

      <Panel title="Topes vs gastado">
        {budgets.length ? (
          <ul className="space-y-3 text-sm">
            {budgets.map((b) => {
              const pct = b.limit_amount
                ? Math.min(100, Math.round((b.spent / b.limit_amount) * 100))
                : 0;
              return (
                <li key={b.id} className="rounded-xl border border-[var(--line)] p-3">
                  <div className="mb-1 flex justify-between gap-2">
                    <strong>{b.category_name}</strong>
                    <span className={b.over ? "text-[var(--bad)]" : "text-[var(--muted)]"}>
                      {money(b.spent)} / {money(b.limit_amount)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${b.over ? "bg-[var(--bad)]" : "bg-[var(--brand)]"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {b.over
                      ? `Pasaste por ${money(Math.abs(b.remaining))}`
                      : `Te quedan ${money(b.remaining)}`}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>Todavía no hay topes este mes.</Empty>
        )}
      </Panel>
    </div>
  );
}

function LoginScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const data =
        mode === "login"
          ? await api.login({ email, password })
          : await api.register({ name, email, password });
      onAuth(data);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm"
      >
        <div className="mb-1 text-xs font-semibold tracking-[0.2em] text-[var(--brand)]">MIMES</div>
        <h1 className="mb-4 text-xl font-bold">
          {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </h1>

        {mode === "register" && (
          <input
            className="mb-2 w-full rounded-xl border border-[var(--line)] p-3"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          className="mb-2 w-full rounded-xl border border-[var(--line)] p-3"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="mb-3 w-full rounded-xl border border-[var(--line)] p-3"
          type="password"
          placeholder="Contraseña (mín. 6)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-white"
        >
          {mode === "login" ? "Entrar" : "Registrarme"}
        </button>

        <button
          type="button"
          className="mt-3 w-full text-sm text-[var(--brand)]"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "¿No tenés cuenta? Registrate" : "Ya tengo cuenta"}
        </button>

        {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
      </form>
    </div>
  );
}
