

CREATE TABLE IF NOT EXISTS Roles(
  role_id SERIAL8 PRIMARY KEY,
  name string UNIQUE NOT NULL,
  description string DEFAULT "No description provided."
)