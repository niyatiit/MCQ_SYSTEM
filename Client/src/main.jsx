import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ExamModeProvider } from "./context/ExamModeContext.jsx";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <ExamModeProvider>
      <StrictMode>
        <App />
      </StrictMode>
    </ExamModeProvider>
  </AuthProvider>
);