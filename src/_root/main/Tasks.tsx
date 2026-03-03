import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Image as ImageIcon,
  Leaf,
  MoreVertical,
  Plus,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import apiBack from "../../api/apiBack";
import { calculateReminderTime } from "../../lib/utils";
import NotesArea from "../components/NotesArea";

// --- Tipagens ---
export interface Reminder {
  id: string;
  time: string;
  taskId: string;
}
type TaskType = "HEALTH" | "WORK";

export enum TaskPriority {
  URGENT = "URGENT",
  PRIORITY = "PRIORITY",
  DATED = "DATED",
  NODATE = "NODATE",
}

export interface Task {
  id: string;
  type: TaskType;
  status: boolean;
  name: string;
  description?: string | null;
  image?: string | null;
  date?: string | null;
  isPriority: TaskPriority | boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  reminders: Reminder[];
}

const PRIORITY_CONFIG = {
  [TaskPriority.URGENT]: {
    label: "Urgente",
    color: "bg-rose-500",
    border: "border-rose-500",
    text: "text-rose-600",
    light: "bg-rose-50",
    icon: <Flame size={16} />,
    weight: 1,
  },
  [TaskPriority.PRIORITY]: {
    label: "Focar",
    color: "bg-amber-500",
    border: "border-amber-500",
    text: "text-amber-600",
    light: "bg-amber-50",
    icon: <Zap size={16} />,
    weight: 2,
  },
  [TaskPriority.DATED]: {
    label: "Prazo",
    color: "bg-sky-500",
    border: "border-sky-500",
    text: "text-sky-600",
    light: "bg-sky-50",
    icon: <Clock size={16} />,
    weight: 3,
  },
  [TaskPriority.NODATE]: {
    label: "Rotina",
    color: "bg-emerald-500",
    border: "border-emerald-500",
    text: "text-emerald-600",
    light: "bg-emerald-50",
    icon: <Leaf size={16} />,
    weight: 4,
  },
};

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
  const [completingIds, setCompletingIds] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>(
    TaskPriority.PRIORITY,
  );
  const [reminderType, setReminderType] = useState("1day");
  const [imageStr, setImageStr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    setNotes(localStorage.getItem("notes-v4") || "");
  }, []);

  useEffect(() => localStorage.setItem("notes-v4", notes), [notes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const reminderTime = calculateReminderTime(dueDate, reminderType);
    const isPriority = selectedPriority;

    const payload = {
      name: title,
      type: "WORK" as TaskType,
      description: description || undefined,
      image: imageStr || undefined,
      date:
        selectedPriority !== TaskPriority.NODATE && dueDate
          ? new Date(`${dueDate}T00:00:00`)
          : undefined,
      isPriority,
      reminderTime,
    };

    try {
      if (editingId) {
        await apiBack.put(`private/tasks/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setTasks((prev) =>
          prev.map((t) =>
            t.id === editingId
              ? {
                  ...t,
                  ...payload,
                  date: payload.date ? payload.date.toISOString() : null,
                  image: imageStr,
                }
              : t,
          ),
        );
      } else {
        const res = await apiBack.post("private/tasks", payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setTasks((prev) => [res.data, ...prev]);
      }
      resetForm();
    } catch (err) {
      console.error("Erro ao salvar tarefa", err);
    }
  };

  const handleEditClick = (task: Task) => {
    setEditingId(task.id);
    setTitle(task.name);
    setDescription(task.description || "");
    setDueDate(
      task.date ? new Date(task.date).toISOString().split("T")[0] : "",
    );
    setReminderType("1day");
    setImageStr(task.image || null);

    const prioValue = Object.values(TaskPriority).includes(
      task.isPriority as any,
    )
      ? (task.isPriority as TaskPriority)
      : task.isPriority === true
      ? TaskPriority.URGENT
      : task.date
      ? TaskPriority.DATED
      : TaskPriority.NODATE;
    setSelectedPriority(prioValue);

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleTaskStatus = (id: string) => {
    setCompletingIds((prev) => [...prev, id]);
    setTimeout(async () => {
      try {
        const task = tasks.find((t) => t.id === id);
        if (!task) return;
        await apiBack.put(
          `private/tasks/${id}`,
          { status: !task.status },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        const updatedTasks = tasks.map((t) => {
          if (t.id === id) return { ...t, status: !t.status };
          return t;
        });
        setTasks(updatedTasks);
      } catch (err) {
        console.error(err);
      } finally {
        setCompletingIds((prev) => prev.filter((curr) => curr !== id));
      }
    }, 850);
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
    setReminderType("1day");
    setImageStr(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Por favor, selecione um arquivo de imagem.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageStr(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processedTasks = useMemo(() => {
    return tasks
      .filter((t) => (filter === null ? true : t.status === filter))
      .sort((a, b) => {
        const getW = (t: Task) => {
          if (Object.values(TaskPriority).includes(t.isPriority as any)) {
            return PRIORITY_CONFIG[t.isPriority as TaskPriority].weight;
          }
          return t.isPriority === true ? 1 : t.date ? 3 : 2;
        };
        return getW(a) - getW(b);
      });
  }, [tasks, filter]);

  return (
    <div className="bg-background text-foreground font-sans selection:bg-primary/30">
      <div className="w-full mx-auto  gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-8">
          {/* Dashboard Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <h1 className="font-neusharp text-2xl text-foreground tracking-tighter italic">
                Dashboard de Tarefas
              </h1>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <div className="flex bg-card border border-border p-1 rounded-2xl shadow-sm min-w-max">
                {[
                  { val: null, label: "Tudo" },
                  { val: false, label: "Pendentes" },
                  { val: true, label: "Concluídas" },
                ].map((f) => (
                  <button
                    key={String(f.val)}
                    onClick={() => setFilter(f.val as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      filter === f.val
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  if (showForm) resetForm();
                  else setShowForm(true);
                }}
                className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-3 sm:py-2.5 rounded-2xl font-bold transition-all active:scale-95 text-sm md:text-base"
              >
                {showForm ? <X size={18} /> : <Plus size={18} />}
                {showForm ? "Fechar" : "Nova Tarefa"}
              </button>
            </div>
          </header>

          {/* Form Overlay/Section */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border rounded-[2.5rem] p-6 lg:p-8 shadow-xl relative overflow-hidden"
              >
                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                        O que precisa ser feito?
                      </label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Finalizar apresentação do projeto"
                        className="w-full bg-background border border-input focus:border-primary rounded-2xl px-6 py-4 outline-none transition-all font-bold text-lg text-foreground placeholder:text-muted-foreground/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                        Prioridade
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map(
                          (p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setSelectedPriority(p)}
                              className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border ${
                                selectedPriority === p
                                  ? `${PRIORITY_CONFIG[p].border} ${PRIORITY_CONFIG[p].light} shadow-sm`
                                  : "border-border bg-background text-muted-foreground opacity-60 hover:opacity-100"
                              }`}
                            >
                              <span
                                className={
                                  selectedPriority === p
                                    ? PRIORITY_CONFIG[p].text
                                    : ""
                                }
                              >
                                {PRIORITY_CONFIG[p].icon}
                              </span>
                              <span className="text-[10px] font-black uppercase tracking-tighter">
                                {PRIORITY_CONFIG[p].label}
                              </span>
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                        Detalhes (Opcional)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva brevemente os passos..."
                        className="w-full bg-background border border-input focus:border-primary rounded-2xl px-6 py-3 outline-none transition-all h-[80px] resize-none font-medium text-sm text-foreground placeholder:text-muted-foreground/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {selectedPriority !== TaskPriority.NODATE ? (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                            Prazo
                          </label>
                          <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full bg-background border border-input focus:border-primary rounded-2xl px-4 py-3 outline-none transition-all font-bold text-sm text-foreground"
                          />
                        </div>
                      ) : (
                        <div />
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                          Lembrete
                        </label>
                        <select
                          value={reminderType}
                          onChange={(e) => setReminderType(e.target.value)}
                          className="w-full bg-background border border-input focus:border-primary rounded-2xl px-4 py-3 outline-none transition-all font-bold text-sm text-foreground"
                        >
                          {reminderOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                      <div className="w-full sm:flex-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`flex items-center gap-2 text-xs font-bold px-4 py-3 rounded-2xl transition-all w-full justify-center border ${
                            imageStr
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "text-muted-foreground bg-secondary hover:bg-secondary/80 border-border"
                          }`}
                        >
                          <ImageIcon size={16} />
                          <span className="truncate">
                            {imageStr ? "Anexo OK!" : "Anexar"}
                          </span>
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full sm:flex-[2] bg-primary text-primary-foreground px-8 py-3 rounded-2xl font-black text-sm hover:bg-primary/90 transition-all shadow-lg active:scale-95"
                      >
                        {editingId ? "SALVAR TAREFA" : "CRIAR TAREFA"}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Task Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative">
            <AnimatePresence mode="popLayout">
              {processedTasks.map((task) => {
                const configKey = Object.values(TaskPriority).includes(
                  task.isPriority as any,
                )
                  ? (task.isPriority as TaskPriority)
                  : task.isPriority === true
                  ? TaskPriority.URGENT
                  : task.date
                  ? TaskPriority.DATED
                  : TaskPriority.NODATE;
                const config =
                  PRIORITY_CONFIG[configKey] ||
                  PRIORITY_CONFIG[TaskPriority.PRIORITY];

                return (
                  <motion.div
                    key={task.id}
                    layout
                    variants={{
                      initial: { opacity: 0, y: 20 },
                      animate: { opacity: 1, y: 0 },
                      exit: {
                        opacity: 0,
                        scale: 0.1,
                        rotate: 1080,
                        y: 500,
                        transition: { duration: 0.85, ease: "easeInOut" },
                      },
                    }}
                    initial="initial"
                    animate="animate"
                    exit={
                      completingIds.includes(task.id) ? "exit" : { opacity: 0 }
                    }
                    className={`group bg-card text-card-foreground rounded-[2rem] border border-border p-6 flex flex-col justify-between shadow-sm hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                      task.status ? "opacity-60 bg-muted/30" : ""
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${config.color} text-white`}
                        >
                          {config.label}
                        </div>
                        <button
                          onClick={() => toggleTaskStatus(task.id)}
                          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                            task.status
                              ? "bg-primary border-primary"
                              : "border-border hover:border-primary/40 shadow-inner bg-background"
                          }`}
                        >
                          {task.status ? (
                            <Check
                              size={20}
                              className="text-primary-foreground"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-border" />
                          )}
                        </button>
                      </div>

                      <div className="space-y-2 min-w-0">
                        <h3
                          className={`text-lg md:text-xl font-bold leading-tight tracking-tight break-words ${
                            task.status
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {task.name}
                        </h3>
                        {task.description && (
                          <p
                            className={`text-xs font-medium line-clamp-3 leading-relaxed break-words ${
                              task.status
                                ? "text-muted-foreground"
                                : "text-muted-foreground/80"
                            }`}
                          >
                            {task.description}
                          </p>
                        )}
                        {task.image && (
                          <div className="pt-2">
                            <a
                              href={task.image}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={task.image}
                                alt="Anexo"
                                className="w-full h-24 object-cover rounded-xl border border-border opacity-80 group-hover:opacity-100 transition-opacity"
                              />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {task.date && (
                          <div
                            className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md border ${
                              task.status
                                ? "bg-background border-border text-muted-foreground"
                                : "bg-secondary border-border text-secondary-foreground"
                            }`}
                          >
                            <Calendar size={12} />
                            {new Date(task.date).toLocaleDateString("pt-BR")}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(task)}
                          className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
                        >
                          <MoreVertical size={16} />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-all border border-transparent hover:border-destructive/20"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {processedTasks.length === 0 && !loading && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                <div className="bg-primary/10 border border-primary/20 p-6 rounded-full mb-4">
                  <CheckCircle2
                    size={48}
                    strokeWidth={1}
                    className="text-primary/60"
                  />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Área Limpa
                </h3>
                <p className="text-sm font-medium text-muted-foreground mt-2">
                  Nenhuma tarefa encontrada neste filtro.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar / Notes Area */}
        <NotesArea notes={notes} setNotes={setNotes} />
      </div>
    </div>
  );
};

export default TaskManager;
