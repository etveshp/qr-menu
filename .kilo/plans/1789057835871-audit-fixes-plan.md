# План виправлень після аудиту (ключові)

Основа: звіт аудиту від 2026-09-10, стан `main` @ `d4698cd`.
Обсяг: стабільність, безпека, гігієна коду. Міграції БД і розбиття `app/admin/page.tsx` — **поза обсягом** (див. кінець).

## Загальні правила виконання

- Гілка: створити `fix/audit-followup` від `main`.
- Кроки виконуються **строго по порядку**. Наприкінці кожного кроку — однаковий ланцюг перевірок:
  1. `npm test`
  2. `npx tsc --noEmit`
  3. `npm run lint`
  4. `npm run build`
- **СТОП-ГЕЙТ.** Наступний крок не починати без підтвердження користувачем, що додаток працює стабільно.
- Після підтвердження кроку (за AGENTS.md): позначити пункт у `PLAN.md` (нова `Фаза 17 — Аудит: виправлення`), додати рядок у «Журнал змін плану», оновити `CHANGELOG.md`.
- Якщо перевірка падає — не переходити далі; виправити в межах того самого кроку.
- Новий код — без коментарів, TypeScript strict, палітра проєкту.

### Базовий стан (Крок 0 — фіксація)
Запустити `npm test` (очікується 191/191), `npx tsc --noEmit` (0), `npm run lint` (0 errors, 9 warnings), `npm run build` (успіх). Зафіксувати як baseline.

---

## Крок 1 — Error boundaries (P1, HIGH)

**Мета:** будь-який збій у клієнтському дереві не валить усю сторінку.

**Файли (нові):**
- `app/error.tsx` — `'use client'`, сигнатура `{ error: Error & { digest?: string }, reset: () => void }`. Рендер у палітрі (#FAF6EE/#3E2F26/#C09E6D): заголовок, короткий текст, кнопка «Спробувати знову» → `reset()`, посилання на `/`. Логування `console.error` один раз через `useEffect`.
- `app/global-error.tsx` — `'use client'`, власні `<html lang="uk"><body>` (замінює root layout), той самий стиль.
- `app/not-found.tsx` — брендований 404 + посилання «До меню» на `/`.

**Деталі:**
- Не використовувати `ToastProvider` у `global-error.tsx` (він поза layout).
- Не додавати нові ключі перекладів, якщо можна обійтись статичним текстом; якщо потрібна локалізація — читати `localStorage['aura_lang']` безпечно.

**Перевірки кроку:** стандартний ланцюг + ручне:
- Перейти на неіснуючий шлях (напр. `/no-such-page`) → кастомний 404, не дефолтний Next.
- Тимчасово кинути `throw new Error('test')` у клієнтському компоненті меню → показано `app/error.tsx`; `reset()` повертає робочий стан. **Після перевірки throw прибрати.**

**Відкат:** видалити 3 нові файли.

---

## Крок 2 — Прибрати `ADMIN_EMAILS` з клієнтського бандла (S1, MEDIUM)

**Мета:** жодного захардкодженого email у клієнті; єдине джерело істини — `profiles.is_admin`.

**Передумова (обов'язкова):** переконатися, що в live-БД `public.profiles` має `is_admin = true` для власника (`supabase-schema.sql:255`). Без цього власник втратить доступ після зміни.

**Файли:**
- `lib/supabase.ts`: видалити `ADMIN_EMAILS` і `isUserAdmin`; `hasAdminAccess` лишити лише перевірку `profiles.is_admin` (без короткого замикання).
- `app/admin/page.tsx:1821`: замість `isUserAdmin(currentUser)` показувати `t('roleAdmin')`, коли `isAuthenticated === true` (або з відомого стану адміна).
- `lib/__tests__/auth.test.ts`: видалити блок `describe('isUserAdmin')`, оновити імпорти.

**Перевірки кроку:** стандартний ланцюг + ручне:
- `Get-ChildItem -Recurse -Path .next -File | Select-String -Pattern "svitkavyvisk"` → **порожньо** (перевіряти після `npm run build`).
- Вхід через Google адміном → кабінет відкривається, роль показується; не-адмін → викидається в меню.
- Перевірити, що запис даних у кабінеті працює (RLS не порушено).

**Відкат:** повернути `ADMIN_EMAILS`/`isUserAdmin`.

---

## Крок 3 — Realtime: уніфікувати unique topic (R3, LOW)

**Мета:** усі канали мають унікальний topic, як `advertising`/`text_banner`, щоб повторна підписка не повертала вже підписаний канал.

**Файли:** `lib/supabase.ts`
- `subscribeCafeInfo` (має фіксований `channel('cafe_info')`), `subscribeCategories` (`channel('categories')`), `subscribeProducts` (`channel('products')`).
- Для кожного додати локальний лічильник (`let cafeSubId = 0;` тощо) і topic `cafe-info-${cafeSubId++}` / `categories-${...}` / `products-${...}`; логіку `.on(...).subscribe()` і cleanup не змінювати.

**Перевірки кроку:** стандартний ланцюг + ручне (dev, `reactStrictMode: true`):
- Відкрити меню у `npm run dev` → у консолі немає помилок типу "tried to subscribe multiple times"/`.on()` after subscribe.
- Зміна категорії/товару в адмінці → меню оновлюється через realtime (сторінка меню відкрита).
- Перезавантаження меню не дублює канали.

**Відкат:** повернути фіксовані topic-и.

---

## Крок 4 — rAF-throttle скролу (R1, MEDIUM)

**Мета:** обробник скролу не робить `getBoundingClientRect()`+`setState` на кожен евент.

**Файли:** `components/menu/MenuContainer.tsx:122-144`
- Обгорнути тіло `updateHeaderHeight` у `requestAnimationFrame` з прапорцем `ticking`.
- Перед `setState` порівнювати з попереднім значенням (`headerHeight`, `cartButtonRect`) і не оновлювати, якщо не змінилось.
- `resize` лишити (спрацьовує рідко), `scroll` — через rAF; зберегти `passive: true` де доречно.
- Cleanup effect зберегти.

**Перевірки кроку:** стандартний ланцюг + ручне:
- Скрол меню (мобільний 390px + десктоп): висота хедера, позиція кнопки кошика, кнопка «Нагору» працюють коректно.
- Відкрита картка товару: title-float/анімації не ламаються.
- DevTools Performance: немає `setState` на кожен евент (кількість re-render зменшується).

**Відкат:** повернути прямий обробник.

---

## Крок 5 — Мертвий код + примусове виявлення (G1, G2 част., G3)

**Мета:** прибрати реально мертвий код і зробити так, щоб він більше не з'являвся.

**Файли та зміни:**
1. `components/admin/SaveButton.tsx` + імпорт `app/admin/page.tsx:86` — **видалити** (компонент не використовується жодного разу).
2. `lib/cart.ts:39` — видалити `incrementCartItem`; оновити `lib/__tests__/cart.test.ts` (прибрати describe-блок і імпорт).
3. `lib/photo-storage.ts:41,51` — видалити `dataUriToBase64` і `storagePathFromPublicUrl` (живуть лише в тестах); оновити `lib/__tests__/photo-storage.test.ts` (прибрати відповідні кейси, зберегти покриття `objectPublicUrl`).
4. `lib/sound.ts:20` — прибрати `export` у `triggerAddToCartHaptic` (виклик всередині файлу лишити); оновити `lib/__tests__/sound.test.ts` (тестувати через публічну `playAddToCartChime` або прибрати прямий імпорт).
5. `lib/errors.ts:56-76` — видалити Firebase-легасі коди (`auth/invalid-credential`, `auth/popup-closed-by-user`, `auth/cancelled-popup-request`, `auth/too-many-requests`), лишити Supabase-коди + `permission-denied`/`unavailable`.

6. **Примусове виявлення (корінь проблеми):**
   - `eslint.config.mjs`: додати правило `@typescript-eslint/no-unused-vars` (error) з `argsIgnorePattern`/`varsIgnorePattern: '^_'` за потреби.
   - `tsconfig.json`: додати `"noUnusedLocals": true`, `"noUnusedParameters": true`.
   - Запустити `npx tsc --noEmit` і `npm run lint` → виправити **все**, що виявиться (окремі невикористані змінні/імпорти).

**Перевірки кроку:** стандартний ланцюг. Кількість тестів може зменшитись (видалені test-only кейси) — зафіксувати нове число.

**Відкат:** повернути файли/правила.

---

## Крок 6 — Cleanup таймерів (R2, MEDIUM)

**Мета:** прибрати `setState` після unmount і «висячі» таймери.

**Файли:**
- `components/menu/MenuContainer.tsx` — голі `setTimeout` у `handleAddModalToCart`/`handleAddToCart`/`handleIncrementCart` (`setBouncingCart`, `setIsJustAdded`, `setFloaters`, рядки ~296-326), а також `setTimeout` ~188. Зібрати id у `useRef<number[]>` і чистити в `useEffect` return (або локальний хук `useSafeTimeouts`).
- `app/admin/page.tsx` — 9 `setTimeout` для save-статусів (рядки 1105, 1134, 1152, 1226, 1278, 1327, 1448 та ін.): зберегти id у ref, чистити при unmount. Не змінювати логіку статусів.

**Перевірки кроку:** стандартний ланцюг + ручне:
- Швидко додати товар/змінити кількість, одразу піти зі сторінки → у консолі немає «Can't perform a React state update on an unmounted component».
- Save-статуси кнопок в адмінці працюють як раніше.

**Відкат:** повернути голі `setTimeout`.

---

## Крок 7 — Чесне покриття тестами (P2, MEDIUM)

**Мета:** метрика покриття відображає реальність, а критична логіка меню вкрита.

**Порядок (важливо — спершу тести, потім зміна config, щоб не зламати CI):**
1. Додати фокусні тести на критичні шляхи:
   - `MenuContainer`: фолбек мови, коли збережена мова вимкнена; формування ключа рядка кошика з модифікаторами; сідинг `textBanner`/`advertising` із SSR.
   - `ProductModal`: блокування додавання при незаповнених обов'язкових групах; підсумкова ціна з доплатами.
2. Лише після цього прибрати `components/menu/MenuContainer.tsx` і `components/menu/ProductModal.tsx` з `coverage.exclude` (`vitest.config.ts:18-19`).
3. Прогнати `npm run test:coverage`. Якщо пороги не досягаються — або додати тести, або явно й обґрунтовано знизити пороги в `vitest.config.ts` (без повернення файлів в exclude).

**Перевірки кроку:** `npm run test:coverage` (пороги пройдено), `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.

**Відкат:** повернути exclude-рядки.

---

## Крок 8 — Фінальна верифікація та документація

**Дії:**
- Повний ланцюг: `npm test`, `npx tsc --noEmit`, `npm run lint` (очікується 0 warnings), `npm run build`.
- За наявності dev-сервера: `npm run test:e2e`.
- Ручний smoke: меню (SSR + realtime), кошик з модифікаторами, фотобанер, текстовий банер, адмін-вхід Google + збереження, 404 та error boundary.
- Оновити `PLAN.md` (Фаза 17 — усі пункти + журнал), `CHANGELOG.md` (Added/Changed/Fixed/Security/Removed), `AUDIT.md` (позначити закриті знахідки S1/P1/P2/R1/R2/R3/G1-G3).

**СТОП-ГЕЙТ:** підтвердження користувача → merge `fix/audit-followup` → `main`/`production`.

---

## Явно поза обсягом (потребує окремого рішення)

- **P4** — ідемпотентний `supabase-schema.sql`, write-політики на `is_admin_true()`, міграції.
- **D1** — розбиття `app/admin/page.tsx` (~4000 рядків).
- **S2** — CSP `unsafe-inline` (потребує nonce, несумісний з ISR — прийнятий компроміс).
- **S3** — видалення `images.unsplash.com` з `remotePatterns` (seed і частина live-фото досі на Unsplash; спершу міграція даних).
- **S4** — валідація схеми Instagram (admin-only вектор).
- **S5** — стійкий rate-limit `/api/translate` (зовнішній store).
- **S6** (`poweredByHeader: false`) і прибирання дискового сміття (`firebase-debug.log`, `coverage/`, `test-results/`) — косметика, робиться за бажанням.

## Ризики

- **Крок 2** небезпечний, якщо `profiles.is_admin` не встановлено для власника → обов'язкова передумова.
- **Крок 5** (`noUnusedLocals`) може викрити багато дрібних помилок — виправляти в межах кроку, не послаблювати правила.
- **Крок 3/4** змінюють робочу поведінку (realtime/скрол) — обов'язкова ручна перевірка.
