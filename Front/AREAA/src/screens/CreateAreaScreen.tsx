/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** CreateAreaScreen component - Create new AREA with multi-step form
*/

import React, { useState, useEffect } from "react";
import { fetchServices, fetchServiceCapabilities, createArea, fetchCurrentUser } from "../services/api";
import type { Service as APIService, User } from "../services/api";
import { fetchOAuthProviders, logout } from "../services/auth";
import type { OAuthProvider } from "../services/auth";
import NotificationContainer, { NotificationItem } from "../components/NotificationContainer";
import AccessibilityPanel from "../components/AccessibilityPanel";
import "./CreateAreaScreen.css";

interface Service {
  id: number;
  name: string;
  icon: string;
  color: string;
  oauthProvider?: string;
}

interface ActionType {
  id: number;
  name: string;
  description: string;
  parameters: Parameter[];
}

interface ReactionType {
  id: number;
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
  required?: boolean;
}

const CreateAreaScreen: React.FC = () => {
  const [stars, setStars] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedActionService, setSelectedActionService] = useState<Service | null>(null);
  const [selectedActionType, setSelectedActionType] = useState<ActionType | null>(null);
  const [actionParameters, setActionParameters] = useState<Record<string, string>>({});
  const [selectedReactionService, setSelectedReactionService] = useState<Service | null>(null);
  const [selectedReactionType, setSelectedReactionType] = useState<ReactionType | null>(null);
  const [reactionParameters, setReactionParameters] = useState<Record<string, string>>({});
  const [areaName, setAreaName] = useState("");
  
  const [services, setServices] = useState<Service[]>([]);
  const [actionTypes, setActionTypes] = useState<Record<number, ActionType[]>>({});
  const [reactionTypes, setReactionTypes] = useState<Record<number, ReactionType[]>>({});
  const [loading, setLoading] = useState(true);

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
      } finally {
        setUserLoading(false);
      }
    };

    generateStars();
    fetchUser();
    loadServices();
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const loadServices = async () => {
    try {
      setLoading(true);

      // Fetch both sources:
      // - /services  -> list of services (used for capabilities etc.)
      // - /auth/providers -> icons/colors from providers.yaml
      const [apiServices, providers] = await Promise.all([
        fetchServices(),
        fetchOAuthProviders(),
      ]);

      const providerById: Record<string, OAuthProvider> = Object.fromEntries(
        (providers || []).map((p) => [p.id, p])
      );

      const mappedServices: Service[] = apiServices.map((service: APIService) => {
        const providerKey = service.oauth_provider || service.name;
        const provider = providerById[providerKey];

        return {
          id: service.id,
          name: service.display_name || service.name,
          oauthProvider: service.oauth_provider,
          icon: provider?.icon ?? service.icon ?? "🔵",
          color: provider?.color ?? service.color ?? "#4285f4",
        };
      });

      setServices(mappedServices);
    } catch (err) {
      console.error("Error loading services:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadServiceCapabilities = async (serviceId: number) => {
    try {
      const capabilities = await fetchServiceCapabilities(serviceId);
      
      // console.log("capabilities :", capabilities);

      const actions = capabilities.actions || [];
      const reactions = capabilities.reactions || [];
      
      const mappedActions: ActionType[] = actions.map((action: any) => ({
        id: action.id,
        name: action.name,
        description: action.description || "",
        parameters: parseParameters(action.parameters),
      }));

      const mappedReactions: ReactionType[] = reactions.map((reaction: any) => ({
        id: reaction.id,
        name: reaction.name,
        description: reaction.description || "",
        parameters: parseParameters(reaction.parameters),
      }));

      console.log(`${serviceId}: ${mappedActions.length} actions, ${mappedReactions.length} reactions`);
      
      setActionTypes((prev) => ({ ...prev, [serviceId]: mappedActions }));
      setReactionTypes((prev) => ({ ...prev, [serviceId]: mappedReactions }));

      if (mappedActions.length === 0 && mappedReactions.length === 0) {
        console.warn(`No actions or reactions available for service ${serviceId}`);
      }
    } catch (err) {
      console.error("Error loading service capabilities:", err);
      setActionTypes((prev) => ({ ...prev, [serviceId]: [] }));
      setReactionTypes((prev) => ({ ...prev, [serviceId]: [] }));
    }
  };

  const parseParameters = (params?: Record<string, any>): Parameter[] => {
    if (!params) return [];
    
    return Object.entries(params).map(([key, value]) => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
      type: typeof value === "number" ? "number" : "text",
      placeholder: `Enter ${key}...`,
      required: value?.required || false,
    }));
  };

  // const dummyActionTypes: Record<string, ActionType[]> = {
  //   github: [
  //     {
  //       id: "new_issue",
  //       name: "New Issue",
  //       description: "Déclenché quand une nouvelle issue est créée",
  //       parameters: [
  //         { id: "repository", name: "Repository", type: "text", placeholder: "owner/repo" },
  //       ],
  //     },
  //     {
  //       id: "new_pr",
  //       name: "New Pull Request",
  //       description: "Déclenché quand une nouvelle PR est créée",
  //       parameters: [
  //         { id: "repository", name: "Repository", type: "text", placeholder: "owner/repo" },
  //       ],
  //     },
  //     {
  //       id: "new_star",
  //       name: "New Star",
  //       description: "Déclenché quand le repo reçoit une étoile",
  //       parameters: [
  //         { id: "repository", name: "Repository", type: "text", placeholder: "owner/repo" },
  //       ],
  //     },
  //   ],
  //   google: [
  //     {
  //       id: "new_email",
  //       name: "New Email",
  //       description: "Déclenché à la réception d'un email",
  //       parameters: [
  //         { id: "from", name: "From (optional)", type: "text", placeholder: "sender@example.com" },
  //         { id: "subject", name: "Subject contains", type: "text", placeholder: "Keywords..." },
  //       ],
  //     },
  //     {
  //       id: "new_calendar_event",
  //       name: "New Calendar Event",
  //       description: "Déclenché quand un événement est créé",
  //       parameters: [
  //         { id: "calendar", name: "Calendar", type: "text", placeholder: "primary" },
  //       ],
  //     },
  //   ],
  //   discord: [
  //     {
  //       id: "new_message",
  //       name: "New Message",
  //       description: "Déclenché à chaque nouveau message",
  //       parameters: [
  //         { id: "channel", name: "Channel ID", type: "text", placeholder: "123456789" },
  //       ],
  //     },
  //     {
  //       id: "event_created",
  //       name: "Event Created",
  //       description: "Déclenché quand un événement est créé",
  //       parameters: [],
  //     },
  //   ],
  //   spotify: [
  //     {
  //       id: "new_liked_song",
  //       name: "New Liked Song",
  //       description: "Déclenché quand vous aimez une chanson",
  //       parameters: [],
  //     },
  //     {
  //       id: "new_playlist",
  //       name: "New Playlist",
  //       description: "Déclenché quand vous créez une playlist",
  //       parameters: [],
  //     },
  //   ],
  //   trello: [
  //     {
  //       id: "card_moved",
  //       name: "Card Moved",
  //       description: "Déclenché quand une carte est déplacée",
  //       parameters: [
  //         { id: "board", name: "Board ID", type: "text", placeholder: "Board ID" },
  //         { id: "list", name: "To List", type: "text", placeholder: "List name" },
  //       ],
  //     },
  //     {
  //       id: "new_card",
  //       name: "New Card",
  //       description: "Déclenché quand une carte est créée",
  //       parameters: [
  //         { id: "board", name: "Board ID", type: "text", placeholder: "Board ID" },
  //       ],
  //     },
  //   ],
  //   slack: [
  //     {
  //       id: "new_message",
  //       name: "New Message",
  //       description: "Déclenché à chaque nouveau message",
  //       parameters: [
  //         { id: "channel", name: "Channel", type: "text", placeholder: "#general" },
  //       ],
  //     },
  //   ],
  //   twitter: [
  //     {
  //       id: "new_tweet",
  //       name: "New Tweet from User",
  //       description: "Déclenché quand un utilisateur tweet",
  //       parameters: [
  //         { id: "username", name: "Username", type: "text", placeholder: "@username" },
  //       ],
  //     },
  //   ],
  //   microsoft: [
  //     {
  //       id: "new_email",
  //       name: "New Email (Outlook)",
  //       description: "Déclenché à la réception d'un email",
  //       parameters: [
  //         { id: "from", name: "From (optional)", type: "text", placeholder: "sender@example.com" },
  //       ],
  //     },
  //   ],
  // };

  // const dummyReactionTypes: Record<string, ReactionType[]> = {
  //   discord: [
  //     {
  //       id: "send_message",
  //       name: "Send Message",
  //       description: "Envoyer un message dans un channel",
  //       parameters: [
  //         { id: "channel", name: "Channel ID", type: "text", placeholder: "123456789" },
  //         { id: "message", name: "Message", type: "text", placeholder: "Your message..." },
  //       ],
  //     },
  //   ],
  //   slack: [
  //     {
  //       id: "send_notification",
  //       name: "Send Notification",
  //       description: "Envoyer une notification",
  //       parameters: [
  //         { id: "channel", name: "Channel", type: "text", placeholder: "#general" },
  //         { id: "message", name: "Message", type: "text", placeholder: "Your message..." },
  //       ],
  //     },
  //   ],
  //   trello: [
  //     {
  //       id: "create_card",
  //       name: "Create Card",
  //       description: "Créer une nouvelle carte",
  //       parameters: [
  //         { id: "board", name: "Board ID", type: "text", placeholder: "Board ID" },
  //         { id: "list", name: "List", type: "text", placeholder: "To Do" },
  //         { id: "title", name: "Card Title", type: "text", placeholder: "Card title..." },
  //       ],
  //     },
  //   ],
  //   twitter: [
  //     {
  //       id: "post_tweet",
  //       name: "Post Tweet",
  //       description: "Publier un tweet",
  //       parameters: [
  //         { id: "text", name: "Tweet Text", type: "text", placeholder: "Your tweet..." },
  //       ],
  //     },
  //   ],
  //   google: [
  //     {
  //       id: "send_email",
  //       name: "Send Email",
  //       description: "Envoyer un email via Gmail",
  //       parameters: [
  //         { id: "to", name: "To", type: "text", placeholder: "recipient@example.com" },
  //         { id: "subject", name: "Subject", type: "text", placeholder: "Email subject" },
  //         { id: "body", name: "Body", type: "text", placeholder: "Email body..." },
  //       ],
  //     },
  //     {
  //       id: "create_calendar_event",
  //       name: "Create Calendar Event",
  //       description: "Créer un événement dans Google Calendar",
  //       parameters: [
  //         { id: "title", name: "Event Title", type: "text", placeholder: "Event title" },
  //         { id: "date", name: "Date", type: "text", placeholder: "YYYY-MM-DD" },
  //       ],
  //     },
  //   ],
  //   microsoft: [
  //     {
  //       id: "send_teams_message",
  //       name: "Send Teams Message",
  //       description: "Envoyer un message dans Teams",
  //       parameters: [
  //         { id: "channel", name: "Channel", type: "text", placeholder: "General" },
  //         { id: "message", name: "Message", type: "text", placeholder: "Your message..." },
  //       ],
  //     },
  //   ],
  //   spotify: [
  //     {
  //       id: "add_to_playlist",
  //       name: "Add to Playlist",
  //       description: "Ajouter une chanson à une playlist",
  //       parameters: [
  //         { id: "playlist", name: "Playlist ID", type: "text", placeholder: "Playlist ID" },
  //       ],
  //     },
  //   ],
  // };

  const handleNextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSelectActionService = async (service: Service) => {
    setSelectedActionService(service);
    setSelectedActionType(null);
    setActionParameters({});
    
    if (!actionTypes[service.id]) {
      await loadServiceCapabilities(service.id);
    }
  };

  const handleSelectActionType = (type: ActionType) => {
    setSelectedActionType(type);
    const params: Record<string, string> = {};
    type.parameters.forEach((param) => {
      params[param.id] = "";
    });
    setActionParameters(params);
  };

  const handleSelectReactionService = async (service: Service) => {
    setSelectedReactionService(service);
    setSelectedReactionType(null);
    setReactionParameters({});
    
    if (!reactionTypes[service.id]) {
      await loadServiceCapabilities(service.id);
    }
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

  const handleSubmit = async () => {
    if (!selectedActionService || !selectedActionType || !selectedReactionService || !selectedReactionType) {
      addNotification("Veuillez sélectionner tous les éléments requis", "error");
      return;
    }

    try {
      await createArea({
        name: areaName,
        action_service_id: selectedActionService.id,
        action_id: selectedActionType.id,
        action_parameters: actionParameters,
        reaction_service_id: selectedReactionService.id,
        reaction_id: selectedReactionType.id,
        reaction_parameters: reactionParameters,
      });

      addNotification(`AREA "${areaName}" créée avec succès !`, "success");
      setTimeout(() => window.location.href = "/areas", 2000);
    } catch (err) {
      addNotification(err instanceof Error ? err.message : "Erreur inconnue", "error");
    }
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

  const isStep1Valid = selectedActionService !== null;
  const isStep2Valid = selectedActionType !== null;
  const isStep3Valid = selectedReactionService !== null;
  const isStep4Valid = selectedReactionType !== null;
  const isStep5Valid = areaName.trim() !== "";

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
          <a href="/create-area" className="nav-item active">
            ➕ Créer une AREA
          </a>
          <a href="/services" className="nav-item">
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
          <h1 className="topbar-title">Créer une AREA</h1>
          <div className="topbar-user">
            <span className="user-name">👋 {userLoading ? "Chargement..." : (user?.name || "Utilisateur")}</span>
            <button onClick={handleLogout} className="logout-btn">
              🚪 Déconnexion
            </button>
          </div>
        </div>

        <div className="dashboard-main">
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
                            {renderServiceIcon(service)}
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
                    {!actionTypes[selectedActionService.id] && (
                      <div className="loading-message">Chargement des actions disponibles...</div>
                    )}
                    {actionTypes[selectedActionService.id]?.length === 0 && (
                      <div className="empty-message">
                        <p>Aucune action disponible pour ce service.</p>
                        <p className="text-sm">Les actions seront ajoutées prochainement.</p>
                      </div>
                    )}
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
                          {renderServiceIcon(service)}
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
                    {!reactionTypes[selectedReactionService.id] && (
                      <div className="loading-message">Chargement des réactions disponibles...</div>
                    )}
                    {reactionTypes[selectedReactionService.id]?.length === 0 && (
                      <div className="empty-message">
                        <p>Aucune réaction disponible pour ce service.</p>
                        <p className="text-sm">Les réactions seront ajoutées prochainement.</p>
                      </div>
                    )}
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
      </div>
    </div>
  );
};

export default CreateAreaScreen;
