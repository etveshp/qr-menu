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

- **Тестова інфраструктура**: Vitest + Testing Library + jsdom, `vitest.config.ts`, `test/setup.ts`, скрипти `test` / `test:watch` / `test:coverage`.
- **95 тестів** (15 файлів): `cart`, `utils`, `translations`, `validation`, `errors`, `sound`, auth (`isUserAdmin`, `hasAdminAccess`), хуки (`useCart`, `useLanguage`, `useAuth`, `useMenuData`), компоненти (`Toast`, `LanguageSelector`, `CartDrawer`, `ScrollToTop`) та e2e щасливий шлях (Playwright).
- **Coverage-гейт**: lines/functions/statements ≥ 70%, branches ≥ 50%.
- **Хуки**: `useLanguage`, `useAuth`, `useMenuData`, `useCart` (персистентний кошик у localStorage).
- **SSR/ISR**: `app/page.tsx` — Server Component з `revalidate=30`, динамічне визначення URL через `headers()`.
- **API route** `GET /api/menu` (Firestore REST API, без service account).
- **Деплой**: `Dockerfile` (Next.js standalone, Node 22), `cloudbuild.yaml`, `.dockerignore`, Artifact Registry `aura-cafe-qr-menu`, Google Cloud Run.

### Changed

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

### Security

- Прибрано хардкод паролів (`ADMIN_MASTER_PASS`, passcode-бекдор `admin`/`Aura2026`), пароль більше не зберігається у Firestore/localStorage.
- `settings/security` закритий для всіх.
- Секрети винесено в `.env.local` (gitignored).

### Removed

- Dead code: `lib/store.ts`, `components/LanguageSwitcher.tsx`, `hooks/use-mobile.ts`, `registerWithEmail`, `playCartSound`, `playSuccessSound`, `@google/genai`, `bun.lock`.
- Кнопка «Відновити демо-дані» (`resetToDefaultData`).
- `.eslintrc.json` (legacy).
