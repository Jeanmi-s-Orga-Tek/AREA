/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** LoginScreen
*/

import React, { useState } from "react";
import { login } from "../services/auth";
import "./LoginScreen.css";

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Liste de démonstration des providers OAuth2 (visuel seulement)
  const demoProviders = ["Google", "GitHub", "Discord", "Spotify", "Microsoft", "Trello"];

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

  const handleOAuthLogin = (provider: string) => {
    alert(`Connexion avec ${provider} sera disponible prochainement !`);
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
          {demoProviders.map((provider) => (
            <button
              key={provider}
              onClick={() => handleOAuthLogin(provider)}
              className="login-oauth-button"
              disabled={loading}
            >
              Se connecter avec {provider}
            </button>
          ))}
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

