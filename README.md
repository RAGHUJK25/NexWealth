# NexWealth — Personal finance workspace

NexWealth is a personal finance management application built with React + Vite, FastAPI, SQLAlchemy and SQLite. This version adds:
- Dashboard search, financial health insights, a collapsible sidebar, and a savings-streak game with virtual-only points.
- A level-based financial-literacy quiz, colorful charts, and an original fintech illustration on the sign-in page.
- In-app notifications, optional user-controlled Gmail alerts for savings rewards, and PDF insight reports plus full account-data CSV exports.
- A cash-flow estimate based on transaction history; existing personalized forecasts are used when available, otherwise a four-month average is shown.
- A hosted OpenAI-powered finance assistant, with a clearly labelled rule-based fallback when no API key is configured.
- Email-based password reset, transaction CRUD, CSV import, analytics, savings goals and purchase simulator.

## Requirements
- Python 3.11 recommended (Python 3.10+ may work with compatible package versions).
- Node.js 18+ and npm.
- Internet access to install packages and to use the hosted AI assistant.
- An OpenAI API key only if you want hosted AI responses. The rest of the application works without it.

## Windows CMD setup

### 1. Backend

Open Command Prompt:

```cmd
cd /d C:\Projects\NexWealth-2\backend
py -3.11 -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
copy .env.example .env
```

If `.env` already exists, do not overwrite it. Open it and update the settings manually.

The `.env.example` contains:
- `SECRET_KEY`: replace with a long random secret before use beyond local development.
- `DATABASE_URL`: SQLite database location.
- `FRONTEND_ORIGIN`: local Vite origin.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, and `SMTP_USE_TLS`: optional settings for password resets, test emails, and opted-in savings reward alerts. Without SMTP configuration, email features report that delivery is unavailable.
- `OPENAI_API_KEY`: optional secret key for hosted AI responses.
- `OPENAI_MODEL`: model name, defaults to `gpt-4o-mini`.

Keep the real `.env` private. Never paste the API key into React code or commit it to GitHub.

For Gmail delivery, use `smtp.gmail.com`, port `587`, and a Google App Password for `SMTP_PASSWORD` (not your regular Gmail password). Enable two-step verification on the Google account before creating an App Password. Store these values only in the backend `.env`.

Start the backend:

```cmd
python -m uvicorn app.main:app --reload --port 8001
```

API documentation: http://127.0.0.1:8001/docs

### 2. Frontend

Open a second CMD window:

```cmd
cd /d C:\Projects\NexWealth-2\frontend
npm install
npm run dev
```

Open the Vite URL (normally http://localhost:5173).

## How to use cash-flow estimates

1. Register or sign in.
2. Add transactions or import a CSV.
3. Open **Forecast** in the sidebar.
4. Select **Estimate** to recalculate using your saved transaction history. If a personalized forecast is available, it is used; otherwise the application displays a transparent four-month historical average.

Estimates are not guarantees. Unusual future events, missing records, and changing habits can make them inaccurate.

## Password reset and savings game

- Configure the SMTP settings in `backend/.env` to send secure one-time password-reset links. Links expire after 60 minutes. Keep SMTP credentials private.
- In **Settings**, enable savings reward emails and send a test message to the signed-in account. Each earned streak creates an in-app notification; reward emails are sent only when opted in.
- The savings game awards 10 virtual coins for recording one contribution toward a savings goal per day. 100 coins display an estimated ₹70 equivalent, but the points have no cash value and cannot be withdrawn or redeemed.

## Reports and learning game

- Open **Reports & export** to download a PDF containing recorded cash flow, analysis, goal progress, and forecast insights, or a CSV with all account records. Previously saved challenge records are retained in the CSV for data history.
- **Money quiz** contains five progressively harder financial-literacy levels. Earn a perfect score to unlock the next level. Progress is stored in this browser for the signed-in account; the quiz awards no money.

## How to enable the AI assistant

1. Obtain an API key from your OpenAI account.
2. Open `backend/.env`.
3. Set:

```env
OPENAI_API_KEY=your_real_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

4. Stop and restart the backend so it reloads environment variables.
5. Open **AI assistant** and ask a question about your recorded finances.

The backend retrieves a small financial summary from SQLite for the authenticated user and sends that context with the question to the language model. The API key stays on the backend.

If `OPENAI_API_KEY` is empty or the provider is unavailable, the assistant uses the existing rule-based fallback. The chat response indicates which mode was used. Hosted AI usage may incur provider charges and requires internet access.

### Privacy and safety
- Never expose the API key in frontend code, screenshots, public repositories or shared ZIP files.
- The hosted AI provider receives the financial summary needed to answer the user's question. Use only data you are comfortable sending to that provider and disclose this clearly to users.
- The assistant is educational, not a personalized investment, tax or legal adviser.
- This is a learning/demo implementation. Before production deployment, add stronger secret management, HTTPS, rate limiting, privacy/consent controls, audit logging and security review.

## CSV format

```csv
date,description,category,type,amount
2026-11-01,Salary,Income,income,50000
2026-11-02,Groceries,Food,expense,2500
```

`date`, `description`, `type` and `amount` are required. `category` is optional. `type` accepts `income` or `expense`.

## Troubleshooting

- `No module named app`: run Uvicorn from the `backend` directory.
- `pip.exe was blocked`: try `python -m pip install -r requirements.txt`. If Windows Device Guard blocks Python/package execution, ask your IT administrator to approve the required tools; do not disable security controls.
- Email alerts are unavailable: configure SMTP settings in the backend `.env` and restart the API.
- AI assistant says rule-based mode: configure `OPENAI_API_KEY` in `backend/.env`, check provider access/billing, and restart the backend.
- Port 8001 already in use: stop the old backend with Ctrl+C before starting another one.

## Project folders

```text
backend/
  app/
    main.py
    ml/
      forecasting.py
      saved_models/       # generated per-user model files
  requirements.txt
  .env.example
frontend/
  src/
    App.jsx
    api.js
```
