/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** Notification
*/

import React, { useEffect, useState } from "react";
import "./Notification.css";

export type NotificationType = "success" | "error";

interface NotificationProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  onClose,
  duration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`notification notification-${type} ${
        isVisible ? "notification-visible" : ""
      }`}
    >
      <div className="notification-icon">
        {type === "success" ? "✓" : "✕"}
      </div>
      <span className="notification-message">{message}</span>
    </div>
  );
};

export default Notification;

