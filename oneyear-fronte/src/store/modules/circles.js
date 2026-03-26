const circlesModule = {
  namespaced: true,

  state() {
    return {
      list: [],
      bubbleStates: {}
    };
  },

  mutations: {
    SET_CIRCLES(state, circles) {
      state.list = circles;
    },

    CLEAR_CIRCLES(state) {
      state.list = [];
      state.bubbleStates = {};
    },

    SET_BUBBLE_STATE(state, payload) {
      state.bubbleStates[payload.id] = payload.value;
    },

    UPDATE_BUBBLE_POSITION(state, payload) {
      const bubble = state.bubbleStates[payload.id];
      if (!bubble) {
        return;
      }
      bubble.x = payload.x;
      bubble.y = payload.y;
      bubble.vx = payload.vx;
      bubble.vy = payload.vy;
    }
  },

  actions: {
    setCircles({ commit }, circles) {
      commit('SET_CIRCLES', circles);
    },

    clearCircles({ commit }) {
      commit('CLEAR_CIRCLES');
    },

    setBubbleState({ commit }, payload) {
      commit('SET_BUBBLE_STATE', payload);
    },

    updateBubblePosition({ commit }, payload) {
      commit('UPDATE_BUBBLE_POSITION', payload);
    }
  }
};

export default circlesModule;
