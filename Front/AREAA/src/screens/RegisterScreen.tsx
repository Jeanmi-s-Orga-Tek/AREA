/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** RegisterScreen
*/

import React, { useState, useEffect, useMemo } from "react";
import { register, fetchOAuthProviders, initiateOAuthLogin, OAuthProvider } from "../services/auth";
import NotificationContainer, { NotificationItem } from "../components/NotificationContainer";
import "./RegisterScreen.css";

type Star = {
  id: string;
  top: number;
  left: number;
  size: number;
  delay: number;
  dur: number;
  alpha: number;
};

const RegisterScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !username || !password || !confirmPassword) {
      addNotification("Tous les champs sont requis", "error");
      return;
    }

    if (password !== confirmPassword) {
      addNotification("Les mots de passe ne correspondent pas", "error");
      return;
    }

    if (password.length < 6) {
      addNotification("Le mot de passe doit contenir au moins 6 caractères", "error");
      return;
    }

    setLoading(true);

    try {
      await register({ email, name: username, new_password: password });
      addNotification("Inscription réussie ! Redirection vers la page de connexion...", "success");
      setEmail("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      addNotification(err instanceof Error ? err.message : "Une erreur est survenue", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (providerId: string) => {
    setLoading(true);
    
    try {
      await initiateOAuthLogin(providerId);
    } catch (err) {
      addNotification(err instanceof Error ? err.message : `Erreur lors de l'inscription OAuth`, "error");
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
    <div className="register-container">
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
      <div className="register-background" aria-hidden="true">
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
      <div className="register-form-card">
        <h1 className="register-title">Inscription</h1>
        <p className="register-subtitle">Créez votre compte AREA</p>


        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-form-group">
            <label htmlFor="email" className="register-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="register-input"
              placeholder="votre@email.com"
              disabled={loading}
            />
          </div>

          <div className="register-form-group">
            <label htmlFor="username" className="register-label">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="register-input"
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

          <div className="register-form-group">
            <label htmlFor="password" className="register-label">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="register-input"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <div className="register-form-group">
            <label htmlFor="confirmPassword" className="register-label">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="register-input"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading ? "Inscription en cours..." : "S'inscrire"}
          </button>
        </form>

        <div className="register-divider">
          <span>OU</span>
        </div>

        <div className="register-oauth-buttons">
          {loadingProviders ? (
            <p style={{ textAlign: "center", color: "#999" }}>Chargement des providers...</p>
          ) : oauthProviders.length === 0 ? (
            <p style={{ textAlign: "center", color: "#999" }}>Aucun provider OAuth2 disponible</p>
          ) : (
            oauthProviders.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleOAuthLogin(provider.id)}
                className="register-oauth-button"
                disabled={loading}
                style={{
                  borderLeft: `4px solid ${provider.color}`,
                }}
              >
                {renderProviderIcon(provider)}
                S'inscrire avec {provider.name}
              </button>
            ))
          )}
        </div>

        <div className="register-footer">
          <p className="register-footer-text">
            Vous avez déjà un compte ?{" "}
            <a href="/login" className="register-link">
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;

