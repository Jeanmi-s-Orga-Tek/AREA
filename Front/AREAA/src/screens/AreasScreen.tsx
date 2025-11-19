/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** AreasScreen component - List of all AREA
*/

import React, { useState } from "react";
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
  id: string;
  name: string;
  action: Action;
  reaction: Reaction;
  isActive: boolean;
  createdAt: string;
}

const AreasScreen: React.FC = () => {
  const [areas, setAreas] = useState<Area[]>([
    {
      id: "1",
      name: "Notifications GitHub → Discord",
      action: {
        service: "GitHub",
        type: "New Issue",
        description: "Quand une nouvelle issue est créée",
      },
      reaction: {
        service: "Discord",
        type: "Send Message",
        description: "Envoyer un message dans #dev",
      },
      isActive: true,
      createdAt: "15 Nov 2025",
    },
    {
      id: "2",
      name: "Emails → Trello",
      action: {
        service: "Google",
        type: "New Email",
        description: "Quand un email important arrive",
      },
      reaction: {
        service: "Trello",
        type: "Create Card",
        description: "Créer une carte dans 'To Do'",
      },
      isActive: true,
      createdAt: "12 Nov 2025",
    },
    {
      id: "3",
      name: "Spotify → Twitter",
      action: {
        service: "Spotify",
        type: "New Liked Song",
        description: "Quand j'aime une chanson",
      },
      reaction: {
        service: "Twitter",
        type: "Post Tweet",
        description: "Publier un tweet avec le titre",
      },
      isActive: false,
      createdAt: "08 Nov 2025",
    },
    {
      id: "4",
      name: "GitHub PR → Slack",
      action: {
        service: "GitHub",
        type: "New Pull Request",
        description: "Quand une PR est créée",
      },
      reaction: {
        service: "Slack",
        type: "Send Notification",
        description: "Notifier l'équipe dans #reviews",
      },
      isActive: true,
      createdAt: "05 Nov 2025",
    },
    {
      id: "5",
      name: "Trello → Microsoft Teams",
      action: {
        service: "Trello",
        type: "Card Moved",
        description: "Quand une carte est déplacée en 'Done'",
      },
      reaction: {
        service: "Microsoft",
        type: "Send Message",
        description: "Célébrer dans le channel Teams",
      },
      isActive: true,
      createdAt: "01 Nov 2025",
    },
    {
      id: "6",
      name: "Discord → Google Calendar",
      action: {
        service: "Discord",
        type: "Event Created",
        description: "Quand un événement Discord est créé",
      },
      reaction: {
        service: "Google",
        type: "Create Event",
        description: "Ajouter au calendrier Google",
      },
      isActive: false,
      createdAt: "28 Oct 2025",
    },
  ]);

  const handleToggleActive = (id: string) => {
    setAreas(
      areas.map((area) =>
        area.id === id ? { ...area, isActive: !area.isActive } : area
      )
    );
    const area = areas.find((a) => a.id === id);
    if (area) {
      alert(
        `AREA "${area.name}" ${area.isActive ? "désactivée" : "activée"} avec succès !`
      );
    }
  };

  const handleDelete = (id: string) => {
    const area = areas.find((a) => a.id === id);
    if (area && window.confirm(`Voulez-vous vraiment supprimer "${area.name}" ?`)) {
      setAreas(areas.filter((a) => a.id !== id));
      alert(`AREA "${area.name}" supprimée avec succès !`);
    }
  };

  const activeCount = areas.filter((area) => area.isActive).length;

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
            <button className="areas-create-button">Créer ma première AREA</button>
          </div>
        )}

        <div className="areas-actions">
          <button className="areas-create-button">+ Créer une nouvelle AREA</button>
          <a href="/" className="areas-back-button">
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
};

export default AreasScreen;
