/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** EditAreaScreen component - Edit existing AREA
*/

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fetchAreaById, updateArea } from "../services/api";
import type { AreaDetail } from "../services/api";
import { logout } from "../services/auth";
import NotificationContainer, { NotificationItem } from "../components/NotificationContainer";
import ConfirmModal from "../components/ConfirmModal";
import LanguageSelector from "../components/LanguageSelector";
import "./AreasScreen.css";

const EditAreaScreen: React.FC = () => {
  const { t } = useTranslation();
  const [stars, setStars] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [areaId, setAreaId] = useState<number | null>(null);
  const [area, setArea] = useState<AreaDetail | null>(null);

  const [areaName, setAreaName] = useState("");
  const [actionParameters, setActionParameters] = useState<Record<string, string>>({});
  const [reactionParameters, setReactionParameters] = useState<Record<string, string>>({});
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

    const pathParts = window.location.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    if (id && !isNaN(Number(id))) {
      setAreaId(Number(id));
    } else {
      addNotification(t("editArea.invalidId"), "error");
      setTimeout(() => window.location.href = "/areas", 2000);
    }
  }, []);

  useEffect(() => {
    if (areaId) {
      loadArea();
    }
  }, [areaId]);

  const loadArea = async () => {
    if (!areaId) return;
    
    try {
      setLoading(true);
      const areaData = await fetchAreaById(areaId);
      setArea(areaData);
      setAreaName(areaData.name);
      setActionParameters(areaData.action_parameters || {});
      setReactionParameters(areaData.reaction_parameters || {});
    } catch (err) {
      addNotification(err instanceof Error ? err.message : t("editArea.loadError"), "error");
      setTimeout(() => window.location.href = "/areas", 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!areaId || !areaName.trim()) {
      addNotification(t("editArea.nameRequired"), "error");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: t("editArea.confirmTitle"),
      message: t("editArea.confirmMessage", { name: areaName }),
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: () => {} });
        try {
          setSaving(true);
          await updateArea(areaId, {
            name: areaName,
            action_parameters: actionParameters,
            reaction_parameters: reactionParameters,
          });

          addNotification(t("editArea.updateSuccess", { name: areaName }), "success");
          setTimeout(() => window.location.href = "/areas", 1500);
        } catch (err) {
          addNotification(err instanceof Error ? err.message : t("common.unknownError"), "error");
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="areas-container">
        <LanguageSelector />
        <div className="areas-background">
          {stars.map((star) => (
            <div key={star.id} className="star" style={star.style} />
          ))}
        </div>
        <div className="areas-content">
          <div className="loading-card">
            <p>{t("editArea.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!area) {
    return null;
  }

  const getParameterFields = (parameters: Record<string, any>, currentValues: Record<string, string>, onChange: (key: string, value: string) => void) => {
    return Object.entries(parameters).map(([key, value]) => (
      <div key={key} style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", fontSize: "14px", color: "#9ca3af" }}>
          {key}
        </label>
        <input
          type="text"
          value={currentValues[key] || ""}
          onChange={(e) => onChange(key, e.target.value)}
          placeholder={t("editArea.enterValue", { key })}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            background: "rgba(255, 255, 255, 0.05)",
            color: "#fff",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />
      </div>
    ));
  };

  return (
    <div className="areas-container">
      <LanguageSelector />
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={t("editArea.save")}
        cancelText={t("common.cancel")}
        type="info"
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
          <h1 className="topbar-title">{t("editArea.title")}</h1>
          <button onClick={handleLogout} className="logout-btn">
            {t("profile.logout")}
          </button>
        </div>

        <div className="areas-list">
          <div className="area-card area-card-active">
            <div className="area-card-header">
              <div className="area-card-title-section" style={{ width: "100%" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#9ca3af" }}>
                  {t("editArea.areaName")}
                </label>
                <input
                  type="text"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder={t("editArea.namePlaceholder")}
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "#fff",
                    width: "100%",
                    boxSizing: "border-box",
                    marginBottom: "10px",
                  }}
                />
              </div>
            </div>

            <div className="area-card-body">
              <div className="area-flow">
                <div className="area-flow-item area-flow-action">
                  <div className="area-flow-label">{t("areas.action")}</div>
                  <div className="area-flow-service">{area.action.service.display_name}</div>
                  <div className="area-flow-type">{area.action.action.name}</div>
                  <div className="area-flow-description">
                    {area.action.action.description}
                  </div>
                  {Object.keys(area.action_parameters || {}).length > 0 && (
                    <div className="area-flow-parameters" style={{ marginTop: "15px" }}>
                      <strong style={{ marginBottom: "10px", display: "block", fontSize: "14px" }}>{t("areas.parameters")}:</strong>
                      {getParameterFields(
                        area.action_parameters,
                        actionParameters,
                        (key, value) => setActionParameters((prev) => ({ ...prev, [key]: value }))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="area-flow-arrow">→</div>

              <div className="area-flow-item area-flow-reaction">
                <div className="area-flow">
                  <div className="area-flow-label">{t("areas.reaction")}</div>
                  <div className="area-flow-service">{area.reaction.service.display_name}</div>
                  <div className="area-flow-type">{area.reaction.reaction.name}</div>
                  <div className="area-flow-description">
                    {area.reaction.reaction.description}
                  </div>
                  {Object.keys(area.reaction_parameters || {}).length > 0 && (
                    <div className="area-flow-parameters" style={{ marginTop: "15px" }}>
                      <strong style={{ marginBottom: "10px", display: "block", fontSize: "14px" }}>{t("areas.parameters")}:</strong>
                      {getParameterFields(
                        area.reaction_parameters,
                        reactionParameters,
                        (key, value) => setReactionParameters((prev) => ({ ...prev, [key]: value }))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="area-card-footer">
              <button
                onClick={handleSubmit}
                disabled={saving || !areaName.trim()}
                className="area-action-button area-action-button-activate"
              >
                {saving ? t("editArea.saving") : t("editArea.save")}
              </button>
              <button
                onClick={() => window.location.href = "/areas"}
                disabled={saving}
                className="area-action-button area-action-button-edit"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>

        <div className="areas-actions">
          <a href="/areas" className="areas-back-button">
            {t("editArea.backToList")}
          </a>
        </div>
      </div>
    </div>
  );
};

export default EditAreaScreen;
