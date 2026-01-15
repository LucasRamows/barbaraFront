// App.tsx
import { Route, Routes } from "react-router-dom";
import AuthLayout from "./_auth/AuthLayout";
import SigninForm from "./_auth/forms/SigninForm";
import RootLayout from "./_root/RootLayout";
import Dashboard from "./_root/main/Dashboard";
import Profile from "./_root/main/Profile";
import Settings from "./_root/main/Settings";
import NoteEditor from "./_root/main/NoteEditor";
import WorkoutManager from "./_root/main/WorkoutManager";
import { AlertProvider } from "./components/shared/AlertProvider";
import { ThemeProvider } from "./validation/ThemeContext";
import DataProvider from "./contexts/DataContext";
import HealthModule from "./_root/main/HealthModule";
import Security from "./_root/main/Security";

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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="/workout" element={<WorkoutManager />} />
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
