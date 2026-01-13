/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** ServerScreen
*/

import React, { useEffect, useState } from "react";
import { logout } from "../services/auth";
import { fetchCurrentUser } from "../services/api";
import type { User } from "../services/api";
import "./ServerScreen.css";

const ServerScreen: React.FC = () => {
  const [stars, setStars] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

    const fetchUser = async () => {
      try {
        const userData = await fetchCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    generateStars();
    fetchUser();
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="dashboard-page">
      <div className="server-background">
        <div>
          {stars.map((star) => (
            <div key={star.id} className="star" style={star.style} />
          ))}
        </div>
      </div>

      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-logo">⚡ AREA</h2>
        </div>
        <nav className="sidebar-nav">
          <a href="/" className="nav-item active">
            🏠 Dashboard
          </a>
          <a href="/areas" className="nav-item">
            📋 Mes AREAs
          </a>
          <a href="/create-area" className="nav-item">
            ➕ Créer une AREA
          </a>
          <a href="/services" className="nav-item">
            🔌 Services
          </a>
          <a href="/profile" className="nav-item">
            👤 Profil
          </a>
          <a href="/about" className="nav-item">
            ℹ️ À propos
          </a>
        </nav>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-topbar">
          <h1 className="topbar-title">Dashboard</h1>
          <div className="topbar-user">
            <span className="user-name">👋 {loading ? "Chargement..." : (user?.name || "Utilisateur")}</span>
            <button onClick={handleLogout} className="logout-btn">
              🚪 Déconnexion
            </button>
          </div>
        </div>

        <div className="dashboard-main">
          <div className="welcome-card">
            <h2 className="welcome-title">AREA Dashboard</h2>
            <p className="welcome-text">
              Welcome to the AREA web client. Your automation platform is up and running.
            </p>
          </div>

          <div className="grid-3">
            <div className="card">
              <div className="card-icon">📋</div>
              <h3 className="card-title">Mes AREAs</h3>
              <p className="card-description">Gérez vos automatisations</p>
              <a href="/areas" className="card-link">Voir tout →</a>
            </div>

            <div className="card">
              <div className="card-icon">➕</div>
              <h3 className="card-title">Créer une AREA</h3>
              <p className="card-description">Nouvelle automatisation</p>
              <a href="/create-area" className="card-link">Créer →</a>
            </div>

            <div className="card">
              <div className="card-icon">🔌</div>
              <h3 className="card-title">Services</h3>
              <p className="card-description">Connectez vos services</p>
              <a href="/services" className="card-link">Gérer →</a>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3 className="card-title">Statistiques</h3>
              <div className="stats">
                <div className="stat-item">
                  <span className="stat-label">AREAs actives</span>
                  <span className="stat-value">0</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Services connectés</span>
                  <span className="stat-value">0</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Activité récente</h3>
              <p className="card-description text-muted">Aucune activité pour le moment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerScreen;
