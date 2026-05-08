# Backend SerdiPay — ETS MAMAN BRIGITTE

Projet backend Node.js pour connecter le site Netlify à l’API publique SerdiPay.

## Infos connues

- Marchand : ETS MAMAN BRIGITTE
- Merchant code : 302443
- Site : https://ets-maman-brigitte.netlify.app

## Endpoints créés

### Tester le serveur
`GET /api/health`

### Tester le token SerdiPay
`GET /api/serdipay/token-test`

### Recevoir un paiement client -> marchand
`POST /api/payment/client-to-merchant`

Body exemple :

```json
{
  "clientPhone": "+243976422837",
  "amount": 400,
  "currency": "CDF",
  "telecom": "AM"
}
```

Codes opérateurs :

- `AM` = Airtel Money
- `OM` = Orange Money
- `MP` = Vodacom M-Pesa
- `AF` = Afrimoney

### Callback SerdiPay
`POST /api/serdipay/callback`

URL à donner à SerdiPay après déploiement :

```text
https://votre-backend.com/api/serdipay/callback
```

## Installation

```bash
npm install
cp .env.example .env
npm run dev
```

## Variables à compléter dans `.env`

```text
SERDIPAY_EMAIL=
SERDIPAY_PASSWORD=
SERDIPAY_API_ID=
SERDIPAY_API_PASSWORD=
SERDIPAY_MERCHANT_CODE=302443
SERDIPAY_MERCHANT_PIN=
CALLBACK_URL=
```

## Informations à demander à SerdiPay

Il manque encore les vraies valeurs privées :

1. API ID
2. API password
3. Merchant PIN
4. Mot de passe API ou backoffice utilisé pour obtenir le token
5. Confirmation du bon endpoint à utiliser pour C2B : `payment-merchant`
6. Confirmation du bon endpoint à utiliser pour B2C : `payment-client`

## À envoyer à SerdiPay après déploiement

Nom de domaine :

```text
https://ets-maman-brigitte.netlify.app
```

URL callback POST :

```text
https://votre-backend.com/api/serdipay/callback
```

IP statique :

```text
à compléter selon l’hébergeur choisi
```
