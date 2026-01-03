import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import apiBack from "../../api/apiBack";
import { Button } from "../../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { loginForm } from "../../validation";
import { useData } from "../../contexts/DataContext";

const SigninForm = () => {
  const navigate = useNavigate();
  const { refreshData } = useData();
  const form = useForm<z.infer<typeof loginForm>>({
    resolver: zodResolver(loginForm),
    defaultValues: {
      email: "",
      key: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginForm>) => {
    apiBack
      .post("public/login", { email: values.email, password: values.key })
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        refreshData();
        navigate("/dashboard");
      })
      .catch((err) => {
        console.error("Erro ao fazer login:", err);
        if (!confirm("Credenciais Inválidas")) return;
      });
  };

  return (
    <div className="w-full px-6 md:px-10 md:w-1/2 flex flex-col gap-4 mx-auto">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">Entrar</Button>
        </form>
      </Form>
    </div>
  );
};

export default SigninForm;
