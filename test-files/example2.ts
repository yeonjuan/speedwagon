export async function fetchData(url: string) {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 5000);
  return fetch(url, { signal: controller.signal });
}

export function retryFetch(callback: () => void) {
  setTimeout(callback, 5000);
  poll(5000);
}

function poll(interval: number) {
  return interval;
}
