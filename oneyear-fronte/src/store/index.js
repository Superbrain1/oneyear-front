import { createStore } from 'vuex';
import auth from './modules/auth';
import circles from './modules/circles';

const store = createStore({
  modules: {
    auth,
    circles
  }
});

export default store;
