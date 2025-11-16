/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** AboutScreen
*/

import React, { useEffect, useState } from "react";
import { fetchAbout, AboutResponse } from "../services/api";

const AboutScreen: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [about, setAbout] = useState<AboutResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAbout = async () => {
      setLoading(true);
      setError(null);

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
        setError(message);
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
      <main>
        <p>Loading /about.json...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <p>Error: {error}</p>
      </main>
    );
  }

  if (!about || about.server.services.length === 0) {
    return (
      <main>
        <p>No services available.</p>
      </main>
    );
  }

  const firstService = about.server.services[0];

  return (
    <main>
      <h1>/about</h1>
      <p>First service: {firstService.name}</p>
    </main>
  );
};

export default AboutScreen;
