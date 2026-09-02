-- Seed the cafe_info greeting columns with the previously hardcoded greeting
-- texts (from lib/translations.ts) and enable both greetings so they show in
-- the app. Several greetings are stored in one cell, separated by ";".

update public.cafe_info
set
  greeting_customer_uk = 'Ласкаво просимо до Світ Кави',
  greeting_customer_hu = 'Üdvözöljük a Svit Kavy kávézóban',
  greeting_customer_en = 'Welcome to Svit Kavy',
  greeting_customer_enabled = true,

  greeting_admin_uk = 'Чудовий день, щоб зробити зміни в меню!; Гості вже чекають на щось новеньке. За роботу!; Свіжа порція ідей — і меню засяє по-новому!; Саме час додати родзинку в меню!; Сьогодні ідеальний день, щоб здивувати гостей.',
  greeting_admin_hu = 'Remek nap a menü frissítésére!; A vendégek már várnak valami újra. Munkára fel!; Friss ötletek — a menü új fényben tündököl!; Itt az ideje egy kis különlegességet adni a menühöz!; Ma tökéletes nap arra, hogy meglepje a vendégeket.',
  greeting_admin_en = 'A great day to make changes to the menu!; Guests are already waiting for something new. Let''s get to work!; A fresh batch of ideas — and the menu will shine anew!; Time to add a little zest to the menu!; Today is the perfect day to surprise your guests.',
  greeting_admin_enabled = true
where id = 1;
