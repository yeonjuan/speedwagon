// Test file 2 with duplicate constants

export function fetchData() {
  const url = "https://api.example.com";
  const timeout = 5000;

  return fetch(url, { timeout });
}

export function retryDelay() {
  return 5000;
}
