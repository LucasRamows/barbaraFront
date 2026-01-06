import {
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import apiBack from "../../api/apiBack";

const App = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [installment, setinstallment] = useState("1x");
  const [category, setCategory] = useState("Moradia");
  const token = localStorage.getItem("token");
  const [currentDate, setCurrentDate] = useState(new Date());

  const categories = [
    "Moradia",
    "Alimentação",
    "Lanches/IFD",
    "Autocuidado",
    "Transporte",
    "Moto",
    "Lazer",
    "Saúde",
    "Educação",
    "Infra/Tec",
    "Salário",
    "Investimentos",
    "Familia",
    "Outros",
  ];

  const installments = ["1x", "2x", "3x", "4x", "5x"];

  type TransactionType = "income" | "expense" | "credit";

  type Transaction = {
    id: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    timestamp: string;
    dateDisplay: string;
  };

  async function loadTransactions() {
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      const response = await apiBack.get("/private/transactions", {
        params: { month, year },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const formatted: Transaction[] = response.data.map((t: any) => ({
        id: String(t.id),
        description: t.description,
        amount: Number(t.amount),
        type: t.type.toLowerCase() as TransactionType,
        category: t.category,
        timestamp: t.date,
        dateDisplay: new Date(t.date).toLocaleDateString("pt-BR"),
      }));

      setTransactions(formatted);
    } catch (error) {
      console.error("Erro ao carregar transações", error);
    }
  }

  useEffect(() => {
    if (token) loadTransactions();
  }, [token, currentDate]);

  // Navegação de meses
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
    loadTransactions();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
    loadTransactions();
  };

  const monthLabel = currentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const filteredTransactions = useMemo<Transaction[]>(() => {
    return transactions.filter((t) => {
      const tDate = new Date(t.timestamp);
      return (
        tDate.getMonth() === currentDate.getMonth() &&
        tDate.getFullYear() === currentDate.getFullYear()
      );
    });
  }, [transactions, currentDate]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0);
    const expense = filteredTransactions
      .filter((t) => t.type === "expense" && "credit")
      .reduce((acc, t) => acc + t.amount, 0);
    const creditTotal = filteredTransactions
      .filter((t) => t.type === "credit")
      .reduce((acc, t) => acc + t.amount, 0);
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    const catMap: Record<string, number> = {};
    const catInc: Record<string, number> = {};

    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });

    filteredTransactions
      .filter((t) => t.type === "credit")
      .forEach((t) => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });

    filteredTransactions
      .filter((t) => t.type === "income")
      .forEach((t) => {
        catInc[t.category] = (catInc[t.category] || 0) + t.amount;
      });

    const topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

    return {
      income,
      expense,
      creditTotal,
      balance: income - expense - creditTotal,
      savingsRate,
      topCategory,
      catMap,
      catInc,
    };
  }, [filteredTransactions]);

  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!description || !amount) return;

    const baseAmount = parseFloat(amount);
    const numInstallments = parseInt(installment.replace("x", "")) || 1;
    const valuePerInstallment = baseAmount / numInstallments;

    const iterations = type === "credit" ? numInstallments : 1;

    for (let i = 0; i < iterations; i++) {
      const transactionDate = new Date(currentDate);
      transactionDate.setMonth(currentDate.getMonth() + i);

      const payload = {
        description:
          iterations > 1
            ? `${description} (${i + 1}/${numInstallments})`
            : description,
        amount: type === "credit" ? valuePerInstallment : baseAmount,
        type: type.toUpperCase(),
        category: category,
        date: transactionDate.toISOString(),
      };

      try {
        await apiBack.post("/private/transactions", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Erro ao salvar parcela", i, err);
      }
    }

    setDescription("");
    setAmount("");
    setinstallment("1x");
    loadTransactions();
  };
  const handleDeleteTransaction = async (id: string) => {
    try {
      await apiBack.delete(`/private/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Erro ao deletar parcela", err);
    }
    setTransactions(transactions.filter((x) => x.id !== id));
  };
  const formatCurrency = (val: number): string =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  return (
    <div className="min-h-screen font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header & Mês */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-neusharp text-2xl text-primary tracking-tighter italic">
              Dashboard Financeiro
            </h1>
          </div>

          <div className="flex justify-between items-center  bg-card shadow-sm border border-card rounded-xl p-1">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="px-6 font-bold text-indigo-700 capitalize min-w-[150px] text-center">
              {monthLabel}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Resumo e Insights Rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card p-5 rounded-2xl border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <TrendingUp size={18} />
              </div>
              <span className="text-sm font-medium text-slate-500">
                Receitas
              </span>
            </div>
            <p className="text-xl font-bold text-emerald-600">
              {formatCurrency(stats.income)}
            </p>
          </div>

          <div className="bg-card p-5 rounded-2xl border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                <TrendingDown size={18} />
              </div>
              <span className="text-sm font-medium text-slate-500">
                Despesas
              </span>
            </div>
            <p className="text-xl font-bold text-rose-600">
              {formatCurrency(stats.expense)}
            </p>
          </div>

          <div className="bg-card p-5 rounded-2xl border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <CreditCard size={18} />
              </div>
              <span className="text-sm font-medium text-slate-500">
                Cartão de Crédito
              </span>
            </div>
            <p className="text-xl font-bold text-indigo-600">
              {formatCurrency(stats.creditTotal)}
            </p>
          </div>

          <div className="bg-card p-5 rounded-2xl border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <AlertTriangle size={18} />
              </div>
              <span className="text-sm font-medium text-slate-500">
                Maior Gasto
              </span>
            </div>
            <p className="text-lg font-bold text-slate-800 truncate">
              {stats.topCategory ? stats.topCategory[0] : "Nenhum"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {stats.topCategory
                ? formatCurrency(stats.topCategory[1])
                : "R$ 0,00"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Adicionar e Gráfico */}
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-3xl border shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                Novo Registro
              </h2>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição"
                  className="w-full px-4 py-2 bg-muted border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Valor R$"
                  className="w-full px-4 py-2 bg-muted border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setType("expense")}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                      type === "expense"
                        ? "bg-rose-50 border-rose-200 text-rose-600"
                        : "bg-white border-slate-100 text-slate-400"
                    }`}
                  >
                    Débito
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("income")}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                      type === "income"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                        : "bg-white border-slate-100 text-slate-400"
                    }`}
                  >
                    Receita
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("credit")}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                      type === "credit"
                        ? "bg-blue-50 border-blue-200 text-blue-600"
                        : "bg-white border-slate-100 text-slate-400"
                    }`}
                  >
                    Crédito
                  </button>
                </div>
                {type === "credit" ? (
                  <select
                    value={installment}
                    onChange={(e) => setinstallment(e.target.value)}
                    className="w-full px-4 py-2 bg-muted border-none rounded-xl"
                  >
                    {installments.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : null}
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-muted border-none rounded-xl"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="w-full bg-muted text-white py-3 rounded-xl font-bold hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} /> Salvar
                </button>
              </form>
            </div>

            <div className="bg-card p-6 rounded-3xl border shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-indigo-500" /> Gastos por
                Categoria
              </h2>
              <div className="space-y-3">
                {Object.entries(stats.catMap).length > 0 ? (
                  Object.entries(stats.catMap).map(([cat, val]) => (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">{cat}</span>
                        <span className="font-bold">{formatCurrency(val)}</span>
                      </div>
                      <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-400 h-full"
                          style={{ width: `${(val / stats.expense) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-400 text-sm py-4">
                    Sem dados de gastos
                  </p>
                )}
              </div>
            </div>
            <div className="bg-card p-6 rounded-3xl border shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-indigo-500" /> Receita por
                Categoria
              </h2>
              <div className="space-y-3">
                {Object.entries(stats.catInc).length > 0 ? (
                  Object.entries(stats.catInc).map(([cat, val]) => (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">{cat}</span>
                        <span className="font-bold">{formatCurrency(val)}</span>
                      </div>
                      <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-green-500 h-full"
                          style={{ width: `${(val / stats.income) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-400 text-sm py-4">
                    Sem receita
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Histórico do Mês */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-muted flex items-center justify-between">
                <h2 className="font-bold text-lg">De {monthLabel}</h2>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    stats.balance >= 0
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {formatCurrency(stats.balance)}
                </div>
              </div>
              <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                {filteredTransactions.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    Nenhum registro encontrado para este mês.
                  </div>
                ) : (
                  filteredTransactions.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            t.type === "income"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {t.type === "income" ? (
                            <TrendingUp size={18} />
                          ) : (
                            <TrendingDown size={18} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">
                            {t.description}
                          </h4>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                            {t.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`font-bold ${
                            t.type === "income"
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {t.type === "income" ? "+" : "-"}{" "}
                          {formatCurrency(t.amount)}
                        </span>
                        <button
                          onClick={
                            () =>
                              handleDeleteTransaction(t.id)
                            //votar
                          }
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
