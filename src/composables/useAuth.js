import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { googleAuth, loginUser, registerUser } from '../api/auth';

export function useAuth({ onLoginSuccess, onRegisterSuccess, showMessage }) {
  const store = useStore();
  const router = useRouter();

  const token = ref(store.state.auth.token || '');
  const user = ref(store.state.auth.user || null);

  const loginForm = reactive({ account: '', password: '' });
  const registerForm = reactive({ username: '', email: '', password: '' });

  const isLoggedIn = computed(() => store.getters['auth/isLoggedIn']);

  async function register() {
    try {
      await registerUser(registerForm);
      showMessage('注册成功，请登录');
      registerForm.username = '';
      registerForm.email = '';
      registerForm.password = '';
      if (typeof onRegisterSuccess === 'function') {
        await onRegisterSuccess();
      }
    } catch (err) {
      showMessage(err?.response?.data?.message || '注册失败');
    }
  }

  async function login() {
    try {
      const { data } = await loginUser(loginForm);
      token.value = data.token;
      user.value = data.user;
      await store.dispatch('auth/setAuth', {
        token: data.token,
        user: data.user
      });
      if (typeof onLoginSuccess === 'function') {
        await onLoginSuccess(data.user);
      }
      await router.push('/home');
    } catch (err) {
      showMessage(err?.response?.data?.message || '登录失败');
    }
  }

  async function logout(onLogout) {
    token.value = '';
    user.value = null;
    await store.dispatch('auth/clearAuth');
    if (typeof onLogout === 'function') {
      onLogout();
    }
    await router.push('/auth');
  }

  async function loginWithGoogle(credential) {
    try {
      const { data } = await googleAuth({ credential });
      token.value = data.token;
      user.value = data.user;
      await store.dispatch('auth/setAuth', {
        token: data.token,
        user: data.user
      });
      showMessage(data?.isNewUser ? '注册成功，已为你自动登录' : 'Google 登录成功');
      await router.push('/home');
    } catch (err) {
      showMessage(err?.response?.data?.message || 'Google 登录失败');
    }
  }

  return {
    token,
    user,
    loginForm,
    registerForm,
    isLoggedIn,
    register,
    login,
    loginWithGoogle,
    logout
  };
}
