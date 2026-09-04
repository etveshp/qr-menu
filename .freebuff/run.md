# Run doc — локальний dev-сервер (SVITKAVY-SUPABASE)

Робоча тека цього треду == головний чекаут (`D:\1_DEV\1_PROJECTS\SVITKAVY-SUPABASE`) — окремого
worktree немає, тому нічого копіювати між теками не потрібно.

## Як відтворити артефакти (для свіжого чекауту)

1. `npm ci` — встановити залежності з `package-lock.json` (у цій теці вже встановлені).
2. `copy .env.local` з головного чекауту (у цій теці файл уже на місці; містить
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — реальні значення, у git не комітяться).
3. Змінні середовища для продакшену задаються на Vercel; локально досить `.env.local`.

## Як запустити сервер

- Команда: `npm run dev` (Next.js dev, порт 3000).
- Якщо порт 3000 уже зайнятий здоровим dev-сервером цього проєкту — НЕ запускати другий,
  перевикористати наявний (перевірка: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → 200).
- Якщо сервера немає — запустити від'єднано (Windows):
  - `powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"`
  - stdout і stderr — у РІЗНІ файли (`<log>` та `<log>.err`); PowerShell падає, якщо обидва вказують на один шлях.
  - Лог-файл для цього треду: `.freebuff/preview-aec1bd39-fd30-4d29-a15b-1029a6a32296.log`.
- Після старту дочекатись відповіді URL (http://localhost:3000/) перед реєстрацією прев'ю.
