# CHANGELOG

Усі помітні зміни в цьому проєкті фіксуються тут.
Формат — [Keep a Changelog](https://keepachangelog.com/uk/1.1.0/).
Версіонування — [SemVer](https://semver.org/lang/uk/).

## Як оновлювати

Після **кожної зміни або нової фічі** додавай запис у секцію поточної версії
(або створюй нову секцію `## [x.y.z] - РРРР-ММ-ДД`):

- **Added** — нова функціональність
- **Changed** — зміни в існуючому функціоналі / рефакторинг
- **Fixed** — виправлення багів
- **Security** — виправлення безпеки
- **Removed** — видалення функціоналу

---

## [0.1.0] - 2026-08-24

### Added

- **CI/CD (preview + production)**: GitHub Connection у Cloud Build, два тригери — `deploy-production` (push у `main` → прод-сервіс) і `deploy-preview` (pull request → preview-сервіс). Preview-сервіс: `aura-cafe-qr-menu-preview`.
- **Тестова інфраструктура**: Vitest + Testing Library + jsdom, `vitest.config.ts`, `test/setup.ts`, скрипти `test` / `test:watch` / `test:coverage`.
- **95 тестів** (15 файлів): `cart`, `utils`, `translations`, `validation`, `errors`, `sound`, auth (`isUserAdmin`, `hasAdminAccess`), хуки (`useCart`, `useLanguage`, `useAuth`, `useMenuData`), компоненти (`Toast`, `LanguageSelector`, `CartDrawer`, `ScrollToTop`) та e2e щасливий шлях (Playwright).
- **Coverage-гейт**: lines/functions/statements ≥ 70%, branches ≥ 50%.
- **Хуки**: `useLanguage`, `useAuth`, `useMenuData`, `useCart` (персистентний кошик у localStorage).
- **SSR/ISR**: `app/page.tsx` — Server Component з `revalidate=30`, динамічне визначення URL через `headers()`.
- **API route** `GET /api/menu` (Firestore REST API, без service account).
- **Деплой**: `Dockerfile` (Next.js standalone, Node 22), `cloudbuild.yaml`, `.dockerignore`, Artifact Registry `aura-cafe-qr-menu`, Google Cloud Run.

### Changed

- **Назва додатку**: «Aura Cafe / Aura Premium» замінено на **«Світ Кави QR Меню»** — metadata (`app/layout.tsx`), loading-екрани, QR-друк/ім'я файлу, `appName`/`welcome` у перекладах (uk/hu/en), AGENTS.md, PLAN.md, `supabase-schema.sql`. npm-пакет перейменовано `ai-studio-applet` → `svit-kavy-qr-menu`.
- **Supabase (Фаза 6.5)**: RLS-політики через `profiles` + Realtime publication застосовано до live-БД через Supabase CLI (`supabase db push`, міграції в `supabase/migrations/`). `supabase-schema.sql` синхронізовано (ідемпотентний Realtime).
- **Auth-помилки**: `lib/errors.ts` адаптовано під Supabase-коди (`invalid_credentials`, `email_not_confirmed`, `weak_password`, `over_email_send_rate_limit` тощо) — локалізовані повідомлення тепер коректно з'являються.
- **Google OAuth**: `loginWithGoogle` більше не повертає фейковий `User` (повертає `void`; сесія обробляється через `onAuthStateChange`).
- **Попап для не-адмінів**: замість тоста при спробі входу не-адміна (email/пароль на `/admin` і Google-вхід) показується анімований попап «Ще не адміністратор» з кнопкою «ОК» — на адмінці ОК перенаправляє в меню, на публічній сторінці закриває. Переклади uk/hu/en.
- **Вхід email/пароль**: розрізнено «невірний пароль» (пошта зареєстрована → тост «Невірний пароль» + посилання відновлення) і «пошта не зареєстрована» (→ попап «Ще не адміністратор») через серверну RPC `email_registered` (security definer, міграція).
- **Скидання пароля**: додано обробку recovery-посилання (`handleRecoveryToken`, PKCE `verifyOtp`) — після переходу з листа показується форма «Зміна пароля» (`updateUser`).
- **Безпека (Фаза 0)**:
  - Переписані `firestore.rules`: default-deny, `isAdmin()` (custom claim `admin` OR verified email allow-list), валідація типів/розмірів полів, `settings/security` повністю закритий.
  - Firebase-конфіг винесено в env (`NEXT_PUBLIC_FIREBASE_*`), `firebase-applet-config.json` — шаблон без реальних значень.
  - Адмін-гейтинг через `hasAdminAccess()` (custom claims), вхід лише для адмінів.
- **Архітектура (Фаза 1)**:
  - `app/page.tsx` (1120 рядків) розбито на `components/menu/`: `Header`, `HeroBanner`, `CategoryCard`, `ProductCard`, `ProductModal`, `CartDrawer`, `ScrollToTop`, `MenuContainer`.
  - `app/admin/page.tsx` (2177 рядків) зменшено: `components/admin/` — `ImageCropModal`, `ConfirmModal`, `QrGenerator`.
  - `lib/cart.ts` — чисті функції кошика; `lib/validation.ts` — валідація; `lib/errors.ts` — спільний `getFriendlyErrorMessage` (ук/ху/ен).
  - Дані в реальному часі через `onSnapshot` (`subscribeCafeInfo/Categories/Products`); помилки запису більше не глушаться.
- **Функціонал (Фаза 2)**: персистентний кошик; блокування видалення категорії з товарами.
- **Полірування (Фаза 4)**: ESLint увімкнено у build, видалено dead code та `@google/genai`, i18n адмінки (~45 ключів × 3 мови), singleton `AudioContext`, доступність (Escape-закриття, scroll-lock, focus-trap).
- **Hydration fix**: `useCart`/`useLanguage` не читають localStorage під час першого рендеру; адмінка використовує `useLanguage`; `cafeInfo`/`cafeForm` завантажуються після mount.

### Fixed

- Зникнення карток категорій: `subscribeCategories`/`subscribeProducts` не перезаписують кеш порожнім масивом з Firestore; `getLocalArray` повертає дефолт при порожньому кеші.
- Hydration mismatch (React error #418) на `/` та `/admin`.
- ESLint: 0 errors / 0 warnings.
- Recursive RLS (`54001 stack depth limit exceeded`): `is_admin_true()` → `SECURITY DEFINER`. Після фіксу анонімний запис коректно блокується RLS (401/42501), без помилки стеку.
- Після входу через Google адмін тепер потрапляє в свій кабінет: `loginWithGoogle` встановлює прапорець (`PENDING_ADMIN_REDIRECT_KEY`), і меню-сторінка після повернення з OAuth перенаправляє адміна на `/admin` (прапорець очищується одразу).
- Прибрано dead code: `AuthModal` (не використовувався), застарілі коментарі «Firestore», `firebasestorage.googleapis.com` з `next.config.ts`, `firebase-debug.log`.

### Security

- Прибрано хардкод паролів (`ADMIN_MASTER_PASS`, passcode-бекдор `admin`/`Aura2026`), пароль більше не зберігається у Firestore/localStorage.
- **Не-адміни більше не можуть авторизуватись**: після Google-входу (або будь-якої іншої спроби) не-адміністративний користувач негайно розлогінюється (`logoutUser`). Сесія не зберігається — меню доступне без авторизації. Перевірка додана в `useAuth` (публічна сторінка) та в `subscribeToAuth` адмінки.
- `settings/security` закритий для всіх.
- Секрети винесено в `.env.local` (gitignored).

### Removed

- Dead code: `lib/store.ts`, `components/LanguageSwitcher.tsx`, `hooks/use-mobile.ts`, `registerWithEmail`, `playCartSound`, `playSuccessSound`, `@google/genai`, `bun.lock`.
- Кнопка «Відновити демо-дані» (`resetToDefaultData`).
- `.eslintrc.json` (legacy).
