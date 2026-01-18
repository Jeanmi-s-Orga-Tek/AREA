/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** main
*/

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./i18n";
import "./styles/accessibility.css";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <AccessibilityProvider>
        <App />
      </AccessibilityProvider>
    </React.StrictMode>
  );
}
