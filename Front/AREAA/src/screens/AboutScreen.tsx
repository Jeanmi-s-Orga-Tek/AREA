/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** AboutScreen
*/

import React, { useEffect, useState } from "react";
import { fetchAbout, AboutResponse } from "../services/api";
import NotificationContainer, { NotificationItem } from "../components/NotificationContainer";
import "./AboutScreen.css";

const AboutScreen: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [about, setAbout] = useState<AboutResponse | null>(null);
  const [stars, setStars] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const addNotification = (message: string, type: "success" | "error") => {
    const id = `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications((prev) => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

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
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  useEffect(() => {

    let isMounted = true;

    const loadAbout = async () => {
      setLoading(true);

      try {
        const response = await fetchAbout();
        if (!isMounted) {
          return;
        }
        setAbout(response);
        setLoading(false);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        const message =
          err instanceof Error ? err.message : "Unknown error while fetching /about";
        addNotification(message, "error");
        setLoading(false);
      }
    };

    void loadAbout();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="about-container">
        <div className="about-background">
          {stars.map((star) => (
            <div key={star.id} className="star" style={star.style} />
          ))}
        </div>
        <div className="about-content">
          <div className="loading-card">
            <p>Chargement des informations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!about || about.server.services.length === 0) {
    return (
      <div className="about-container">
        <div className="about-background">
          {stars.map((star) => (
            <div key={star.id} className="star" style={star.style} />
          ))}
        </div>
        <div className="about-content">
          <div className="error-card">
            <p>Aucun service disponible.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="about-container">
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
      <div className="about-background">
        {stars.map((star) => (
          <div key={star.id} className="star" style={star.style} />
        ))}
      </div>
      <div className="about-content">
        <div className="about-topbar">
          <h1 className="topbar-title">À propos</h1>
          <a href="/" className="back-btn">
            ← Retour
          </a>
        </div>

        <div className="about-header">
          <h1>⚡ AREA Platform</h1>
          <p>Action REAction - Plateforme d'automatisation multi-services</p>
        </div>

        <div className="about-info-card">
          <h2>📊 Informations du serveur</h2>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Adresse IP Client</div>
              <div className="info-value">{about.client.host}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Heure actuelle</div>
              <div className="info-value">
                {currentTime.toLocaleString("fr-FR")}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Services disponibles</div>
              <div className="info-value">{about.server.services.length}</div>
            </div>
          </div>
        </div>

        <div className="about-info-card">
          <h2>ℹ️ À propos de la plateforme</h2>
          <div className="about-description">
            <p>
              <strong>AREA</strong> (Action REAction) est une plateforme d'automatisation qui vous permet de 
              connecter différents services entre eux pour créer des automatisations personnalisées.
            </p>
            <p>
              Le principe est simple : définissez une <strong>action</strong> (événement déclencheur) sur un service, 
              puis choisissez une <strong>réaction</strong> (action à effectuer) sur le même service ou un autre. 
              Lorsque l'action se produit, la réaction est automatiquement exécutée.
            </p>
            <p>
              Par exemple, vous pouvez :
            </p>
            <ul className="feature-list">
              <li>📧 Recevoir un email lorsqu'un nouveau commit est poussé sur GitHub</li>
              <li>💬 Envoyer un message Discord quand vous recevez un email important</li>
              <li>🎵 Ajouter automatiquement des chansons à une playlist Spotify</li>
              <li>📋 Créer des cartes Trello depuis vos emails Gmail</li>
              <li>⏰ Déclencher des actions à des heures précises avec le Timer</li>
            </ul>
            <p>
              Créez, activez et gérez vos automatisations en quelques clics pour gagner du temps 
              et améliorer votre productivité !
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutScreen;
