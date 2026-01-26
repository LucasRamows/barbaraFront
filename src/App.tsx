// App.tsx
import { Route, Routes } from "react-router-dom";
import AuthLayout from "./_auth/AuthLayout";
import SigninForm from "./_auth/forms/SigninForm";
import RootLayout from "./_root/RootLayout";
import { default as Dashboard, default as Financial } from "./_root/main/Financial";
import HealthModule from "./_root/main/HealthModule";
import NoteEditor from "./_root/main/NoteEditor";
import Profile from "./_root/main/Profile";
import Security from "./_root/main/Security";
import Settings from "./_root/main/Settings";
import TaskManager from "./_root/main/Tasks";
import WorkoutManager from "./_root/main/WorkoutManager";
import { AlertProvider } from "./components/shared/AlertProvider";
import DataProvider from "./contexts/DataContext";
import { ThemeProvider } from "./validation/ThemeContext";

const App = () => {
  return (
    <ThemeProvider>
      <AlertProvider>
        <DataProvider>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/sign-in" element={<SigninForm />} />
            </Route>

            <Route element={<RootLayout />}>
              <Route path="/dashboard" element={<Financial />} />
              <Route path="/" element={<Financial />} />
              <Route path="/workout" element={<WorkoutManager />} />
              <Route path="/tasks" element={<TaskManager />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/health" element={<HealthModule />} />
              <Route path="/projects" element={<NoteEditor />} />
              <Route path="/bank" element={<Security />} />
            </Route>
          </Routes>
        </DataProvider>
      </AlertProvider>
    </ThemeProvider>
  );
};

export default App;
