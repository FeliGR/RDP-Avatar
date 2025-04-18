#!/bin/sh

# Apply runtime environment variables before starting the server
cat <<EOF > /app/build/runtime-env.js
window.ENV = {
  REACT_APP_PERSONA_ENGINE_URL: "${REACT_APP_PERSONA_ENGINE_URL:-}",
  REACT_APP_DIALOG_ORCHESTRATOR_URL: "${REACT_APP_DIALOG_ORCHESTRATOR_URL:-}"
}
EOF

# Log the environment configuration for debugging
echo "Runtime environment configured:"
echo "PERSONA_ENGINE_URL: ${REACT_APP_PERSONA_ENGINE_URL:-not set}"
echo "DIALOG_ORCHESTRATOR_URL: ${REACT_APP_DIALOG_ORCHESTRATOR_URL:-not set}"

exec "$@"