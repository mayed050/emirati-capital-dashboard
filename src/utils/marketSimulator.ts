/**
 * دالة للتحقق مما إذا كانت أوقات التداول الرسمية في الإمارات (GST - UTC+4) مفتوحة حالياً.
 * ساعات تداول أسواق DFM و ADX: من الاثنين إلى الجمعة، 10:00 صباحاً حتى 3:00 مساءً بتوقيت دبي.
 */
export function isGstMarketOpen(dateOverride?: Date): boolean {
  // استخدام التاريخ الحالي أو التاريخ الممرر للاختبار
  const now = dateOverride || new Date();
  
  // تحويل التوقيت الحالي لتوقيت دبي (GST / UTC+4)
  const gstString = now.toLocaleString("en-US", { timeZone: "Asia/Dubai" });
  const gstDate = new Date(gstString);
  
  const day = gstDate.getDay(); // 0: Sunday, 1: Monday, ..., 5: Friday, 6: Saturday
  const hour = gstDate.getHours();
  const minutes = gstDate.getMinutes();

  // الأسواق الإماراتية مغلقة يومي السبت والأحد (6 و 0)
  if (day === 0 || day === 6) {
    return false;
  }

  // التداول الرسمي يبدأ من 10:00 صباحاً وينتهي في 3:00 مساءً (15:00)
  const timeInMinutes = hour * 60 + minutes;
  const startInMinutes = 10 * 60; // 10:00 AM
  const endInMinutes = 15 * 60;   // 3:00 PM

  return timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes;
}
