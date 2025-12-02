/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** ServicesScreen
*/

import React, { useState, useEffect } from "react";
import { fetchServices, fetchMyConnectedServices, disconnectService } from "../services/api";
import type { Service as APIService, ServiceAccount } from "../services/api";
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
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      console.log("=== loadServices START ===");
      setLoading(true);
      setError("");
      
      console.log(" Chargement des services...");
      const [allServices, connectedServices] = await Promise.all([
        fetchServices(),
        fetchMyConnectedServices(),
      ]);

      console.log(" Tous les services:", allServices);
      console.log(" Services connectés:", connectedServices);

      const validConnectedServices = connectedServices.filter(sa => sa.service && sa.service.id);
      console.log(" Services connectés valides:", validConnectedServices);

      const connectedServiceIds = new Set(validConnectedServices.map((sa) => sa.service.id));
      console.log(" IDs des services connectés:", Array.from(connectedServiceIds));
      
      const serviceAccountMap = new Map(
        validConnectedServices.map((sa) => [sa.service.id, sa.id])
      );
      console.log(" Map service -> serviceAccount:", serviceAccountMap);

      const mappedServices: Service[] = allServices.map((service) => ({
        id: service.id,
        name: service.display_name || service.name,
        description: service.description || `Connectez-vous à ${service.display_name}`,
        icon: service.icon || "📦",
        color: service.color || "#4285f4",
        isConnected: connectedServiceIds.has(service.id),
        serviceAccountId: serviceAccountMap.get(service.id),
        oauth_provider: service.oauth_provider,
      }));

      console.log("Services mappés avec état de connexion:");
      mappedServices.forEach(s => {
        console.log(`  - ${s.name}: ${s.isConnected ? '✅ Connecté' : '⭕ Non connecté'} (provider: ${s.oauth_provider})`);
      });

      setServices(mappedServices);
      console.log("=== loadServices END ===");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des services");
      console.error("Error loading services:", err);
    } finally {
      setLoading(false);
    }
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
          alert(`Service ${service.name} déconnecté avec succès !`);
          await loadServices();
        } catch (err) {
          console.error("Erreur déconnexion:", err);
          alert(`Erreur lors de la déconnexion: ${err instanceof Error ? err.message : "Erreur inconnue"}`);
        }
      }
    } else {
      // Connect - redirect to OAuth flow
      console.log("Connexion au service:", service.name);
      console.log("OAuth Provider:", service.oauth_provider);
      
      if (!service.oauth_provider) {
        alert(`Ce service ne supporte pas encore l'OAuth automatique`);
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
        alert(`Erreur lors de la connexion: ${err instanceof Error ? err.message : "Erreur inconnue"}`);
      }
    }
  };

  const connectedCount = services.filter((s) => s.isConnected).length;
  const totalCount = services.length;

  if (loading) {
    return (
      <div className="services-container">
        <div className="services-content">
          <p>Chargement des services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="services-container">
        <div className="services-content">
          <div style={{ color: "red", padding: "20px" }}>
            <h3>Erreur</h3>
            <p>{error}</p>
            <button onClick={loadServices}>Réessayer</button>
          </div>
        </div>
      </div>
    );
  }

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
