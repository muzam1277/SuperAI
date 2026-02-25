import express from "express";
import { createServer as createViteServer } from "vite";
import { OAuth2Client } from "google-auth-library";
import cookieParser from "cookie-parser";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());
  app.use(cookieParser());

  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = `${process.env.APP_URL || 'http://localhost:3000'}/auth/google/callback`;

  const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  // Auth Routes
  app.get("/api/auth/google/url", (req, res) => {
    const url = client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
    });
    res.json({ url });
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    try {
      const { tokens } = await client.getToken(code as string);
      client.setCredentials(tokens);
      
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: CLIENT_ID,
      });
      const payload = ticket.getPayload();
      
      // Set session cookie
      res.cookie("user", JSON.stringify({
        name: payload?.name,
        email: payload?.email,
        picture: payload?.picture,
        role: 'USER' // Default role for Google login
      }), {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Google Auth Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.get("/api/auth/me", (req, res) => {
    const user = req.cookies.user;
    if (user) {
      res.json(JSON.parse(user));
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("user");
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
