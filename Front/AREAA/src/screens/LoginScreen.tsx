/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** LoginScreen
*/

import React, { useState, useEffect } from "react";
import { login, fetchOAuthProviders, initiateOAuthLogin, OAuthProvider } from "../services/auth";
import "./LoginScreen.css";

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

  return (
    <div className="login-container">
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
            <p style={{ textAlign: "center", color: "#999" }}>Chargement des providers...</p>
          ) : oauthProviders.length === 0 ? (
            <p style={{ textAlign: "center", color: "#999" }}>Aucun provider OAuth2 disponible</p>
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
                <span style={{ marginRight: "8px" }}>{provider.icon}</span>
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

