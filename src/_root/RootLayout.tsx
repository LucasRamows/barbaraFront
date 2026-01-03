import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "../components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "../components/ui/breadcrumb";
import { Separator } from "../components/ui/separator";
import { useEffect, useState } from "react";

const RootLayout = () => {
  const location = useLocation(); 
  const [actualPage, setActualPage] = useState("Dashboard");

  useEffect(() => {
    // toda vez que a rota mudar, atualiza a string
    switch (location.pathname) {
      case "/profile":
        setActualPage("Perfil");
        break;
      case "/settings":
        setActualPage("Configurações");
        break;
      case "/workout":
        setActualPage("Treino");
        break;
      case "/tasks":
        setActualPage("Tarefas");
        break;
      default:
        setActualPage("Dashboard");
        break;
    }
  }, [location.pathname]); // ✅ dependência da rota

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex justify-between h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbPage>{actualPage}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default RootLayout;
