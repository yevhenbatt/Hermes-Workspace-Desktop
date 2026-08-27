# Задача для Antigravity IDE: Интеграция Hermes Workspace Desktop с VPS и API Gateway

> **Проект:** Hermes Workspace Desktop App (Tauri v2)
> **Локация исходного кода:** `D:\Obsidian\Vault\WorkspaceUI`
> **Локация документации:** `D:\Obsidian\Vault\Hermes_Project\Hermes_Project_MD\workspace`

---

## Цель Задачи
Подключить локально созданный десктопный фронтенд **Hermes Workspace Desktop (Tauri v2)** к боевому серверному окружению на VPS (Hermes Agent, Graphify RAG, SwarmClaw Execution Engine, n8n, LLM провайдеры) с поддержкой многопользовательской изоляции и многоканального общения.

---

## Этапы Выполнения Задачи

### Этап 1. Переменные Окружения и API Gateway (`.env`)
1. Создать `.env` файл в корне `D:\Obsidian\Vault\WorkspaceUI\`:
   ```env
   VITE_HERMES_API_URL=https://<your-vps-domain-or-ip>/api/hermes
   VITE_GRAPHIFY_API_URL=https://<your-vps-domain-or-ip>/api/graphify
   VITE_SWARMCLAW_API_URL=https://<your-vps-domain-or-ip>/api/swarmclaw
   VITE_N8N_API_URL=https://<your-vps-domain-or-ip>/api/n8n
   ```
2. Подключить чтение конфигурации в `src/desktop/adapters/hostAdapter.ts`.

---

### Этап 2. Реализация Сетевого Слой в `HostAdapter`
1. Заменить заглушки в `src/desktop/adapters/hostAdapter.ts` на реальные REST API и WebSocket клиенты.
2. Внедрить автоматическую передачу заголовков контекста во все HTTP запросы:
   - `X-User-Id`
   - `X-Organization-Id`
   - `X-Workspace-Id`
   - `Authorization: Bearer <JWT_TOKEN>`
3. Подключить нативное сохранение токенов в зашифрованном виде через **Tauri OS Keychain API**.

---

### Этап 3. Сквозное Интеграционное Тестирование (E2E)

#### 1. Hermes Co-Pilot Drawer (`src/desktop/components/copilot/`)
- [ ] Отправка промптов из боковой панели в стиле VS Code.
- [ ] Получение потокового ответа (SSE / WebSocket) и отображение мыслительных цепочек (`reasoningTrace`).

#### 2. Dual Storage Knowledge & Skill Studio (`src/desktop/components/knowledge/`)
- [ ] Чтение и запись заметок на **VPS** через Graphify/Obsidian API.
- [ ] Чтение и запись заметок на **диск ПК** через Tauri FS API (`readLocalFile` / `writeLocalFile`).
- [ ] Переключение режимов VPS / Local в UI.

#### 3. Visual n8n Workflow Designer (`src/desktop/components/n8n/`)
- [ ] Загрузка списка нод с сервера n8n.
- [ ] Проектирование нод с помощью AI по промпту в Hermes Co-Pilot.
- [ ] Ручное добавление, редактирование и удаление нод в визуальном графе (React Flow).

#### 4. Org Chart & Agentic OS (`src/desktop/components/org/`)
- [ ] Отображение дерева оргструктуры и балансов расходов агентов ($/мес).
- [ ] Пауза / возобновление агентов SwarmClaw из UI.
- [ ] Добавление сторонних агентов (BYOA).

#### 5. LLM Provider & OAuth Settings (`src/desktop/components/settings/`)
- [ ] Авторизация OAuth 2.0 (ChatGPT, Claude, Gemini).
- [ ] Ввод и безопасное сохранение API-ключей (OpenRouter, FreeLLMAPI, OmniRoute, Ollama).

---

### Этап 4. Многоканальный Шлюз и Права Доступа (RBAC / ACL)
1. Проверка работы гранулярного шеринга заметок, скиллов и задач между пользователями.
2. Настройка и тестирование передачи уведомлений в Telegram / Discord ботов.

---

## Команды для Проверки и Сборки

```bash
# Переход в папку проекта
cd D:\Obsidian\Vault\WorkspaceUI

# Установка зависимостей
npm install

# Проверка типов и сборка фронтенда
npm run build

# Запуск десктопного приложения в режиме разработки
npm run tauri dev
```
