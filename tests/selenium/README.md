# Student dashboard Selenium test

This test is intentionally limited to the US-107 student dashboard. It runs the
real frontend in headless Chrome and supplies deterministic API responses inside
the browser, so it does not require credentials or modify backend data.

Run it from the frontend repository:

```sh
npm run test:selenium:student-dashboard
```

Chrome must be installed. Selenium Manager resolves the matching ChromeDriver.
