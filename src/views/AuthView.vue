<template>
  <div class="auth-page">
    <video
      class="auth-bg-video"
      autoplay
      muted
      loop
      playsinline
      preload="metadata"
    >
      <source src="/login-bg.mp4" type="video/mp4" />
    </video>

    <div class="auth-overlay"></div>

    <div class="page auth-content">
      <div class="auth">
        <h1>OneYear</h1>
        <p class="muted">前端与后端已分离，登录后进入泡泡首页。</p>

        <div class="auth-tabs" role="tablist" aria-label="登录注册切换">
          <button
            class="auth-tab"
            :class="{ active: activeTab === 'login' }"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'login'"
            @click="activeTab = 'login'"
          >
            登录
          </button>
          <button
            class="auth-tab"
            :class="{ active: activeTab === 'register' }"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'register'"
            @click="activeTab = 'register'"
          >
            注册
          </button>
        </div>

        <section v-if="activeTab === 'login'" class="auth-panel" role="tabpanel" aria-label="登录面板">
          <input v-model="loginForm.account" placeholder="用户名或邮箱" />
          <input v-model="loginForm.password" type="password" placeholder="密码" />
          <button @click="login">登录</button>
        </section>

        <section v-else class="auth-panel" role="tabpanel" aria-label="注册面板">
          <input v-model="registerForm.username" placeholder="用户名" />
          <input v-model="registerForm.email" placeholder="邮箱" />
          <input v-model="registerForm.password" type="password" placeholder="密码" />
          <button @click="register">注册</button>
        </section>

        <div class="google-wrap">
          <p class="muted" style="margin-bottom:8px">
            {{ activeTab === 'login' ? '或使用 Google 登录' : '或使用 Google 注册' }}
          </p>
          <div v-show="googleReady" ref="googleBtn"></div>
          <button
            v-if="!googleReady"
            type="button"
            class="google-manual-btn"
            @click="retryInitGoogle"
          >
            重新加载 Google 登录
          </button>
          <p v-if="googleHint" class="muted" style="margin-top:8px">{{ googleHint }}</p>
        </div>

        <p v-if="message" class="auth-toast">{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { nextTick, onMounted, ref, watch } from 'vue';
import { useAuth } from '../composables/useAuth';
import { useMessage } from '../composables/useMessage';

export default {
  name: 'AuthView',
  setup() {
    const { message, showMessage } = useMessage();
    const activeTab = ref('login');
    const googleBtn = ref(null);
    const googleReady = ref(false);
    const googleHint = ref('');
    const googleClientId = process.env.VUE_APP_GOOGLE_CLIENT_ID || '';

    const { loginForm, registerForm, register, login, loginWithGoogle } = useAuth({
      showMessage,
      onRegisterSuccess: async () => {
        activeTab.value = 'login';
        await nextTick();
      }
    });

    function loadGoogleScript() {
      return new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) {
          resolve();
          return;
        }

        const existing = document.getElementById('google-identity-sdk');
        if (existing) {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () => reject(new Error('Google SDK 加载失败')));
          return;
        }

        const script = document.createElement('script');
        script.id = 'google-identity-sdk';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Google SDK 加载失败'));
        document.head.appendChild(script);
      });
    }

    function renderGoogleButton() {
      if (!googleBtn.value || !window.google?.accounts?.id) {
        return;
      }

      googleBtn.value.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtn.value, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: activeTab.value === 'login' ? 'signin_with' : 'signup_with',
        shape: 'pill',
        width: 320
      });
    }

    async function initGoogle() {
      if (!googleClientId) {
        googleReady.value = false;
        googleHint.value = 'Google 登录暂不可用，请稍后重试';
        return;
      }

      try {
        await loadGoogleScript();
        if (!googleBtn.value || !window.google?.accounts?.id) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async ({ credential }) => {
            await loginWithGoogle(credential);
          }
        });
        renderGoogleButton();
        googleReady.value = true;
        googleHint.value = '';
      } catch (err) {
        googleReady.value = false;
        googleHint.value = 'Google SDK 加载失败，请检查网络后重试';
        showMessage(err?.message || 'Google 登录初始化失败');
      }
    }

    async function retryInitGoogle() {
      await initGoogle();
    }

    onMounted(() => {
      initGoogle();
    });

    watch(activeTab, () => {
      renderGoogleButton();
    });

    return {
      activeTab,
      googleBtn,
      googleReady,
      googleHint,
      loginForm,
      registerForm,
      register,
      login,
      retryInitGoogle,
      message
    };
  }
};
</script>

<style scoped>
.auth-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.auth-bg-video {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

.auth-overlay {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at 78% 24%, rgba(14, 165, 233, 0.22), transparent 38%),
    linear-gradient(140deg, rgba(2, 6, 23, 0.62), rgba(2, 6, 23, 0.34));
  z-index: 1;
}

.auth-content {
  position: relative;
  z-index: 2;
}

.auth-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}

.auth-tab {
  margin-top: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.04);
}

.auth-tab.active {
  background: linear-gradient(90deg, #14b8a6, #0ea5e9);
  border-color: transparent;
}

.auth-panel {
  margin-top: 12px;
}

.google-wrap {
  margin-top: 16px;
}

.google-manual-btn {
  margin-top: 0;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.auth-toast {
  margin: 14px 0 0;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.45);
  color: #d1fae5;
  font-size: 13px;
}

@media (prefers-reduced-motion: reduce) {
  .auth-bg-video {
    display: none;
  }

  .auth-page {
    background: linear-gradient(135deg, #0f172a, #0b2a36);
  }
}
</style>
