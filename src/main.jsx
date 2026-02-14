import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";

// 1. Import the AG Grid Registry and Community Module
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

// 2. Register the modules globally
ModuleRegistry.registerModules([ AllCommunityModule ]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
