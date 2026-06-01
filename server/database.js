const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'wishlist.db');

let db;

function query(fn) {
  return Promise.resolve().then(() => fn());
}

function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA busy_timeout = 5000');
    db.exec('PRAGMA foreign_keys = ON');
  }
  return db;
}

function initDb() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      email TEXT,
      phone TEXT
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS gifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      image_path TEXT DEFAULT '',
      price REAL DEFAULT 0,
      links TEXT DEFAULT '[]',
      total_needed INTEGER DEFAULT 0
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS selections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_id INTEGER NOT NULL,
      gift_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (guest_id) REFERENCES guests(id),
      FOREIGN KEY (gift_id) REFERENCES gifts(id),
      UNIQUE(guest_id, gift_id)
    )
  `);

  seedData(database);
}

function seedData(database) {
  const guestCount = database.prepare('SELECT COUNT(*) as count FROM guests').get();
  if (guestCount.count === 0) {
    const insertGuest = database.prepare('INSERT INTO guests (name, email) VALUES (?, ?)');
    insertGuest.run('Анна', 'anna@example.com');
    insertGuest.run('Михаил', 'mikhail@example.com');
    insertGuest.run('Елена', null);
    insertGuest.run('Дмитрий', 'dmitry@example.com');
  }

  const giftCount = database.prepare('SELECT COUNT(*) as count FROM gifts').get();
  if (giftCount.count === 0) {
    const insertGift = database.prepare(
      'INSERT INTO gifts (name, description, image_path, price, links, total_needed) VALUES (?, ?, ?, ?, ?, ?)'
    );
    insertGift.run(
      'Bluetooth колонка',
      'Портативная колонка с отличным звуком и влагозащитой. Идеально подходит для пикников и путешествий.',
      'images/speaker.jpg',
      3500,
      JSON.stringify([
        { title: 'Ozon', url: 'https://ozon.ru' },
        { title: 'Wildberries', url: 'https://wildberries.ru' },
        { title: 'Яндекс.Маркет', url: 'https://market.yandex.ru' }
      ]),
      2
    );
    insertGift.run(
      'Набор для чая',
      'Красивый набор из 6 сортов китайского чая в подарочной упаковке.',
      'images/tea.jpg',
      2500,
      JSON.stringify([
        { title: 'Ozon', url: 'https://ozon.ru' },
        { title: 'Wildberries', url: 'https://wildberries.ru' }
      ]),
      1
    );
    insertGift.run(
      'Книга «Атлант расправил плечи»',
      'Культовый роман Айн Рэнд в подарочном издании.',
      'images/book.jpg',
      1200,
      JSON.stringify([
        { title: 'Лабиринт', url: 'https://labirint.ru' },
        { title: 'Читай-город', url: 'https://chitai-gorod.ru' },
        { title: 'Ozon', url: 'https://ozon.ru' }
      ]),
      3
    );
    insertGift.run(
      'Сертификат в спа-салон',
      'Сертификат на 2 часа спа-процедур в центре города.',
      'images/spa.jpg',
      5000,
      JSON.stringify([
        { title: 'Купить на сайте', url: 'https://example-spa.ru' }
      ]),
      0
    );
    insertGift.run(
      'Настольная игра «Колонизаторы»',
      'Популярная стратегическая игра для компании от 3 до 6 человек.',
      'images/catan.jpg',
      3200,
      JSON.stringify([
        { title: 'Ozon', url: 'https://ozon.ru' },
        { title: 'Hobby Games', url: 'https://hobbygames.ru' }
      ]),
      1
    );
    insertGift.run(
      'Фитнес-браслет',
      'Умный браслет с отслеживанием активности, сна и уведомлениями.',
      'images/band.jpg',
      4000,
      JSON.stringify([
        { title: 'DNS', url: 'https://dns-shop.ru' },
        { title: 'М.Видео', url: 'https://mvideo.ru' }
      ]),
      2
    );
  }
}

module.exports = { getDb, initDb, query };
