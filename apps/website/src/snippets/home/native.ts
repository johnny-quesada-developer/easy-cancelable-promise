const fetchUser = fetch('/api/user').then((res) => res.json());

// User navigated? There is nothing to call.
// The request keeps going, and so does everything chained after it.
fetchUser.then((user) => render(user));

declare function render(user: unknown): void;
