/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** AreasScreen component - List of all AREA
*/

import React, { useState, useEffect } from "react";
import { fetchMyAreas, toggleAreaStatus, deleteArea } from "../services/api";
import type { AreaDetail } from "../services/api";
import "./AreasScreen.css";

interface Action {
  service: string;
  type: string;
  description: string;
}

interface Reaction {
  service: string;
  type: string;
  description: string;
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

  useEffect(() => {
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
        },
        reaction: {
          service: area.reaction.service.display_name || area.reaction.service.name,
          type: area.reaction.reaction.name,
          description: area.reaction.reaction.description,
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

  const activeCount = areas.filter((area) => area.isActive).length;

  if (loading) {
    return (
      <div className="areas-container">
        <div className="areas-content">
          <p>Chargement des AREAs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="areas-container">
        <div className="areas-content">
          <div style={{ color: "red", padding: "20px" }}>
            <h3>Erreur</h3>
            <p>{error}</p>
            <button onClick={loadAreas}>Réessayer</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="areas-container">
      <div className="areas-content">
        <div className="areas-header">
          <h1 className="areas-title">Mes AREA</h1>
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
                <div className="area-flow-item area-flow-action">
                  <div className="area-flow-label">ACTION</div>
                  <div className="area-flow-service">{area.action.service}</div>
                  <div className="area-flow-type">{area.action.type}</div>
                  <div className="area-flow-description">
                    {area.action.description}
                  </div>
                </div>

                <div className="area-flow-arrow">→</div>

                <div className="area-flow-item area-flow-reaction">
                  <div className="area-flow-label">RÉACTION</div>
                  <div className="area-flow-service">{area.reaction.service}</div>
                  <div className="area-flow-type">{area.reaction.type}</div>
                  <div className="area-flow-description">
                    {area.reaction.description}
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
