-- remove all admin permissions
UPDATE Auth SET isadmin = FALSE WHERE isadmin = TRUE;
