# Firebase + tawazan.tech Setup

هذا الملف يلخص الخطوات الخارجية المطلوبة لإكمال النشر على الدومين المخصص.

## المطلوب مرة واحدة

1. افتح Firebase Console.
2. أنشئ مشروعًا جديدًا أو اختر المشروع الموجود.
3. فعّل Authentication وFirestore إذا لم يكونا مفعّلين.
4. من Hosting، أضف الدومين `tawazan.tech`.
5. أضف `www.tawazan.tech` إذا أردت ثم فعّل إعادة التوجيه إلى الدومين الأساسي.
6. انسخ سجلات DNS التي يعرضها Firebase وضعها عند مزود الدومين.

## GitHub Secrets

أضف الأسرار التالية إلى المستودع:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_TAWAZAN`

## ملاحظات مهمة

- التطبيق الحالي مصمم كـ SPA، لذلك أي مسار غير الجذر سيعود إلى `index.html`.
- بعد ربط الدومين، تحقق من أن `authDomain` في ملفات البيئة يشير إلى مشروع Firebase الصحيح.