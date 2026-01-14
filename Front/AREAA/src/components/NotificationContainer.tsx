/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** NotificationContainer
*/

import React from "react";
import Notification, { NotificationType } from "./Notification";

export interface NotificationItem {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContainerProps {
  notifications: NotificationItem[];
  onRemove: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove,
}) => {
  return (
    <>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </>
  );
};

export default NotificationContainer;

