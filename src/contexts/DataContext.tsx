import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiBack from "../api/apiBack";

type DataType = any;

interface DataContextType {
  data: DataType;
  setData: React.Dispatch<React.SetStateAction<DataType>>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);
const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<DataType | null>(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const res = await apiBack.get("/private/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setData(res.data);
    } catch (err) {
      console.error("Erro ao buscar dados do usuário:", err);
      localStorage.removeItem("token");
      navigate("/sign-in");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DataContext.Provider value={{ data, setData, refreshData: fetchData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData deve ser usado dentro de um DataProvider");
  }
  return context;
};
export default DataProvider;
