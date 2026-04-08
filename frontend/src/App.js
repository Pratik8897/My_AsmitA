import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";

function App() {
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = storedTheme || (prefersDark ? "dark" : "light");

    document.documentElement.dataset.theme = nextTheme;
    if (!storedTheme) {
      localStorage.setItem("theme", nextTheme);
    }
  }, []);

  return <AppRoutes />;
}

export default App;
