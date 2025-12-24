import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const API_KEY = process.env.QOYOD_API_KEY;
const BASE_URL = "https://api.qoyod.com/2.0";
const TARGET_SKU = "754500950512";

app.get("/api/invoices", async (req, res) => {
  try {
    const headers = { "API-KEY": API_KEY, "Accept": "application/json" };
    const [invRes, locRes] = await Promise.all([
      fetch(`${BASE_URL}/invoices`, { headers }),
      fetch(`${BASE_URL}/locations`, { headers })
    ]);

    const invData = await invRes.json();
    const locData = await locRes.json();

    const invoices = invData.invoices
      .filter(inv =>
        inv.line_items?.some(item => String(item.sku) === TARGET_SKU) &&
        inv.status !== "paid"
      )
      .map(inv => ({
        id: inv.id,
        reference: inv.reference,
        due_amount: inv.due_amount,
        contact_name: inv.contact_name,
        location_name: locData.locations.find(l => l.id === inv.location_id)?.name || "الرئيسي"
      }));

    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: "Qoyod API Error" });
  }
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Backend running on port 3000")
);