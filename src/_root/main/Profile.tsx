import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  Save,
  Loader2,
  Key,
  Eye,
  EyeOff,
  LogOut,
} from "lucide-react";
import apiBack from "../../api/apiBack";
import { useData } from "../../contexts/DataContext";

const ProfilePage: React.FC = () => {
  const { data, setData } = useData();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const token = localStorage.getItem("token");
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(()=>{
    setProfile(data);
    setLoading(false)
  })

  const handleUpdate = async (e:any) => {
    const nameInput = document.getElementById(
      "profile-name"
    ) as HTMLInputElement;
    const passwordInput = document.getElementById(
      "profile-password"
    ) as HTMLInputElement;

    const payload: any = {
      name: nameInput.value,
    };

    if (passwordInput.value.trim() !== "") {
      payload.password = passwordInput.value;
    }

    try {
      setIsSaving(true);

      const { data } = await apiBack.put("/private/update", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfile(data);

      alert("Perfil atualizado com sucesso!");

      passwordInput.value = "";
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("Falha ao atualizar perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground font-poppins p-6">
      <main className="max-w-2xl mx-auto space-y-12 pt-10">
        {/* Header Simples */}
        <div className="flex justify-between items-center border-b border-border pb-8">
          <div>
            <h1 className="text-5xl font-neusharp italic uppercase tracking-tighter leading-none">
              Perfil
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2">
              Configurações de Conta
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
            className="p-3 text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut size={24} />
          </button>
        </div>

        {/* Formulário Geral */}
        <section className="space-y-8">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Seu Nome
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <input
                  defaultValue={profile?.name}
                  id="profile-name"
                  className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                E-mail
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <input
                  readOnly
                  defaultValue={profile?.email}
                  className="w-full bg-secondary/20 border border-border rounded-2xl py-4 pl-12 pr-4 text-muted-foreground cursor-not-allowed font-medium"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Seção Trocar Senha */}
        <section className="space-y-6 pt-6 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <Key size={18} className="text-primary" />
            <h3 className="font-neusharp italic uppercase text-lg tracking-tight">
              Segurança
            </h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Nova Senha
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <input 
                  id="profile-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Deixe em branco para não alterar"
                  className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-14 focus:outline-none focus:border-primary font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Ação Final */}
        <button
          onClick={(e) => {
            handleUpdate(e);
          }}
          className="w-full bg-primary text-primary-foreground py-5 rounded-[2rem] font-neusharp italic uppercase text-sm shadow-xl shadow-primary/10 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          <Save size={20} /> Atualizar Tudo
        </button>
      </main>
    </div>
  );
};

export default ProfilePage;
