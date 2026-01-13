import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Plus, 
  Eye, 
  EyeOff, 
  Trash2, 
  Key, 
  Upload, 
  LogOut,
  Globe,
  Mail,
  ShoppingBag,
  Info
} from 'lucide-react';

// --- Interfaces ---
interface VaultItem {
  id: string;
  site: string;
  login: string;
  encryptedPass: string; // Base64
}

interface MockTemplate {
  site: string;
  login: string;
  pass: string;
}

const APP_ID = 'crypto-vault-v1';

export default function Security() {
  // --- State ---
  const [items, setItems] = useState<VaultItem[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [revealedPasses, setRevealedPasses] = useState<Record<string, string>>({});
  
  // Form State
  const [site, setSite] = useState('');
  const [login, setLogin] = useState('');
  const [pass, setPass] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Mock Data Templates ---
  const mockTemplates: MockTemplate[] = [
    { site: "Netflix", login: "utilizador@exemplo.com", pass: "Senha@Netflix123" },
    { site: "Gmail", login: "teste.seguro@gmail.com", pass: "Google#Pass!2024" },
    { site: "Amazon", login: "comprador_online", pass: "PrimeSecure$99" }
  ];

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

    const exportedPriv = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const exportedPub = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);

    const privPem = btoa(String.fromCharCode(...new Uint8Array(exportedPriv)));
    const pubPem = btoa(String.fromCharCode(...new Uint8Array(exportedPub)));

    // Salva chave pública para criptografar novos itens
    localStorage.setItem(`${APP_ID}_pub_key`, pubPem);

    // Criptografa os exemplos padrão imediatamente com a nova chave
    const exampleItems: VaultItem[] = [];
    for (const m of mockTemplates) {
      const encrypted = await encryptWithKey(m.pass, keyPair.publicKey);
      exampleItems.push({
        id: Math.random().toString(36).substr(2, 9),
        site: m.site,
        login: m.login,
        encryptedPass: encrypted
      });
    }
    
    setItems(exampleItems);
    localStorage.setItem(`${APP_ID}_items`, JSON.stringify(exampleItems));

    // Download da Chave Privada
    const blob = new Blob([privPem], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "key.pem";
    a.click();
    
    alert("Chave gerada! O ficheiro 'key.pem' foi baixado. Guarde-o bem, ele é a sua única forma de abrir o cofre.");
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

    const pubRaw = localStorage.getItem(`${APP_ID}_pub_key`);
    if (!pubRaw) {
      alert("Erro: Chave pública não encontrada. Gere uma nova chave.");
      return;
    }

    const binaryPub = new Uint8Array(atob(pubRaw).split("").map(c => c.charCodeAt(0)));
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
      encryptedPass: encrypted
    };

    const newItems = [newItem, ...items];
    setItems(newItems);
    localStorage.setItem(`${APP_ID}_items`, JSON.stringify(newItems));
    
    setSite(''); setLogin(''); setPass('');
    setShowForm(false);
  };

  const decryptPass = async (id: string, encryptedBase64: string) => {
    if (!privateKey) return;
    
    if (revealedPasses[id]) {
      const newRevealed = { ...revealedPasses };
      delete newRevealed[id];
      setRevealedPasses(newRevealed);
      return;
    }

    try {
      const binary = new Uint8Array(atob(encryptedBase64).split("").map(c => c.charCodeAt(0)));
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
    const filtered = items.filter(i => i.id !== id);
    setItems(filtered);
    localStorage.setItem(`${APP_ID}_items`, JSON.stringify(filtered));
  };

  // --- Render Helpers ---
  const getIcon = (siteName: string) => {
    const s = siteName.toLowerCase();
    if (s.includes('mail') || s.includes('gmail')) return <Mail size={20} />;
    if (s.includes('amazon') || s.includes('shop')) return <ShoppingBag size={20} />;
    return <Globe size={20} />;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 font-sans selection:bg-blue-500/30">
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16 border-b border-white/5 pb-10">
          <div className="flex items-center gap-5">
            <div className="bg-blue-600 p-4 rounded-3xl shadow-2xl shadow-blue-600/20 text-white transform hover:scale-105 transition-transform">
              <ShieldCheck size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-white">CRYPTO VAULT</h1>
              <p className="text-neutral-500 text-sm font-medium">RSA-2048 Local-Only Encryption</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {!isUnlocked ? (
              <>
                <button 
                  onClick={generateKeys}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl font-bold transition-all active:scale-95"
                >
                  <Key size={18} /> CRIAR NOVA CHAVE
                </button>
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
            <h2 className="text-2xl font-bold text-white mb-3">Cofre Protegido</h2>
            <p className="text-neutral-500 text-center max-w-sm mb-10 leading-relaxed">
              Os seus dados estão criptografados. Carregue o ficheiro <code className="text-blue-400 font-mono">key.pem</code> para desbloquear.
            </p>
            <div className="flex items-center gap-3 bg-blue-500/5 px-6 py-3 rounded-2xl border border-blue-500/10 text-blue-400 text-sm font-medium animate-pulse">
              <Info size={18} />
              <span>Dica: Clique em "Criar Nova Chave" para ver os exemplos.</span>
            </div>
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
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Website</label>
                    <input 
                      value={site} onChange={e => setSite(e.target.value)}
                      placeholder="Ex: Netflix" 
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Login</label>
                    <input 
                      value={login} onChange={e => setLogin(e.target.value)}
                      placeholder="E-mail ou User" 
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Senha</label>
                    <input 
                      type="password" value={pass} onChange={e => setPass(e.target.value)}
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
                items.map(item => (
                  <div key={item.id} className="group bg-white/5 hover:bg-white/[0.08] p-5 rounded-[2rem] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-blue-500/30">
                    <div className="flex items-center gap-5">
                      <div className="bg-neutral-900 text-blue-500 p-4 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                        {getIcon(item.site)}
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-0.5">{item.site}</div>
                        <div className="text-lg font-bold text-white">{item.login}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-black/40 px-5 py-3 rounded-2xl border border-white/5 flex items-center gap-6 min-w-[200px] justify-between">
                        <span className="font-mono text-sm tracking-wider">
                          {revealedPasses[item.id] ? revealedPasses[item.id] : '••••••••••••'}
                        </span>
                        <button 
                          onClick={() => decryptPass(item.id, item.encryptedPass)}
                          className="text-neutral-500 hover:text-white transition-colors p-1"
                        >
                          {revealedPasses[item.id] ? <EyeOff size={18}/> : <Eye size={18}/>}
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