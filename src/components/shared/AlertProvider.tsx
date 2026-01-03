import { createContext, useContext, useState, type ReactNode,  } from "react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { BadgeAlert, BadgeCheck } from "lucide-react";

type AlertType = "success" | "error" | null;

interface AlertContextType {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  clearAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alert, setAlert] = useState<{ type: AlertType; message: string | null }>({
    type: null,
    message: null,
  });

  const showError = (message: string) => setAlert({ type: "error", message });
  const showSuccess = (message: string) => setAlert({ type: "success", message });
  const clearAlert = () => setAlert({ type: null, message: null });

  return (
    <AlertContext.Provider value={{ showError, showSuccess, clearAlert }}>
      {alert.type && (
        <div className="flex max-w-sm md:max-w-md w-full fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <Alert variant={alert.type === "error" ? "destructive" : "default"}>
            {alert.type === "error" ? (
              <BadgeAlert className="h-4 w-4" />
            ) : (
              <BadgeCheck className="h-4 w-4" />
            )}
            <AlertTitle>
              {alert.type === "error" ? "Erro" : "Sucesso"}
            </AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        </div>
      )}
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert deve ser usado dentro de um AlertProvider");
  }
  return context;
};
