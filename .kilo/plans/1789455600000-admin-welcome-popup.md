# Попап-привітання адміна при вході в Кабінет

## Мета
Показувати адміністратору модальний попап із привітанням (з імʼям) та кнопкою «До роботи!» одразу після входу в Кабінет. Привітання обирається випадково з пулу варіантів (можна — за часом доби).

## Рішення
- Перевикористовуємо наявний компонент `NotAdminModal` (logo + title + text + ok-кнопка) — він уже має гарну анімацію й той самий сітчастий стиль. Передаємо:
  - `logo={cafeInfo?.logo}`
  - `title` = «Вітаю, {імʼя}!» (з `t('welcomeTitle').replace('{name}', firstName)`)
  - `text` = випадково обраний варіант привітання
  - `okLabel={t('toWork')}` = «До роботи!»
  - `onOk={() => setShowWelcome(false)}`
- Тригер: коли `isAuthenticated` стає `true` і є `currentUser` — один раз за сесію (через `useRef(hasShownWelcomeRef)`), інакше попап знову зʼявлявся б при переключенні вкладок.

## Кроки

### 1. `lib/translations.ts`
Додати ключі для всіх трьох мов:
- `welcomeTitle`: `"Вітаю, {name}!"` / `"Üdv, {name}!"` / `"Hi, {name}!"`
- `toWork`: `"До роботи!"` / `"Munkára fel!"` / `"Let's go!"`

Пул привітань — у коді (мапа за мовою) або через кілька ключів `welcomeMsg1..5`. Обрано в коді.

### 2. `app/admin/page.tsx`
- Додати стан: `const [showWelcome, setShowWelcome] = useState(false);` і `const hasShownWelcomeRef = useRef(false);`
- Ефект:
```ts
useEffect(() => {
  if (isAuthenticated && currentUser && !hasShownWelcomeRef.current) {
    hasShownWelcomeRef.current = true;
    setShowWelcome(true);
  }
}, [isAuthenticated, currentUser]);
```
- Отримати імʼя: перше слово з `currentUser.user_metadata?.full_name` або `currentUser.email?.split('@')[0]`.
- Пул привітань (мапа `ADMIN_GREETINGS[lang]`), випадковий вибір.
- У гілці автентифікованого `<main>` додати:
```tsx
<NotAdminModal
  isOpen={showWelcome}
  logo={cafeInfo?.logo ?? null}
  title={t('welcomeTitle').replace('{name}', firstName)}
  text={greeting}
  okLabel={t('toWork')}
  onOk={() => setShowWelcome(false)}
/>
```

### 3. Варіанти привітань (uk / hu / en)
- uk:
  - «Чудовий день, щоб зробити зміни в меню!»
  - «Гості вже чекають на щось новеньке. За роботу!»
  - «Свіжа порція ідей — і меню засяє по-новому!»
  - «Саме час додати родзинку в меню!»
  - «Сьогодні ідеальний день, щоб здивувати гостей.»
- hu (аналогічно): «Remek nap a menü frissítésére!», «A vendégek már várnak valami újra.», …
- en (аналогічно): «A great day to refresh the menu!», «Guests are waiting for something new.», …

## Валідація
1. `npm test` — зелені тести.
2. `npx tsc --noEmit` — без помилок.
3. `npm run lint` — чисто.
4. Ручна перевірка: вхід у `/admin` → попап з імʼям + «До роботи!»; закривається по кнопці/Escape; не зʼявляється повторно при перемиканні розділів.
