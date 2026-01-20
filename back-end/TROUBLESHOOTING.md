# Troubleshooting Guide

## Environment Issues

### Anaconda/Conda Python Conflict

If you encounter the error:
```
AttributeError: class must define a '_type_' attribute
```

This is caused by anaconda/conda Python interfering with the virtual environment. 

**Solution 1: Deactivate conda before using venv**

```bash
# Always deactivate conda first
conda deactivate

# Remove existing venv
rm -rf venv

# Create venv (make dev will do this)
make dev

# Activate and verify
source venv/bin/activate
python -c "import sys; print(sys.executable)"  # Should show venv path, not anaconda
```

**Solution 2: Use virtualenv instead of venv**

If `python3 -m venv` doesn't work:
```bash
pip install virtualenv
virtualenv venv
source venv/bin/activate
pip install -r requirements.txt -r dev-requirements.txt
```

**Solution 3: Fix anaconda's ctypes (advanced)**

If the above don't work, you may need to fix anaconda's Python installation:
```bash
conda install -c conda-forge ctypes
# Or reinstall anaconda Python
```

**Solution 2: Unset conda environment**

```bash
# Deactivate conda if active
conda deactivate

# Unset conda paths
unset CONDA_PREFIX
unset CONDA_DEFAULT_ENV

# Then proceed with venv setup
source venv/bin/activate
```

**Solution 3: Use a wrapper script**

Create a script `run_server.sh`:
```bash
#!/bin/bash
unset PYTHONPATH
export PYTHONNOUSERSITE=1
source venv/bin/activate
exec python -m flask --app=app.py run "$@"
```

## Database Connection Issues

### PostgreSQL not running

If you see:
```
could not connect to server: No such file or directory
```

**Solution:**
```bash
# Check if PostgreSQL is running
pg_isready -h localhost

# If not, start PostgreSQL (method depends on your system)
# Ubuntu/Debian:
sudo systemctl start postgresql

# macOS:
brew services start postgresql

# Or manually:
postgres -D /usr/local/var/postgres
```

### Database doesn't exist

If you see:
```
database "underboss" does not exist
```

**Solution:**
```bash
# Create database (make will do this automatically)
createdb underboss

# Or use make to set up everything
make clean
make log
```

## Testing Issues

### Tests fail with import errors

Make sure:
1. Virtual environment is activated: `source venv/bin/activate`
2. Dependencies are installed: `pip install -r requirements.txt -r dev-requirements.txt`
3. Database is set up: `make clean` (creates database)

### Tests fail with authentication errors

Make sure test users exist. The Makefile generates them from `test_users.in`:
```bash
make clean  # This generates test_users.csv
```

## Common Code Issues

### Query function not found

If you see errors like `db.get_user_* function not found`:
1. Check that `queries.sql` is loaded in `local.conf`: `"queries": [ "queries.sql" ]`
2. Verify the query name matches exactly (case-sensitive)
3. Restart the server after modifying `queries.sql`

### Authorization errors (403)

- Check that user has the correct role (admin vs worker)
- Verify the `user_is_admin` function in `auth.py` is working
- Check that tokens are being passed correctly in requests

### UUID vs String issues

The database uses UUIDs but returns them as text strings. Make sure:
- Model uses `aid: str` (not `int`)
- Queries use `id::text` to convert UUIDs
- Comparisons use string comparison, not integer

## Getting Help

1. Check the logs: `tail -f app.log`
2. Enable debug mode in `local.conf`: `APP_LOGGING_LEVEL = logging.DEBUG`
3. Check database directly: `psql underboss`
4. Review error messages in test output: `make check.pytest`

