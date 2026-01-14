-- kill application connections in "idle in tx"
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE application_name = :'name' || '-app'
  AND state = 'idle in transaction';
