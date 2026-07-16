# Commands

## Do not start or restart servers

Never run `npm run dev`, `npm start`, `uvicorn`, `python -m`, or any other command that starts the frontend or backend dev server. The user manages these processes themselves.

When backend changes require a restart (e.g. new endpoints, `.env` changes), tell the user a restart is needed instead of restarting it.
