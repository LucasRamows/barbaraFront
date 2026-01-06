import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { AxiosResponse } from "axios";
import {
  Bold,
  ChevronLeft,
  FileText,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Plus,
  Trash2,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import apiBack from "../../api/apiBack";

// --- Tipagens ---
interface Note {
  id: string;
  title: string;
  content: string;
  folder: string | null;
  createdAt: string;
}

const NoteEditor: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const { data } = await apiBack.get<Note[]>(`/private/notes`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setNotes(data);
        console.log("Notas carregadas:", data);
      } catch (error) {
        console.error("Erro ao buscar notas:", error);
      }
    };

    if (token) {
      fetchNotes();
    }
  }, [token]); // Adicionamos token como dependência por segurança

  const editor = useEditor({
    extensions: [StarterKit],
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert focus:outline-none max-w-4xl mx-auto p-8 min-h-[500px] text-lg font-poppins",
      },
    },
  });

  const TextEditorToolbar = () => {
    if (!editor) return null;
    return (
      <div className="flex flex-wrap items-center gap-1 p-2 bg-card border border-border rounded-xl shadow-2xl mb-4 sticky top-4 z-20 w-fit mx-auto">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive("bold")
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary"
          }`}
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive("italic")
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary"
          }`}
        >
          <Italic size={18} />
        </button>
        <div className="w-[1px] h-6 bg-border mx-1" />
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive("heading", { level: 1 })
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary"
          }`}
        >
          <Heading1 size={18} />
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive("heading", { level: 2 })
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary"
          }`}
        >
          <Heading2 size={18} />
        </button>
        <div className="w-[1px] h-6 bg-border mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive("bulletList")
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary"
          }`}
        >
          <List size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive("orderedList")
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary"
          }`}
        >
          <ListOrdered size={18} />
        </button>
      </div>
    );
  };

  const openNote = (note: Note) => {
    setCurrentNote(note);
    editor?.commands.setContent(note.content);
    setIsEditing(true);
  };

  const createNewNote = () => {
    const newNote: Note = {
      id: `temp-${Math.random().toString(36).substr(2, 9)}`, // Prefixamos com 'temp-'
      title: "",
      content: "",
      folder: "Geral",
      createdAt: new Date().toISOString(),
    };

    // Opcional: Você pode escolher NÃO adicionar ao array 'notes' aqui
    // e adicionar apenas após o sucesso do POST.
    openNote(newNote);
  };

  const saveCurrentNote = async () => {
    if (!currentNote || !editor) return;

    const htmlContent = editor.getHTML();
    const titleContent = currentNote.title || "Sem Título";

    const payload = {
      title: titleContent,
      content: htmlContent,
      folder: currentNote.folder || "Geral",
    };

    try {
      let response: AxiosResponse<Note>;;

      const isNewNote = currentNote.id.toString().startsWith("temp-");

      if (isNewNote) {
        // --- CRIAÇÃO (POST) ---
        response = await apiBack.post(`/private/notes`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Adicionamos a nota real vinda do banco à lista
        setNotes((prev) => [response.data, ...prev]);
      } else {
        // --- ATUALIZAÇÃO (PUT) ---
        response = await apiBack.put(
          `/private/notes/${currentNote.id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Atualizamos a nota existente na lista
        setNotes((prev) =>
          prev.map((n) => (n.id === currentNote.id ? response.data : n))
        );
      }

      setIsEditing(false);
      setCurrentNote(null); // Limpa a nota atual após salvar
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
      alert("Erro ao salvar. Verifique sua conexão.");
    }
  };

  const deleteNode = async () => {
    if (!currentNote) return;

    try {
      apiBack.delete(`/private/notes/${currentNote.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.reload();
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
    }
  };
  return (
    <div className="min-h-screen bg-background text-foreground font-poppins selection:bg-primary/30">
      {!isEditing ? (
        <main className="max-w-6xl mx-auto">
          {/* Header Minimalista */}
          <div className="flex justify-between items-end mb-16 border-b border-border pb-8">
            <div>
              <h1 className="font-neusharp text-2xl text-primary tracking-tighter italic">
                Projetos
              </h1>
            </div>
            <button
              onClick={createNewNote}
              className="bg-primary text-primary-foreground p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all"
            >
              <Plus size={28} />
            </button>
          </div>

          {/* Grid de Notas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.length === 0 && (
              <div className="col-span-full py-32 text-center">
                <FileText size={48} className="mx-auto mb-4 opacity-10" />
                <p className="font-neusharp italic uppercase text-muted-foreground tracking-widest text-sm">
                  Vazio por enquanto
                </p>
              </div>
            )}

            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => openNote(note)}
                className="group bg-card border border-border p-8 rounded-3xl hover:border-primary transition-all cursor-pointer shadow-sm relative overflow-hidden h-64 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-bold text-muted-foreground italic">
                      {new Date(note.createdAt).toLocaleDateString('pt-BR'  )}
                    </span>
                  </div>
                  <h3 className="text-xl font-neusharp italic uppercase leading-none mb-4 group-hover:text-primary transition-colors">
                    {note.title || "Sem Título"}
                  </h3>
                  <div
                    className="text-xs text-muted-foreground line-clamp-3 leading-relaxed opacity-70"
                    dangerouslySetInnerHTML={{ __html: note.content }}
                  />
                </div>
                <div className="pt-4 flex justify-end">
                  <div className="w-8 h-[2px] bg-border group-hover:bg-primary group-hover:w-16 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </main>
      ) : (
        /* --- EDITOR FOCO TOTAL --- */
        <div className="animate-in fade-in duration-500 bg-background min-h-screen flex flex-col">
          <header className="py-6 border-b border-border flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-xl z-30">
            <button
              onClick={saveCurrentNote}
              className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft size={16} /> Voltar
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => deleteNode()}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={20} />
              </button>
              <button
                onClick={saveCurrentNote}
                className="bg-primary text-primary-foreground px-8 py-2 rounded-full font-neusharp italic text-xs uppercase shadow-lg"
              >
                Salvar
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-12 scrollbar-hide">
            <div className="max-w-4xl mx-auto">
              <input
                value={currentNote?.title}
                onChange={(e) =>
                  setCurrentNote((prev) =>
                    prev ? { ...prev, title: e.target.value } : null
                  )
                }
                placeholder="DIGITE O TÍTULO..."
                className="w-full bg-transparent text-6xl font-neusharp italic text-foreground focus:outline-none mb-12 placeholder:opacity-10 uppercase tracking-tighter"
              />

              {/* Barra de Ferramentas Flutuante */}
              <TextEditorToolbar />

              <div className="bg-card/20 rounded-3xl border border-border/50 shadow-inner">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estilos para o Tiptap compatíveis com o tema */}
      <style>{`
        .ProseMirror { min-height: 500px; outline: none; }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: "Comece a escrever sua ideia brilhante...";
          float: left; color: var(--muted-foreground); pointer-events: none; height: 0; font-style: italic;
        }
        .prose h1 { font-family: 'Neusharp', sans-serif; font-style: italic; text-transform: uppercase; margin-bottom: 1rem; color: var(--foreground); }
        .prose h2 { font-family: 'Neusharp', sans-serif; font-style: italic; margin-top: 2rem; color: var(--foreground); }
        .prose ul { list-style-type: disc; padding-left: 2rem; margin-bottom: 1rem; }
        .prose ol { list-style-type: decimal; padding-left: 2rem; margin-bottom: 1rem; }
        .prose p { margin-bottom: 1rem; line-height: 1.8; }
      `}</style>
    </div>
  );
};

export default NoteEditor;
