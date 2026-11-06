import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { FournisseurBar } from "./ui/contexte.tsx";
import "./ui/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FournisseurBar>
      <App />
    </FournisseurBar>
  </StrictMode>,
);
