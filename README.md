# Birthday Wishlist

Веб-приложение для коллективного выбора подарков на день рождения. Гости выбирают подарки из списка, указывают количество и сохраняют свой выбор. Каждый подарок имеет ограниченное количество — приложение следит, чтобы гости не выбрали больше, чем доступно.

## Запуск

```bash
cd server
npm install
npm start
```

Открыть `http://localhost:3000`.

## Структура

```
wishlist/
├── server/                  # Node.js + Express API
│   ├── server.js            # Точка входа
│   ├── database.js          # SQLite (встроенный node:sqlite)
│   ├── routes/
│   │   ├── gifts.js         # GET /api/gifts
│   │   ├── selections.js    # CRUD /api/selections
│   │   └── services/
│   │       └── mailer.js    # Nodemailer
│   └── package.json
├── client/                  # Статический фронтенд
│   ├── index.html           # 3 экрана (Tailwind CSS CDN)
│   ├── css/style.css
│   └── js/app.js
├── data/
│   └── wishlist.db          # SQLite база (автосоздание)
└── .env                     # Конфигурация
```

## API

| Метод   | Путь                          | Описание                        |
| ------- | ----------------------------- | ------------------------------- |
| GET     | `/api/guests`                 | Список гостей                   |
| GET     | `/api/gifts`                  | Список подарков                 |
| GET     | `/api/gifts/:id`              | Детали подарка                  |
| POST    | `/api/selections`             | Сохранить выбор                 |
| GET     | `/api/selections?guest_id=X`  | Выборы гостя                    |
| DELETE  | `/api/selections?guest_id=X`  | Очистить выборы гостя           |
| POST    | `/api/send-email`             | Отправить список на email       |
