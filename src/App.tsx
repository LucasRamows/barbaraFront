// App.tsx
import { Route, Routes } from "react-router-dom";
import AuthLayout from "./_auth/AuthLayout";
import SigninForm from "./_auth/forms/SigninForm";
import RootLayout from "./_root/RootLayout";
import Dashboard from "./_root/main/Dashboard";
import Profile from "./_root/main/Profile";
import Settings from "./_root/main/Settings";
import Tasks from "./_root/main/NoteEditor";
import WorkoutManager from "./_root/main/WorkoutManager";
import { AlertProvider } from "./components/shared/AlertProvider";
import CitySearch from "./components/shared/citiesSearch";
import { ThemeProvider } from "./validation/ThemeContext";
import DataProvider from "./contexts/DataContext";

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
              <Route path="/workout" element={<WorkoutManager />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/city" element={<CitySearch />} />
              <Route path="/tasks" element={<Tasks />} />
            </Route>
          </Routes>
        </DataProvider>
      </AlertProvider>
    </ThemeProvider>
  );
};

export default App;
