# منصة الأسهم الإماراتية

تطبيق Next.js عربي باتجاه RTL لمتابعة أسهم سوق دبي وسوق أبوظبي. يعتمد المشروع على طبقة بيانات موحدة في:

```text
src/lib/data/unified-market-data.ts
```

هذه الطبقة تجمع الأسهم، التحليلات، القادة، وعدّادات التغطية، وتستخدمها صفحات المشروع وواجهة `/api/stocks`.

## التشغيل المحلي

```powershell
npm run dev -- --hostname 127.0.0.1 --port 3000
```

ثم افتح:

```text
http://127.0.0.1:3000
```

## الجودة والتحقق

```powershell
npm run validate:data
npm run lint
npm run build
```

أو تشغيلها دفعة واحدة:

```powershell
npm run quality
```

يتحقق `validate:data` من تغطية 20 سهمًا قياديًا في DFM و20 سهمًا قياديًا في ADX، ومن سلامة الحقول المالية، التواريخ، التاريخ السعري، التوزيعات، SWOT، ونواتج التحليلات.

## التحديث اليومي

ملف التحديث اليومي هو:

```text
src/data/generated/market-overrides.json
```

لتحديثه من مصدر JSON:

```powershell
$env:MARKET_DATA_SNAPSHOT_URL="https://example.com/market-snapshot.json"
npm run update:data
npm run validate:data
```

أو من ملف محلي:

```powershell
$env:MARKET_DATA_SNAPSHOT_FILE="C:\path\to\snapshot.json"
npm run update:data
```

يوجد GitHub Actions في:

```text
.github/workflows/daily-market-update.yml
```

للتشغيل اليومي، أضف secret باسم `MARKET_DATA_SNAPSHOT_URL` داخل إعدادات GitHub repository. سيقوم الـ workflow بتحديث البيانات، تشغيل التحقق، lint، build، ثم عمل commit فقط إذا تغيّر ملف البيانات.

## الصفحات

- `/` النظرة العامة.
- `/stocks` قائمة الأسهم والفلاتر.
- `/stocks/[symbol]` صفحة السهم.
- `/dividends` التوزيعات.
- `/analysts` النطاقات المستهدفة النموذجية.
- `/outlook` الاتجاه المتوقع.
- `/portfolio` المحفظة.
- `/calculator` حاسبة الأمان.
- `/compare` المقارنة.
- `/report` تقرير الطباعة.
- `/api/stocks` بيانات JSON موحدة.

## تنبيه

البيانات لأغراض المتابعة والتعليم فقط، وليست توصية شراء أو بيع. بعض الحقول التاريخية والنطاقات المستهدفة مشتقة داخليًا وموسومة ضمن مصادر السهم.
