# Кебаб-картки категорій і товарів (адмінка)

## Мета
Прибрати з карток категорій та товарів постійно видимі іконки редагування/видалення, щоб звільнити місце для назви. Замість цього на картці лишається один вертикальний кебаб (⋯). Тап по кебабу плавно зсуває контент картки вліво (поверх фото), відкриваючи під ним дві кнопки-іконки — Редагувати й Видалити. Повторний тап повертає контент на місце.

Пріоритет: **mobile-first**. Жодних hover-залежностей.

## Рішення (узгоджено з користувачем)
- Спосіб доступу: **клік/тап по кебабу → зсув контенту вліво поверх фото**, відкриваються дві іконки.
- Підтвердження видалення: **`ConfirmModal`** (вже імпортований), замість браузерного `confirm()`.
- Кнопки у вивільненій зоні: **іконки** (після тапу) — `Edit2` і `Trash2`, з `title`/`aria-label`.

## Геометрія
- Фото: фіксований блок `w-24 aspect-[4/3]` (= 96px завширшки), обрізається `object-cover`.
- Контент (назва + метадані + кебаб) — шар `z-10` на всю решту ширини.
- Шар дій (Редагувати/Видалити) — абсолютно позиціонований праворуч, ширина `w-24` (= 96px), прихований (`opacity-0` + `pointer-events-none`), поки закрито.
- Тап по кебабу: контент `translateX(-96px)` — зсувається вліво й накриває фото, вивільняючи праву 96px зону, де проявляються іконки дій.
- Одна відкрита картка на раз: `isOpen` виводиться зі спільного стану `openActionsId`.

## Реалізація

### 1. Нові переклади (`lib/translations.ts`)
Додати для всіх трьох мов (uk/hu/en):
- `deleteConfirmTitle`: «Видалити?» / «Törlés?» / «Delete?»
- `deleteConfirmMessage`: «Цю дію не можна скасувати.» / «Ez a művelet nem vonható vissza.» / «This action cannot be undone.»

Назва обʼєкта додається в повідомлення кодом: `Видалити "«name»"?`

### 2. Іконки (`app/admin/page.tsx`)
Додати `MoreVertical` до імпорту з `lucide-react` (рядок ~34–58). Якщо в конкретній версії `MoreVertical` відсутній — використати `EllipsisVertical`.

### 3. Стейт (`app/admin/page.tsx`)
Додати два стани:
- `openActionsId: string | null` — ідентифікатор відкритої картки (null = усі закриті).
- `deleteTarget: { kind: 'category' | 'product'; id: string; name: string } | null` — ціль для `ConfirmModal`.

### 4. Перейменувати функції видалення (прибрати браузерний confirm)
У `app/admin/page.tsx` (зараз рядки ~898 і ~1018):
- `handleDeleteCategory` / `handleDeleteProduct` → перейменувати на `performDeleteCategory(id)` / `performDeleteProduct(id)` і **видалити** обгортку `if (confirm(...))` (залишити лише тіло видалення).
- Ці функції тепер викликаються лише з `ConfirmModal.onConfirm`.

### 5. Новий компонент `components/admin/ActionCard.tsx` (client)
Універсальна картка з кебабом. Пропси:
```ts
interface ActionCardProps {
  photo: string;
  alt: string;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode; // текст контенту (назва + метадані)
}
```
Структура:
- Контейнер: `relative flex items-center overflow-hidden border border-[#E6DFD5] bg-[#FAF6EE] rounded-2xl`.
- Фото: `relative w-24 aspect-[4/3] shrink-0 overflow-hidden` + `<Image fill object-cover>`.
- Шар дій: `absolute inset-y-0 right-0 w-24 flex items-center justify-end gap-1 pr-3 transition-opacity duration-200` + `(isOpen ? 'opacity-100' : 'pointer-events-none opacity-0')`. Містить дві кнопки:
  - Редагувати: `Edit2`, `text-[#C09E6D] hover:bg-[#F1ECE3]`, `w-9 h-9 rounded-full`.
  - Видалити: `Trash2`, `text-red-700 hover:bg-red-50`, `w-9 h-9 rounded-full`.
- Контент: `motion.div` з `animate={{ x: isOpen ? -96 : 0 }}` і пружинним transition (напр. `{ type: 'spring', stiffness: 350, damping: 30 }`), клас `relative z-10 flex flex-1 items-center justify-between gap-3 p-3 bg-[#FAF6EE]`. Усередині:
  - Текстова зона з `min-w-0` (для обрізання довгого тексту) — `children`.
  - Кнопка кебаба: `MoreVertical`, `w-10 h-10`, `text-[#8E7A68] hover:text-[#3E2F26]`, `shrink-0`.

Використати `motion/react` (вже в проєкті).

### 6. Замінити картки у `app/admin/page.tsx`

**Категорії** (зараз ~1768–1794): замість поточного `div` картки — `<ActionCard>`:
```tsx
<ActionCard
  photo={cat.photo}
  alt={cat.nameUk}
  isOpen={openActionsId === cat.id}
  onToggle={() => setOpenActionsId(openActionsId === cat.id ? null : cat.id)}
  onEdit={() => handleEditCategory(cat)}
  onDelete={() => setDeleteTarget({ kind: 'category', id: cat.id, name: cat.nameUk })}
>
  <p className="font-semibold text-sm text-[#231913]">{cat.nameUk}</p>
  <p className="text-[10px] text-[#8E7A68]">{cat.nameEn} • {cat.nameHu}</p>
</ActionCard>
```

**Товари** (зараз ~1830–1857): аналогічно, з локалізованими назвами (за `lang`) і рядком «категорія • ціна ₴»:
```tsx
<ActionCard
  photo={p.photo}
  alt={p.nameUk}
  isOpen={openActionsId === p.id}
  onToggle={() => setOpenActionsId(openActionsId === p.id ? null : p.id)}
  onEdit={() => handleEditProduct(p)}
  onDelete={() => setDeleteTarget({ kind: 'product', id: p.id, name: lang === 'hu' ? p.nameHu : lang === 'en' ? p.nameEn : p.nameUk })}
>
  <p className="font-semibold text-sm text-[#231913]">{lang === 'hu' ? p.nameHu : lang === 'en' ? p.nameEn : p.nameUk}</p>
  <p className="text-xs font-semibold text-[#3E2F26]">{cat ? (lang === 'hu' ? cat.nameHu : lang === 'en' ? cat.nameEn : cat.nameUk) : t('noCategory')} • {p.price} ₴</p>
</ActionCard>
```

### 7. Додати спільний `ConfirmModal` (поруч із наявними, ~1881/1925)
Один новий `ConfirmModal`, привʼязаний до `deleteTarget`:
```tsx
<ConfirmModal
  isOpen={!!deleteTarget}
  title={t('deleteConfirmTitle')}
  message={deleteTarget ? t('deleteConfirmMessage') + ` "${deleteTarget.name}"` : ''}
  onCancel={() => setDeleteTarget(null)}
  onConfirm={() => {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target) return;
    if (target.kind === 'category') performDeleteCategory(target.id);
    else performDeleteProduct(target.id);
  }}
/>
```

## Поведінка / edge-cases
- Одночасно відкрита лише одна картка (спільний `openActionsId`); тап по кебабу іншої закриває попередню.
- Кебаб залишається тапабельним у відкритому стані (він зсувається разом із контентом) — повторний тап закриває.
- Кнопка «Редагувати» закриває кебаб шляхом відкриття drawer (`handleEditCategory`/`handleEditProduct` вже встановлюють стан; при необхідності додати `setOpenActionsId(null)` у `onEdit`).
- Після успішного видалення/редагування контент оновлюється через наявний `fetchData()`.

## Валідація
1. `npm test` — 95 тестів зелених.
2. `npx tsc --noEmit` — без помилок типів.
3. `npm run lint` — чисто.
4. `npm run build` — успішний білд (перевіряє імпорт `MoreVertical`).
5. Ручна перевірка (dev-сервер, mobile-viewport): тап кебаба → плавний зсув вліво, поява Edit/Delete; тап «Видалити» → `ConfirmModal`; підтвердження видаляє; тап кебаба повторно повертає контент.

## Межі та відкриті питання
- Використовується тільки у вкладках «Категорії» та «Меню» адмінки. QR/банер/лого не зачіпаються.
- Опційно (поза поточним обсягом): автозакриття при кліку поза карткою. За замовчуванням закриття — повторним тапом по кебабу або відкриттям іншої картки.
- Інших рішень не чекає; план реалізаційно-готовий.
