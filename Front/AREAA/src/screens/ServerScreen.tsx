/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** ServerScreen
*/

import React, { useEffect, useState } from "react";
import { logout } from "../services/auth";
import "./ServerScreen.css";

const ServerScreen: React.FC = () => {
  const [stars, setStars] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);

  useEffect(() => {
    const generateStars = () => {
      const newStars = [];
      for (let i = 0; i < 100; i++) {
        const size = Math.random() * 3 + 1;
        newStars.push({
          id: i,
          style: {
            width: `${size}px`,
            height: `${size}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 3 + 2}s`,
          },
        });
      }
      setStars(newStars);
    };

    generateStars();
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="server-page-wrapper">
      <div className="server-background">
        <div>
          {stars.map((star) => (
            <div key={star.id} className="star" style={star.style} />
          ))}
        </div>
      </div>
      
      <main style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 1 }}>
      <h1 style={{ color: "white" }}>AREA Dashboard</h1>
      <p style={{ color: "white" }}>Welcome to the AREA web client. Your automation platform is up and running.</p>
      
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
    </div>
  );
};

export default ServerScreen;
