import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API || "http://localhost:8000";

export default function App(){
  const [summary,setSummary] = useState(null);
  const month = new Date().toISOString().slice(0,7); // YYYY-MM

  useEffect(()=>{
    fetch(`${API}/api/tx/summary?month=${month}`).then(r=>r.json()).then(setSummary);
  },[]);

  return (
    <div className="min-h-screen max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">MiMes – Gastos & Rutina</h1>
      <p className="text-sm opacity-70">Mes: {month}</p>

      {summary && (
        <div className="grid grid-cols-3 gap-4 mt-4">
          <Card title="Ingresos" value={`S/ ${summary.total_income.toFixed(2)}`} />
          <Card title="Gastos" value={`S/ ${summary.total_expense.toFixed(2)}`} />
          <Card title="Ahorro" value={`S/ ${(summary.saving).toFixed(2)}`} />
        </div>
      )}

      <div className="mt-8">
        <h2 className="font-semibold">Agregar gasto rápido</h2>
        <QuickAdd />
      </div>
    </div>
  );
}

function Card({title,value}){
  return (
    <div className="rounded-2xl shadow p-4">
      <div className="text-sm opacity-70">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function QuickAdd(){
  const [amount,setAmount] = useState("");
  const [desc,setDesc] = useState("");
  const month = new Date().toISOString().slice(0,7);
  const API = import.meta.env.VITE_API || "http://localhost:8000";

  async function save(){
    const occurred_at = new Date().toISOString().slice(0,10);
    await fetch(`${API}/api/tx`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ type:"expense", amount:Number(amount), description:desc, occurred_at })
    });
    setAmount(""); setDesc("");
    // opcional: toast
  }

  return (
    <div className="flex gap-2 mt-2">
      <input className="border p-2 rounded w-24" placeholder="S/ 0.00" value={amount} onChange={e=>setAmount(e.target.value)} />
      <input className="border p-2 rounded flex-1" placeholder="Descripción (p.ej. almuerzo)" value={desc} onChange={e=>setDesc(e.target.value)} />
      <button className="px-4 py-2 rounded bg-black text-white" onClick={save}>Guardar</button>
    </div>
  );
}
