# crm-fullstack-final
Full Stack CRM featuring an AI assistant. Final course project built with React/Next.js, Node.js, and MongoDB.

## Google sign-in setup

1. Create a Google OAuth client ID for a **Web application** in Google Cloud Console.
2. Add the frontend URL (for local development, `http://localhost:3000`) to the OAuth client's authorized JavaScript origins.
3. Set the same client ID in `client/.env.local` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and in `server/.env` as `GOOGLE_CLIENT_ID`.
4. Restart both the client and server after setting the environment variables.

The server verifies Google's ID token before creating or signing in a user. A Google client secret is not required for this flow and must not be added to a `NEXT_PUBLIC_` variable.
