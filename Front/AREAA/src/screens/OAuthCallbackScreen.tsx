/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** OAuthCallbackScreen - Gère le retour du provider OAuth2
*/

import React, { useEffect, useState } from "react";
import { handleOAuthCallback } from "../services/auth";
import { connectService } from "../services/api";

const OAuthCallbackScreen: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}></div>
          <h2 style={styles.title}>Authentification en cours...</h2>
          <p style={styles.message}>Veuillez patienter pendant que nous vous connectons.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          {/* <div style={styles.errorIcon}></div> */}
          <h2 style={styles.title}>Erreur d'authentification</h2>
          <p style={styles.errorMessage}>{error}</p>
          <p style={styles.message}>Vous allez être redirigé vers la page de connexion...</p>
        </div>
      </div>
    );
  }

  return null;
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    padding: "20px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "40px",
    maxWidth: "500px",
    width: "100%",
    textAlign: "center",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  spinner: {
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #3498db",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "12px",
  },
  message: {
    fontSize: "16px",
    color: "#666",
    marginBottom: "8px",
  },
  errorIcon: {
    fontSize: "50px",
    marginBottom: "20px",
  },
  errorMessage: {
    fontSize: "16px",
    color: "#e74c3c",
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#fee",
    borderRadius: "8px",
  },
};

export default OAuthCallbackScreen;
