// Exemple côté Netlify pour lancer un paiement SerdiPay

async function createSerdiPayPayment() {
  const response = await fetch("https://votre-backend.com/api/payment/client-to-merchant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      clientPhone: "+243XXXXXXXXX",
      amount: 400,
      currency: "CDF",
      telecom: "AM"
    })
  });

  const data = await response.json();
  console.log(data);
}
