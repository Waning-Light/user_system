CREATE DATABASE IF NOT EXISTS user_center
    DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE user_center;

CREATE TABLE IF NOT EXISTS users (
                                     id         CHAR(36)     NOT NULL,
    username   VARCHAR(32)  NOT NULL,
    password   VARCHAR(128) NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_username (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sessions (
                                        session_id CHAR(64) NOT NULL,
    user_id    CHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (session_id),
    KEY idx_sessions_user (user_id),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;