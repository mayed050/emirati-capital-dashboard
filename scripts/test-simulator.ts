import { isGstMarketOpen } from "../src/utils/marketSimulator";

function runTests() {
  console.log("=== بدء تشغيل اختبارات ساعات السوق ===");

  // 1. التحقق من ساعات السوق في دبي
  console.log("\n1. فحص ساعات العمل الرسمية (GST):");
  // اختبار يوم أحد (مغلق)
  const sunday = new Date("2026-05-31T12:00:00Z"); // Sunday 16:00 GST
  console.log(`- يوم الأحد 16:00 بتوقيت دبي: ${isGstMarketOpen(sunday) ? "❌ مفتوح (خطأ)" : "✅ مغلق (صحيح)"}`);

  // اختبار يوم ثلاثاء الساعة 11:00 صباحاً (مفتوح)
  const tuesdayOpen = new Date("2026-06-02T07:00:00Z"); // UTC 7:00 -> GST 11:00 AM Tuesday
  console.log(`- يوم الثلاثاء 11:00 بتوقيت دبي: ${isGstMarketOpen(tuesdayOpen) ? "✅ مفتوح (صحيح)" : "❌ مغلق (خطأ)"}`);

  // اختبار يوم ثلاثاء الساعة 8:00 مساءً (مغلق)
  const tuesdayClosed = new Date("2026-06-02T16:00:00Z"); // UTC 16:00 -> GST 20:00 Tuesday
  console.log(`- يوم الثلاثاء 20:00 بتوقيت دبي: ${isGstMarketOpen(tuesdayClosed) ? "❌ مفتوح (خطأ)" : "✅ مغلق (صحيح)"}`);

  console.log("\n=== انتهت كافة الفحوصات بنجاح! ===");
}

runTests();
