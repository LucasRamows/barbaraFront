import {
  Bell,
  Calendar,
  ClipboardList,
  Info,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import apiBack from "../../api/apiBack";

interface HealthExam {
  id: string;
  title: string;
  date: string;
  category: string;
  note: string;
}

interface Tasks {
  id: string;
  name: string;
  type: string;
  description: string;
  date: Date;
  isPriority: string;
}

const HealthModule: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setisEditModalOpen] = useState(false);
  const token = localStorage.getItem("token");
  const [exams, setExams] = useState<HealthExam[]>([]);
  const [editExams, setEditExams] = useState<HealthExam>();
  const [newTask, setNewTask] = useState({
    name: "",
    type: "HEALTH",
    description: "",
    date: "",
  });
  const [task, setTask] = useState<Tasks[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data } = await apiBack.get<HealthExam[]>(`/private/health`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setExams(data);
        console.log("Notas carregadas:", data);
      } catch (error) {
        console.error("Erro ao buscar notas:", error);
      }
    };
    const fetchTasks = async () => {
      try {
        const { data } = await apiBack.get<Tasks[]>(`/private/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const onlyHealthTasks = Array.isArray(data)
          ? data.filter((task: Tasks) => task.type === "HEALTH")
          : [];
        setTask(onlyHealthTasks);
        console.log("Notas carregadas:", onlyHealthTasks);
      } catch (error) {
        console.error("Erro ao buscar notas:", error);
      }
    };
    if (token) {
      fetchExams();
      fetchTasks();
    }
  }, [token]);

  const [newExam, setNewExam] = useState({
    title: "",
    date: "",
    category: "",
    note: "",
  });

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const examToAdd = {
      ...newExam,
      id: Math.random().toString(36).substr(2, 9),
    };
    try {
      console.log(newExam);
      await apiBack.post<HealthExam[]>(`/private/health`, newExam, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Erro ao salvar exam:", error);
    }

    setExams([examToAdd, ...exams]);
    setIsModalOpen(false);
    setNewExam({ title: "", date: "", category: "", note: "" });
  };
  const handleDeleteExam = async (id: string) => {
    try {
      await apiBack.delete(`/private/health/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Erro ao deletar exam:", error);
    }
    setExams(exams.filter((x) => x.id !== id));
  };
  const handleCreateReminder = async () => {
    setLoading(true);
    if (!newTask.name || !newTask.date) return;
    try {
      await apiBack.post(
        `/private/tasks/`,
        {
          name: newTask.name,
          type: newTask.type,
          description: "",
          isPriority: false,
          date: newTask.date,
          reminderTime: newTask.date,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } catch (error) {
      console.error("Erro ao processar criação:", error);
    } finally {
      setNewTask({ name: "", type: "HEALTH", description: "", date: "" });
      setLoading(false);
    }
  };
  const handleDeleteTask = async (id: string) => {
    try {
      await apiBack.delete(`/private/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Erro ao processar remoção:", error);
    } finally {
      setTask(task.filter((x) => x.id !== id));
    }
  };
  const onEdit = async (exam: HealthExam) => {
    setisEditModalOpen(true);
    setEditExams(exam);
  };

  const handleEditExam = async (id: string) => {
    try {
      await apiBack.put(`/private/health/${id}`, editExams, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Erro ao editar exam:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-poppins relative">
      {/* HEADER */}
      <header className="mb-8">
        <h1 className="font-neusharp text-2xl text-primary tracking-tighter italic">
          Sáude
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* COLUNA: LISTA DE EXAMES */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-neusharp text-xl flex items-center gap-2 italic">
              <ClipboardList className="text-primary" size={20} /> MEUS EXAMES
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-neusharp italic text-sm hover:scale-105 transition-transform"
            >
              <Plus size={16} /> ADICIONAR
            </button>
          </div>

          <div className="space-y-4">
            {exams && exams.length > 0 ? (
              exams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-1">
                      <h3 className="font-bold uppercase text-base text-card-foreground">
                        {exam.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar size={14} />
                        {exam.date.substring(8, 10)}/{exam.date.substring(5, 7)}
                        /{exam.date.substring(0, 4)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[10px] bg-secondary px-3 py-1 rounded-full font-bold text-secondary-foreground italic border border-border">
                        {exam.category}
                      </span>
                      {/* Espaço para botões de ação se necessário */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEdit(exam)}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {exam.note && (
                    <div className="bg-background/40 p-3 rounded-xl border border-border/50 flex gap-3 mt-3">
                      <Info size={16} className="text-primary shrink-0" />
                      <p className="text-xs italic leading-relaxed text-muted-foreground">
                        {exam.note}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-10 border border-dashed border-border rounded-2xl text-muted-foreground">
                <p className="text-sm">Nenhum registro de saúde encontrado.</p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-neusharp text-xl flex items-center gap-2 italic">
            <Bell className="text-primary" size={20} /> LEMBRETES & CUIDADOS
          </h2>

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="space-y-4">
              {/* Input de Texto */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground px-1">
                  O que você precisa fazer?
                </label>
                <input
                  type="text"
                  value={newTask.name}
                  onChange={(e) =>
                    setNewTask({ ...newTask, name: e.target.value })
                  }
                  placeholder="Ex: Tomar Creatina, Beber 3L água..."
                  className="w-full bg-secondary/50 border border-input p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground px-1">
                    Data/Hora
                  </label>
                  <input
                    type="datetime-local"
                    value={newTask.date}
                    onChange={(e) =>
                      setNewTask({ ...newTask, date: e.target.value })
                    }
                    className="w-full bg-secondary/50 border border-input p-2 rounded-lg text-xs outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleCreateReminder}
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground font-neusharp py-2 rounded-lg italic text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? "SALVANDO..." : "CRIAR AVISO"}
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Lembretes (Opcional - para visualização) */}
            {task.length > 0 && (
              <div className="mt-6 space-y-2 border-t border-border pt-4">
                {task.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-secondary/30 p-3 rounded-lg border border-border/50"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(item.date).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteTask(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* --- MODAL DE CADASTRO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/20">
              <h2 className="font-neusharp text-xl italic uppercase tracking-tighter">
                Novo Exame
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-background rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveExam} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                  Nome do Exame
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Ressonância Magnética"
                  className="w-full bg-background border border-input p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                  value={newExam.title}
                  onChange={(e) =>
                    setNewExam({ ...newExam, title: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                    Data
                  </label>
                  <input
                    required
                    type="date"
                    className="w-full bg-background border border-input p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                    value={newExam.date}
                    onChange={(e) =>
                      setNewExam({ ...newExam, date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Imagem"
                    className="w-full bg-background border border-input p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                    value={newExam.category}
                    onChange={(e) =>
                      setNewExam({ ...newExam, category: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                  Observações Importantes
                </label>
                <textarea
                  rows={3}
                  placeholder="Resultados, recomendações médicas, etc..."
                  className="w-full bg-background border border-input p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm resize-none"
                  value={newExam.note}
                  onChange={(e) =>
                    setNewExam({ ...newExam, note: e.target.value })
                  }
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-neusharp italic flex items-center justify-center gap-2 mt-4 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                <Save size={18} /> SALVAR REGISTRO
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE EDICAO --- */}
      {isEditModalOpen && editExams && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/20">
              <h2 className="font-neusharp text-xl italic uppercase tracking-tighter">
                Editar Exame
              </h2>
              <button
                onClick={() => setisEditModalOpen(false)}
                className="p-2 hover:bg-background rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form
              onSubmit={() => handleEditExam(editExams.id)}
              className="p-6 space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                  Nome do Exame
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Ressonância Magnética"
                  className="w-full bg-background border border-input p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                  value={editExams.title}
                  onChange={(e) =>
                    setEditExams({ ...editExams, title: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                    Data
                  </label>
                  <input
                    required
                    type="date"
                    className="w-full bg-background border border-input p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                    value={editExams.date}
                    onChange={(e) =>
                      setEditExams({ ...editExams, date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Imagem"
                    className="w-full bg-background border border-input p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                    value={editExams.category}
                    onChange={(e) =>
                      setEditExams({ ...editExams, category: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                  Observações Importantes
                </label>
                <textarea
                  rows={3}
                  placeholder="Resultados, recomendações médicas, etc..."
                  className="w-full bg-background border border-input p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm resize-none"
                  value={editExams.note}
                  onChange={(e) =>
                    setEditExams({ ...editExams, note: e.target.value })
                  }
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-neusharp italic flex items-center justify-center gap-2 mt-4 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                <Save size={18} /> SALVAR REGISTRO
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthModule;
