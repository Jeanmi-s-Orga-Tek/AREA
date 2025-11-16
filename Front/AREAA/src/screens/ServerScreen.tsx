/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** ServerScreen
*/

import React from "react";

const ServerScreen: React.FC = () => {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Web OK</h1>
      <p>The AREA web client is up and running.</p>
      <p>
        <a href="/about">Go to /about</a>
      </p>
    </main>
  );
};

export default ServerScreen;
