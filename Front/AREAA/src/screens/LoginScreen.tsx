/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** LoginScreen
*/

import React, { useState, useMemo, useEffect } from "react";
import { login, fetchOAuthProviders, initiateOAuthLogin, OAuthProvider } from "../services/auth";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

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
    setError("");

    if (!email || !password) {
      setError("Tous les champs sont requis");
      return;
    }

    setLoading(true);

    try {
      await login({ email, password });
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (providerId: string) => {
    setError("");
    setLoading(true);

    try {
      await initiateOAuthLogin(providerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Erreur lors de la connexion OAuth`);
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
        <h1 className="login-title">Connexion</h1>
        <p className="login-subtitle">Connectez-vous à votre compte AREA</p>

        {error && <div className="login-error-box">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label htmlFor="email" className="login-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              placeholder="votre@email.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="login-form-group">
            <label htmlFor="password" className="login-label">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              placeholder="••••••••"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >

            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <div className="login-divider">
          <span>OU</span>
        </div>

        <div className="login-oauth-buttons">
          {loadingProviders ? (
              <p style={{ textAlign: "center", color: "#999" }}>
                Chargement des providers...
              </p>
          ) : oauthProviders.length === 0 ? (
              <p style={{ textAlign: "center", color: "#999" }}>
                Aucun provider OAuth2 disponible
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
                    Se connecter avec {provider.name}
                  </button>
              ))
          )}
        </div>

        <div className="login-footer">
          <p className="login-footer-text">
            Vous n'avez pas de compte ?{" "}
            <a href="/register" className="login-link">
              S'inscrire
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

