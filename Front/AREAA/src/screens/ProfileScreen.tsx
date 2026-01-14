/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** ProfileScreen
*/

import React, { useState, useEffect } from "react";
import { logout } from "../services/auth";
import { fetchCurrentUser, fetchMyConnectedServices, fetchMyAreas, disconnectService } from "../services/api";
import type { User } from "../services/api";
import NotificationContainer, { NotificationItem } from "../components/NotificationContainer";
import "./ProfileScreen.css";

interface ConnectedService {
  id: number;
  name: string;
  icon: string;
  connectedAt: string;
}

const ProfileScreen: React.FC = () => {
  const [stars, setStars] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);
  const [user, setUser] = useState<User | null>(null);
  const [connectedServices, setConnectedServices] = useState<ConnectedService[]>([]);
  const [areaCount, setAreaCount] = useState(0);
  const [activeAreas, setActiveAreas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = (message: string, type: "success" | "error") => {
    const id = `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications((prev) => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

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
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);

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
      addNotification(err instanceof Error ? err.message : "Erreur lors du chargement du profil", "error");
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
      addNotification(`${serviceName} déconnecté avec succès !`, "success");
      await loadProfileData();
    } catch (err) {
      addNotification(`Erreur: ${err instanceof Error ? err.message : "Erreur inconnue"}`, "error");
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
            <a href="/" className="nav-item">
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
            <a href="/profile" className="nav-item active">
              👤 Profil
            </a>
            <a href="/about" className="nav-item">
              ℹ️ À propos
            </a>
          </nav>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-topbar">
            <h1 className="topbar-title">Mon Profil</h1>
            <div className="topbar-user">
              <span className="user-name">👋 Chargement...</span>
            </div>
          </div>

          <div className="dashboard-main">
            <div className="card">
              <p className="card-description">Chargement du profil...</p>
            </div>
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
    <div className="dashboard-page">
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
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
          <a href="/" className="nav-item">
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
          <a href="/profile" className="nav-item active">
            👤 Profil
          </a>
          <a href="/about" className="nav-item">
            ℹ️ À propos
          </a>
        </nav>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-topbar">
          <h1 className="topbar-title">Mon Profil</h1>
          <div className="topbar-user">
            <span className="user-name">👋 {user?.name || "Utilisateur"}</span>
            <button onClick={handleLogout} className="logout-btn">
              🚪 Déconnexion
            </button>
          </div>
        </div>

        <div className="dashboard-main">
          <div className="welcome-card">
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
              <h2 className="welcome-title">{user.name}</h2>
              <p className="welcome-text">{user.email}</p>
            </div>
          </div>

          <div className="profile-stats">
            <div className="card stats-card">
              <div className="profile-stat-value">{areaCount}</div>
              <div className="profile-stat-label">AREA créés</div>
            </div>
            <div className="card stats-card">
              <div className="profile-stat-value">{activeAreas}</div>
              <div className="profile-stat-label">AREA actifs</div>
            </div>
            <div className="card stats-card">
              <div className="profile-stat-value">{connectedServices.length}</div>
              <div className="profile-stat-label">Services connectés</div>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">Services Connectés</h2>
            <div className="profile-services">
              {connectedServices.map((service) => (
                <div key={service.id} className="card profile-service-card">
                  <div className="profile-service-icon">{service.icon}</div>
                  <div className="profile-service-info">
                    <div className="profile-service-name">{service.name}</div>
                    <div className="profile-service-date">
                      Connecté le {service.connectedAt}
                    </div>
                  </div>
                  <button
                    className="btn-disconnect"
                    onClick={() => handleDisconnectService(service.id, service.name)}
                  >
                    Déconnecter
                  </button>
                </div>
              ))}
            </div>

            {connectedServices.length === 0 && (
              <p className="card-description" style={{ textAlign: 'center', padding: '40px' }}>
                Aucun service connecté pour le moment
              </p>
            )}
          </div>

          <div className="profile-actions">
            <a href="/services" className="btn-primary">
              🔌 Gérer les services
            </a>
            <a href="/areas" className="btn-secondary">
              📋 Mes AREA
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
