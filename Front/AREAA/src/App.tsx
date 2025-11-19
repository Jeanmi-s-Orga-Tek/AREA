/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** App
*/

import React from "react";
import AboutScreen from "./screens/AboutScreen";
import ServerScreen from "./screens/ServerScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";

const App: React.FC = () => {
  const path = window.location.pathname;

  if (path === "/about") {
    return <AboutScreen />;
  }

  if (path === "/login") {
    return <LoginScreen />;
  }

  if (path === "/register") {
    return <RegisterScreen />;
  }

  return <ServerScreen />;
};

export default App;
