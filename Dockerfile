FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm install

COPY . .

ARG REACT_APP_PERSONA_ENGINE_URL
ARG REACT_APP_DIALOG_ORCHESTRATOR_URL
ARG REACT_APP_RPM_CLIENT_ID
ENV REACT_APP_PERSONA_ENGINE_URL=${REACT_APP_PERSONA_ENGINE_URL:-http://persona-engine-service:5001}
ENV REACT_APP_DIALOG_ORCHESTRATOR_URL=${REACT_APP_DIALOG_ORCHESTRATOR_URL:-http://adaptiveai-personaar-dialogorch:5002}
ENV REACT_APP_RPM_CLIENT_ID=${REACT_APP_RPM_CLIENT_ID:-684b2978d8c346fff8566d83}

RUN npm run build

RUN npm install -g serve

EXPOSE 3000

RUN chmod +x /app/entrypoint.sh

RUN sed -i 's/<head>/<head><script src="\/runtime-env.js"><\/script>/' /app/build/index.html

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["serve", "-s", "build", "-l", "3000"]