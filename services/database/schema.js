/**
 * Defines the basic schema defined within our sql file. This is used for sanity checking all edits
 */
class TABLE_SCHEMA {
	/**
     * Defines the basic schema for a table
     * This is used primarily for verification of requests
     */
    static TABLE_NAME = "";
	static KEY_COLUMNS = [];
	static NON_NULLABLE_COLUMNS = [];
	static COLUMNS = [];
}


class CASES_SCHEMA extends TABLE_SCHEMA {
	static TABLE_NAME = "Cases";
	static KEY_COLUMNS = [
		"CaseID"
	];
	static NON_NULLABLE_COLUMNS = [
		"CaseID",
		"Owner"
	];
	static COLUMNS = [
		"CaseID",
		"Owner"
	];
}

class INCIDENT_SCHEMA extends TABLE_SCHEMA {
	static TABLE_NAME = "Incident";
	static KEY_COLUMNS = [
		"IncidentID"	
	];
	static NON_NULLABLE_COLUMNS = [
		"IncidentID",
		"Owner",
		"Time",
		"Location",
		"Description",
		"IncidentLevel",
		"SceneDescription"
	];
	static COLUMNS = [
		"IncidentID",
		"Owner",
		"Time",
		"Location",
		"Description",
		"IncidentLevel",
		"SceneDescription",
		"ArrestMade",
		"RaceOfVictim",
		"GenderOfVictim"
	];
}

class OFFICER_SCHEMA extends TABLE_SCHEMA {
	static TABLE_NAME = "Officer";
	static KEY_COLUMNS = [
		"OfficerID"
	];
	static NON_NULLABLE_COLUMNS = [
		"OfficerID",
		"BadgeID"
	];
	static COLUMNS = [
		"OfficerID",
		"BadgeID"
	];	
}

class ORGANIZATIONS_SCHEMA extends TABLE_SCHEMA {
	static TABLE_NAME = "Organizations";
	static KEY_COLUMNS = [
		"OrganizationID"
	];
	static NON_NULLABLE_COLUMNS = [
		"OrganizationID",
		"OrganizationName",
		"ContactInfo"
	];
	static COLUMNS = [
		"OrganizationID",
		"OrganizationName",
		"ContactInfo"
	];
}

class USER_SCHEMA extends TABLE_SCHEMA {
	static TABLE_NAME = "Customer"; // we needed to name this customer because user was a reserved word in SQL
	static KEY_COLUMNS = [
		"UserID"
	];
	static NON_NULLABLE_COLUMNS = [
		"UserID",
		"DOB",
		"ContactName",
		"ContactPhone",
		"ContactEmail",
		"Location"
	];
	static COLUMNS = [
		"UserID",
		"DOB",
		"ContactName",
		"ContactPhone",
		"ContactEmail",
		"Location"
	];
}

class CASES_TO_INCIDENTS_SCHEMA extends TABLE_SCHEMA {
	static TABLE_NAME = "CasesToIncidents";
	static KEY_COLUMNS = [
		"CaseID",
		"IncidentID"
	];
	static NON_NULLABLE_COLUMNS = [
		"CaseID",
		"IncidentID"
	];
	static COLUMNS = [
		"CaseID",
		"IncidentID"
	];
}

class INCIDENTS_TO_OFFICERS_SCHEMA extends TABLE_SCHEMA {
	static TABLE_NAME = "CasesToOfficers";
	static KEY_COLUMNS = [
		"IncidentID",
		"OfficerID"
	];
	static NON_NULLABLE_COLUMNS = [
		"IncidentID",
		"OfficerID"
	];
	static COLUMNS = [
		"IncidentID",
		"OfficerID"
	];
}

class ORGANIZATIONS_TO_CASES_SCHEMA extends TABLE_SCHEMA {
	static TABLE_NAME = "OrganizationsToCases";
	static KEY_COLUMNS = [
		"OrganizationID",
		"CaseID"
	];
	static NON_NULLABLE_COLUMNS = [
		"OrganizationID",
		"CaseID"
	];
	static COLUMNS = [
		"OrganizationID",
		"CaseID"
	];
}

exports.ORGANIZATIONS_SCHEMA = ORGANIZATIONS_SCHEMA
exports.ORGANIZATIONS_TO_CASES_SCHEMA = ORGANIZATIONS_TO_CASES_SCHEMA
exports.INCIDENT_SCHEMA = INCIDENT_SCHEMA
exports.INCIDENTS_TO_OFFICERS_SCHEMA = INCIDENT_SCHEMA
exports.CASES_SCHEMA = CASES_SCHEMA
exports.CASES_TO_INCIDENTS_SCHEMA = CASES_TO_INCIDENTS_SCHEMA
exports.OFFICER_SCHEMA = OFFICER_SCHEMA
exports.USER_SCHEMA = USER_SCHEMA
exports.TABLE_SCHEMA = TABLE_SCHEMA
