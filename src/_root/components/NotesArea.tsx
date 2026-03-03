import { RotateCcw } from "lucide-react";
import React from "react";

interface NotesAreaProps {
  notes: string;
  setNotes: (notes: string) => void;
}

const NotesArea: React.FC<NotesAreaProps> = ({ notes, setNotes }) => {
  return (
    <div className="w-full flex flex-col mt-8">
      <div className="space-y-4">
        <div className="relative group flex flex-col items-stretch">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anote links, ideias rápidas ou lembretes aqui..."
            className="w-full h-[350px] lg:h-[450px] bg-background border border-input rounded-[2rem] p-6 text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-inner resize-none placeholder:text-muted-foreground/50"
          />
        </div>

        <button
          onClick={() => setNotes("")}
          className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw size={12} /> Limpar Bloco
        </button>
      </div>
    </div>
  );
};

export default NotesArea;
