const admin = require("firebase-admin");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Configurer Firebase Admin SDK avec les variables d'environnement
const serviceAccount = {
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Ajouter un token à Firestore
app.post("/api/saveToken", async (req, res) => {
        try {
                const { token } = req.body;
                await db.collection("user_tokens").add({
                        token: token,
                        date_created: admin.firestore.FieldValue.serverTimestamp(),
                });
                res.status(200).json({ message: "Token enregistré avec succès" });
        } catch (error) {
                console.error("Erreur lors de l'enregistrement du token:", error);
                res.status(500).json({ error: "Erreur lors de l'enregistrement du token" });
        }
});

// Envoyer des notifications à tous les utilisateurs
app.post("/api/sendNotification", async (req, res) => {
        try {
                const message = req.body.message;

                const tokensSnapshot = await db.collection("user_tokens").get();
                const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);

                if (tokens.length === 0) {
                        res.status(404).json({ message: "Aucun token trouvé." });
                        return;
                }

                const payload = {
                        notification: {
                                title: "Notification Title",
                                body: message,
                        },
                };

                const response = await admin.messaging().sendToDevice(tokens, payload);
                res.status(200).json({ message: "Notifications envoyées avec succès", response });
        } catch (error) {
                console.error("Erreur lors de l'envoi des notifications:", error);
                res.status(500).json({ error: "Erreur lors de l'envoi des notifications" });
        }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
});
