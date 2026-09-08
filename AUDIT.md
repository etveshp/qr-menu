# AUDIT.md — Аудит проєкту «Світ Кави QR Меню» (Supabase + Vercel)

**Дата:** 2026-09-08
**Тип:** аудит чистоти коду (мертвий код, дублювання, сміття) + аудит безпеки веб-додатку.

---

## 0. Методологія та статус автоперевірок

| Перевірка | Результат |
|---|---|
| `npx tsc --noEmit` | ✅ 0 помилок |
| `npm run lint` | ✅ 0 попереджень |
| `npm audit` (prod + dev) | ✅ 0 вразливостей |
| `npm test` (Vitest) | ✅ 167/167 тестів, 22 файли |
| `.env.local` у git | ✅ ігнорується (`.gitignore:6`), секретів у репозиторії немає |
| CI | ✅ `.github/workflows/ci.yml` — tests + typecheck + lint + build на PR/push |

Загальна оцінка: **проект у хорошій формі для прототипу** — strict TypeScript, чисті тести й lint, коректний RLS, нуль вразливостей у залежностях. Головні проблеми — **відсутні HTTP security headers, гігієна git-артефактів і серйозне дублювання в монолітному `admin/page.tsx`**.

---

## 1. Безпека (пріоритет №1)

### 1.1. Що зроблено добре ✅
- **RLS на всіх 7 таблицях** (`cafe_info`, `categories`, `products`, `advertising`, `text_banner`, `profiles`, `qr_codes`). Анонім має read-only доступ лише до публічного контенту меню; запис повсюдно admin-only. `USING (true)` зустрічається тільки в SELECT-політиках.
- `is_admin_true()` — SECURITY DEFINER з `set search_path = public`, рекурсія RLS виправлена міграцією. `delete_saved_qr()` — еталонна (внутрішня перевірка адміна + revoke від public). `handle_new_user()` створює профіль з `is_admin=false` — підвищення привілеїв через реєстрацію неможливе.
- Storage bucket `menu-photos`: public-читання задумано, але `file_size_limit = 5MB`, `allowed_mime_types` обмежені, запис — admin-only.
- `/api/revalidate` — коректна схема: Bearer token → `getUser` → перевірка `profiles.is_admin` через RLS → `revalidateTag`.
- Валідації вхідних даних (`lib/validation.ts`) — обмеження довжин, цін, MIME data-URI (`lib/photo-storage.ts:32`).
- Client-side перевірки адміна (`isUserAdmin`) — лише UI-зручність; реальний захист на RLS. Це правильно.

### 1.2. Знахідки

| # | Критичність | Знахідка | Рекомендація |
|---|---|---|---|
| S1 | **HIGH** | **Немає security headers.** `next.config.ts` не містить `headers()`, `middleware.ts` відсутній. Немає CSP, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` → сайт можна вбудовувати в iframe (clickjacking), немає захисту від ін'єкції сторонніх скриптів. (HSTS/nosniff Vercel додає сам.) | Додати в `next.config.ts` `headers()`: як мінімум `X-Frame-Options: DENY` (або CSP `frame-ancestors 'none'`), `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. |
| S2 | **MEDIUM** | `email_registered()` RPC (міграція `20260827170000`) — SECURITY DEFINER, доступний **anon** → відкритий oracle перебору email без rate-limit. | `revoke execute from anon`, лишити `authenticated`; або не розрізняти «email не знайдено» у відповіді. |
| S3 | **MEDIUM** | `supabase-schema.sql:153` — політика `profiles read: own` використовує `is_admin_true()` **до** її створення (ряд. 162). Чистий прогін схеми з нуля впаде; працює лише через порядок міграцій. | Перенести `CREATE FUNCTION is_admin_true()` на початок RLS-секції. |
| S4 | MEDIUM | `/api/translate` — відкритий проксі до Google Translate без rate-limit (SSRF немає — хост фіксований, текст обрізано до 5000 символів). | Простий rate-limit по IP або ліміт розміру тіла. |
| S5 | LOW | Write-політики через `auth.uid() in (select ...)` замість `is_admin_true()` — працює, але крихкіше; уніфікувати. | Див. S3 — один патерн скрізь. |
| S6 | LOW | `next.config.ts:23-40` — широкий `remotePatterns`: `**.supabase.co`, `*.googleusercontent.com`, plus `picsum.photos`/`unsplash` (плейсхолдери). | Звузити до `<PROJECT-REF>.supabase.co`; плейсхолдери прибрати. |
| S7 | LOW | `ADMIN_EMAILS` хардкод у `lib/supabase.ts:187` — email адміна потрапляє в публічний JS-бандл (разом з рештою `lib/supabase.ts`). | Прибрати з клієнтського бандла: перевірка email дублюється на БД; або хоча б винести в env. |
| S8 | LOW | `is_admin_true()` без `REVOKE EXECUTE FROM anon` (за принципом найменших привілеїв). | `revoke execute ... from anon, public; grant execute ... to authenticated`. |

---

## 2. Сміття та мертвий код

| # | Критичність | Знахідка |
|---|---|---|
| G1 | MEDIUM | **`supabase/.temp/` закомічено в git** (9 файлів CLI-артефактів: `project-ref`, `pooler-url` тощо). Це службова тека Supabase CLI — її треба в `.gitignore` і `git rm -r --cached`. |
| G2 | MEDIUM | **`@hookform/resolvers` у dependencies — мертвий пакет**: `react-hook-form` відсутній у package.json, у коді жодного імпорту немає. Видалити. |
| G3 | MEDIUM | **`lib/utils.ts` — повністю мертвий модуль**: єдиний експорт `cn` ніде не імпортується (крім власного тесту). Разом з ним мертві залежності `clsx` і `tailwind-merge`. |
| G4 | LOW | Локальне сміття на диску (в git не потрапляє, але засмічує робочу теку): `firebase-debug.log`, `tsconfig.tsbuildinfo`, `coverage/`, `.next/`. `.gitignore` покриває все — можна просто видалити. |
| G5 | LOW | **`.freebuff/` закомічено** — артефакти агент-інструменту (`run.md`, `project-id`). Винести з git. |
| G6 | LOW | Мертві експорти в lib: `incrementCartItem` (`lib/cart.ts:13`), `useSupabase` (`lib/supabase.ts:103`), `ADMIN_EMAILS` (використовується лише всередині файлу), `dataUriToBase64` + `storagePathFromPublicUrl` (`lib/photo-storage.ts:41,51`), `triggerAddToCartHaptic`/`playAddToCartChime` (`lib/sound.ts:20,45`). |
| G7 | LOW | **Firebase-спадок у `lib/errors.ts:4-35`**: обробка кодів `auth/invalid-email`, `auth/user-not-found` тощо — на Supabase ніколи не спрацюють (сам коментар визнає «legacy»). |
| G8 | LOW | `app/admin/page.tsx`: невикористані імпорти `useMemo` (ряд. 3) і `TRANSLATIONS` (ряд. 51); мертвий стан `loading` (ряд. 377 — встановлюється, ніде не читається; два statement на одному рядку). |
| G9 | LOW | Дефолтні `export default` поруч з іменованими в `ActionCard`, `RecommendedProductsPicker`, `LanguageSelector` — ніхто не використовує. |

**Позитив:** `console.log` у прод-коді немає (лише виправдані `console.error` і 2 логи в one-time скрипті), TODO/FIXME/закоментованих блоків не знайдено.

---

## 3. Дублювання (найбільша зона проблем)

| # | Критичність | Знахідка |
|---|---|---|
| D1 | **HIGH** | **`app/admin/page.tsx` — моноліт 4114 рядків** (~40 useState, 5 форм, 5 crop-флоу, QR, auth). Це корінь дублювань D2–D5. |
| D2 | **HIGH** | 5 копій crop-станів + ~20 хендлерів (`banner/logo/category/ad/product`, ряд. 660–870) — ~200 рядків копіпасту → один хук `useImageCrop(aspect)`. |
| D3 | **HIGH** | 7–9 копій «save-кнопки» з idle/saving/saved-анімацією → компонент `<SaveButton status>`. |
| D4 | **HIGH** | **QR-download продубльований повністю**: `admin/page.tsx:157-258` (SavedQrDownload) vs `QrGenerator.tsx:24-91` — `downloadPngHi`, `downloadSvg`, `menuPos`, навіть `triggerDownload` написаний двічі (144–153 vs 46–55). |
| D5 | **HIGH** | **Мапери Supabase-рядків написані вдруге** в `app/api/menu/route.ts:29-82` замість перевикористання `mapCafeInfo/mapCategory/mapProduct` з `lib/supabase.ts`. **Вже розходяться**: API втрачає `bannerOriginal/logoOriginal/photoOriginal/photoScale` — при додаванні поля легко забути один з двох маперів. |
| D6 | HIGH | **Focus-trap × 3 копії**: `CartDrawer.tsx:39-58`, `ProductModal.tsx:167-186`, `AdminDrawer.tsx:35-63` → хук `useFocusTrap(ref, active)`. |
| D7 | MEDIUM | Drag-to-scroll × 2 (`MenuContainer.tsx:174-199` vs `admin/page.tsx:561-586`) — ідентична логіка з магічними константами. |
| D8 | MEDIUM | Badge-радіогрупа: компонент `BadgeRadioGroup` (admin/page.tsx:122-142) створено як «shared», але продуктовий drawer (ряд. 3360-3388) реалізує ту саму розмітку інлайном. |
| D9 | MEDIUM | Авторизація: `hooks/use-auth.ts:23-44` та `admin/page.tsx:320-364` — дві паралельні реалізації одного потоку (subscribe → hasAdminAccess → localStorage `aura_admin_auth` → logout не-адміна). Ключі розкидані по 3 файлах. |
| D10 | LOW | `use-cart.ts:51-61` — `addItem` та `incrementItem` з ідентичним тілом; `itemsCount` (ряд. 76) дублює `getCartItemsCount`, імпортований, але не викликаний. |
| D11 | LOW | Продубльований блок «add to cart + toast» у `ProductModal` для desktop (335-397) і mobile (531-593) розкладок (~60 рядків). |

---

## 4. Реакт-проблеми та баги

| # | Критичність | Знахідка |
|---|---|---|
| R1 | **HIGH** | `ProductModal.tsx:188` — `if (!product) return null;` стоїть **до** `AnimatePresence`: при закритті компонент синхронно розмонтовується, всі exit-анімації модалки мертві. |
| R2 | MEDIUM | `setState` після unmount: усі `setTimeout(..., 2200)` для save-статусів у admin (1327…1489) і таймери в `MenuContainer.tsx:275-296` — без cleanup. |
| R3 | MEDIUM | `MenuContainer.tsx:119-141` — `getBoundingClientRect` на кожен scroll-евент без rAF/throttle → ре-рендери всього MenuContainer під час скролу. |
| R4 | MEDIUM | 20× явний `any` у прод-коді: 5× `onCropComplete (: any, : any)` (react-easy-crop експортує тип `Area`), 15× `catch (err: any)` (тут варто типізувати через `lib/errors.ts`), `getLocal/setLocal: any`, 3× `payload.new as any`. |
| R5 | MEDIUM | `admin/page.tsx:924-928` — `setTimeout(() => fetchData(), 0)` з eslint-disable, без cleanup і без пояснення. |
| R6 | LOW | Асинхронний `hasAdminAccess` у колбеці підписки `use-auth.ts` без прапорця `cancelled`. |
| R7 | LOW | `ProductModal.tsx:209-217` — список інгредієнтів `key={idx}` при динамічному масиві (залежить від мови). |
| R8 | LOW | Неузгодженість оверлеїв: `ConfirmModal`/`ImageCropModal` без Escape/scroll-lock, на відміну від `AdminDrawer`/`CartDrawer`. |
| R9 | LOW | Легасі-типізація `t` інлайном у `HeroBanner`/`RecommendedProductsPicker`/`use-language` замість `Translator`; конверсія `'ua'→'uk'` у `LanguageSelector` ніким не використовується. |

---

## 5. Інфраструктура та залежності

| # | Критичність | Знахідка |
|---|---|---|
| I1 | MEDIUM | Залежності не в тих секціях: `@types/qrcode`, `autoprefixer`, `postcss` — у `dependencies` замість `devDependencies`. З Tailwind v4 autoprefixer, ймовірно, взагалі зайвий (вбудований). |
| I2 | MEDIUM | `vitest.config.ts:15-33` — з покриття виключено майже всі UI-компоненти й `app/**`; пороги 70% застосовуються до вузького набору. Реальне покриття системно занижене. |
| I3 | LOW | `package.json:56-59` — `optionalDependencies` з Windows-бінарниками (workaround для локальної інсталяції) — прибрати після стабілізації lockfile. |
| I4 | OK | CI (`ci.yml`): test + typecheck + lint + build на push/PR до main — безпечна конфігурація (немає `pull_request_target`, секретів у workflows немає). |
| I5 | OK | `scripts/backfill-photos.mjs` — секрети лише через env, ідемпотентний; не запускати в CI. |
| I6 | OK | `vercel.json` — cron на `/api/menu` (публічний read-only прогрів кешу) — прийнятно. |
| I7 | OK | `tsconfig.json` strict; `ignoreBuildErrors: false`. |

---

## 6. Підсумкова таблиця

| Категорія | Critical | High | Medium | Low |
|---|---|---|---|---|
| Безпека | 0 | 1 (S1) | 3 | 4 |
| Мертвий код/сміття | 0 | 0 | 3 | 6 |
| Дублювання | 0 | 5 | 3 | 2 |
| React-баги | 0 | 1 (R1) | 4 | 4 |
| Інфраструктура | 0 | 0 | 2 | 2 |

---

## 7. Рекомендації (за пріоритетом)

**Негайно (безпека, ~30 хв):**
1. Додати security headers у `next.config.ts` (S1): `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, бажано CSP.
2. `revoke execute on email_registered from anon` (S2) + одна міграція з переносом `is_admin_true()` вгору схеми (S3).
3. Гігієна git: `.gitignore` → `supabase/.temp/`, `.freebuff/`; `git rm -r --cached` для них; видалити `firebase-debug.log`, `tsconfig.tsbuildinfo` з диска.

**Найближчий етап (якість):**
4. Прибрати мертві пакети й код: `@hookform/resolvers`, `clsx`+`tailwind-merge`+`lib/utils.ts`, Firebase-блок у `lib/errors.ts`, перелік G6/G8.
5. Виправити `ProductModal` (R1) — перенести early-return всередину анімованого дерева.
6. Усунути дублікати D4–D6 (QR-download, мапери, focus-trap) — найбільший виграш на рядок коду; мапери в `app/api/menu` перенаправити на мапери з `lib/supabase.ts`, щоб зникла розсинхронізація полів.
7. Розбити `admin/page.tsx` на tab-компоненти + хук `useImageCrop` + `<SaveButton>` — це усуне D2/D3/D8 і більшість `any`.

**Системно:**
8. Перенести `@types/qrcode`/`postcss` у devDependencies, вирішити долю `autoprefixer`.
9. Поступово зменшувати exclude-список у `vitest.config.ts`, щоб пороги покриття стали реальними.
10. Уніфікувати write-політики RLS на `is_admin_true()` та винести email адміна з клієнтського бандла (S5, S7).

---

*Аудит виконано лише на основі читання коду та автоматичних перевірок — жодних змін у код не внесено.*
