import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { installGlobalErrorHandlers } from './utils/errorReporter';
import '../styles.css';

installGlobalErrorHandlers();

createApp(App).use(store).use(router).mount('#app');
