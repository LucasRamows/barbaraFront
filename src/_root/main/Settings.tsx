import {
  Bell,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Moon,
  RefreshCw,
  Smartphone,
  Sun
} from "lucide-react";
import React, { useEffect, useState } from "react";
import apiBack from "../../api/apiBack";
import { useTheme } from "../../validation/ThemeContext";

const SettingsPage: React.FC = () => {
  const [receiveNotifications, setReceiveNotifications] = useState(true);
  const [themeToggle, setThemeToggle] = useState(true);
  const {toggleTheme } = useTheme();
  const [whatsappStatus, setWhatsappStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  const checkStatus = async () => {
    try {
      const { data } = await apiBack.get("/private/status", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.connected) {
        setWhatsappStatus("connected");
        setQrCodeData(null);
      } else if (data.qrCode) {
        setQrCodeData(data.qrCode);
      }
    } catch (e) {
      console.error("Erro ao verificar status do WhatsApp");
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    checkStatus();

    if (whatsappStatus === "connecting") {
      interval = setInterval(checkStatus, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [whatsappStatus, token]);
  const handleConnectWhatsapp = async () => {
    try {
      setLoading(true);
      setWhatsappStatus("connecting");

      const { data } = await apiBack.get("/private/status", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setQrCodeData(data.qrCode);

      if (whatsappStatus === "connecting") {
        setInterval(() => {
          checkStatus();
        }, 15000);
      }
    } catch (error) {
      alert("Erro ao iniciar conexão");
      setWhatsappStatus("disconnected");
    } finally {
      setLoading(false);
    }
  };
  const handleDisconnect = async () => {
    // Confirmação para evitar cliques acidentais
    if (!confirm("Tem certeza que deseja desconectar o WhatsApp?")) return;

    try {
      setLoading(true);

      await apiBack.post(
        "/private/logout",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setWhatsappStatus("disconnected");
      setQrCodeData(null);

      alert("WhatsApp desconectado com sucesso.");
    } catch (error) {
      console.error("Erro ao desconectar:", error);
      alert("Falha ao desconectar o dispositivo.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background text-foreground font-poppins p-6">
      <main className="max-w-2xl mx-auto space-y-12 pt-10">
        {/* Header */}
        <div>
          <h1 className="text-5xl font-neusharp italic uppercase tracking-tighter leading-none">
            Configurações
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2">
            Preferências do Sistema
          </p>
        </div>

        {/* Tema */}
        <section className="bg-card border border-border rounded-[2rem] p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-primary" />
            <h3 className="font-neusharp italic uppercase text-lg">Tema</h3>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Mudar tema
            </span>
            <button
              onClick={() => {
                setThemeToggle((prev) => !prev);
                toggleTheme();
              }}
              className={`w-14 h-8 rounded-full transition-all relative flex items-center ${
                themeToggle ? "bg-primary" : "bg-secondary"
              }`}
            >
              {/* Ícone */}
              <div
                className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all flex items-center justify-center ${
                  themeToggle ? "left-7" : "left-1"
                }`}
              >
                {themeToggle ? (
                  <Moon size={14} className="text-gray-800" />
                ) : (
                  <Sun size={14} className="text-yellow-500" />
                )}
              </div>
            </button>
          </div>
        </section>

        {/* Notificações */}
        <section className="bg-card border border-border rounded-[2rem] p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-primary" />
            <h3 className="font-neusharp italic uppercase text-lg">
              Alertas e Avisos
            </h3>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Receber avisos no sistema
            </span>
            <button
              onClick={() => setReceiveNotifications(!receiveNotifications)}
              className={`w-14 h-8 rounded-full transition-all relative ${
                receiveNotifications ? "bg-primary" : "bg-secondary"
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${
                  receiveNotifications ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
        </section>
        {/* WhatsApp Connection */}
        <section className="bg-card border border-border rounded-[2rem] p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare size={20} className="text-primary" />
              <h3 className="font-neusharp italic uppercase text-lg">
                WhatsApp Business
              </h3>
            </div>

            <div
              className={`px-4 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-2 ${
                whatsappStatus === "connected"
                  ? "bg-green-500/20 text-green-500"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  whatsappStatus === "connected"
                    ? "bg-green-500 animate-pulse"
                    : "bg-muted-foreground"
                }`}
              />
              {whatsappStatus === "connected" ? "Conectado" : "Desconectado"}
            </div>
          </div>

          {whatsappStatus !== "connected" ? (
            <div className="space-y-6">
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Conecte seu WhatsApp para receber lembretes de treinos e tarefas
                diretamente no seu celular.
              </p>

              {!qrCodeData ? (
                <button
                  onClick={handleConnectWhatsapp}
                  disabled={loading}
                  className="w-full bg-secondary hover:bg-primary hover:text-primary-foreground py-4 rounded-2xl font-neusharp italic uppercase text-sm transition-all flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Smartphone size={18} />
                  )}
                  Vincular Novo Dispositivo
                </button>
              ) : (
                <div className="flex flex-col items-center space-y-6 py-4 animate-in zoom-in-95 duration-300">
                  <div className="bg-white p-4 rounded-3xl shadow-2xl">
                    <img src={qrCodeData} alt="QR Code" className="w-56 h-56" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">
                      Aguardando Leitura...
                    </p>
                    <button
                      onClick={() => setQrCodeData(null)}
                      className="mt-4 text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw size={14} /> Cancelar e tentar de novo
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-secondary/30 rounded-2xl p-6 border border-primary/10 flex items-center gap-4">
              <div className="bg-primary/20 p-3 rounded-xl text-primary">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-tight">
                  Dispositivo Pareado
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Você está pronto para receber notificações automáticas.
                </p>
              </div>
              <button
                onClick={() => handleDisconnect()}
                className="ml-auto text-[10px] font-black text-destructive uppercase tracking-widest hover:underline"
              >
                Desconectar
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default SettingsPage;
