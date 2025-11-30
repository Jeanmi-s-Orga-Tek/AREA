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

interface Service {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  isConnected: boolean;
  serviceAccountId?: number;
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
      setLoading(true);
      setError("");
      
      const [allServices, connectedServices] = await Promise.all([
        fetchServices(),
        fetchMyConnectedServices(),
      ]);

      const validConnectedServices = connectedServices.filter(sa => sa.service && sa.service.id);

      const connectedServiceIds = new Set(validConnectedServices.map((sa) => sa.service.id));
      const serviceAccountMap = new Map(
        validConnectedServices.map((sa) => [sa.service.id, sa.id])
      );

      const mappedServices: Service[] = allServices.map((service) => ({
        id: service.id,
        name: service.display_name || service.name,
        description: service.description || `Connectez-vous à ${service.display_name}`,
        icon: service.icon || "�",
        color: service.color || "#4285f4",
        isConnected: connectedServiceIds.has(service.id),
        serviceAccountId: serviceAccountMap.get(service.id),
      }));

      setServices(mappedServices);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des services");
      console.error("Error loading services:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleConnection = async (serviceId: number) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    if (service.isConnected) {
      // Disconnect
      if (service.serviceAccountId) {
        try {
          await disconnectService(service.serviceAccountId);
          alert(`Service ${service.name} déconnecté avec succès !`);
          await loadServices();
        } catch (err) {
          alert(`Erreur lors de la déconnexion: ${err instanceof Error ? err.message : "Erreur inconnue"}`);
        }
      }
    } else {
      // Connect - redirect to OAuth flow
      alert(`Connexion OAuth pour ${service.name} sera implémentée prochainement !`);
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
