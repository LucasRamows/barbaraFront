import {
  Eye,
  EyeOff,
  Globe,
  Key,
  Lock,
  LogOut,
  Mail,
  Plus,
  ShoppingBag,
  Trash2,
  Unlock,
  Upload,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import apiBack from "../../api/apiBack";

// --- Interfaces ---
interface VaultItem {
  id: string;
  site: string;
  login?: string;
  email?: string;
  password: string;
}

interface Status {
  totalCredentials: number;
}

const APP_ID = "crypto-vault-v1";

export default function Security() {
  // --- State ---
  const [items, setItems] = useState<VaultItem[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [status, setStatus] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pubRaw, setPubRaw] = useState("");
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [revealedPasses, setRevealedPasses] = useState<Record<string, string>>(
    {},
  );

  // Form State
  const [site, setSite] = useState("");
  const [login, setLogin] = useState("");
  const [pass, setPass] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  // --- Carregar dados do Backend (Prisma) ---
  const fetchStatus = async () => {
    try {
      const res = await apiBack.get<Status>("private/stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (res.data?.totalCredentials > 0) {
        setStatus(true);
      }
    } catch (err) {
      console.error("Erro ao carregar credenciais:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCredentials = async () => {
    try {
      const res = await apiBack.get("private/credentials", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setItems(res.data);
    } catch (err) {
      console.error("Erro ao carregar credenciais:", err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (isUnlocked) {
      fetchCredentials();
    }
  }, [isUnlocked]);

  // --- Initial Load ---
  useEffect(() => {
    const savedItems = localStorage.getItem(`${APP_ID}_items`);
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, []);

  // --- Crypto Logic ---

  const generateKeys = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"],
    );

    const exportedPriv = await window.crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey,
    );
    const exportedPub = await window.crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey,
    );

    const privPem = btoa(String.fromCharCode(...new Uint8Array(exportedPriv)));
    const pubPem = btoa(String.fromCharCode(...new Uint8Array(exportedPub)));

    const exampleItems: VaultItem[] = [];

    setItems(exampleItems);
    try {
      const response = await apiBack.put(
        "/private/publickey",
        {
          key: pubPem,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setItems(response.data);
    } catch (error) {
      console.error("Erro ao subir publicKey:", error);
    }

    const blob = new Blob([privPem], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "key.pem";
    a.click();

    alert(
      "Chave gerada! O ficheiro 'key.pem' foi baixado. Guarde-o bem, ele é a sua única forma de abrir o cofre.",
    );
  };

  const encryptWithKey = async (text: string, publicKey: CryptoKey) => {
    const encoded = new TextEncoder().encode(text);
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      encoded,
    );
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const binaryDerString = atob(text.trim());
      const binaryDer = new Uint8Array(binaryDerString.length);
      for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
      }

      const importedPriv = await window.crypto.subtle.importKey(
        "pkcs8",
        binaryDer.buffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["decrypt"],
      );

      setPrivateKey(importedPriv);
      setIsUnlocked(true);
    } catch (err) {
      alert("Ficheiro de chave inválido ou corrompido.");
    }
  };
  const saveNewEntry = async () => {
    if (!site || !login || !pass) return;
    try {
      const res = await apiBack.get("private/publickey", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const pubRaw = res.data[0].publicKey;
      setPubRaw(pubRaw);
    } catch (err) {
      alert("Erro: Chave pública não encontrada.");
      return;
    }

    const binaryPub = new Uint8Array(
      atob(pubRaw)
        .split("")
        .map((c) => c.charCodeAt(0)),
    );

    const publicKey = await window.crypto.subtle.importKey(
      "spki",
      binaryPub.buffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["encrypt"],
    );

    const encrypted = await encryptWithKey(pass, publicKey);

    const newItem: VaultItem = {
      id: Date.now().toString(),
      site,
      login,
      email: login,
      password: encrypted,
    };

    setItems((prev) => [newItem, ...prev]);

    await apiBack.post(
      "private/credentials",
      {
        site,
        email: login,
        password: encrypted,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );

    setSite("");
    setLogin("");
    setPass("");
    setShowForm(false);
  };

  const decryptPass = async (id: string, encryptedBase64: string) => {
    if (!privateKey) return;
    console.log(privateKey);
    console.log(encryptedBase64);
    if (revealedPasses[id]) {
      const newRevealed = { ...revealedPasses };
      delete newRevealed[id];
      setRevealedPasses(newRevealed);
      return;
    }

    try {
      const binary = new Uint8Array(
        atob(encryptedBase64)
          .split("")
          .map((c) => c.charCodeAt(0)),
      );
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        binary.buffer,
      );
      const plainText = new TextDecoder().decode(decrypted);
      setRevealedPasses({ ...revealedPasses, [id]: plainText });
    } catch (e) {
      alert("Falha na descriptografia.");
    }
  };

  const deleteItem = (id: string) => {
    const filtered = items.filter((i) => i.id !== id);
    setItems(filtered);
    try {
      apiBack.delete(`/private/credentials/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  // --- Render Helpers ---
  const getIcon = (siteName: string) => {
    const s = siteName.toLowerCase();
    if (s.includes("mail") || s.includes("gmail")) return <Mail size={20} />;
    if (s.includes("amazon") || s.includes("shop"))
      return <ShoppingBag size={20} />;
    return <Globe size={20} />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <div className="w-full mx-auto py-1 px-4 md:px-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-16 border-b border-border pb-8 md:pb-10">
          <div className="flex items-center">
            <div>
              <h1 className="font-neusharp text-2xl text-foreground tracking-tighter italic">
                CRYPTO VAULT
              </h1>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full md:w-auto">
            {!isUnlocked ? (
              <>
                {!status || false ? (
                  <button
                    onClick={generateKeys}
                    className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-3 sm:py-2.5 rounded-2xl font-bold transition-all active:scale-95 text-sm md:text-base"
                  >
                    <Key size={18} /> CRIAR NOVA CHAVE
                  </button>
                ) : (
                  <></>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-5 py-3 sm:py-2.5 rounded-2xl font-bold border border-border transition-all active:scale-95 text-sm md:text-base"
                >
                  <Upload size={18} /> SUBIR KEY.PEM
                </button>
              </>
            ) : (
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto flex justify-center items-center gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive px-5 py-3 sm:py-2.5 rounded-2xl font-bold border border-destructive/20 transition-all text-sm md:text-base"
              >
                <LogOut size={18} /> FECHAR COFRE
              </button>
            )}
          </div>
        </header>

        {/* Hidden Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept=".pem"
        />

        {/* Content */}
        {!isUnlocked ? (
          <div className="flex flex-col items-center justify-center py-24 bg-card rounded-[3rem] border border-border backdrop-blur-sm">
            <div className="bg-secondary p-8 rounded-full mb-8 text-secondary-foreground shadow-inner">
              <Lock size={64} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Cofre Protegido
            </h2>
            <p className="text-muted-foreground text-center max-w-sm mb-10 leading-relaxed">
              Os seus dados estão criptografados. Carregue o ficheiro{" "}
              <code className="text-primary font-mono">key.pem</code> para
              desbloquear.
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 px-1 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-foreground flex items-center justify-center sm:justify-start gap-3">
                <Unlock className="text-primary" size={24} />
                Credenciais Disponíveis
              </h2>
              <button
                onClick={() => setShowForm(!showForm)}
                className="w-full sm:w-auto justify-center bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 sm:py-2.5 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus size={18} /> NOVO ITEM
              </button>
            </div>

            {/* Add Form */}
            {showForm && (
              <div className="bg-card p-8 rounded-3xl border border-border space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                      Website
                    </label>
                    <input
                      value={site}
                      onChange={(e) => setSite(e.target.value)}
                      placeholder="Ex: Netflix"
                      className="w-full bg-background border border-input rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                      Login
                    </label>
                    <input
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      placeholder="E-mail ou User"
                      className="w-full bg-background border border-input rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                      Senha
                    </label>
                    <input
                      type="password"
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-background border border-input rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-foreground"
                    />
                  </div>
                </div>
                <button
                  onClick={saveNewEntry}
                  className="w-full bg-primary hover:bg-primary/90 py-4 rounded-2xl font-bold text-primary-foreground shadow-xl transition-all"
                >
                  CRIPTOGRAFAR E GUARDAR NO COFRE
                </button>
              </div>
            )}

            {/* List */}
            <div className="grid gap-4">
              {items.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground font-medium">
                  Cofre vazio. Adicione a sua primeira senha.
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-card hover:bg-accent p-4 sm:p-5 rounded-[2rem] border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-primary/50 text-card-foreground"
                  >
                    <div className="flex items-center gap-4 sm:gap-5 w-full md:w-auto overflow-hidden">
                      <div className="bg-secondary text-primary p-3 sm:p-4 rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 flex-shrink-0">
                        {getIcon(item.site)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-[0.2em] mb-0.5 truncate">
                          {item.site}
                        </div>
                        <div className="text-base sm:text-lg font-bold truncate break-all text-foreground">
                          {item.login || item.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
                      <div className="bg-muted px-4 sm:px-5 py-3 rounded-2xl border border-border flex items-center justify-between sm:min-w-[200px] flex-1">
                        <span className="font-mono text-sm tracking-wider truncate mr-2">
                          {revealedPasses[item.id]
                            ? revealedPasses[item.id]
                            : "••••••••••••"}
                        </span>
                        <button
                          onClick={() => decryptPass(item.id, item.password)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1 flex-shrink-0"
                        >
                          {revealedPasses[item.id] ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="bg-destructive/10 sm:bg-transparent text-destructive sm:text-muted-foreground hover:text-destructive transition-colors p-3 sm:p-2 rounded-2xl sm:rounded-none flex justify-center items-center flex-shrink-0"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
