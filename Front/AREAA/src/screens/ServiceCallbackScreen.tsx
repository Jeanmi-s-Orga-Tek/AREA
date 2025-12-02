/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** ServiceCallbackScreen
*/


import React, { useEffect, useState } from "react";
import { connectService } from "../services/api";

const ServiceCallbackScreen: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processServiceCallback = async () => {
      try {
        if (window.location.hostname === "127.0.0.1") {
          const newUrl = window.location.href.replace("127.0.0.1", "localhost");
          window.location.href = newUrl;
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const errorParam = urlParams.get("error");

        const pendingService = sessionStorage.getItem("pending_service_connection");
        
        if (!pendingService) {
          throw new Error("Aucun service en attente de connexion");
        }

        if (errorParam) {
          const errorDescription = urlParams.get("error_description") || errorParam;
          sessionStorage.removeItem("pending_service_connection");
          throw new Error(`Erreur OAuth: ${errorDescription}`);
        }

        if (!code) {
          sessionStorage.removeItem("pending_service_connection");
          throw new Error("Code manquant dans l'URL de callback");
        }

        await connectService(pendingService, code, "web");
        
        sessionStorage.removeItem("pending_service_connection");
        window.location.href = "/services";
      } catch (err) {
        console.error("Service callback error:", err);
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
        setLoading(false);

        setTimeout(() => {
          window.location.href = "/services";
        }, 3000);
      }
    };

    processServiceCallback();
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}></div>
          <h2 style={styles.title}>Connexion du service en cours...</h2>
          <p style={styles.message}>Veuillez patienter pendant que nous connectons votre service.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>❌</div>
          <h2 style={styles.title}>Erreur de connexion</h2>
          <p style={styles.errorMessage}>{error}</p>
          <p style={styles.message}>Vous allez être redirigé vers la page des services...</p>
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

export default ServiceCallbackScreen;
