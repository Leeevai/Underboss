#!/bin/bash
# Workaround script to run server without anaconda interference

# Unset conda/anaconda environment variables
unset CONDA_PREFIX
unset CONDA_DEFAULT_ENV
unset CONDA_PROMPT_MODIFIER
unset PYTHONPATH

# Prevent Python from using user site-packages (anaconda)
export PYTHONNOUSERSITE=1

# Activate venv
source venv/bin/activate

# Run flask
exec flask --app=app.py run "$@"

