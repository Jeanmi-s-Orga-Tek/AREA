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
import ProfileScreen from "./screens/ProfileScreen";
import ServicesScreen from "./screens/ServicesScreen";
import AreasScreen from "./screens/AreasScreen";
import CreateAreaScreen from "./screens/CreateAreaScreen";

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

  if (path === "/profile") {
    return <ProfileScreen />;
  }

  if (path === "/services") {
    return <ServicesScreen />;
  }

  if (path === "/areas") {
    return <AreasScreen />;
  }

  if (path === "/create-area") {
    return <CreateAreaScreen />;
  }

  return <ServerScreen />;
};

export default App;
