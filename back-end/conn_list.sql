-- show current application connections
SELECT *, CURRENT_TIMESTAMP - state_change AS "state_delay"
FROM pg_stat_activity
WHERE application_name = :'name' || '-app';
