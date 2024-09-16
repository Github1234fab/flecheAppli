const { json } = require("@netlify/functions");
const admin = require("firebase-admin");

// Configure Firebase Admin SDK
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

exports.handler = async (event) => {
        if (event.httpMethod === "POST") {
                try {
                        const { message } = JSON.parse(event.body);
                        const tokensSnapshot = await db.collection("user_tokens").get();
                        const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);

                        if (tokens.length === 0) {
                                return json({ message: "No tokens found." }, { statusCode: 404 });
                        }

                        const payload = {
                                notification: {
                                        title: "Notification Title",
                                        body: message,
                                },
                        };

                        const response = await admin.messaging().sendToDevice(tokens, payload);
                        return json({ message: "Notifications sent successfully", response });
                } catch (error) {
                        console.error("Error sending notification:", error);
                        return json({ error: "Error sending notification" }, { statusCode: 500 });
                }
        } else {
                return json({ error: "Method not allowed" }, { statusCode: 405 });
        }
};
