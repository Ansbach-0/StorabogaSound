import React from "react";
import ReactDOM from "react-dom/client";
import { defineCustomElements } from "@deadlock-api/ui-core/loader";
import { App } from "./App";
import "./index.css";

defineCustomElements(window);

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

