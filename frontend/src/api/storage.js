const PREFIX = 'renyan_';

export const storage = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem(PREFIX + key)); } catch { return null; }
  },
  set: (key, val) => localStorage.setItem(PREFIX + key, JSON.stringify(val)),
  push: (key, item) => {
    const arr = storage.get(key) || [];
    arr.unshift(item);
    storage.set(key, arr);
    return arr;
  }
};

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function randomName() {
  const names = ['流云','晨雾','暮光','细雨','山风','溪石','落叶','星尘','浅草','远山','冬雪','春泥'];
  return names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 900 + 100);
}
