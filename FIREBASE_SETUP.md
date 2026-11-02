# Firebase Authentication + tawazan.tech Setup

هذا الملف يلخص إعداد Firebase Authentication وFirestore وربط الدومين بالموقع المنشور على GitHub Pages.

## المطلوب مرة واحدة

1. افتح Firebase Console.
2. أنشئ مشروعًا جديدًا أو اختر المشروع الموجود.
3. فعّل Authentication وFirestore إذا لم يكونا مفعّلين.
4. من إعدادات GitHub Pages اربط الدومين `tawazan.tech` بالمستودع.
5. أضف `www.tawazan.tech` إذا أردت ثم فعّل إعادة التوجيه إلى الدومين الأساسي.
6. انسخ سجلات DNS التي يعرضها GitHub Pages وضعها عند مزود الدومين.

## GitHub Secrets

أضف أسرار Firebase Web التالية إلى المستودع حتى يعمل تسجيل الدخول في النسخة المنشورة:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## ملاحظات مهمة

- الموقع الحالي مصمم كـ SPA، لذلك أي مسار غير الجذر سيعود إلى `index.html`.
- بعد ربط الدومين، تحقق من أن `authDomain` في ملفات البيئة يشير إلى مشروع Firebase الصحيح.