/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** ServicesScreen
*/

import React, { useState, useEffect } from "react";
import { fetchServices, fetchMyConnectedServices, disconnectService, fetchCurrentUser } from "../services/api";
import type { User } from "../services/api";
import { logout, fetchOAuthProviders } from "../services/auth";
import type { OAuthProvider } from "../services/auth";
import NotificationContainer, { NotificationItem } from "../components/NotificationContainer";
import AccessibilityPanel from "../components/AccessibilityPanel";
import "./ServicesScreen.css";

const API_BASE_URL = "http://localhost:8080";

interface Service {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  isConnected: boolean;
  serviceAccountId?: number;
  oauth_provider?: string | null;
}

const ServicesScreen: React.FC = () => {
  const [stars, setStars] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);
  const [user, setUser] = useState<User | null>(null);
  const [services, setServices] = useState<Service[]>([]);
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

    const fetchUser = async () => {
      try {
        const userData = await fetchCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    generateStars();
    fetchUser();
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      console.log("=== loadServices START ===");
      setLoading(true);

      console.log(" Chargement des services et providers...");
      const [allServices, connectedServices, providers] = await Promise.all([
        fetchServices(),
        fetchMyConnectedServices(),
        fetchOAuthProviders(),
      ]);

      console.log(" Tous les services:", allServices);
      console.log(" Services connectés:", connectedServices);
      console.log(" Providers OAuth:", providers);

      const validConnectedServices = connectedServices.filter(sa => sa.service && sa.service.id);
      console.log(" Services connectés valides:", validConnectedServices);

      const connectedServiceIds = new Set(validConnectedServices.map((sa) => sa.service.id));
      console.log(" IDs des services connectés:", Array.from(connectedServiceIds));
      
      const serviceAccountMap = new Map(
        validConnectedServices.map((sa) => [sa.service.id, sa.id])
      );
      console.log(" Map service -> serviceAccount:", serviceAccountMap);

      const providerById: Record<string, OAuthProvider> = Object.fromEntries(
        (providers || []).map((p) => [p.id, p])
      );

      const mappedServices: Service[] = allServices.map((service) => {
        const providerKey = service.oauth_provider || service.name;
        const provider = providerById[providerKey];

        return {
          id: service.id,
          name: service.display_name || service.name,
          description: service.description || `Connectez-vous à ${service.display_name}`,
          icon: provider?.icon ?? service.icon ?? "📦",
          color: provider?.color ?? service.color ?? "#4285f4",
          isConnected: connectedServiceIds.has(service.id),
          serviceAccountId: serviceAccountMap.get(service.id),
          oauth_provider: service.oauth_provider,
        };
      });

      console.log("Services mappés avec état de connexion:");
      mappedServices.forEach(s => {
        console.log(`  - ${s.name}: ${s.isConnected ? '✅ Connecté' : '⭕ Non connecté'} (provider: ${s.oauth_provider})`);
      });

      setServices(mappedServices);
      console.log("=== loadServices END ===");
    } catch (err) {
      addNotification(err instanceof Error ? err.message : "Erreur lors du chargement des services", "error");
      console.error("Error loading services:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const renderServiceIcon = (service: Service) => {
    const icon = service.icon;

    if (/^https?:\/\//i.test(icon)) {
      return (
        <img
          src={icon}
          alt={`${service.name} logo`}
          style={{
            width: "48px",
            height: "48px",
            objectFit: "contain",
            display: "block",
          }}
        />
      );
    }

    if (/^\s*<svg[\s>]/i.test(icon)) {
      return (
        <span
          aria-label={`${service.name} logo`}
          role="img"
          style={{ width: "48px", height: "48px", display: "inline-block" }}
          dangerouslySetInnerHTML={{ __html: icon }}
        />
      );
    }

    return <>{icon}</>;
  };

  const handleToggleConnection = async (serviceId: number) => {
    const service = services.find((s) => s.id === serviceId);
    console.log("=== handleToggleConnection ===");
    console.log("Service ID:", serviceId);
    console.log("Service found:", service);
    
    if (!service) return;

    if (service.isConnected) {
      // Disconnect
      console.log("Déconnexion du service:", service.name);
      if (service.serviceAccountId) {
        try {
          await disconnectService(service.serviceAccountId);
          addNotification(`Service ${service.name} déconnecté avec succès !`, "success");
          await loadServices();
        } catch (err) {
          console.error("Erreur déconnexion:", err);
          addNotification(`Erreur lors de la déconnexion: ${err instanceof Error ? err.message : "Erreur inconnue"}`, "error");
        }
      }
    } else {
      // Connect - redirect to OAuth flow
      console.log("Connexion au service:", service.name);
      console.log("OAuth Provider:", service.oauth_provider);
      
      if (!service.oauth_provider) {
        addNotification(`Ce service ne supporte pas encore l'OAuth automatique`, "error");
        return;
      }

      try {
        console.log("Sauvegarde dans sessionStorage:");
        console.log("  - connecting_service:", service.name);
        console.log("  - connecting_service_provider:", service.oauth_provider);
        
        sessionStorage.setItem("connecting_service", service.name);
        sessionStorage.setItem("connecting_service_provider", service.oauth_provider);
        
        console.log("🌐 Récupération URL OAuth pour:", service.oauth_provider);
        const response = await fetch(`${API_BASE_URL}/oauth/authorize/${service.oauth_provider}/web`);
        
        console.log("Response status:", response.status);
        if (!response.ok) {
          throw new Error("Impossible de récupérer l'URL d'autorisation");
        }
        
        const data = await response.json();
        console.log("Authorization URL:", data.authorization_url);
        console.log("Redirection vers OAuth...");
        
        window.location.href = data.authorization_url;
      } catch (err) {
        console.error("Erreur lors de la connexion:", err);
        addNotification(`Erreur lors de la connexion: ${err instanceof Error ? err.message : "Erreur inconnue"}`, "error");
      }
    }
  };

  const connectedCount = services.filter((s) => s.isConnected).length;
  const totalCount = services.length;

  return (
    <div className="dashboard-page">
      <AccessibilityPanel />
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
          <a href="/services" className="nav-item active">
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
          <h1 className="topbar-title">Services</h1>
          <div className="topbar-user">
            <span className="user-name">👋 {loading ? "Chargement..." : (user?.name || "Utilisateur")}</span>
            <button onClick={handleLogout} className="logout-btn">
              🚪 Déconnexion
            </button>
          </div>
        </div>

        <div className="dashboard-main">
          <div className="welcome-card">
            <h2 className="welcome-title">🔌 Services Disponibles</h2>
            <p className="welcome-text">
              Connectez vos services préférés pour automatiser vos tâches
            </p>
            <div className="services-stats">
              <span className="stat-value">{connectedCount} / {totalCount}</span>
              <span className="stat-label"> services connectés</span>
            </div>
          </div>

          {loading ? (
            <div className="card">
              <p className="card-description">Chargement des services...</p>
            </div>
          ) : (
            <div className="services-grid">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`card service-card ${service.isConnected ? "service-card-connected" : ""}`}
                >
                  <div className="service-card-header">
                    <div className="card-icon" style={{ color: service.color }}>
                      {renderServiceIcon(service)}
                    </div>
                    {service.isConnected && (
                      <span className="service-badge-connected">✓ Connecté</span>
                    )}
                  </div>

                  <div className="service-card-body">
                    <h3 className="card-title">{service.name}</h3>
                    <p className="card-description">{service.description}</p>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ServicesScreen;
