import {
  Bell,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import apiBack from "../../api/apiBack";
import { calculateReminderTime } from "../../lib/utils";

export interface Reminder {
  id: string;
  time: string; // DateTime vindo da API geralmente vem como ISO string
  taskId: string;
}

type TaskType = "HEALTH" | "WORK";
export interface Task {
  id: string;
  type: TaskType;
  status: boolean;
  name: string;
  description?: string | null;
  date?: string | null;
  isPriority: boolean;
  createdAt: string;
  updatedAt: string;

  userId: string;
  reminders: Reminder[];
}
const reminderOptions = [
  { key: "3days", label: "3 dias antes" },
  { key: "1day", label: "1 dia antes" },
  { key: "1week", label: "1 semana antes" },
  { key: "1month", label: "1 mês antes" },
];

const TaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<boolean | null>(null);

  // Estados do Formulário
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [reminderType, setReminderType] = useState("WORK");

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await apiBack.get("private/tasks", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const onlyWorkTasks = Array.isArray(res.data)
        ? res.data.filter((task: Task) => task.type === "WORK")
        : [];

      setTasks(onlyWorkTasks);
    } catch (err) {
      console.error("Erro ao buscar tarefas", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async (e: any) => {
    e.preventDefault();
    if (!title) return;
    const reminderTime = calculateReminderTime(dueDate, reminderType);
    const newTask = {
      name: title,
      type: "WORK" as TaskType,
      description: description || undefined,
      date: dueDate ? new Date(`${dueDate}T00:00:00`) : undefined,
      isPriority: false,
      reminderTime,
    };

    try {
      const res = await apiBack.post("private/tasks", newTask, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setTasks((prev) => [res.data, ...prev]);
      resetForm();
    } catch (err) {
      console.error("Erro ao salvar tarefa", err);
    }
  };

  const toggleTaskStatus = async (id: string) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === id)
        return { ...t, status: t.status === true ? false : true };
      return t;
    });
    setTasks(updatedTasks);
    // Aqui enviaria o PUT para o backend
  };

  const deleteTask = async (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
    try {
      await apiBack.delete(`private/tasks/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setReminderType("daily");
    setShowForm(false);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === true) return t.status === true;
    if (filter === false) return t.status === false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 font-sans selection:bg-blue-500/30">
      <div className="w-full mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-white/5 pb-10">
          <div>
            <h1 className="font-neusharp text-2xl text-primary tracking-tighter italic">
              Minhas Tarefas
            </h1>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-foreground hover:bg-foreground text-secondary px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus size={20} /> NOVA TAREFA
          </button>
        </header>

        {/* Formulário de Nova Tarefa */}
        {showForm && (
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 mb-10 animate-in fade-in zoom-in duration-300">
            <form onSubmit={handleAddTask} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">
                    Título da Tarefa
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Revisar contrato de segurança"
                    className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">
                    Data de Vencimento
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
                      size={18}
                    />
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">
                  Descrição / Notas
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes adicionais sobre a tarefa..."
                  rows={3}
                  className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">
                    Lembrete
                  </label>

                  <div className="flex gap-2 flex-wrap">
                    {reminderOptions.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setReminderType(key)}
                        className={`px-4 py-3 rounded-xl border font-medium transition-all ${
                          reminderType === key
                            ? "bg-blue-600/20 border-blue-500 text-blue-400"
                            : "bg-black border-white/10 text-neutral-500 hover:border-white/20"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-white text-black hover:bg-neutral-200 py-4 rounded-2xl font-bold transition-all"
                  >
                    CRIAR AGORA
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Filtros */}
        <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter(null)}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              filter === null
                ? "bg-white text-black"
                : "bg-white/5 text-neutral-500"
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter(false)}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              filter === false
                ? "bg-blue-500/20 text-blue-400"
                : "bg-white/5 text-neutral-500"
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilter(true)}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              filter === true
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-white/5 text-neutral-500"
            }`}
          >
            Concluídas
          </button>
        </div>

        {/* Lista de Tarefas */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20 text-neutral-600 animate-pulse">
              Carregando tarefas...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
              <div className="bg-neutral-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-600">
                <Clock size={32} />
              </div>
              <h3 className="text-white font-bold text-lg">
                Nenhuma tarefa encontrada
              </h3>
              <p className="text-neutral-500">
                Comece criando uma nova tarefa para se organizar.
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`group bg-white/5 hover:bg-white/[0.08] p-6 rounded-[2rem] border transition-all duration-300 flex items-start gap-5 ${
                  task.status === true
                    ? "border-white/5 opacity-60"
                    : "border-white/5 hover:border-blue-500/30"
                }`}
              >
                <button
                  onClick={() => toggleTaskStatus(task.id)}
                  className={`mt-1 transition-colors ${
                    task.status === true
                      ? "text-blue-500"
                      : "text-neutral-600 hover:text-blue-400"
                  }`}
                >
                  {task.status === true ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <Circle size={24} />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={`text-lg font-bold leading-tight truncate ${
                        task.status === true
                          ? "line-through text-neutral-500"
                          : "text-white"
                      }`}
                    >
                      {task.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button className="text-neutral-700 hover:text-white transition-colors">
                        <MoreVertical size={18} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-neutral-700 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-neutral-500 text-sm mb-4 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black rounded-lg border border-white/5 text-neutral-400">
                      <Calendar size={14} />
                      {task.date
                        ? new Date(task.date).toLocaleDateString("pt-BR")
                        : "Sem data"}
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 rounded-lg text-blue-400">
                      <Bell size={14} />
                      {task.type === "HEALTH"
                        ? "Saúde"
                        : task.type === "WORK"
                        ? "Trabalho"
                        : "Outro"}
                    </div>

                    {task.status === false && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 rounded-lg text-amber-500">
                        <Clock size={14} />
                        Em aberto
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskManager;
