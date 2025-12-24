import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.QOYOD_API_KEY; // ضع مفتاحك هنا أو في متغيرات البيئة
const BASE_URL = "https://api.qoyod.com/2.0";
const TARGET_SKU = "754500950512";

// Route اختبارية للتأكد من تشغيل السيرفر
app.get("/", (req, res) => {
  res.send("Backend Qoyod يعمل ✅");
});

// جلب كل الفواتير الغير مدفوعة للمنتج المستهدف
app.get("/api/invoices", async (req, res) => {
  try {
    const headers = { "API-KEY": API_KEY, Accept: "application/json" };

    const [invRes, locRes] = await Promise.all([
      fetch(`${BASE_URL}/invoices`, { headers }),
      fetch(`${BASE_URL}/inventories`, { headers })
    ]);

    const invData = await invRes.json();
    const locData = await locRes.json();

    const invoices = invData.invoices
      .filter(inv =>
        inv.line_items?.some(item => String(item.sku) === TARGET_SKU)
      )
      .map(inv => ({
        id: inv.id,
        reference: inv.reference,
        total: inv.total,
        due_date: inv.due_date,
        issue_date: inv.issue_date,
        contact_name: inv.contact_name || "-",
        location_name:
          locData.inventories.find(l => l.id === inv.line_items[0]?.inventory_id)
            ?.name_ar || "الرئيسي",
        status: inv.status,
        created_by: inv.created_by || "-"
      }));

    res.json({ invoices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "فشل جلب الفواتير من Qoyod" });
  }
});

// البحث عن فاتورة يدوية (ID أو أي جزء من المرجع)
app.get("/api/invoices/search/:text", async (req, res) => {
  try {
    const searchText = req.params.text.toLowerCase();
    const headers = { "API-KEY": API_KEY, Accept: "application/json" };
    const response = await fetch(`${BASE_URL}/invoices`, { headers });
    const data = await response.json();

    const matched = data.invoices.filter(
      inv =>
        (inv.reference && inv.reference.toLowerCase().includes(searchText)) ||
        (inv.id && inv.id.toString().includes(searchText))
    );

    res.json({ invoices: matched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "فشل البحث عن الفاتورة" });
  }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));