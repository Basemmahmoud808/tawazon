# Tawazon

توازن هو تطبيق عربي للروتين اليومي، تتبع العادات، الأذكار، والورد اليومي.

## النشر على tawazan.tech

المشروع مهيأ الآن لـ Firebase Hosting، وهذا هو المسار المناسب لربط الدومين المخصص `tawazan.tech`.

### المطلوب خارج الكود

1. إنشاء/اختيار مشروع Firebase.
2. إضافة الدومين المخصص من Firebase Hosting ثم إعداد سجلات DNS عند مزود الدومين.
3. إضافة أسرار GitHub Actions التالية:
  - `FIREBASE_SERVICE_ACCOUNT_TAWAZAN`
  - `FIREBASE_PROJECT_ID`

### النشر المحلي

```bash
npm ci
npm run build
```

### ملاحظات

- التطبيق يعمل كـ SPA، لذلك `firebase.json` مضبوط لإعادة التوجيه إلى `index.html`.
- عند إضافة `tawazan.tech` في Firebase Hosting، يمكن أيضًا تفعيل `www.tawazan.tech` وإعادة التوجيه إلى النطاق الأساسي.

## خطوات الإكمال السريعة

1. افتح Firebase Console وأنشئ أو اختر مشروعًا.
2. أضف موقع Hosting ثم اربط `tawazan.tech` و`www.tawazan.tech`.
3. أضف سجلات DNS التي يطلبها Firebase عند مزود الدومين.
4. أضف أسرار GitHub Actions المطلوبة ثم ادفع إلى `main`.

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
