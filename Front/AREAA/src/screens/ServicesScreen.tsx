/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** ServicesScreen
*/

import React, { useState } from "react";
import "./ServicesScreen.css";

interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isConnected: boolean;
}

const ServicesScreen: React.FC = () => {
  const [services, setServices] = useState<Service[]>([
    {
      id: "google",
      name: "Google",
      description: "Accédez à Gmail, Google Calendar et Google Drive",
      icon: "🔵",
      color: "#4285f4",
      isConnected: true,
    },
    {
      id: "github",
      name: "GitHub",
      description: "Gérez vos repositories et notifications GitHub",
      icon: "⚫",
      color: "#333",
      isConnected: true,
    },
    {
      id: "discord",
      name: "Discord",
      description: "Recevez des notifications sur vos serveurs Discord",
      icon: "🟣",
      color: "#5865f2",
      isConnected: true,
    },
    {
      id: "spotify",
      name: "Spotify",
      description: "Contrôlez votre musique et playlists",
      icon: "🟢",
      color: "#1db954",
      isConnected: false,
    },
    {
      id: "trello",
      name: "Trello",
      description: "Automatisez vos boards et cartes Trello",
      icon: "🔷",
      color: "#0079bf",
      isConnected: false,
    },
    {
      id: "microsoft",
      name: "Microsoft",
      description: "Accédez à Outlook, OneDrive et Teams",
      icon: "🟦",
      color: "#00a4ef",
      isConnected: false,
    },
    {
      id: "slack",
      name: "Slack",
      description: "Recevez des messages sur vos canaux Slack",
      icon: "💬",
      color: "#4a154b",
      isConnected: false,
    },
    {
      id: "twitter",
      name: "Twitter / X",
      description: "Publiez des tweets et suivez votre timeline",
      icon: "🔷",
      color: "#1da1f2",
      isConnected: false,
    },
  ]);

  const handleToggleConnection = (serviceId: string) => {
    setServices((prevServices) =>
      prevServices.map((service) => {
        if (service.id === serviceId) {
          const action = service.isConnected ? "Déconnexion" : "Connexion";
          alert(`${action} de ${service.name} sera disponible prochainement !`);
          return { ...service, isConnected: !service.isConnected };
        }
        return service;
      })
    );
  };

  const connectedCount = services.filter((s) => s.isConnected).length;
  const totalCount = services.length;

  return (
    <div className="services-container">
      <div className="services-content">
        <div className="services-header">
          <h1 className="services-title">Services Disponibles</h1>
          <p className="services-subtitle">
            Connectez vos services préférés pour automatiser vos tâches
          </p>
          <div className="services-stats">
            <span className="services-stat-badge">
              {connectedCount} / {totalCount} services connectés
            </span>
          </div>
        </div>
        <div className="services-grid">
          {services.map((service) => (
            <div
              key={service.id}
              className={`service-card ${service.isConnected ? "service-card-connected" : ""}`}
            >
              <div className="service-card-header">
                <div className="service-icon">{service.icon}</div>
                {service.isConnected && (
                  <span className="service-badge-connected">✓ Connecté</span>
                )}
              </div>

              <div className="service-card-body">
                <h3 className="service-name">{service.name}</h3>
                <p className="service-description">{service.description}</p>
              </div>

              <div className="service-card-footer">
                <button
                  onClick={() => handleToggleConnection(service.id)}
                  className={`service-button ${
                    service.isConnected
                      ? "service-button-disconnect"
                      : "service-button-connect"
                  }`}
                  style={
                    !service.isConnected
                      ? { backgroundColor: service.color, borderColor: service.color }
                      : {}
                  }
                >
                  {service.isConnected ? "Déconnecter" : "Connecter"}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="services-actions">
          <a href="/" className="services-back-button">
            ← Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
};

export default ServicesScreen;
