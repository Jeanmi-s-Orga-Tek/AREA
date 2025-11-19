/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** ProfileScreen
*/

import React from "react";
import { logout } from "../services/auth";
import "./ProfileScreen.css";

const ProfileScreen: React.FC = () => {
  const userEmail = "utilisateur@example.com";
  const connectedServices = [
    { name: "Google", icon: "🔵", connectedAt: "15 Nov 2025" },
    { name: "GitHub", icon: "⚫", connectedAt: "10 Nov 2025" },
    { name: "Discord", icon: "🟣", connectedAt: "05 Nov 2025" },
  ];
  const areaCount = 12;
  const activeAreas = 8;

  const handleLogout = () => {
    if (window.confirm("Voulez-vous vraiment vous déconnecter ?")) {
      logout();
      window.location.href = "/";
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-content">
        <div className="profile-header">
          <div className="profile-avatar">
            <span className="profile-avatar-text">
              {userEmail.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="profile-title">Mon Profil</h1>
          <p className="profile-email">{userEmail}</p>
        </div>
        <div className="profile-stats">
          <div className="profile-stat-card">
            <div className="profile-stat-value">{areaCount}</div>
            <div className="profile-stat-label">AREA créés</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-value">{activeAreas}</div>
            <div className="profile-stat-label">AREA actifs</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-value">{connectedServices.length}</div>
            <div className="profile-stat-label">Services connectés</div>
          </div>
        </div>

        <div className="profile-section">
          <h2 className="profile-section-title">Services Connectés</h2>
          <div className="profile-services">
            {connectedServices.map((service, index) => (
              <div key={index} className="profile-service-card">
                <div className="profile-service-icon">{service.icon}</div>
                <div className="profile-service-info">
                  <div className="profile-service-name">{service.name}</div>
                  <div className="profile-service-date">
                    Connecté le {service.connectedAt}
                  </div>
                </div>
                <button className="profile-service-disconnect">
                  Déconnecter
                </button>
              </div>
            ))}
          </div>

          {connectedServices.length === 0 && (
            <p className="profile-empty-state">
              Aucun service connecté pour le moment
            </p>
          )}
        </div>

        <div className="profile-actions">
          <a href="/" className="profile-button profile-button-secondary">
            Retour à l'accueil
          </a>
          <a href="/areas" className="profile-button profile-button-secondary">
            Mes AREA
          </a>
          <a href="/services" className="profile-button profile-button-secondary">
            Gérer les services
          </a>
          <button
            onClick={handleLogout}
            className="profile-button profile-button-danger"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
