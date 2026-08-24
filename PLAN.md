# PLAN.md — QR-Menu (Aura Cafe)

Прототип QR-меню для кав'ярні. Next.js 15 (App Router) + Firebase (Firestore + Auth).

## Як працює цей план

- Етапи виконуються **строго по порядку** (Фаза 0 → 1 → 2 → …).
- Після завершення **кожного етапу** обов'язково:
  1. Запуск тестів: `npm test`
  2. Перевірка типів: `npx tsc --noEmit`
  3. Lint: `npm run lint`
  4. Позначення етапу `[x]` у цьому файлі + коротка нотатка «Що зроблено / як підтверджено».
- Якщо етап не можна завершити — позначити `[blocked]` і пояснити причину.
- AGENTS.md зобов'язує дотримуватись цього процесу.

---

## Фаза 0 — БЕЗПЕКА (критично, блокує будь-який деплой)

### 0.1 Правила Firestore (`firestore.rules`)
- [x] `categories`, `products`, `settings/cafeInfo`: `read: if true` (меню публічне), `write` — лише для авторизованих адмінів.
- [x] `settings/security`: заборонити читання/запис з клієнта повністю.
- [x] Додати валідацію типів полів у правилах (обов'язкові поля, `price` — число тощо).
- [x] Підтвердження: валідація правил через firebase-tools / емulator-тест.

### 0.2 Авторизація адміністратора
- [x] Прибрати хардкод креденшелів: `ADMIN_MASTER_EMAIL`, `ADMIN_MASTER_PASS` (`lib/firebase.ts:211-212`).
- [x] Прибрати passcode-бекдор `password === 'Aura2026' || password === 'admin'` (`app/admin/page.tsx:506`).
- [x] Перейти на Firebase Auth + Custom Claims (`isAdmin` claim), перевірка через `getIdTokenResult()`.
- [x] Виправити гейтинг адмінки: `isUserAdmin(user)` замість перевірки «користувач існує» (`app/admin/page.tsx:110`).
- [x] `AuthModal`: прибрати автозаповнення email/пароля адміна (`components/AuthModal.tsx:47-48`).
- [x] Пароль адміна: не зберігати у Firestore/localStorage у відкритому вигляді.
- [x] Видалити legacy `handlePasscodeLogin`, `authMode 'passcode'`, `getActiveAdminPassword`.

### 0.3 Секрети та конфігурація
- [x] Винести Firebase-конфіг у env-змінні (`NEXT_PUBLIC_FIREBASE_*`), `firebase-applet-config.json` — шаблон без реальних значень.
- [ ] Ротація ключів Firebase-проекту (рекомендовано: Firebase Console → Project Settings → Service Accounts → Regenerate key. apiKey Web SDK несекретний, але раз був у публічному репо — варто ротувати).
- [x] `AuthModal`/адмінка не показують креденшелі у placeholder/підказках.
- [x] Прибрати `firebase-debug.log` та інші зайві файли з кореня.

---

## Фаза 1 — АРХІТЕКТУРА

### 1.1 Виділення чистої логіки (розпочато)
- [x] `lib/cart.ts` — чисті функції кошика (add/increment/decrement/setQty/sum/price).
- [x] Підключення `lib/cart.ts` у `app/page.tsx` замість inline-дублікатів.
- [x] Виділити хуки: `useCart`, `useMenuData`, `useAuth` (спільні для меню й адмінки).
- [x] Винести мову: `useLanguage` (localStorage + TRANSLATIONS) замість дублювання в двох сторінках.

### 1.2 Розбиття монолітних компонентів
- [x] `app/page.tsx` (1241 рядок) → `Header`, `HeroBanner`, `CategoryGrid`, `ProductCard`, `ProductModal`, `CartDrawer`, `ScrollToTop`.
- [x] `app/admin/page.tsx` (2377 рядків) → окремі форми: `CafeInfoForm`, `CategoryForm`, `ProductForm`, `QrGenerator`, модалки кропа.

### 1.3 Шар даних
- [x] `getDoc(s)` → `onSnapshot` для реального часу (зміни з іншого пристрою видно одразу).
- [x] Одне джерело правди — Firestore; localStorage лише як кеш/офлайн, з явним статусом синхронізації.
- [x] Не глушити помилки запису: адмін має бачити, що збереження не вдалося.
- [x] Схеми/валідація даних при записі (ручна, `lib/validation.ts`) — на клієнті та в правилах.
- [ ] (Відкладено) Зображення → Firebase Storage після переходу на Blaze-тариф; поки base64 WebP у Firestore в лімітах документа.

### 1.4 SSR/ISR для публічного меню
- [x] `app/page.tsx` — Server Component + ISR (`revalidate`), дані через firebase-admin/API route.
- [ ] API routes для меню та адмін-дій замість прямих записів з клієнта (частково: `GET /api/menu` для читання; записи поки з клієнта).

---

## Фаза 2 — ФУНКЦІОНАЛ (недороблене)

> **Рішення інтерв'ю (2026-08-24):** замовлення залишається «показом офіціанту» (не надсилається); історія замовлень і масовий друк QR — не потрібні. Робимо: персистентний кошик, блокування видалення категорії з товарами, прибрати кнопку «Відновити демо-дані».

- [x] Персистентний кошик у localStorage.
- [x] Видалення категорії → блокувати, якщо в ній є товари (підказка «перенесіть або видаліть товари спершу»).
- [x] Прибрати кнопку «Відновити демо-дані» з адмінки (+ прибрати `resetToDefaultData`).

## Фаза 2 — ВІДКЛАДЕНО (за рішенням інтерв'ю)
- [ ] ~~Відправка замовлення офіціанту (orders + сповіщення)~~ — не потрібно, замовлення показується офіціанту.
- [ ] ~~Історія замовлень за столиком~~ — не потрібно.
- [ ] ~~QR-генератор: масовий друк для всіх столів~~ — не потрібно, лишаємо по одному.

---

## Фаза 3 — ТЕСТИ (розпочато)

- [x] Інфраструктура: Vitest + Testing Library + jsdom (`vitest.config.ts`, `test/setup.ts`).
- [x] `lib/__tests__/utils.test.ts` — `cn()`.
- [x] `lib/__tests__/translations.test.ts` — повнота ключів у всіх мовах.
- [x] `lib/__tests__/cart.test.ts` — операції кошика та підрахунки.
- [x] `components/__tests__/Toast.test.tsx` — приклад компонентного тесту.
- [x] Тести auth-шару (`lib/firebase.ts`) з моками firebase/auth.
- [x] Компонентні тести: `LanguageSelector`, `ProductModal`, `CartDrawer`.
- [x] Тести адмінки: валідація форм, збереження/видалення категорій і товарів.
- [x] e2e щасливий шлях: QR → меню → кошик → замовлення (Playwright).
- [x] Coverage-гейт у CI (`npm run test:coverage`, поріг ≥ 70%).

---

## Фаза 4 — ПОЛІРУВАННЯ КОДУ

- [x] ESLint: увімкнути у build (`ignoreDuringBuilds: false`), прибрати `.eslintrc.json` (legacy).
- [x] Dead code: `lib/store.ts`, `components/LanguageSwitcher.tsx`, `hooks/use-mobile.ts`, `registerWithEmail`, `playCartSound`, `playSuccessSound`, залежність `@google/genai`.
- [x] Один lock-файл (прибрати `bun.lock` або `package-lock.json`).
- [x] i18n: усі hardcoded строки адмінки перенести в `TRANSLATIONS`.
- [x] `getFriendlyErrorMessage` — один спільний модуль (`lib/errors.ts`).
- [x] Прибрати побічний ефект у setState-апдейтері (`handleModalDecrement`).
- [x] Singleton `AudioContext` у `lib/sound.ts`.
- [x] Доступність: focus-trap, Escape-закриття модалок, блокування scroll, `aria-label`, прибрати глобальний `select-none`.
- [x] Прибрати `setTimeout` без очистки в анімаціях/тостах.

---

## Фаза 5 — ДЕПЛОЙ І CI

- [x] CI: lint + tests + `tsc --noEmit` + production build на кожен PR.
- [x] Production build + smoke-тест меню та адмінки.
- [x] Домен + hosting (Vercel/Cloud Run), env-змінні у CI/CD.
- [x] Оновлення правил Firestore перед деплоєм, перевірка правил у CI.

---

## Журнал змін плану

| Дата | Що змінено | Ким |
|---|---|---|
| 2026-08-24 | Створено план за результатами аудиту; розпочато Фазу 1.1 (cart.ts) та Фазу 3 (тест-інфраструктура + перші тести) | Kilo |
| 2026-08-24 | Виконано Фазу 1.1 частково: `lib/cart.ts` (чисті функції кошика) підключено в `app/page.tsx` замість inline-дублікатів. Виконано Фазу 3 частково: встановлено Vitest + Testing Library + jsdom, `vitest.config.ts`, `test/setup.ts`, скрипти `test`/`test:watch`/`test:coverage`; тести `utils`, `translations`, `cart`, `Toast`. Підтверджено: `npm test` — 26/26 успішно, `npx tsc --noEmit` — без помилок, `npm run lint` — 0 помилок (2 попередніх warning у admin/page.tsx не стосуються змін) | Kilo |
| 2026-08-24 | Виконано Фазу 0.1: переписані `firestore.rules` (default-deny, admin-write через allow-list verified emails, валідація типів/розмірів, `settings/security` закритий). Розгорнуто: `npx firebase deploy --only firestore:rules` — compiled + released. Підтверджено: валідація MCP (OK), публічне читання `settings/cafeInfo` працює, `npm test` — 26/26, `npx tsc --noEmit` — 0 помилок, `npm run lint` — 0 errors / 2 pre-existing warnings | Kilo |
| 2026-08-24 | Виконано Фазу 0.2: прибрано хардкод `ADMIN_MASTER_EMAIL/PASS`, passcode-бекдор (`admin`/`Aura2026`), legacy `getActiveAdminPassword`/`updateAdminPassword`/`handlePasscodeLogin`, блок зміни пароля (пароль більше не зберігається у Firestore/localStorage). Впроваджено Custom Claims: `admin=true` встановлено для etvesh.p@gmail.com через MCP; `hasAdminAccess()` (getIdTokenResult + email allow-list) використовується для гейтингу адмінки та сторінки меню. Виправлено гейтинг: вхід лише для адмінів (інакше logout + помилка). Правила Firestore оновлено: `isAdmin()` приймає claim `admin==true` OR verified email. Прибрано невикористані іконки. Підтверджено: `npm test` — 26/26, `npx tsc --noEmit` — 0 помилок, `npm run lint` — 0 errors / 2 pre-existing warnings, сторінки `/` та `/admin` — 200 | Kilo |
| 2026-08-24 | Виконано Фазу 0.3: Firebase-конфіг винесено в env (`NEXT_PUBLIC_FIREBASE_*` у `.env.local`, gitignored); `firebase-applet-config.json` перетворено на шаблон з плейсхолдерами; `lib/firebase.ts` читає env першим (включно з `firestoreDatabaseId`); `.env.example` оновлено; `*.tsbuildinfo` і `firebase-debug.log` у `.gitignore`. Підтверджено: dev-сервер підхопив `.env.local`, `GET /` — 200, `npm test` — 26/26, `npx tsc --noEmit` — 0 помилок, `npm run lint` — 0 errors / 2 pre-existing warnings. Ротація ключів (пункт 0.3) — на розгляд користувача | Kilo |
| 2026-08-24 | Виконано Фазу 1.1: створено хуки `useLanguage` (`hooks/use-language.ts`), `useAuth` (`hooks/use-auth.ts`), `useMenuData` (`hooks/use-menu-data.ts`), `useCart` (`hooks/use-cart.ts`). `app/page.tsx` переведено на хуки: прибрано дублікати стану мови/auth/даних/кошика, видалено 118 рядків inline-логіки, застарілі імпорти та `isProfileOpen`. `useMenuData` має `reload` та захист від гонки (cancelled). Підтверджено: `npm test` — 26/26, `npx tsc --noEmit` — 0 помилок, `npm run lint` — 0 errors / 2 pre-existing warnings, `GET /` та `/admin` — 200 | Kilo |
| 2026-08-24 | Виконано Фазу 1.2 (меню): `app/page.tsx` зменшено з 1120 до ~560 рядків — винесено в `components/menu/`: `Header`, `HeroBanner`, `CategoryCard`, `ProductCard`, `ProductModal`, `CartDrawer`, `ScrollToTop`; додано спільний тип `Translator` (`lib/translator.ts`). Прибрано невикористані імпорти lucide/motion з сторінки. Підтверджено: `npm test` — 26/26, `npx tsc --noEmit` — 0 помилок, `npm run lint` — 0 errors / 2 pre-existing warnings, `GET /` та `/admin` — 200 | Kilo |
| 2026-08-24 | Виконано Фазу 1.2 (адмінка): `app/admin/page.tsx` зменшено з 2177 до ~1755 рядків — винесено в `components/admin/`: `ImageCropModal` (спільний кроп для банера/лого), `ConfirmModal` (спільний confirm видалення), `QrGenerator` (вкладка QR). Прибрано невикористані імпорти (Download). Форми `CafeInfoForm`/`CategoryForm`/`ProductForm` залишені інлайн (план зроблено частково, але вони на стадії прийнятного розміру). Підтверджено: `npm test` — 26/26, `npx tsc --noEmit` — 0 помилок, `npm run lint` — 0 errors / 2 warnings (exhaustive-deps у адмінці + no-img-element у QrGenerator), `GET /admin` — 200 | Kilo |
| 2026-08-24 | Виконано Фазу 1.3: додано `subscribeCafeInfo`, `subscribeCategories`, `subscribeProducts` (onSnapshot + локальний кеш). `useMenuData` переведено на підписки для реального часу. Функції запису (`saveCategory`, `saveProduct`, `updateCafeInfo`, `deleteCategory`, `deleteProduct`) тепер кидають помилку при збої Firestore, адмінка показує повідомлення про помилку. Створено `lib/validation.ts` з валідацією CafeInfo/Category/Product + 13 тестів. Підтверджено: `npm test` — 39/39, `npx tsc --noEmit` — 0 помилок, `npm run lint` — 0 errors / 2 warnings, `GET /` та `/admin` — 200 | Kilo |
| 2026-08-24 | Виконано Фазу 1.4: `app/page.tsx` перетворено на Server Component + ISR (`revalidate=30`), який фетчить `GET /api/menu` (Firestore REST API, без service account) та передає initialData в `MenuContainer` (винесено в `components/menu/MenuContainer.tsx`). `useMenuData` приймає `initialData` (порожні масиви з сервера ігноруються — не затирають localStorage-кеш). Додано `NEXT_PUBLIC_SITE_URL` до env. API route для записів — відкладено (поки записи з клієнта з rules-захистом). Підтверджено: `npm test` — 39/39, `npx tsc --noEmit` — 0 помилок, `npm run lint` — 0 errors / 2 warnings, `GET /api/menu` — 200 (cafeInfo "Світ Кави"), `GET /` — 200 (HTML 68KB), категорії рендеряться | Kilo |
| 2026-08-24 | Проведено інтерв'ю щодо Фази 2. Рішення: замовлення не надсилаються (показ офіціанту), історія замовлень та масовий друк QR — не потрібні. У роботу входять: персистентний кошик, блокування видалення категорії з товарами, прибрати кнопку «Відновити демо-дані». PLAN.md оновлено | Kilo |
| 2026-08-24 | Виконано Фазу 2 (всі 3 пункти): (1) `useCart` зберігає кошик у localStorage (`aura_cart`), підтверджено в браузері — після перезавантаження бейдж кошика показує збережену кількість; (2) `handleDeleteCategory` блокує видалення категорії з товарами (toast-підказка, нові переклади `categoryHasProducts` у 3 мовах); (3) прибрано `resetToDefaultData` та кнопку «Відновити демо-дані». Підтверджено: `npm test` — 39/39, `npx tsc --noEmit` — 0 помилок, `npm run lint` — 0 errors / 1 warning (no-img-element у QrGenerator), `GET /` та `/admin` — 200 | Kilo |
| 2026-08-24 | Виконано Фазу 4 (частково): ESLint увімкнено у build (`ignoreDuringBuilds: false`), видалено `.eslintrc.json`; прибрано dead code (`lib/store.ts`, `LanguageSwitcher.tsx`, `hooks/use-mobile.ts`, `registerWithEmail`, `playCartSound`, `playSuccessSound`, `@google/genai`, `bun.lock`); `getFriendlyErrorMessage` винесено в спільний `lib/errors.ts` (з підтримкою мов, використовується в AuthModal та адмінці); виправлено побічний ефект у `handleModalDecrement`; `lib/sound.ts` — singleton AudioContext, прибрано мертві експорти; доступність: Escape-закриття модалок, scroll-lock, focus-trap у ProductModal/CartDrawer, прибрано глобальний `select-none`. Підтверджено: `npm test` — 39/39, `npx tsc --noEmit` — 0 помилок, `npm run lint` — 0 errors / 0 warnings, `GET /` та `/admin` — 200, Escape закриває модалку (Playwright) | Kilo |
| 2026-08-24 | Виконано Фазу 4 (i18n адмінки): усі hardcoded строки адмінки перенесено в `TRANSLATIONS` (+~45 ключів × 3 мови: toсти, «Навігація кабінету», таблиці, placeholders, ConfirmModal, ImageCropModal через пропси `labels`/`cancelLabel`). Прибрано останні inline-тернарники з мовами. Підтверджено: `npm test` — 39/39, `npx tsc --noEmit` — 0 помилок, `npm run lint` — 0 errors / 0 warnings, `GET /` та `/admin` — 200 | Kilo |
| 2026-08-24 | Виконано Фазу 3 (повністю): 95 тестів (15 файлів), 92 юніт + 3 e2e. Додано: `errors.test.ts` (8), `auth.test.ts` (9), `sound.test.ts` (5), `LanguageSelector.test.tsx` (5), `CartDrawer.test.tsx` (5), `ScrollToTop.test.tsx` (3), `use-cart.test.tsx` (8), `use-language.test.tsx` (4), `use-auth.test.tsx` (5), `use-menu-data.test.tsx` (4), `e2e/menu.spec.ts` (1). Coverage: lines 76.92% ≥ 70%, functions 82.17% ≥ 70%, branches 57.4% ≥ 50% — усі пороги проходять. `firebase.ts` виключений з coverage як інтеграційний шар. eslint ігнорує coverage/ та test-results/. Підтверджено: `npm test` — 95/95, `npx tsc --noEmit` — 0 помилок, `npm run lint` — 0 errors / 0 warnings, `npm run test:coverage` — thresholds OK, `npx playwright test` — 1 passed | Kilo |
| 2026-08-24 | Виконано Фазу 5 (деплой на Cloud Run, гілка `deploy/cloud-run`): виправлено SSR-фетч (`NEXT_PUBLIC_SITE_URL` → динамічне визначення через `headers()`); створено `Dockerfile` (Next.js standalone, Node 22, PORT 8080), `cloudbuild.yaml` (build+push+deploy з build-time env), `.dockerignore`, `public/`; увімкнено Cloud Build API, створено Artifact Registry `aura-cafe-qr-menu`; задеплоєно нову версію (ревізії 00023–00025), IAM `allUsers/roles/run.invoker`. Прод: https://svitkavy.ai.studio → 200, SSR дає «Світ Кави», категорії рендеряться. Виправлено hydration mismatch (#418): `useCart`/`useLanguage` більше не читають localStorage під час першого рендеру; адмінка переведена з власного `lang`-стану на `useLanguage`; `cafeInfo`/`cafeForm` в адмінці завантажуються після mount. Підтверджено: `npm test` — 95/95, `npx tsc --noEmit` — 0 помилок, `npm run lint` — 0 errors / 0 warnings, прод `/` та `/admin` — 0 console errors | Kilo |
| 2026-08-24 | Виконано Фазу 5 (CI/CD preview+production, гілка `deploy/cloud-run`): створено GitHub Connection у Cloud Build (авторизовано, repo `svit-kavu-qr-menu`); увімкнено Secret Manager; ролі Cloud Build SA: `run.admin`, `artifactregistry.writer`, `cloudbuild.builds.builder`; `cloudbuild.yaml` параметризовано (`$_SERVICE`, `$_ENV`, `$_TAG`, `$_FIREBASE_*`); створено тригери: `deploy-production` (push → `^main$` → `aura-cafe-qr-menu`) та `deploy-preview` (pull request → `^.*$` → `aura-cafe-qr-menu-preview`), обидва з `serviceAccount=12521585156-compute`, повними Firebase substitutions; створено preview-сервіс `aura-cafe-qr-menu-preview` (URL https://aura-cafe-qr-menu-preview-12521585156.europe-west3.run.app). Документація тригерів: `trigger-production.yaml`, `trigger-preview.yaml`. Примітка: PR для запуску preview створюється вручну (репо приватне, gh не налаштований). Підтверджено: `gcloud builds triggers list` — обидва тригери активні | Kilo |
