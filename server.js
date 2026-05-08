require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const SERDIPAY_BASE_URL = process.env.SERDIPAY_BASE_URL || "https://serdipay.com";

function normalizePhone(phone) {
  if (!phone) return "";
  return String(phone).replace(/\s+/g, "").replace(/^\+/, "");
}

function normalizeTelecom(telecom) {
  const value = String(telecom || "").toUpperCase().trim();
  const allowed = ["AM", "OM", "MP", "AF"];
  if (!allowed.includes(value)) {
    throw new Error("telecom invalide. Utilisez AM, OM, MP ou AF.");
  }
  return value;
}

async function getSerdiPayToken() {
  const url = `${SERDIPAY_BASE_URL}/api/public-api/v1/merchant/get-token`;

  const response = await axios.post(
    url,
    {
      email: process.env.SERDIPAY_EMAIL,
      password: process.env.SERDIPAY_PASSWORD,
    },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    }
  );

  return response.data.access_token;
}

// Page de test
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend SerdiPay ETS MAMAN BRIGITTE actif",
    merchantCode: process.env.SERDIPAY_MERCHANT_CODE || "302443",
  });
});

// Test santé serveur
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Test authentification SerdiPay
app.get("/api/serdipay/token-test", async (req, res) => {
  try {
    const token = await getSerdiPayToken();
    res.json({
      success: true,
      message: "Token SerdiPay obtenu.",
      tokenPreview: token ? `${String(token).slice(0, 8)}...` : null,
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: "Impossible d'obtenir le token SerdiPay.",
      error: error.response?.data || error.message,
    });
  }
});

// Paiement client -> marchand (C2B)
// Le client reçoit une demande de paiement sur son Mobile Money.
app.post("/api/payment/client-to-merchant", async (req, res) => {
  try {
    const { clientPhone, amount, currency = "CDF", telecom } = req.body;

    if (!clientPhone || !amount || !telecom) {
      return res.status(400).json({
        success: false,
        message: "clientPhone, amount et telecom sont obligatoires.",
      });
    }

    const token = await getSerdiPayToken();

    const payload = {
      api_id: process.env.SERDIPAY_API_ID,
      api_password: process.env.SERDIPAY_API_PASSWORD,
      merchantCode: process.env.SERDIPAY_MERCHANT_CODE,
      merchant_pin: process.env.SERDIPAY_MERCHANT_PIN,
      clientPhone: normalizePhone(clientPhone),
      amount: Number(amount),
      currency: String(currency).toUpperCase(),
      telecom: normalizeTelecom(telecom),
    };

    const url = `${SERDIPAY_BASE_URL}/api/public-api/v1/merchant/payment-merchant`;

    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000,
    });

    res.status(response.status).json({
      success: response.status === 200 || response.status === 102,
      message: "Demande de paiement envoyée à SerdiPay.",
      serdipayStatus: response.status,
      data: response.data,
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: "Erreur lors de l'initiation du paiement C2B.",
      error: error.response?.data || error.message,
    });
  }
});

// Paiement marchand -> client (B2C)
// À utiliser seulement si SerdiPay active ce service pour le compte.
app.post("/api/payment/merchant-to-client", async (req, res) => {
  try {
    const { clientPhone, amount, currency = "CDF", telecom } = req.body;

    if (!clientPhone || !amount || !telecom) {
      return res.status(400).json({
        success: false,
        message: "clientPhone, amount et telecom sont obligatoires.",
      });
    }

    const token = await getSerdiPayToken();

    const payload = {
      api_id: process.env.SERDIPAY_API_ID,
      api_password: process.env.SERDIPAY_API_PASSWORD,
      merchantCode: process.env.SERDIPAY_MERCHANT_CODE,
      merchant_pin: process.env.SERDIPAY_MERCHANT_PIN,
      clientPhone: normalizePhone(clientPhone),
      amount: Number(amount),
      currency: String(currency).toUpperCase(),
      telecom: normalizeTelecom(telecom),
    };

    const url = `${SERDIPAY_BASE_URL}/api/public-api/v1/merchant/payment-client`;

    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000,
    });

    res.status(response.status).json({
      success: response.status === 200 || response.status === 102,
      message: "Paiement marchand vers client envoyé à SerdiPay.",
      serdipayStatus: response.status,
      data: response.data,
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: "Erreur lors de l'initiation du paiement B2C.",
      error: error.response?.data || error.message,
    });
  }
});

// Alias simple pour ton site Netlify
app.post("/api/payment/create", async (req, res) => {
  req.url = "/api/payment/client-to-merchant";
  app._router.handle(req, res);
});

// Callback SerdiPay : URL POST à transmettre à SerdiPay.
// Exemple : https://votre-backend.com/api/serdipay/callback
app.post("/api/serdipay/callback", async (req, res) => {
  try {
    console.log("Callback SerdiPay reçu :", JSON.stringify(req.body, null, 2));

    const payment = req.body.payment || {};
    const status = String(payment.status || "").toLowerCase();

    if (status === "success") {
      console.log("Paiement confirmé :", {
        sessionId: payment.sessionId,
        transactionId: payment.transactionId,
      });
    }

    if (status === "failed") {
      console.log("Paiement échoué :", {
        sessionId: payment.sessionId,
        transactionId: payment.transactionId,
      });
    }

    // Toujours répondre 200 pour dire à SerdiPay que le callback est bien reçu.
    res.status(200).json({
      success: true,
      message: "Callback reçu avec succès.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur callback.",
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serveur SerdiPay démarré sur le port ${PORT}`);
});
