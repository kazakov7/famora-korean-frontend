# Quiz frontend

TOPIK va Mock Exam platformasining Next.js App Router frontendi. O‘quvchi sayti va `/admin` bir ilovada. GraphQL operatsiyalari, komponentlar, locale fayllari va SCSS Nestar Next tuzilishiga mos joylashtirilgan. [Loyiha spetsifikatsiyasi](../PROJECT_SPEC.md)

## Ishga tushirish

Node.js 22.12 yoki undan yangi versiya kerak. Avval [backend](../quiz%20backend/README.md)ni ishga tushiring.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Sayt `http://localhost:3000/uz`da, admin panel `http://localhost:3000/admin`da ochiladi. Admin uchun backendda `ADMIN` roli belgilanadi.

| O‘zgaruvchi     | Vazifa                                                                             |
| --------------- | ---------------------------------------------------------------------------------- |
| `QUIZ_API_URL`  | NestJS API origin. Lokal standart `http://localhost:4000`.                         |
| `QUIZ_SITE_URL` | Saytning ommaviy origini. Canonical URL, sitemap va robots fayllarida ishlatiladi. |

Brauzer GraphQL’ga `/api/graphql`, Google va Telegram loginiga `/auth/<provider>/start` orqali murojaat qiladi. Next.js so‘rovlarni backendga uzatadi. Shu proksi bilan ishlaganda backendning `FRONTEND_URL` va `PUBLIC_API_URL` qiymatlarini sayt originiga teng bering. OAuth callback manzili `<site-origin>/auth/<provider>/callback`. Sayt origini Cloudflare R2 CORS sozlamasiga ham kerak.

## Sahifalar

- Ochiq katalog, TOPIK I va II, Mock Exam, test tafsilotlari, Reyting va Yordam uch tilda ishlaydi. Test kontenti backenddan asl tilida keladi.
- Akkaunt oqimlari nickname bilan login va signup, Google va Telegram login, Gmail bog‘lash kodi, parolni tiklash va profilni tahrirlashni qamrab oladi.
- Test rejimlari, taymer, pauza, javoblarni saqlash, audio, natijalar tarixi va lug‘at daftari GraphQL bilan ishlaydi.
- Admin menyularni, testning menyulardagi joylashuvini, qoralama va nashr etilgan versiyalarni, variantlar, bo‘limlar, savollar va R2 media fayllarini boshqaradi.
- Light va dark rejim brauzerda saqlanadi. Interfeys tili `/uz`, `/en` va `/ko` marshrutlari orqali tanlanadi.

## Tekshiruv

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

Jonli Google va Telegram login, Gmail OTP va media yuklash backend xizmatlarining tegishli sozlamalariga bog‘liq. Testlar e’lon qilingach katalogda ko‘rinadi.
