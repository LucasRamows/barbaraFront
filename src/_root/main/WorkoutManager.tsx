import { Clock, Dumbbell, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import apiBack from "../../api/apiBack";

// --- Tipagens ---
type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

interface Exercise {
  id: string;
  name: string;
  targetMuscle: string;
}

interface ExerciseOnDay {
  id: string;
  order: number;
  sets: number;
  reps: string;
  weight: number | null;
  restTime: number | null;
  exercise: Exercise;
}

interface WorkoutDay {
  id: string;
  day: DayOfWeek;
  label: string | null;
  exercises: ExerciseOnDay[];
}

const WorkoutManager: React.FC = () => {
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [globalExercises, setGlobalExercises] = useState<Exercise[]>([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadPlan = async () => {
      const { data } = await apiBack.get("private/plans", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(data);
      const { data: exercises } = await apiBack.get("private/exercises", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setGlobalExercises(exercises);

      if (!data.length) return;

      const plan = data[0];
      setPlanId(plan.id);

      const days: WorkoutDay[] = plan.days.map((d: any) => ({
        id: d.id,
        day: d.day,
        label: d.label,
        exercises: d.exercises.map((ex: any) => ({
          id: ex.id,
          order: ex.order,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          restTime: ex.restTime,
          exercise: {
            name: ex.exercise.name,
            targetMuscle: ex.exercise.targetMuscle,
          },
        })),
      }));
      setWorkoutDays(days);
      console.log(days);
    };
    loadPlan();
  }, []);

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("MONDAY");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSecondModalOpen, setSecondModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseOnDay | null>(
    null
  );

  // --- Lógica de CRUD ---
const handleSaveExercise = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!currentDayData) return;

  const formData = new FormData(e.currentTarget);
  const exerciseId = formData.get("exerciseId") as string;

  const selectedExercise = globalExercises.find(
    (ex) => ex.id === exerciseId
  );
  if (!selectedExercise) return;

  const payload = {
    exerciseId,
    order: editingExercise?.order ?? currentDayData.exercises.length + 1,
    sets: Number(formData.get("sets")),
    reps: formData.get("reps") as string,
    weight: Number(formData.get("weight")) || null,
    restTime: Number(formData.get("restTime")) || null,
  };

  try {
    let response;

    // ✏️ EDITAR
    if (editingExercise) {
      response = await apiBack.put(
        `/private/exercises-on-day/${editingExercise.id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } 
    // ➕ CRIAR
    else {
      response = await apiBack.post(
        `/private/days/${currentDayData.id}/exercises`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    }

    const data = response.data;

    // 🔁 Atualiza estado local
    setWorkoutDays((prev) =>
      prev.map((day) => {
        if (day.id !== currentDayData.id) return day;

        // EDIT
        if (editingExercise) {
          return {
            ...day,
            exercises: day.exercises.map((ex) =>
              ex.id === editingExercise.id
                ? {
                    id: data.id,
                    order: data.order,
                    sets: data.sets,
                    reps: data.reps,
                    weight: data.weight,
                    restTime: data.restTime,
                    exercise: {
                      id: selectedExercise.id,
                      name: selectedExercise.name,
                      targetMuscle: selectedExercise.targetMuscle,
                    },
                  }
                : ex
            ),
          };
        }

        // CREATE
        return {
          ...day,
          exercises: [
            ...day.exercises,
            {
              id: data.id,
              order: data.order,
              sets: data.sets,
              reps: data.reps,
              weight: data.weight,
              restTime: data.restTime,
              exercise: {
                id: selectedExercise.id,
                name: selectedExercise.name,
                targetMuscle: selectedExercise.targetMuscle,
              },
            },
          ],
        };
      })
    );

    closeModal();
  } catch (err) {
    console.error("Erro ao salvar exercício", err);
  }
};

  const handleSaveDay = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(planId);
    const formData = new FormData(e.currentTarget);

    const day = formData.get("day");
    const label = formData.get("label");

    if (!day) return;

    try {
      const { data } = await apiBack.post(
        `private/plans/${planId}/days`,
        {
          day,
          label,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // opcional: atualizar estado local
      setWorkoutDays((prev) => [
        ...prev,
        {
          ...data,
          exercises: [],
        },
      ]);
      closeSecondModal();
    } catch (err) {
      console.error("Erro ao adicionar dia", err);
    }
  };

const deleteExercise = async (id: string) => {
  if (!currentDayData) return;

  const confirmed = confirm("Deseja remover este exercício?");
  if (!confirmed) return;

  try {
    await apiBack.delete(`/private/exercises-on-day/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 🔁 Atualiza estado local
    setWorkoutDays((prev) =>
      prev.map((day) => {
        if (day.id !== currentDayData.id) return day;

        return {
          ...day,
          exercises: day.exercises.filter((ex) => ex.id !== id),
        };
      })
    );
  } catch (err) {
    console.error("Erro ao deletar exercício", err);
    alert("Erro ao remover exercício");
  }
};


  const openModal = (exercise?: ExerciseOnDay) => {
    if (exercise) setEditingExercise(exercise);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExercise(null);
  };

  const openSecondModal = () => {
    setSecondModalOpen(true);
  };

  const closeSecondModal = () => {
    setSecondModalOpen(false);
  };

  const currentDayData = workoutDays.find((d) => d.day === selectedDay);
  console.log("current", currentDayData);

  return (
    <div className="min-h-screen bg-background text-foreground font-poppins pb-32">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="font-neusharp text-2xl text-primary tracking-tighter italic">
            Treino
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openModal()}
            className="bg-primary/10 text-primary p-2 rounded-full hover:bg-primary hover:text-white transition-all"
          >
            <Plus size={24} />
          </button>
          <button
            onClick={() => openSecondModal()}
            className="bg-primary/10 text-primary p-2 rounded-full hover:bg-primary hover:text-white transition-all"
          >
            <Plus size={24} />
          </button>
        </div>
      </header>

      {workoutDays.length > 0 && (
        <main className="max-w-4xl mx-auto">
          {/* Seletor de Dias */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            {workoutDays.map((day) => (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.day as DayOfWeek)}
                className={`flex-shrink-0 px-5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedDay === day.day
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : "bg-card text-muted-foreground border-border"
                }`}
              >
                {day.day.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Lista de Exercícios */}
          <div className="space-y-4">
            <div className="flex justify-between items-end mb-2">
              <h2 className="font-neusharp text-xl uppercase italic">
                {currentDayData?.label || "Treino"}
              </h2>
              <span className="text-[10px] font-bold text-primary opacity-70">
                {currentDayData?.exercises.length || 0} EXERCÍCIOS TOTAL
              </span>
            </div>

            {currentDayData?.exercises
              .sort((a, b) => a.order - b.order)
              .map((ex, index) => (
                <div
                  key={ex.id}
                  className="group bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    {/* Ícone drag */}
                    <div className="text-muted-foreground/40">
                      <GripVertical size={20} />
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-neusharp text-primary italic">
                          #{index + 1}
                        </span>
                        <h3 className="font-bold text-sm uppercase tracking-tight">
                          {ex.exercise.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded">
                          <Dumbbell size={12} /> {ex.sets}x{ex.reps}
                        </span>

                        {ex.restTime && (
                          <span className="flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded">
                            <Clock size={12} /> {ex.restTime}s
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(ex)}
                        className="p-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => deleteExercise(ex.id)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {/* Estado vazio */}
            {(!currentDayData || currentDayData.exercises.length === 0) && (
              <div className="text-center py-16 border-2 border-dashed border-border rounded-3xl opacity-50">
                <p className="font-neusharp italic text-sm">
                  Nenhum exercício adicionado
                </p>
                <button
                  onClick={() => openModal()}
                  className="mt-4 text-primary font-bold text-xs underline"
                >
                  ADICIONAR PRIMEIRO
                </button>
              </div>
            )}
          </div>
        </main>
      )}
      {/* --- MODAL DE ADIÇÃO/EDIÇÃO --- */}
      {isModalOpen && workoutDays.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-neusharp text-xl italic">
                  {editingExercise ? "EDITAR EXERCÍCIO" : "NOVO EXERCÍCIO"}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 bg-secondary rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveExercise} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                    Nome do Exercício
                  </label>
                  <select
                    required
                    name="exerciseId"
                    className="w-full bg-secondary/50 border border-border rounded-xl p-3"
                  >
                    {globalExercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                      Séries
                    </label>
                    <input
                      required
                      name="sets"
                      type="number"
                      defaultValue={editingExercise?.sets}
                      placeholder="4"
                      className="w-full bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                      Repetições
                    </label>
                    <input
                      required
                      name="reps"
                      defaultValue={editingExercise?.reps}
                      placeholder="10-12"
                      className="w-full bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                      Carga (kg)
                    </label>
                    <input
                      name="weight"
                      type="number"
                      defaultValue={editingExercise?.weight || 0}
                      className="w-full bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                      Descanso (seg)
                    </label>
                    <input
                      name="restTime"
                      type="number"
                      defaultValue={editingExercise?.restTime || 60}
                      className="w-full bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-neusharp italic mt-4 shadow-lg shadow-primary/20"
                >
                  {editingExercise ? "CONFIRMAR EDIÇÃO" : "ADICIONAR AO TREINO"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* --- MODAL DE DIAS --- */}
      {isSecondModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-neusharp text-xl italic">ADICIONAR DIA</h2>
                <button
                  onClick={closeSecondModal}
                  className="p-2 bg-secondary rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveDay} className="space-y-4">
                {/* DIA DA SEMANA */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                    Dia da Semana
                  </label>

                  <select
                    required
                    name="day"
                    className="w-full bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:border-primary transition-all"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Selecione um dia
                    </option>

                    {[
                      "MONDAY",
                      "TUESDAY",
                      "WEDNESDAY",
                      "THURSDAY",
                      "FRIDAY",
                      "SATURDAY",
                      "SUNDAY",
                    ].map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                {/* LABEL DO TREINO (OPCIONAL) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                    Nome do Treino (opcional)
                  </label>
                  <input
                    name="label"
                    placeholder="Ex: Push Day, Pernas, Costas"
                    className="w-full bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-neusharp italic mt-4 shadow-lg shadow-primary/20"
                >
                  ADICIONAR DIA
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutManager;
