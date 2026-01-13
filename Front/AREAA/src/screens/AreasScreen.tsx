/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** AreasScreen component - List of all AREA
*/

import React, { useState, useEffect } from "react";
import { fetchMyAreas, toggleAreaStatus, deleteArea } from "../services/api";
import type { AreaDetail } from "../services/api";
import { logout } from "../services/auth";
import "./AreasScreen.css";

interface Action {
  service: string;
  type: string;
  description: string;
  parameters: Record<string, any>;
}

interface Reaction {
  service: string;
  type: string;
  description: string;
  parameters: Record<string, any>;
}

interface Area {
  id: number;
  name: string;
  action: Action;
  reaction: Reaction;
  isActive: boolean;
  createdAt: string;
}

const AreasScreen: React.FC = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    loadAreas();
  }, []);

  const loadAreas = async () => {
    try {
      setLoading(true);
      setError("");
      
      const apiAreas = await fetchMyAreas();
      
      const mappedAreas: Area[] = apiAreas.map((area) => ({
        id: area.id,
        name: area.name,
        action: {
          service: area.action.service.display_name || area.action.service.name,
          type: area.action.action.name,
          description: area.action.action.description,
          parameters: area.action_parameters || {},
        },
        reaction: {
          service: area.reaction.service.display_name || area.reaction.service.name,
          type: area.reaction.reaction.name,
          description: area.reaction.reaction.description,
          parameters: area.reaction_parameters || {},
        },
        isActive: area.is_active,
        createdAt: new Date(area.created_at).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      }));

      setAreas(mappedAreas);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des AREAs");
      console.error("Error loading areas:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: number) => {
    const area = areas.find((a) => a.id === id);
    if (!area) return;

    try {
      await toggleAreaStatus(id, !area.isActive);
      alert(`AREA "${area.name}" ${area.isActive ? "désactivée" : "activée"} avec succès !`);
      await loadAreas();
    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : "Erreur inconnue"}`);
    }
  };

  const handleDelete = async (id: number) => {
    const area = areas.find((a) => a.id === id);
    if (!area) return;
    
    if (window.confirm(`Voulez-vous vraiment supprimer "${area.name}" ?`)) {
      try {
        await deleteArea(id);
        alert(`AREA "${area.name}" supprimée avec succès !`);
        await loadAreas();
      } catch (err) {
        alert(`Erreur: ${err instanceof Error ? err.message : "Erreur inconnue"}`);
      }
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const activeCount = areas.filter((area) => area.isActive).length;

  if (loading) {
    return (
      <div className="areas-container">
        <div className="areas-background">
          {stars.map((star) => (
            <div key={star.id} className="star" style={star.style} />
          ))}
        </div>
        <div className="areas-content">
          <div className="loading-card">
            <p>Chargement des AREAs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="areas-container">
        <div className="areas-background">
          {stars.map((star) => (
            <div key={star.id} className="star" style={star.style} />
          ))}
        </div>
        <div className="areas-content">
          <div className="error-card">
            <h3>Erreur</h3>
            <p>{error}</p>
            <button onClick={loadAreas} className="retry-button">Réessayer</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="areas-container">
      <div className="areas-background">
        {stars.map((star) => (
          <div key={star.id} className="star" style={star.style} />
        ))}
      </div>
      <div className="areas-content">
        <div className="areas-topbar">
          <h1 className="topbar-title">Mes AREA</h1>
          <button onClick={handleLogout} className="logout-btn">
            Déconnexion
          </button>
        </div>

        <div className="areas-header">
          <p className="areas-subtitle">
            Gérez vos automatisations entre différents services
          </p>
          <div className="areas-stats">
            <span className="areas-stat-badge">
              {areas.length} AREA{areas.length > 1 ? "s" : ""} totale{areas.length > 1 ? "s" : ""}
            </span>
            <span className="areas-stat-badge areas-stat-badge-success">
              {activeCount} active{activeCount > 1 ? "s" : ""}
            </span>
            <span className="areas-stat-badge areas-stat-badge-inactive">
              {areas.length - activeCount} inactive{areas.length - activeCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="areas-list">
          {areas.map((area) => (
            <div
              key={area.id}
              className={`area-card ${area.isActive ? "area-card-active" : "area-card-inactive"}`}
            >
              <div className="area-card-header">
                <div className="area-card-title-section">
                  <h3 className="area-card-title">{area.name}</h3>
                  <span
                    className={`area-status-badge ${
                      area.isActive
                        ? "area-status-badge-active"
                        : "area-status-badge-inactive"
                    }`}
                  >
                    {area.isActive ? "✓ Active" : "○ Inactive"}
                  </span>
                </div>
                <p className="area-card-date">Créée le {area.createdAt}</p>
              </div>

              <div className="area-card-body">
                <div className="area-flow">
                  <div className="area-flow-item area-flow-action">
                    <div className="area-flow-label">ACTION</div>
                    <div className="area-flow-service">{area.action.service}</div>
                    <div className="area-flow-type">{area.action.type}</div>
                    <div className="area-flow-description">
                      {area.action.description}
                    </div>
                    {Object.keys(area.action.parameters).length > 0 && (
                      <div className="area-flow-parameters">
                        <strong>Paramètres:</strong>
                        <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                          {Object.entries(area.action.parameters).map(([key, value]) => (
                            <li key={key}>
                              <strong>{key}:</strong> {String(value)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="area-flow-arrow">→</div>

                <div className="area-flow-item area-flow-reaction">
                  <div className="area-flow">
                    <div className="area-flow-label">RÉACTION</div>
                    <div className="area-flow-service">{area.reaction.service}</div>
                    <div className="area-flow-type">{area.reaction.type}</div>
                    <div className="area-flow-description">
                      {area.reaction.description}
                    </div>
                    {Object.keys(area.reaction.parameters).length > 0 && (
                      <div className="area-flow-parameters">
                        <strong>Paramètres:</strong>
                        <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                          {Object.entries(area.reaction.parameters).map(([key, value]) => (
                              <li key={key}>
                                <strong>{key}:</strong>{" "}
                                <span
                                    className="param-value"
                                    title="Cliquer pour copier"
                                    onClick={() => navigator.clipboard.writeText(String(value))}
                                >
                                  {String(value).length > 40
                                      ? `${String(value).slice(0, 20)}...${String(value).slice(-10)}`
                                      : String(value)}
                                </span>
                              </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="area-card-footer">
                <button
                  onClick={() => handleToggleActive(area.id)}
                  className={`area-action-button ${
                    area.isActive
                      ? "area-action-button-deactivate"
                      : "area-action-button-activate"
                  }`}
                >
                  {area.isActive ? "Désactiver" : "Activer"}
                </button>
                <button className="area-action-button area-action-button-edit">
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(area.id)}
                  className="area-action-button area-action-button-delete"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>

        {areas.length === 0 && (
          <div className="areas-empty">
            <p className="areas-empty-text">
              Vous n'avez pas encore créé d'AREA.
            </p>
            <a href="/create-area" className="areas-create-button">
              Créer ma première AREA
            </a>
          </div>
        )}

        <div className="areas-actions">
          <a href="/create-area" className="areas-create-button">
            + Créer une nouvelle AREA
          </a>
          <a href="/" className="areas-back-button">
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
};

export default AreasScreen;
