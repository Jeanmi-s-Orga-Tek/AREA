/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** ServerScreen
*/

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { logout } from "../services/auth";
import { fetchCurrentUser } from "../services/api";
import type { User } from "../services/api";
import AccessibilityPanel from "../components/AccessibilityPanel";
import "./ServerScreen.css";

const ServerScreen: React.FC = () => {
  const { t } = useTranslation();
  const [stars, setStars] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      }
    };

    generateStars();
    fetchUser();
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="dashboard-page">
      <AccessibilityPanel />
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
          <a href="/" className="nav-item active">
            {t("navigation.dashboard")}
          </a>
          <a href="/areas" className="nav-item">
            {t("navigation.myAreas")}
          </a>
          <a href="/create-area" className="nav-item">
            {t("navigation.createArea")}
          </a>
          <a href="/services" className="nav-item">
            {t("navigation.services")}
          </a>
          <a href="/profile" className="nav-item">
            {t("navigation.profile")}
          </a>
          <a href="/about" className="nav-item">
            {t("navigation.about")}
          </a>
        </nav>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-topbar">
          <h1 className="topbar-title">{t("dashboard.title")}</h1>
          <div className="topbar-user">
            <span className="user-name">👋 {loading ? t("dashboard.loading") : (user?.name || t("dashboard.user"))}</span>
            <button onClick={handleLogout} className="logout-btn">
              {t("profile.logout")}
            </button>
          </div>
        </div>

        <div className="dashboard-main">
          <div className="welcome-card">
            <h2 className="welcome-title">AREA {t("dashboard.title")}</h2>
            <p className="welcome-text">
              {t("dashboard.welcome")}
            </p>
          </div>

          <div className="grid-3">
            <div className="card">
              <div className="card-icon">📋</div>
              <h3 className="card-title">{t("dashboard.myAreas")}</h3>
              <p className="card-description">{t("dashboard.manageAutomations")}</p>
              <a href="/areas" className="card-link">{t("common.viewAll")} →</a>
            </div>

            <div className="card">
              <div className="card-icon">➕</div>
              <h3 className="card-title">{t("dashboard.createArea")}</h3>
              <p className="card-description">{t("dashboard.createNew")}</p>
              <a href="/create-area" className="card-link">{t("common.create")} →</a>
            </div>

            <div className="card">
              <div className="card-icon">🔌</div>
              <h3 className="card-title">{t("dashboard.servicesTitle")}</h3>
              <p className="card-description">{t("dashboard.connectServices")}</p>
              <a href="/services" className="card-link">{t("common.manage")} →</a>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3 className="card-title">{t("profile.statistics")}</h3>
              <div className="stats">
                <div className="stat-item">
                  <span className="stat-label">{t("profile.activeAreas")}</span>
                  <span className="stat-value">0</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t("profile.connectedServices")}</span>
                  <span className="stat-value">0</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">{t("dashboard.recentActivity")}</h3>
              <p className="card-description text-muted">{t("dashboard.noActivity")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerScreen;
