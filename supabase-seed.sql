-- Migration: insert default data into Supabase
-- Run this in Supabase SQL Editor after creating tables.

-- 1. Cafe Info
insert into public.cafe_info (id, owner_name_uk, owner_name_hu, owner_name_en, name_uk, name_hu, name_en, description_uk, description_hu, description_en, banner, logo, instagram, banner_x, banner_y, banner_scale, logo_x, logo_y, logo_scale, greeting_customer_uk, greeting_customer_hu, greeting_customer_en, greeting_customer_enabled, greeting_admin_uk, greeting_admin_hu, greeting_admin_en, greeting_admin_enabled)
values (1, '', '', '', 'Світ Кави', 'Svit Kavy', 'Svit Kavy', 'Затишна кав''ярня в центрі Вишкова', 'Hangulatos kávézó Visk központjában', 'A cozy coffee shop in the center of Vyshkovo', '', '', 'https://www.instagram.com/svit.kavy', 48, 47, 1.7, 50, 50, 1, 'Ласкаво просимо до Світ Кави', 'Üdvözöljük a Svit Kavy kávézóban', 'Welcome to Svit Kavy', true, E'Чудовий день, щоб зробити зміни в меню!\nГості вже чекають на щось новеньке. За роботу!\nСвіжа порція ідей — і меню засяє по-новому!\nСаме час додати родзинку в меню!\nСьогодні ідеальний день, щоб здивувати гостей.', E'Remek nap a menü frissítésére!\nA vendégek már várnak valami újra. Munkára fel!\nFriss ötletek — a menü új fényben tündököl!\nItt az ideje egy kis különlegességet adni a menühöz!\nMa tökéletes nap arra, hogy meglepje a vendégeket.', E'A great day to make changes to the menu!\nGuests are already waiting for something new. Let''s get to work!\nA fresh batch of ideas — and the menu will shine anew!\nTime to add a little zest to the menu!\nToday is the perfect day to surprise your guests.', true)
on conflict (id) do update set
  name_uk = excluded.name_uk,
  name_hu = excluded.name_hu,
  name_en = excluded.name_en,
  description_uk = excluded.description_uk,
  description_hu = excluded.description_hu,
  description_en = excluded.description_en,
  owner_name_uk = excluded.owner_name_uk,
  owner_name_hu = excluded.owner_name_hu,
  owner_name_en = excluded.owner_name_en,
  instagram = excluded.instagram,
  banner_x = excluded.banner_x,
  banner_y = excluded.banner_y,
  banner_scale = excluded.banner_scale,
  greeting_customer_uk = excluded.greeting_customer_uk,
  greeting_customer_hu = excluded.greeting_customer_hu,
  greeting_customer_en = excluded.greeting_customer_en,
  greeting_customer_enabled = excluded.greeting_customer_enabled,
  greeting_admin_uk = excluded.greeting_admin_uk,
  greeting_admin_hu = excluded.greeting_admin_hu,
  greeting_admin_en = excluded.greeting_admin_en,
  greeting_admin_enabled = excluded.greeting_admin_enabled;

-- 2. Categories
insert into public.categories (id, name_uk, name_hu, name_en, photo) values
  ('espresso-bar', 'Еспресо бар', 'Eszpresszó bár', 'Espresso Bar', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400'),
  ('signature', 'Авторські напої', 'Különleges italok', 'Signature Drinks', 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400'),
  ('tea-matcha', 'Чай та Матча', 'Tea és Matcha', 'Tea & Matcha', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=400'),
  ('desserts', 'Вишукані десерти', 'Különleges desszertek', 'Exquisite Desserts', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400')
on conflict (id) do nothing;

-- 3. Products
insert into public.products (id, category_id, name_uk, name_hu, name_en, description_uk, description_hu, description_en, ingredients_uk, ingredients_hu, ingredients_en, price, photo) values
  ('espresso', 'espresso-bar',
    'Подвійне еспресо', 'Dupla Eszpresszó', 'Double Espresso',
    'Зварено на спешелті зерні свіжого обсмаження (100% арабіка). Має насичений смак з нотками темного шоколаду, карамелі та цитрусовою кислинкою.',
    'Frissen pörkölt specialty kávéból főzve (100% arabica). Intenzív íz étcsokoládé, karamell és citrusos savasság jegyeivel.',
    'Brewed on freshly roasted specialty beans (100% Arabica). Rich taste with notes of dark chocolate, caramel, and citrus acidity.',
    'Спешелті кава, очищена вода', 'Specialty kávé, tisztított víz', 'Specialty coffee, purified water',
    65, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=300'),
  ('flat-white', 'espresso-bar',
    'Флет Вайт', 'Flat White', 'Flat White',
    'Ідеальний баланс подвійного еспресо та оксамитового ніжного молока з мінімальною піною.',
    'A dupla eszpresszó és a selymesen lágy tej tökéletes egyensúlya, minimális habbal.',
    'The perfect balance of double espresso and silky smooth milk with minimal microfoam.',
    'Подвійне еспресо, незбиране молоко', 'Dupla eszpresszó, teljes tej', 'Double espresso, whole milk',
    95, 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&q=80&w=300'),
  ('lavender-latte', 'signature',
    'Лавандовий раф', 'Levendulás Raf', 'Lavender Raf',
    'Вершковий ніжний напій з додаванням натуральних квітів лаванди та домашнього ванільного сиропу.',
    'Krémes, lágy ital valódi levendulavirágokkal és házi vaníliasziruppal.',
    'Creamy, smooth drink infused with natural lavender flowers and homemade vanilla syrup.',
    'Еспресо, вершки, лавандовий цвіт, ванільний сироп', 'Eszpresszó, tejszín, levendulavirág, vaníliaszirup', 'Espresso, cream, lavender flowers, vanilla syrup',
    110, 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&q=80&w=300'),
  ('pistachio-latte', 'signature',
    'Фісташковий лате', 'Pisztáciás Latte', 'Pistachio Latte',
    'Справжній гурманський досвід: еспресо з додаванням преміальної пасти з добірних фісташок та ніжною молочною піною.',
    'Igazi gourmet élmény: eszpresszó prémium pisztáciapasztával és finom tejhabbal.',
    'A true gourmet experience: espresso with premium pistachio paste and silky milk foam.',
    'Еспресо, натуральна фісташкова паста, незбиране молоко, фісташкова крихта', 'Eszpresszó, természetes pisztáciapaszta, teljes tej, pisztácia törmelék', 'Espresso, natural pistachio paste, whole milk, pistachio crumbs',
    130, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=300'),
  ('matcha-latte', 'tea-matcha',
    'Церемоніальна Матча Лате', 'Ceremoniális Matcha Latte', 'Ceremonial Matcha Latte',
    'Японський чай матча преміум-класу, збитий вручну бамбуковим віничком, з ніжним молоком на вибір.',
    'Prémium japán matcha tea, kézzel felvert bambusz habverővel, választható tejjel.',
    'Premium Japanese matcha tea, hand-whisked with a bamboo chasen, with your choice of milk.',
    'Матча преміум, рисове/кокосове/вівсяне молоко', 'Matcha prémium, rizs/kókusz/zab tej', 'Premium matcha, rice/coconut/oat milk',
    120, 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=300'),
  ('macaron', 'desserts',
    'Макарон Фісташка-Малина', 'Pisztácia-Málna Macaron', 'Pistachio-Raspberry Macaron',
    'Традиційне французьке тістечко на основі мигдалевого борошна з ганашем з білого шоколаду, фісташковою пастою та свіжим малиновим кюлі в центрі.',
    'Hagyományos francia mandulás sütemény fehér csokoládé ganache-sal, pisztáciapasztával és friss málna kuli központtal.',
    'Traditional French almond macaron filled with white chocolate pistachio ganache and a fresh raspberry coulis center.',
    'Мигдалеве борошно, цукрова пудра, яєчний білок, білий шоколад, фісташкова паста, малина, пектин',
    'Mandulaliszt, porcukor, tojásfehérje, fehér csokoládé, pisztáciapaszta, málna, pektin',
    'Almond flour, powdered sugar, egg whites, white chocolate, pistachio paste, raspberry, pectin',
    80, 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&q=80&w=300')
on conflict (id) do nothing;