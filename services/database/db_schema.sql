CREATE DATABASE papdb;
\c papdb;

CREATE TABLE IF NOT EXISTS Customer (
	UserID INT NOT NULL,
	DOB DATE NOT NULL,
	ContactName TEXT NOT NULL, 
	ContactPhone TEXT NOT NULL,
	ContactEmail TEXT NOT NULL,
	Location TEXT NOT NULL,
	PRIMARY KEY(UserID)
);

-- the cases are basically clusters of incidents
CREATE TABLE IF NOT EXISTS Cases (
	CaseID INT NOT NULL,
	Owner INT NOT NULL,
	PRIMARY KEY (CaseID),
	FOREIGN KEY (Owner) REFERENCES Customer(UserID)
);

--/ the Incident table contains all reported incidents. Multiple incidents can occur per case (and not necessarily all have been reported). The cases table foreign keys into this
CREATE TABLE IF NOT EXISTS Incident (
	IncidentID INT NOT NULL,
	Owner INT NOT NULL,
	Time TIMESTAMP NOT NULL, --unix time
	Location TEXT NOT NULL, -- ZIP?
	Description TEXT NOT NULL,
	IncidentLevel TEXT NOT NULL,
	SceneDescription TEXT NOT NULL,
	ArrestMade BOOL,
	RaceOfVictim TEXT,
	GenderOfVictim TEXT,
	PRIMARY KEY (IncidentID),
	FOREIGN KEY (Owner) REFERENCES Customer(UserID)
);


CREATE TABLE IF NOT EXISTS Officer (
	OfficerID INT,
	BadgeID TEXT,
	-- Do we want race, description, etc… so we can identify trends here?
	PRIMARY KEY(OfficerID)
);

-- Contains per incident evidence
CREATE TABLE IF NOT EXISTS Evidence (
	EvidenceURI TEXT NOT NULL,
	EvidenceType TEXT NOT NULL,
	OWNER INT NOT NULL,
	Description TEXT NOT NULL,
	IncidentID INT,
	PRIMARY KEY (EvidenceURI),
	FOREIGN KEY (Owner) REFERENCES Customer(UserID),
	FOREIGN KEY (IncidentID) REFERENCES Incident(IncidentID)
);


CREATE TABLE IF NOT EXISTS Organizations (
	OrganizationID INT NOT NULL,
	OrganizationName  TEXT NOT NULL,
	ContactInfo TEXT NOT NULL,
	PRIMARY KEY (OrganizationID)
);


CREATE TABLE IF NOT EXISTS CasesToIncidents (
	CaseID INT,
	IncidentID INT,
	PRIMARY KEY (CaseID, IncidentID),
	FOREIGN KEY (CaseID) REFERENCES Cases(CaseID),
	FOREIGN KEY (IncidentID) REFERENCES Incident(IncidentID)
);

CREATE TABLE IF NOT EXISTS IncidentsToOfficers (
	CaseID INT,
	OfficerID INT,
	PRIMARY KEY (CaseID, OfficerID),
	FOREIGN KEY (CaseID) REFERENCES Cases(CaseID),
	FOREIGN KEY (OfficerID) REFERENCES Officer(OfficerID)
);

CREATE TABLE IF NOT EXISTS OrganizationsToCases (
	OrganizationID INT NOT NULL,
	CaseID INT NOT NULL,
	PRIMARY Key (CaseID, OrganizationID),
	FOREIGN Key (CaseID) REFERENCES Cases(CaseID),
	FOREIGN Key (OrganizationID) REFERENCES Organizations(OrganizationID)
);


