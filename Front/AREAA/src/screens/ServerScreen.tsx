/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** ServerScreen
*/

import React from "react";
import { logout } from "../services/auth";

const ServerScreen: React.FC = () => {
  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1>AREA Dashboard</h1>
      <p>Welcome to the AREA web client. Your automation platform is up and running.</p>
      
      <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <a href="/areas" style={{ padding: "1rem", backgroundColor: "#4285f4", color: "white", textDecoration: "none", borderRadius: "8px", textAlign: "center" }}>
          📋 Mes AREAs
        </a>
        <a href="/create-area" style={{ padding: "1rem", backgroundColor: "#34a853", color: "white", textDecoration: "none", borderRadius: "8px", textAlign: "center" }}>
          ➕ Créer une nouvelle AREA
        </a>
        <a href="/services" style={{ padding: "1rem", backgroundColor: "#fbbc04", color: "white", textDecoration: "none", borderRadius: "8px", textAlign: "center" }}>
          🔌 Gérer mes services
        </a>
        <a href="/profile" style={{ padding: "1rem", backgroundColor: "#ea4335", color: "white", textDecoration: "none", borderRadius: "8px", textAlign: "center" }}>
          👤 Mon profil
        </a>
        <a href="/about" style={{ padding: "1rem", backgroundColor: "#666", color: "white", textDecoration: "none", borderRadius: "8px", textAlign: "center" }}>
          ℹ️ À propos
        </a>
        <button onClick={handleLogout} style={{ padding: "1rem", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "1rem" }}>
          🚪 Se déconnecter
        </button>
      </div>
    </main>
  );
};

export default ServerScreen;
