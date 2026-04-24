import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

  return (
    <>
      <AppRoutes />

      {/* ✅ Toast Container (GLOBAL) */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
    </>
  );
}

export default App;