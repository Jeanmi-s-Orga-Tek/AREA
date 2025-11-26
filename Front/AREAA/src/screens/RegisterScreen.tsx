/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** RegisterScreen
*/

import React, { useState, useEffect } from "react";
import { register, fetchOAuthProviders, initiateOAuthLogin, OAuthProvider } from "../services/auth";
import "./RegisterScreen.css";

const RegisterScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
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

  const demoProviders = ["Google", "GitHub", "Discord", "Spotify", "Microsoft", "Trello"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email || !username || !password || !confirmPassword) {
      setError("Tous les champs sont requis");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);

    try {
      await register({ email, name: username, new_password: password });
      setSuccess(true);
      setEmail("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
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
      setError(err instanceof Error ? err.message : `Erreur lors de l'inscription OAuth`);
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-form-card">
        <h1 className="register-title">Inscription</h1>
        <p className="register-subtitle">Créez votre compte AREA</p>

        {error && <div className="register-error-box">{error}</div>}
        {success && (
          <div className="register-success-box">
            Inscription réussie ! Redirection vers la page de connexion...
          </div>
        )}

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
                <span style={{ marginRight: "8px" }}>{provider.icon}</span>
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

