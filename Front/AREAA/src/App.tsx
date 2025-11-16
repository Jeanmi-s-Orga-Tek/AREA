/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** App
*/

import React from "react";
import AboutScreen from "./screens/AboutScreen";
import ServerScreen from "./screens/ServerScreen";

const App: React.FC = () => {
  const path = window.location.pathname;

  if (path === "/about") {
    return <AboutScreen />;
  }

  return <ServerScreen />;
};

export default App;
