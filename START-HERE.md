# Flora AI frontend

Node.js 22.12 yoki yangiroq versiya kerak. Backend arxivini ham ochib, avval `quiz backend` ichidagi `START-HERE.md` bo‘yicha PostgreSQL va API’ni ishga tushiring.

Keyin ikkinchi terminalda `quiz frontend` ichiga kiring.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Sayt `http://localhost:3000/uz` manzilida, admin panel esa `http://localhost:3000/admin` manzilida ochiladi. API boshqa portda bo‘lsa, `.env.local` ichida `QUIZ_API_URL`ni belgilang. Batafsil ma’lumot [frontend README](README.md)da.
