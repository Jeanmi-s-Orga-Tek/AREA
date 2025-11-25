/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** ProfileScreen
*/

import React, { useState, useEffect } from "react";
import { logout } from "../services/auth";
import { fetchCurrentUser, fetchMyConnectedServices, fetchMyAreas, disconnectService } from "../services/api";
import type { User, ServiceAccount, AreaDetail } from "../services/api";
import "./ProfileScreen.css";

interface ConnectedService {
  id: number;
  name: string;
  icon: string;
  connectedAt: string;
}

const ProfileScreen: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [connectedServices, setConnectedServices] = useState<ConnectedService[]>([]);
  const [areaCount, setAreaCount] = useState(0);
  const [activeAreas, setActiveAreas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError("");

      const [userData, servicesData, areasData] = await Promise.all([
        fetchCurrentUser(),
        fetchMyConnectedServices(),
        fetchMyAreas(),
      ]);

      setUser(userData);

      const mappedServices: ConnectedService[] = servicesData.map((sa) => ({
        id: sa.id,
        name: sa.service.display_name || sa.service.name,
        icon: sa.service.icon || "🔵",
        connectedAt: new Date(sa.created_at).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      }));
      setConnectedServices(mappedServices);

      setAreaCount(areasData.length);
      setActiveAreas(areasData.filter((area) => area.is_active).length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement du profil");
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectService = async (serviceId: number, serviceName: string) => {
    if (!window.confirm(`Voulez-vous vraiment déconnecter ${serviceName} ?`)) {
      return;
    }

    try {
      await disconnectService(serviceId);
      alert(`${serviceName} déconnecté avec succès !`);
      await loadProfileData();
    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : "Erreur inconnue"}`);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Voulez-vous vraiment vous déconnecter ?")) {
      logout();
      window.location.href = "/";
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-content">
          <p>Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="profile-content">
          <div style={{ color: "red", padding: "20px" }}>
            <h3>Erreur</h3>
            <p>{error}</p>
            <button onClick={loadProfileData}>Réessayer</button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-content">
          <p>Utilisateur non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.image ? (
              <img src={user.image} alt={user.name} className="profile-avatar-img" />
            ) : (
              <span className="profile-avatar-text">
                {user.email.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h1 className="profile-title">Mon Profil</h1>
          <p className="profile-name">{user.name}</p>
          <p className="profile-email">{user.email}</p>
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
            {connectedServices.map((service) => (
              <div key={service.id} className="profile-service-card">
                <div className="profile-service-icon">{service.icon}</div>
                <div className="profile-service-info">
                  <div className="profile-service-name">{service.name}</div>
                  <div className="profile-service-date">
                    Connecté le {service.connectedAt}
                  </div>
                </div>
                <button 
                  className="profile-service-disconnect"
                  onClick={() => handleDisconnectService(service.id, service.name)}
                >
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
