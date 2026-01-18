/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** LoginScreen
*/

import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { login, fetchOAuthProviders, initiateOAuthLogin, OAuthProvider } from "../services/auth";
import NotificationContainer, { NotificationItem } from "../components/NotificationContainer";
import AccessibilityPanel from "../components/AccessibilityPanel";
import "./LoginScreen.css";


type Star = {
  id: string;
  top: number;
  left: number;
  size: number;
  delay: number;
  dur: number;
  alpha: number;
};

const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  const addNotification = (message: string, type: "success" | "error") => {
    const id = `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications((prev) => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const providers = await fetchOAuthProviders();
        setOauthProviders(providers.filter(p => p.available && p.flows.web));
      } catch (err) {
        console.error("Failed to load OAuth providers:", err);
      } finally {
        setLoadingProviders(false);
      }
    };

    loadProviders();
  }, []);

  const stars = useMemo<Star[]>(() => {
    const count = 120;
    const rnd = (min: number, max: number) => min + Math.random() * (max - min);

    return Array.from({ length: count }, (_, i) => ({
      id: `s-${i}-${Math.random().toString(16).slice(2)}`,
      top: rnd(0, 100),
      left: rnd(0, 100),
      size: rnd(1, 2.5),
      delay: rnd(0, 6),
      dur: rnd(1.2, 4.5),
      alpha: rnd(0.25, 0.9),
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      addNotification(t("login.allFieldsRequired"), "error");
      return;
    }

    setLoading(true);

    try {
      await login({ email, password });
      addNotification(t("login.success"), "success");
      setTimeout(() => window.location.href = "/", 1000);
    } catch (err) {
      addNotification(err instanceof Error ? err.message : t("login.error"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (providerId: string) => {
    setLoading(true);

    try {
      await initiateOAuthLogin(providerId);
    } catch (err) {
      addNotification(err instanceof Error ? err.message : t("login.oauthError"), "error");
      setLoading(false);
    }
  };

  const renderProviderIcon = (provider: OAuthProvider) => {
    const icon = provider.icon;

    if (/^https?:\/\//i.test(icon)) {
      return (
        <img
          src={icon}
          alt={`${provider.name} logo`}
          style={{
            width: "24px",
            height: "24px",
            objectFit: "contain",
            display: "inline-block",
            marginRight: "8px",
          }}
        />
      );
    }

    if (/^\s*<svg[\s>]/i.test(icon)) {
      return (
        <span
          aria-label={`${provider.name} logo`}
          role="img"
          style={{
            width: "24px",
            height: "24px",
            display: "inline-block",
            marginRight: "8px",
          }}
          dangerouslySetInnerHTML={{ __html: icon }}
        />
      );
    }

    return <span style={{ marginRight: "8px" }}>{icon}</span>;
  };

  return (
    <div className="login-container">
      <AccessibilityPanel />
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
      <div className="login-background" aria-hidden="true">
        {stars.map((s) => (
            <span
                key={s.id}
                className="star"
                style={{
                  top: `${s.top}%`,
                  left: `${s.left}%`,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  opacity: s.alpha,
                  animationDelay: `${s.delay}s`,
                  animationDuration: `${s.dur}s`,
                }}
            />
        ))}
      </div>
      <div className="login-form-card">
        <h1 className="login-title">{t("login.title")}</h1>
        <p className="login-subtitle">{t("login.subtitle")}</p>


        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label htmlFor="email" className="login-label">
              {t("login.email")}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              placeholder={t("login.emailPlaceholder")}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="login-form-group">
            <label htmlFor="password" className="login-label">
              {t("login.password")}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              placeholder={t("login.passwordPlaceholder")}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? t("login.buttonLoading") : t("login.button")}
          </button>
        </form>

        <div className="login-divider">
          <span>{t("login.or")}</span>
        </div>

        <div className="login-oauth-buttons">
          {loadingProviders ? (
              <p style={{ textAlign: "center", color: "#999" }}>
                {t("login.loadingProviders")}
              </p>
          ) : oauthProviders.length === 0 ? (
              <p style={{ textAlign: "center", color: "#999" }}>
                {t("login.noProviders")}
              </p>
          ) : (
              oauthProviders.map((provider) => (
                  <button
                      key={provider.id}
                      onClick={() => handleOAuthLogin(provider.id)}
                      className="login-oauth-button"
                      disabled={loading}
                      style={{
                        borderLeft: `4px solid ${provider.color}`,
                      }}
                  >
                    {renderProviderIcon(provider)}
                    {t("login.loginWith")} {provider.name}
                  </button>
              ))
          )}
        </div>

        <div className="login-footer">
          <p className="login-footer-text">
            {t("login.noAccount")}{" "}
            <a href="/register" className="login-link">
              {t("login.register")}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

