/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** OAuthCallbackScreen - Gère le retour du provider OAuth2
*/

import React, { useEffect, useState } from "react";
import { handleOAuthCallback } from "../services/auth";
import { connectService } from "../services/api";
import "./OAuthCallbackScreen.css";

const OAuthCallbackScreen: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stars, setStars] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);

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
  }, []);

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        if (window.location.hostname === "127.0.0.1") {
          const newUrl = window.location.href.replace("127.0.0.1", "localhost");
          window.location.href = newUrl;
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        
        const hash = window.location.hash;
        const hashContent = hash.replace(/^#/, '');

        let hashToken = null;
        let hashState = null;
        if (hashContent) {
          const hashPairs = hashContent.split('&');
          for (const pair of hashPairs) {
            const [key, value] = pair.split('=');
            if (key === 'token') hashToken = decodeURIComponent(value);
            if (key === 'state') hashState = decodeURIComponent(value);
          }
        }

        let code = urlParams.get("code") || urlParams.get("token") || hashToken;
        let state = urlParams.get("state") || hashState;
        const errorParam = urlParams.get("error");

        if (errorParam) {
          const errorDescription = urlParams.get("error_description") || errorParam;
          throw new Error(`Erreur OAuth: ${errorDescription}`);
        }

        if (!code) {
          throw new Error("Code manquant dans l'URL de callback");
        }

        const stateValue = state || "";

        const pathParts = window.location.pathname.split("/");
        const provider = pathParts[pathParts.length - 1];

        if (!provider) {
          throw new Error("Provider non identifié dans l'URL");
        }

        const connectingService = sessionStorage.getItem("connecting_service");
        const connectingProvider = sessionStorage.getItem("connecting_service_provider");
        
        console.log("=== Vérification connexion service ===");
        console.log("connecting_service:", connectingService);
        console.log("connecting_service_provider:", connectingProvider);
        console.log("current provider:", provider);
        
        if (connectingService && connectingProvider === provider) {
          console.log(" Mode CONNEXION SERVICE (pas login)");
          console.log("Service à connecter:", connectingService);
          try {
            console.log("Appel API connectService avec code:", code.substring(0, 20) + "...");
            await connectService(connectingService, code, "web");
            console.log("Service connecté avec succès!");
            
            sessionStorage.removeItem("connecting_service");
            sessionStorage.removeItem("connecting_service_provider");
            console.log(" SessionStorage nettoyé");
            
            console.log("Redirection vers /services");
            window.location.href = "/services";
            return;
          } catch (serviceErr) {
            console.error("Erreur lors de la connexion du service:", serviceErr);
            console.error("Details:", serviceErr);
            throw serviceErr;
          }
        }

        console.log("Mode LOGIN OAuth");
        console.log("Authentification OAuth avec provider:", provider);
        await handleOAuthCallback(provider, code, stateValue);
        console.log(" Authentification réussie");

        console.log("Redirection vers /");
        window.location.href = "/";
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
        setLoading(false);

        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      }
    };

    processOAuthCallback();
  }, []);

  if (loading) {
    return (
      <div className="oauth-container">
        <div className="oauth-background">
          {stars.map((star) => (
            <div key={star.id} className="star" style={star.style} />
          ))}
        </div>
        <div className="oauth-card">
          <div className="oauth-spinner"></div>
          <h2 className="oauth-title">Authentification en cours...</h2>
          <p className="oauth-message">Veuillez patienter pendant que nous vous connectons.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="oauth-container">
        <div className="oauth-background">
          {stars.map((star) => (
            <div key={star.id} className="star" style={star.style} />
          ))}
        </div>
        <div className="oauth-card">
          <h2 className="oauth-title">Erreur d'authentification</h2>
          <p className="oauth-error-message">{error}</p>
          <p className="oauth-message">Vous allez être redirigé vers la page de connexion...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthCallbackScreen;
