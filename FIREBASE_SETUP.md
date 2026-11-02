# Firebase Authentication + tawazan.tech Setup

هذا الملف يلخص إعداد Firebase Authentication وFirestore وربط الدومين بالموقع المنشور على GitHub Pages.

## المطلوب مرة واحدة

1. افتح Firebase Console.
2. أنشئ مشروعًا جديدًا أو اختر المشروع الموجود.
3. فعّل Authentication وFirestore إذا لم يكونا مفعّلين.
4. من إعدادات GitHub Pages اربط الدومين `tawazan.tech` بالمستودع.
5. أضف `www.tawazan.tech` إذا أردت ثم فعّل إعادة التوجيه إلى الدومين الأساسي.
6. انسخ سجلات DNS التي يعرضها GitHub Pages وضعها عند مزود الدومين.

## إعداد Firebase في الموقع

إعدادات Firebase Web الخاصة بمشروع `tawazan-1ec87` موجودة في
`src/firebase.ts`. هذه القيم عامة بطبيعتها لتطبيقات Firebase Web، لذلك لا
يعتمد النشر على GitHub Secrets. لا تضع كلمات مرور أو مفاتيح خدمة Firebase في
ملفات الموقع.

## ملاحظات مهمة

- الموقع الحالي مصمم كـ SPA، لذلك أي مسار غير الجذر سيعود إلى `index.html`.
- بعد ربط الدومين، تحقق من أن `authDomain` في `src/firebase.ts` يشير إلى مشروع Firebase الصحيح.