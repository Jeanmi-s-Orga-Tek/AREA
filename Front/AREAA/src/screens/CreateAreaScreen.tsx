/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** CreateAreaScreen component - Create new AREA with multi-step form
*/

import React, { useState } from "react";
import "./CreateAreaScreen.css";

interface Service {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface ActionType {
  id: string;
  name: string;
  description: string;
  parameters: Parameter[];
}

interface ReactionType {
  id: string;
  name: string;
  description: string;
  parameters: Parameter[];
}

interface Parameter {
  id: string;
  name: string;
  type: "text" | "number" | "select";
  options?: string[];
  placeholder?: string;
}

const CreateAreaScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedActionService, setSelectedActionService] = useState<Service | null>(null);
  const [selectedActionType, setSelectedActionType] = useState<ActionType | null>(null);
  const [actionParameters, setActionParameters] = useState<Record<string, string>>({});
  const [selectedReactionService, setSelectedReactionService] = useState<Service | null>(null);
  const [selectedReactionType, setSelectedReactionType] = useState<ReactionType | null>(null);
  const [reactionParameters, setReactionParameters] = useState<Record<string, string>>({});
  const [areaName, setAreaName] = useState("");

  const services: Service[] = [
    { id: "github", name: "GitHub", icon: "⚫", color: "#333" },
    { id: "google", name: "Google", icon: "🔵", color: "#4285F4" },
    { id: "discord", name: "Discord", icon: "🟣", color: "#5865F2" },
    { id: "spotify", name: "Spotify", icon: "🟢", color: "#1DB954" },
    { id: "trello", name: "Trello", icon: "🔷", color: "#0079BF" },
    { id: "slack", name: "Slack", icon: "🟥", color: "#4A154B" },
    { id: "twitter", name: "Twitter", icon: "🐦", color: "#1DA1F2" },
    { id: "microsoft", name: "Microsoft", icon: "🟦", color: "#00A4EF" },
  ];

  const actionTypes: Record<string, ActionType[]> = {
    github: [
      {
        id: "new_issue",
        name: "New Issue",
        description: "Déclenché quand une nouvelle issue est créée",
        parameters: [
          { id: "repository", name: "Repository", type: "text", placeholder: "owner/repo" },
        ],
      },
      {
        id: "new_pr",
        name: "New Pull Request",
        description: "Déclenché quand une nouvelle PR est créée",
        parameters: [
          { id: "repository", name: "Repository", type: "text", placeholder: "owner/repo" },
        ],
      },
      {
        id: "new_star",
        name: "New Star",
        description: "Déclenché quand le repo reçoit une étoile",
        parameters: [
          { id: "repository", name: "Repository", type: "text", placeholder: "owner/repo" },
        ],
      },
    ],
    google: [
      {
        id: "new_email",
        name: "New Email",
        description: "Déclenché à la réception d'un email",
        parameters: [
          { id: "from", name: "From (optional)", type: "text", placeholder: "sender@example.com" },
          { id: "subject", name: "Subject contains", type: "text", placeholder: "Keywords..." },
        ],
      },
      {
        id: "new_calendar_event",
        name: "New Calendar Event",
        description: "Déclenché quand un événement est créé",
        parameters: [
          { id: "calendar", name: "Calendar", type: "text", placeholder: "primary" },
        ],
      },
    ],
    discord: [
      {
        id: "new_message",
        name: "New Message",
        description: "Déclenché à chaque nouveau message",
        parameters: [
          { id: "channel", name: "Channel ID", type: "text", placeholder: "123456789" },
        ],
      },
      {
        id: "event_created",
        name: "Event Created",
        description: "Déclenché quand un événement est créé",
        parameters: [],
      },
    ],
    spotify: [
      {
        id: "new_liked_song",
        name: "New Liked Song",
        description: "Déclenché quand vous aimez une chanson",
        parameters: [],
      },
      {
        id: "new_playlist",
        name: "New Playlist",
        description: "Déclenché quand vous créez une playlist",
        parameters: [],
      },
    ],
    trello: [
      {
        id: "card_moved",
        name: "Card Moved",
        description: "Déclenché quand une carte est déplacée",
        parameters: [
          { id: "board", name: "Board ID", type: "text", placeholder: "Board ID" },
          { id: "list", name: "To List", type: "text", placeholder: "List name" },
        ],
      },
      {
        id: "new_card",
        name: "New Card",
        description: "Déclenché quand une carte est créée",
        parameters: [
          { id: "board", name: "Board ID", type: "text", placeholder: "Board ID" },
        ],
      },
    ],
    slack: [
      {
        id: "new_message",
        name: "New Message",
        description: "Déclenché à chaque nouveau message",
        parameters: [
          { id: "channel", name: "Channel", type: "text", placeholder: "#general" },
        ],
      },
    ],
    twitter: [
      {
        id: "new_tweet",
        name: "New Tweet from User",
        description: "Déclenché quand un utilisateur tweet",
        parameters: [
          { id: "username", name: "Username", type: "text", placeholder: "@username" },
        ],
      },
    ],
    microsoft: [
      {
        id: "new_email",
        name: "New Email (Outlook)",
        description: "Déclenché à la réception d'un email",
        parameters: [
          { id: "from", name: "From (optional)", type: "text", placeholder: "sender@example.com" },
        ],
      },
    ],
  };

  const reactionTypes: Record<string, ReactionType[]> = {
    discord: [
      {
        id: "send_message",
        name: "Send Message",
        description: "Envoyer un message dans un channel",
        parameters: [
          { id: "channel", name: "Channel ID", type: "text", placeholder: "123456789" },
          { id: "message", name: "Message", type: "text", placeholder: "Your message..." },
        ],
      },
    ],
    slack: [
      {
        id: "send_notification",
        name: "Send Notification",
        description: "Envoyer une notification",
        parameters: [
          { id: "channel", name: "Channel", type: "text", placeholder: "#general" },
          { id: "message", name: "Message", type: "text", placeholder: "Your message..." },
        ],
      },
    ],
    trello: [
      {
        id: "create_card",
        name: "Create Card",
        description: "Créer une nouvelle carte",
        parameters: [
          { id: "board", name: "Board ID", type: "text", placeholder: "Board ID" },
          { id: "list", name: "List", type: "text", placeholder: "To Do" },
          { id: "title", name: "Card Title", type: "text", placeholder: "Card title..." },
        ],
      },
    ],
    twitter: [
      {
        id: "post_tweet",
        name: "Post Tweet",
        description: "Publier un tweet",
        parameters: [
          { id: "text", name: "Tweet Text", type: "text", placeholder: "Your tweet..." },
        ],
      },
    ],
    google: [
      {
        id: "send_email",
        name: "Send Email",
        description: "Envoyer un email via Gmail",
        parameters: [
          { id: "to", name: "To", type: "text", placeholder: "recipient@example.com" },
          { id: "subject", name: "Subject", type: "text", placeholder: "Email subject" },
          { id: "body", name: "Body", type: "text", placeholder: "Email body..." },
        ],
      },
      {
        id: "create_calendar_event",
        name: "Create Calendar Event",
        description: "Créer un événement dans Google Calendar",
        parameters: [
          { id: "title", name: "Event Title", type: "text", placeholder: "Event title" },
          { id: "date", name: "Date", type: "text", placeholder: "YYYY-MM-DD" },
        ],
      },
    ],
    microsoft: [
      {
        id: "send_teams_message",
        name: "Send Teams Message",
        description: "Envoyer un message dans Teams",
        parameters: [
          { id: "channel", name: "Channel", type: "text", placeholder: "General" },
          { id: "message", name: "Message", type: "text", placeholder: "Your message..." },
        ],
      },
    ],
    spotify: [
      {
        id: "add_to_playlist",
        name: "Add to Playlist",
        description: "Ajouter une chanson à une playlist",
        parameters: [
          { id: "playlist", name: "Playlist ID", type: "text", placeholder: "Playlist ID" },
        ],
      },
    ],
  };

  const handleNextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSelectActionService = (service: Service) => {
    setSelectedActionService(service);
    setSelectedActionType(null);
    setActionParameters({});
  };

  const handleSelectActionType = (type: ActionType) => {
    setSelectedActionType(type);
    const params: Record<string, string> = {};
    type.parameters.forEach((param) => {
      params[param.id] = "";
    });
    setActionParameters(params);
  };

  const handleSelectReactionService = (service: Service) => {
    setSelectedReactionService(service);
    setSelectedReactionType(null);
    setReactionParameters({});
  };

  const handleSelectReactionType = (type: ReactionType) => {
    setSelectedReactionType(type);
    const params: Record<string, string> = {};
    type.parameters.forEach((param) => {
      params[param.id] = "";
    });
    setReactionParameters(params);
  };

  const handleActionParameterChange = (paramId: string, value: string) => {
    setActionParameters({ ...actionParameters, [paramId]: value });
  };

  const handleReactionParameterChange = (paramId: string, value: string) => {
    setReactionParameters({ ...reactionParameters, [paramId]: value });
  };

  const handleSubmit = () => {
    const newArea = {
      name: areaName,
      action: {
        service: selectedActionService?.name,
        type: selectedActionType?.name,
        parameters: actionParameters,
      },
      reaction: {
        service: selectedReactionService?.name,
        type: selectedReactionType?.name,
        parameters: reactionParameters,
      },
    };

    console.log("New AREA:", newArea);
    alert(`AREA "${areaName}" créée avec succès !\n\nAction: ${selectedActionService?.name} - ${selectedActionType?.name}\nRéaction: ${selectedReactionService?.name} - ${selectedReactionType?.name}`);
    
    window.location.href = "/areas";
  };

  const isStep1Valid = selectedActionService !== null;
  const isStep2Valid = selectedActionType !== null;
  const isStep3Valid = selectedReactionService !== null;
  const isStep4Valid = selectedReactionType !== null;
  const isStep5Valid = areaName.trim() !== "";

  return (
    <div className="create-area-container">
      <div className="create-area-content">
        <div className="create-area-header">
          <h1 className="create-area-title">Créer une nouvelle AREA</h1>
          <p className="create-area-subtitle">
            Automatisez vos tâches en connectant vos services préférés
          </p>
        </div>

        <div className="create-area-stepper">
          <div className={`stepper-step ${currentStep >= 1 ? "active" : ""} ${currentStep > 1 ? "completed" : ""}`}>
            <div className="stepper-circle">1</div>
            <div className="stepper-label">Action Service</div>
          </div>
          <div className="stepper-line"></div>
          <div className={`stepper-step ${currentStep >= 2 ? "active" : ""} ${currentStep > 2 ? "completed" : ""}`}>
            <div className="stepper-circle">2</div>
            <div className="stepper-label">Action Type</div>
          </div>
          <div className="stepper-line"></div>
          <div className={`stepper-step ${currentStep >= 3 ? "active" : ""} ${currentStep > 3 ? "completed" : ""}`}>
            <div className="stepper-circle">3</div>
            <div className="stepper-label">Réaction Service</div>
          </div>
          <div className="stepper-line"></div>
          <div className={`stepper-step ${currentStep >= 4 ? "active" : ""} ${currentStep > 4 ? "completed" : ""}`}>
            <div className="stepper-circle">4</div>
            <div className="stepper-label">Réaction Type</div>
          </div>
          <div className="stepper-line"></div>
          <div className={`stepper-step ${currentStep >= 5 ? "active" : ""} ${currentStep > 5 ? "completed" : ""}`}>
            <div className="stepper-circle">5</div>
            <div className="stepper-label">Validation</div>
          </div>
        </div>

        <div className="create-area-step-content">
          {currentStep === 1 && (
            <div className="step-section">
              <h2 className="step-title">Étape 1 : Choisissez le service de l'action</h2>
              <p className="step-description">
                Sélectionnez le service qui déclenchera votre automatisation
              </p>
              <div className="services-grid">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`service-card-select ${selectedActionService?.id === service.id ? "selected" : ""}`}
                    onClick={() => handleSelectActionService(service)}
                  >
                    <div className="service-icon-large" style={{ color: service.color }}>
                      {service.icon}
                    </div>
                    <div className="service-name-select">{service.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && selectedActionService && (
            <div className="step-section">
              <h2 className="step-title">Étape 2 : Choisissez le type d'action</h2>
              <p className="step-description">
                Quel événement sur {selectedActionService.name} doit déclencher l'automatisation ?
              </p>
              <div className="action-types-list">
                {actionTypes[selectedActionService.id]?.map((type) => (
                  <div
                    key={type.id}
                    className={`action-type-card ${selectedActionType?.id === type.id ? "selected" : ""}`}
                    onClick={() => handleSelectActionType(type)}
                  >
                    <h3 className="action-type-name">{type.name}</h3>
                    <p className="action-type-description">{type.description}</p>
                  </div>
                ))}
              </div>

              {selectedActionType && selectedActionType.parameters.length > 0 && (
                <div className="parameters-section">
                  <h3 className="parameters-title">Configuration de l'action</h3>
                  {selectedActionType.parameters.map((param) => (
                    <div key={param.id} className="parameter-field">
                      <label className="parameter-label">{param.name}</label>
                      <input
                        type={param.type === "number" ? "number" : "text"}
                        className="parameter-input"
                        placeholder={param.placeholder}
                        value={actionParameters[param.id] || ""}
                        onChange={(e) => handleActionParameterChange(param.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-section">
              <h2 className="step-title">Étape 3 : Choisissez le service de la réaction</h2>
              <p className="step-description">
                Sélectionnez le service qui exécutera l'action en réponse
              </p>
              <div className="services-grid">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`service-card-select ${selectedReactionService?.id === service.id ? "selected" : ""}`}
                    onClick={() => handleSelectReactionService(service)}
                  >
                    <div className="service-icon-large" style={{ color: service.color }}>
                      {service.icon}
                    </div>
                    <div className="service-name-select">{service.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && selectedReactionService && (
            <div className="step-section">
              <h2 className="step-title">Étape 4 : Choisissez le type de réaction</h2>
              <p className="step-description">
                Que doit faire {selectedReactionService.name} en réponse ?
              </p>
              <div className="action-types-list">
                {reactionTypes[selectedReactionService.id]?.map((type) => (
                  <div
                    key={type.id}
                    className={`action-type-card ${selectedReactionType?.id === type.id ? "selected" : ""}`}
                    onClick={() => handleSelectReactionType(type)}
                  >
                    <h3 className="action-type-name">{type.name}</h3>
                    <p className="action-type-description">{type.description}</p>
                  </div>
                ))}
              </div>

              {selectedReactionType && selectedReactionType.parameters.length > 0 && (
                <div className="parameters-section">
                  <h3 className="parameters-title">Configuration de la réaction</h3>
                  {selectedReactionType.parameters.map((param) => (
                    <div key={param.id} className="parameter-field">
                      <label className="parameter-label">{param.name}</label>
                      <input
                        type={param.type === "number" ? "number" : "text"}
                        className="parameter-input"
                        placeholder={param.placeholder}
                        value={reactionParameters[param.id] || ""}
                        onChange={(e) => handleReactionParameterChange(param.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 5 && (
            <div className="step-section">
              <h2 className="step-title">Étape 5 : Nommez votre AREA</h2>
              <p className="step-description">
                Donnez un nom descriptif à votre automatisation
              </p>

              <div className="parameter-field">
                <label className="parameter-label">Nom de l'AREA</label>
                <input
                  type="text"
                  className="parameter-input"
                  placeholder="Ex: Notifications GitHub → Discord"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                />
              </div>

              <div className="summary-section">
                <h3 className="summary-title">Récapitulatif</h3>
                <div className="summary-flow">
                  <div className="summary-item summary-action">
                    <div className="summary-label">ACTION</div>
                    <div className="summary-service">{selectedActionService?.name}</div>
                    <div className="summary-type">{selectedActionType?.name}</div>
                    {Object.keys(actionParameters).length > 0 && (
                      <div className="summary-params">
                        {Object.entries(actionParameters).map(([key, value]) => (
                          <div key={key} className="summary-param">
                            <strong>{key}:</strong> {value || "(non défini)"}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="summary-arrow">→</div>

                  <div className="summary-item summary-reaction">
                    <div className="summary-label">RÉACTION</div>
                    <div className="summary-service">{selectedReactionService?.name}</div>
                    <div className="summary-type">{selectedReactionType?.name}</div>
                    {Object.keys(reactionParameters).length > 0 && (
                      <div className="summary-params">
                        {Object.entries(reactionParameters).map(([key, value]) => (
                          <div key={key} className="summary-param">
                            <strong>{key}:</strong> {value || "(non défini)"}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="create-area-actions">
          <a href="/areas" className="create-area-button create-area-button-cancel">
            Annuler
          </a>

          {currentStep > 1 && (
            <button
              onClick={handlePreviousStep}
              className="create-area-button create-area-button-secondary"
            >
              ← Précédent
            </button>
          )}

          {currentStep < 5 && (
            <button
              onClick={handleNextStep}
              disabled={
                (currentStep === 1 && !isStep1Valid) ||
                (currentStep === 2 && !isStep2Valid) ||
                (currentStep === 3 && !isStep3Valid) ||
                (currentStep === 4 && !isStep4Valid)
              }
              className="create-area-button create-area-button-primary"
            >
              Suivant →
            </button>
          )}

          {currentStep === 5 && (
            <button
              onClick={handleSubmit}
              disabled={!isStep5Valid}
              className="create-area-button create-area-button-success"
            >
              ✓ Créer l'AREA
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateAreaScreen;
