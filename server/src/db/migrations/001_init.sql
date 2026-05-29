
CREATE TYPE Role AS ENUM ('organization', 'member');
CREATE TYPE Task_Status AS ENUM ('TODO', 'COMPLETED', 'IN_PROGRESS');
CREATE TYPE Task_Priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TABLE "Users" ( 
    id VARCHAR(12) PRIMARY KEY, 
    name VARCHAR(100) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    hashed_password VARCHAR(120) NOT NULL,
    role Role NOT NULL,
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Organizations" (
    user_id VARCHAR(12) PRIMARY KEY,
    FOREIGN KEY (user_id) REFERENCES "Users"(id) ON DELETE CASCADE
);

CREATE TABLE "OrganizationMembers" (
    user_id VARCHAR(12) PRIMARY KEY,
    organization_id VARCHAR(12),
    FOREIGN KEY (user_id) REFERENCES "Users"(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES "Organizations"(user_id) ON DELETE SET NULL
);

CREATE TABLE "Tasks" (
    id VARCHAR(16) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'TODO',
    priority task_priority DEFAULT 'MEDIUM',
    due_date TIMESTAMP NOT NULL,
    user_id VARCHAR(12) NOT NULL,
    organization_id VARCHAR(12),
    assigned_to VARCHAR(12),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "Users"(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES "Organizations"(user_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES "OrganizationMembers"(user_id) ON DELETE SET NULL
);

-- Speeds up queries that filter or join tasks by corresponding attributes
CREATE INDEX idx_users_id ON "Users"(id);
CREATE INDEX idx_users_name ON "Users"(name);
CREATE INDEX idx_users_email ON "Users"(email);
CREATE INDEX idx_users_role ON "Users"(role);

CREATE INDEX idx_organizationMembers_organizationID ON "OrganizationMembers"(organization_id);

CREATE INDEX idx_tasks_userID ON "Tasks"(user_id);
CREATE INDEX idx_tasks_organizationID ON "Tasks"(organization_id);
CREATE INDEX idx_tasks_assignedTo ON "Tasks"(assigned_to);
CREATE INDEX idx_tasks_createdAt ON "Tasks"(created_at);
CREATE INDEX idx_tasks_status ON "Tasks"(status);
