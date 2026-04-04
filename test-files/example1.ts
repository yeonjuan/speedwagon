export function setTimeout1(callback: () => void) {
  setTimeout(callback, 5000);
}

export function delay(callback: () => void) {
  setTimeout(callback, 5000);
}

export function poll(callback: () => void) {
  setInterval(callback, 5000);
}
