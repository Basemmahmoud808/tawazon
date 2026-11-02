# Tawazon

توازن هو موقع عربي للروتين اليومي، تتبع العادات، الأذكار، والورد اليومي.

## النشر على tawazan.tech

المشروع ينشر الموقع تلقائيًا على GitHub Pages عند كل Push إلى فرع `main`، مع الحفاظ على الدومين المخصص `tawazan.tech`.

### المطلوب خارج الكود

1. من إعدادات GitHub افتح **Pages** واختر **GitHub Actions** كمصدر النشر.
2. اربط `tawazan.tech` و`www.tawazan.tech` من إعدادات النطاقات وسجلات DNS.
3. أضف أسرار إعداد Firebase التالية حتى يعمل تسجيل الدخول في النسخة المنشورة:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

> مفاتيح Firebase Web تستخدم داخل المتصفح لتشغيل تسجيل الدخول وقاعدة البيانات، بينما النشر نفسه يتم عبر GitHub Pages ولا يحتاج حساب خدمة Firebase.

### النشر المحلي

```bash
npm ci
npm run build
```

### ملاحظات

- الموقع يعمل كـ SPA، وملف `public/CNAME` يحافظ على الدومين المخصص أثناء النشر.
- عند استخدام مسارات داخلية مستقبلًا، يجب إضافة fallback مناسب لـ GitHub Pages.

## خطوات الإكمال السريعة

1. فعّل GitHub Pages باستخدام GitHub Actions.
2. اربط `tawazan.tech` و`www.tawazan.tech` وسجلات DNS.
3. أضف أسرار Firebase المطلوبة ثم ادفع إلى `main`.

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
