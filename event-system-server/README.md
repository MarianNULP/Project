# 🛡️ EventPort — Backend API

Це серверна частина (Headless CMS), що забезпечує роботу платформи **EventPort**.
Побудована на базі **Strapi v5**.

## 🚀 Технології

* **Core:** Strapi v5 (Node.js)
* **Database:** SQLite (Dev) / PostgreSQL (Prod)
* **Auth:** JWT Authentication provider
* **API:** REST API

## 🗂️ Структура даних (Content Types)

### 1. User (Користувачі)
Стандартна колекція Strapi з розширеними полями:
* `city` (Text)
* `role` (Relation: Organizer / Authenticated)

### 2. Event (Події)
* `title` (Text)
* `description` (Rich Text)
* `date` (DateTime)
* `city` (Text)
* `price` (Number)
* `cover` (Media)
* `organizer` (Relation -> User)
* `categories` (Relation -> Category)

### 3. Registration (Квитки)
* `user` (Relation -> User)
* `event` (Relation -> Event)
* `approval_status` (Enum: pending, approved, rejected)
* `qr_code_hash` (UID - documentId)

### 4. Review (Відгуки)
* `content` (Text)
* `rating` (Number 1-5)
* `event` (Relation -> Event)
* `user` (Relation -> User)

### 5. Category (Категорії)
* `name` (Text) — наприклад: "Концерт", "Навчання", "Спорт".

## ⚙️ Налаштування прав (Permissions)

Для коректної роботи Frontend'у в адмін-панелі Strapi (Settings -> Users & Permissions Roles) налаштовано:

* **Public:**
    * `Event`: find, findOne
    * `Category`: find
    * `Review`: find
* **Authenticated:**
    * `Event`: create (для організаторів)
    * `Review`: create
    * `Registration`: create, find (свої), delete
    * `User`: me, update (профіль)
* **Organizer (Custom Role):**
    * Має права на редагування (`update`) та видалення (`delete`) **власних** подій.

## 🛠️ Встановлення та запуск

1.  **Клонуйте репозиторій:**
    ```bash
    git clone [https://github.com/ВАШ_НІК/event-app-backend.git](https://github.com/ВАШ_НІК/event-app-backend.git)
    cd event-app-backend
    ```

2.  **Встановіть залежності:**
    ```bash
    npm install
    ```

3.  **Запустіть в режимі розробки:**
    ```bash
    npm run develop
    ```
    Адмін-панель доступна за адресою: [http://localhost:1337/admin](http://localhost:1337/admin).

## 🌍 Деплой

Рекомендована платформа: **Strapi Cloud** (найпростіше) або **Render.com**.
При деплої обов'язково налаштуйте змінні середовища для бази даних (PostgreSQL).

---
Created by Marian