# Повне імʼя товару + кнопка видалення у сайдбарі «Ваше замовлення»

## Проблема
- У `CartDrawer` (сайдбар «Ваше замовлення») назва товару виводиться з `truncate` — довгі назви обрізаються, а клієнт має зачитати замовлення офіціанту повністю.
- Немає окремого способу видалити страву зі списку — лише зменшувати кількість степпером до нуля.

## Рішення
1. **Повна назва** — прибрати `truncate`, увімкнути перенесення `break-words` (назва займає всю доступну ширину і переноситься на кілька рядків). Картка росте по висоті; фото ліворуч (`self-stretch`) тягнеться разом із нею.
2. **Степпер лишається** — `− qty +` праворуч, вирівняний по центру вертикалі.
3. **Кнопка видалення** — іконка `Trash2` поруч зі степпером; одне натискання повністю прибирає страву з замовлення (з тим самим коротким звуком `playStepperSound`, що й степпер).

## Кроки

### 1. `lib/cart.ts`
Додати функцію видалення позиції з кошика:
```ts
export const removeCartItem = (cart: Cart, productId: string): Cart => {
  const { [productId]: _removed, ...rest } = cart;
  return rest;
};
```

### 2. `hooks/use-cart.ts`
Додати `removeItem` (useCallback навколо `removeCartItem`) та включити його у значення, що повертаються:
```ts
const removeItem = useCallback((productId: string) => {
  setCart(prev => removeCartItem(prev, productId));
}, []);
// ...у return: removeItem
```
Імпортувати `removeCartItem` з `@/lib/cart`.

### 3. `components/menu/CartDrawer.tsx`
- Додати в `CartDrawerProps`: `onRemove: (productId: string) => void;` (і в деструктуризацію).
- У картці товару:
  - Заголовок назви: з `... truncate leading-snug` → `... break-words leading-snug` (прибрати обрізання).
  - Праворуч від контенту додати блок контролів, що містить: 🔴 кнопку видалення (іконка `Trash2`, `text-red-700 hover:bg-red-50`, aria-label) і наявний степпер `− qty +`.
  - Імпортувати `Trash2` з `lucide-react`.

Орієнтовна структура картки:
```tsx
<div className="flex items-stretch ...">
  <div className="relative w-24 aspect-[4/3] shrink-0 self-stretch overflow-hidden">
    <Image ... />
  </div>
  <div className="flex flex-1 items-center justify-between gap-2 p-3 min-w-0">
    <div className="min-w-0 flex-1">
      <h4 className="font-display font-bold text-[15px] sm:text-lg text-[#231913] leading-snug break-words">
        {getProductName(prod)}
      </h4>
      <p className="text-sm text-[#8E7A68] font-bold mt-0.5">{prod.price} {t('priceCurrency')}</p>
    </div>
    <div className="flex items-center gap-1.5 shrink-0">
      <button type="button" onClick={() => onRemove(prod.id)} className="p-1.5 text-red-700 hover:bg-red-50 transition-all rounded-full" aria-label="Remove item">
        <Trash2 className="w-4 h-4" />
      </button>
      <div className="flex items-center bg-[#F1ECE3] border border-[#E6DFD5] rounded-full overflow-hidden shrink-0 shadow-sm">
        <button onClick={() => onDecrement(prod.id)} ...><Minus /></button>
        <span>{qty}</span>
        <button onClick={() => onIncrement(prod.id)} ...><Plus /></button>
      </div>
    </div>
  </div>
</div>
```

### 4. `components/menu/MenuContainer.tsx`
- Додати `removeItem` до деструктуризації з `useCart`.
- Створити обробник:
```ts
const handleRemoveFromCart = (productId: string) => {
  removeItem(productId);
  playStepperSound();
};
```
- Передати `<CartDrawer ... onRemove={handleRemoveFromCart} />`.

## Валідація
1. `npm test` — усі тести зелені (у `lib/__tests__` можна додати кейс для `removeCartItem`).
2. `npx tsc --noEmit` — без помилок.
3. `npm run lint` — чисто.
4. Ручна перевірка (mobile-viewport): довга назва переноситься повністю; степпер працює; кнопка «смітник» видаляє страву одним тапом; фото зліва розтягується на висоту картки.
