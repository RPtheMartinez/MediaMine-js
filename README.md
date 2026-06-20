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
3. Start the local server:
	```bash
	npm run dev
	```
4. Open http://localhost:5500 in your browser
5. Add your NewsAPI key directly in the app input field

> Note: In this plain frontend version, your API key is used in the browser.
> For production use, move the API call behind a backend proxy.

## Usage

1. Enter at least 3 characters of a state name (e.g. `Cal`, `New`, `Tex`).
2. Pick a state from the dropdown.
3. Enter your NewsAPI key.
4. Click **Get News Headlines**.

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

## Edge cases covered

- Input shorter than 3 characters
- No matching states
- Missing API key
- API/network request errors
- API returns no articles
- Missing article fields in response
