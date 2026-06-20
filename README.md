# MediaMine (JavaScript)

A plain JavaScript app that shows top news headlines by U.S. state.

## Features

- Type-ahead state search (minimum 3 characters)
- Select matching state from dropdown
- Fetch top 5 headlines for selected state
- Clickable article links
- Friendly error handling for common edge cases

## Setup

1. Clone this repo
2. Install dependencies:
	```bash
	npm install
	```
3. Create local environment file:
	```bash
	cp .env.example .env
	```
4. Fill in `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`
5. Start the local server:
	```bash
	npm run dev
	```
6. Open http://localhost:5500 in your browser
7. Add your NewsAPI key directly in the app input field

> Note: In this plain frontend version, your API key is used in the browser.
> For production use, move the API call behind a backend proxy.

## Usage

1. Enter at least 3 characters of a state name (e.g. `Cal`, `New`, `Tex`).
2. Pick a state from the dropdown.
3. Enter your NewsAPI key.
4. Click **Get News Headlines**.

## Signup Setup (Starter)

The app now includes:

- A **Signup** link on the home page
- A **Login** page at `/login.html`
- A signup page at `/signup.html`
- A backend endpoint at `POST /api/signup` that creates a Supabase Auth user
- A backend endpoint at `POST /api/login` for email/password sign-in
- Session-based signed-in state on the home page using `sessionStorage`

To support profile data storage, create a `profiles` table in Supabase SQL Editor:

```sql
create table if not exists public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	email text not null,
	first_name text not null,
	last_name text not null,
	state text,
	created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id);
```

If your Supabase project requires email confirmation, new users will need to confirm by email before full sign-in.

## Local Testing

- Run end-to-end tests:
	```bash
	npm run test:e2e
	```
- Run tests with UI mode:
	```bash
	npm run test:e2e:ui
	```

For API relevance tests in `tests/state-relevance.spec.js`, set `NEWS_API_KEY` (or `NEWSAPI_KEY`) before running tests.

The backend exposes safe client config at `GET /api/config` and returns only `supabaseUrl` and `supabaseAnonKey`.

## Edge cases covered

- Input shorter than 3 characters
- No matching states
- Missing API key
- API/network request errors
- API returns no articles
- Missing article fields in response
