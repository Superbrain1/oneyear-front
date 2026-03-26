const tokenFromStorage = localStorage.getItem('token') || '';
const userFromStorage = JSON.parse(localStorage.getItem('user') || 'null');

const authModule = {
  namespaced: true,

  state() {
    return {
      token: tokenFromStorage,
      user: userFromStorage
    };
  },

  getters: {
    isLoggedIn(state) {
      return Boolean(state.token);
    }
  },

  mutations: {
    SET_AUTH(state, payload) {
      state.token = payload.token;
      state.user = payload.user;
    },

    CLEAR_AUTH(state) {
      state.token = '';
      state.user = null;
    }
  },

  actions: {
    setAuth({ commit }, payload) {
      commit('SET_AUTH', payload);
      localStorage.setItem('token', payload.token);
      localStorage.setItem('user', JSON.stringify(payload.user));
    },

    clearAuth({ commit }) {
      commit('CLEAR_AUTH');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
};

export default authModule;
