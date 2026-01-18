/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** AreasScreen component - List of all AREA
*/

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fetchMyAreas, toggleAreaStatus, deleteArea } from "../services/api";
import type { AreaDetail } from "../services/api";
import { logout } from "../services/auth";
import NotificationContainer, { NotificationItem } from "../components/NotificationContainer";
import ConfirmModal from "../components/ConfirmModal";
import AccessibilityPanel from "../components/AccessibilityPanel";
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
  const { t, i18n } = useTranslation();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stars, setStars] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

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
    loadAreas();
  }, []);

  const loadAreas = async () => {
    try {
      setLoading(true);

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
        createdAt: new Date(area.created_at).toLocaleDateString(i18n.language === 'fr' ? "fr-FR" : "en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      }));

      setAreas(mappedAreas);
    } catch (err) {
      addNotification(err instanceof Error ? err.message : t("services.error"), "error");
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
      addNotification(`AREA "${area.name}" ${area.isActive ? t("areas.deactivatedSuccess") : t("areas.activatedSuccess")}`, "success");
      await loadAreas();
    } catch (err) {
      addNotification(`${t("common.error")}: ${err instanceof Error ? err.message : t("common.error")}`, "error");
    }
  };

  const handleDelete = async (id: number) => {
    const area = areas.find((a) => a.id === id);
    if (!area) return;
    
    setConfirmModal({
      isOpen: true,
      title: t("areas.deleteConfirmTitle"),
      message: `${t("areas.deleteConfirmMessage")} "${area.name}" ?`,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: () => {} });
        try {
          await deleteArea(id);
          addNotification(`AREA "${area.name}" ${t("areas.deleteSuccess")}`, "success");
          await loadAreas();
        } catch (err) {
          addNotification(`${t("common.error")}: ${err instanceof Error ? err.message : t("common.error")}`, "error");
        }
      },
    });
  };

  const handleEdit = (id: number) => {
    window.location.href = `/edit-area/${id}`;
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const activeCount = areas.filter((area) => area.isActive).length;

  if (loading) {
    return (
      <div className="areas-container">
        <AccessibilityPanel />
        <div className="areas-background">
          {stars.map((star) => (
            <div key={star.id} className="star" style={star.style} />
          ))}
        </div>
        <div className="areas-content">
          <div className="loading-card">
            <p>{t("areas.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="areas-container">
      <AccessibilityPanel />
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={t("areas.delete")}
        cancelText={t("areas.cancel")}
        type="danger"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: () => {} })}
      />
      <div className="areas-background">
        {stars.map((star) => (
          <div key={star.id} className="star" style={star.style} />
        ))}
      </div>
      <div className="areas-content">
        <div className="areas-topbar">
          <h1 className="topbar-title">{t("areas.title")}</h1>
          <button onClick={handleLogout} className="logout-btn">
            {t("profile.logout")}
          </button>
        </div>

        <div className="areas-header">
          <p className="areas-subtitle">
            {t("areas.subtitle")}
          </p>
          <div className="areas-stats">
            <span className="areas-stat-badge">
              {areas.length} AREA{areas.length > 1 ? "s" : ""} {t("areas.total")}{areas.length > 1 ? "s" : ""}
            </span>
            <span className="areas-stat-badge areas-stat-badge-success">
              {activeCount} {t("areas.active").toLowerCase()}{activeCount > 1 ? "s" : ""}
            </span>
            <span className="areas-stat-badge areas-stat-badge-inactive">
              {areas.length - activeCount} {t("areas.inactive").toLowerCase()}{areas.length - activeCount > 1 ? "s" : ""}
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
                    {area.isActive ? `✓ ${t("areas.active")}` : `○ ${t("areas.inactive")}`}
                  </span>
                </div>
                <p className="area-card-date">{t("areas.createdOn")} {area.createdAt}</p>
              </div>

              <div className="area-card-body">
                <div className="area-flow">
                  <div className="area-flow-item area-flow-action">
                    <div className="area-flow-label">{t("areas.action")}</div>
                    <div className="area-flow-service">{area.action.service}</div>
                    <div className="area-flow-type">{area.action.type}</div>
                    <div className="area-flow-description">
                      {area.action.description}
                    </div>
                    {Object.keys(area.action.parameters).length > 0 && (
                      <div className="area-flow-parameters">
                        <strong>{t("areas.parameters")}:</strong>
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
                    <div className="area-flow-label">{t("areas.reaction")}</div>
                    <div className="area-flow-service">{area.reaction.service}</div>
                    <div className="area-flow-type">{area.reaction.type}</div>
                    <div className="area-flow-description">
                      {area.reaction.description}
                    </div>
                    {Object.keys(area.reaction.parameters).length > 0 && (
                      <div className="area-flow-parameters">
                        <strong>{t("areas.parameters")}:</strong>
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
                  {area.isActive ? t("areas.deactivate") : t("areas.activate")}
                </button>
                <button 
                  onClick={() => handleEdit(area.id)}
                  className="area-action-button area-action-button-edit"
                >
                  {t("areas.modify")}
                </button>
                <button
                  onClick={() => handleDelete(area.id)}
                  className="area-action-button area-action-button-delete"
                >
                  {t("areas.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>

        {areas.length === 0 && (
          <div className="areas-empty">
            <p className="areas-empty-text">
              {t("areas.emptyMessage")}
            </p>
            <a href="/create-area" className="areas-create-button">
              {t("areas.createFirst")}
            </a>
          </div>
        )}

        <div className="areas-actions">
          <a href="/create-area" className="areas-create-button">
            + {t("areas.createNew")}
          </a>
          <a href="/" className="areas-back-button">
            {t("areas.backToHome")}
          </a>
        </div>
      </div>
    </div>
  );
};

export default AreasScreen;
