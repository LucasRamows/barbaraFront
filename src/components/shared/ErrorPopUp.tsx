import { AlertCircleIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"

interface ErrorPopUpProps {
  error: boolean
}

const ErrorPopUp = ({ error }: ErrorPopUpProps) => {
  return (
    <div className="w-full md:w-1/2 flex items-center justify-center">
      {error ? (
        <Alert className="w-full bg-red-100 text-red-800">
          <AlertCircleIcon />
          <AlertTitle>Erro!</AlertTitle>
          <AlertDescription>
            Tivemos um erro ao processar a solicitação! Entre em contato diretamente com a empresa.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}

export default ErrorPopUp
