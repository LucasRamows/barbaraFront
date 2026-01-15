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
  Upload
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import apiBack from "../../api/apiBack";

// --- Interfaces ---
interface VaultItem {
  id: string;
  site: string;
  login: string;
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
  const [pubRaw, setPubRaw] = useState("");
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [revealedPasses, setRevealedPasses] = useState<Record<string, string>>(
    {}
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
    if (isUnlocked) {
      fetchCredentials();
    }
    fetchStatus();
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
      ["encrypt", "decrypt"]
    );

    const exportedPriv = await window.crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    );
    const exportedPub = await window.crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey
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
        }
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
      "Chave gerada! O ficheiro 'key.pem' foi baixado. Guarde-o bem, ele é a sua única forma de abrir o cofre."
    );
  };

  const encryptWithKey = async (text: string, publicKey: CryptoKey) => {
    const encoded = new TextEncoder().encode(text);
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      encoded
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
        ["decrypt"]
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
        .map((c) => c.charCodeAt(0))
    );

    const publicKey = await window.crypto.subtle.importKey(
      "spki",
      binaryPub.buffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["encrypt"]
    );

    const encrypted = await encryptWithKey(pass, publicKey);

    const newItem: VaultItem = {
      id: Date.now().toString(),
      site,
      login,
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
      }
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
    console.log(revealedPasses);

    try {
      const binary = new Uint8Array(
        atob(encryptedBase64)
          .split("")
          .map((c) => c.charCodeAt(0))
      );
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        binary.buffer
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 font-sans selection:bg-blue-500/30">
      <div className="w-full mx-auto py-1">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16 border-b border-white/5 pb-10">
          <div className="flex items-center">
            <div>
              <h1 className="font-neusharp text-2xl text-primary tracking-tighter italic">
                CRYPTO VAULT
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {!isUnlocked ? (
              <>
                {!status || false? (
                  <button
                    onClick={generateKeys}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl font-bold transition-all active:scale-95"
                  >
                    <Key size={18} /> CRIAR NOVA CHAVE
                  </button>
                ) : (
                  <></>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-2xl font-bold border border-white/10 transition-all active:scale-95"
                >
                  <Upload size={18} /> SUBIR KEY.PEM
                </button>
              </>
            ) : (
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-5 py-2.5 rounded-2xl font-bold border border-red-500/20 transition-all"
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
          <div className="flex flex-col items-center justify-center py-24 bg-white/5 rounded-[3rem] border border-white/5 backdrop-blur-sm">
            <div className="bg-neutral-900 p-8 rounded-full mb-8 text-neutral-600 shadow-inner">
              <Lock size={64} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Cofre Protegido
            </h2>
            <p className="text-neutral-500 text-center max-w-sm mb-10 leading-relaxed">
              Os seus dados estão criptografados. Carregue o ficheiro{" "}
              <code className="text-blue-400 font-mono">key.pem</code> para
              desbloquear.
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Unlock className="text-blue-500" size={24} />
                Credenciais Disponíveis
              </h2>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-white text-black hover:bg-neutral-200 px-6 py-2.5 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus size={18} /> NOVO ITEM
              </button>
            </div>

            {/* Add Form */}
            {showForm && (
              <div className="bg-white/5 p-8 rounded-3xl border border-white/10 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">
                      Website
                    </label>
                    <input
                      value={site}
                      onChange={(e) => setSite(e.target.value)}
                      placeholder="Ex: Netflix"
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">
                      Login
                    </label>
                    <input
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      placeholder="E-mail ou User"
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">
                      Senha
                    </label>
                    <input
                      type="password"
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
                <button
                  onClick={saveNewEntry}
                  className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold text-white shadow-xl shadow-blue-600/20 transition-all"
                >
                  CRIPTOGRAFAR E GUARDAR NO COFRE
                </button>
              </div>
            )}

            {/* List */}
            <div className="grid gap-4">
              {items.length === 0 ? (
                <div className="text-center py-20 text-neutral-600 font-medium">
                  Cofre vazio. Adicione a sua primeira senha.
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-white/5 hover:bg-white/[0.08] p-5 rounded-[2rem] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-blue-500/30"
                  >
                    <div className="flex items-center gap-5">
                      <div className="bg-neutral-900 text-blue-500 p-4 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                        {getIcon(item.site)}
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-0.5">
                          {item.site}
                        </div>
                        <div className="text-lg font-bold text-white">
                          {item.login}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-black/40 px-5 py-3 rounded-2xl border border-white/5 flex items-center gap-6 min-w-[200px] justify-between">
                        <span className="font-mono text-sm tracking-wider">
                          {revealedPasses[item.id]
                            ? revealedPasses[item.id]
                            : "••••••••••••"}
                        </span>
                        <button
                          onClick={() => decryptPass(item.id, item.password)}
                          className="text-neutral-500 hover:text-white transition-colors p-1"
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
                        className="text-neutral-800 hover:text-red-500 transition-colors p-2"
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
