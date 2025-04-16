FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm install

COPY . .

# Create a .env file at build time based on build args
ARG REACT_APP_PERSONA_ENGINE_URL
ARG REACT_APP_DIALOG_ORCHESTRATOR_URL
ENV REACT_APP_PERSONA_ENGINE_URL=${REACT_APP_PERSONA_ENGINE_URL:-http://persona-engine-service:5001}
ENV REACT_APP_DIALOG_ORCHESTRATOR_URL=${REACT_APP_DIALOG_ORCHESTRATOR_URL:-http://adaptiveai-personaar-dialogorch:5002}

# Build the React app
RUN npm run build

RUN npm install -g serve

EXPOSE 3000

# Make sure the entrypoint script is executable
RUN chmod +x /app/entrypoint.sh

# Add a script tag to index.html to load runtime-env.js
RUN sed -i 's/<head>/<head><script src="\/runtime-env.js"><\/script>/' /app/build/index.html

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["serve", "-s", "build", "-l", "3000"]