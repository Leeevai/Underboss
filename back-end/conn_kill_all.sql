-- kill all application connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE application_name = :'name' || '-app';
