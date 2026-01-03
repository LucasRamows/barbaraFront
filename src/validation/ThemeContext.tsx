// ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeContextType = {
  theme: "light" | "dark";
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<"light" | "dark">("light"); // ⬅️ tema inicial claro

  useEffect(() => {
    const stored = localStorage.getItem("ThemeColor") as "light" | "dark" | null;

    // Se houver tema salvo, usa ele; caso contrário, mantém "light"
    const initialTheme = stored || "light";
    setTheme(initialTheme);

    // Remove qualquer classe anterior e adiciona a atual
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("ThemeColor", newTheme);

    // Remove o tema antigo e adiciona o novo
    document.documentElement.classList.remove(theme);
    document.documentElement.classList.add(newTheme);
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
