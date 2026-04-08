import { create } from 'zustand';
import { userApi } from '../api/index.js';

export const useStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  tags: [],

  // 初始化：有 token 则拉取用户信息，否则匿名注册
  async init() {
    const { token } = get();
    if (token) {
      try {
        const { data } = await userApi.me();
        set({ user: data });
      } catch {
        localStorage.removeItem('token');
        set({ token: null });
        get().register();
      }
    } else {
      get().register();
    }
  },

  async register() {
    try {
      const { data } = await userApi.register();
      localStorage.setItem('token', data.token);
      set({ token: data.token, user: data.user });
    } catch {
      // 后端未启动时静默失败，不影响前端渲染
    }
  },

  setTags(tags) { set({ tags }); },
  setUser(user) { set({ user }); }
}));
