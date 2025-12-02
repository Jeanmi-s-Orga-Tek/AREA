/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** App
*/

import React, { useEffect } from "react";
import AboutScreen from "./screens/AboutScreen";
import ServerScreen from "./screens/ServerScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ServicesScreen from "./screens/ServicesScreen";
import AreasScreen from "./screens/AreasScreen";
import CreateAreaScreen from "./screens/CreateAreaScreen";
import OAuthCallbackScreen from "./screens/OAuthCallbackScreen";
import ServiceCallbackScreen from "./screens/ServiceCallbackScreen";
import { isAuthenticated } from "./services/auth";

const App: React.FC = () => {
  const path = window.location.pathname;
  const authenticated = isAuthenticated();

  const publicRoutes = ["/about", "/login", "/register"];
  const isOAuthCallback = path.startsWith("/auth/callback/");
  const isServiceCallback = path.startsWith("/services/callback/");
  const isPublicRoute = publicRoutes.includes(path) || isOAuthCallback || isServiceCallback;

  useEffect(() => {
    if (!authenticated && !isPublicRoute) {
      window.location.href = "/login";
    }
  }, [authenticated, isPublicRoute]);

  if (path === "/about") {
    return <AboutScreen />;
  }

  if (isOAuthCallback) {
    return <OAuthCallbackScreen />;
  }

  if (isServiceCallback) {
    return <ServiceCallbackScreen />;
  }

  if (path === "/login") {
    return <LoginScreen />;
  }

  if (path === "/register") {
    return <RegisterScreen />;
  }

  if (!authenticated) {
    return <LoginScreen />;
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
