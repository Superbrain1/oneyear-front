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
        <p class="auth-kicker">City Badminton Network</p>
        <h1>OneYear 羽毛球社区</h1>
        <p class="muted auth-intro">连接同城球友、活动组局、装备交易和真实讨论，在一个站点完成完整的羽球日常。</p>

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

        <div v-if="googleVisible" class="google-wrap">
          <p class="muted" style="margin-bottom:8px">
            {{ activeTab === 'login' ? '或使用 Google 登录' : '或使用 Google 注册' }}
          </p>
          <div ref="googleBtn"></div>
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
    const googleVisible = ref(false);
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
        googleVisible.value = false;
        return;
      }

      try {
        await loadGoogleScript();
        if (!googleBtn.value || !window.google?.accounts?.id) {
          googleVisible.value = false;
          return;
        }

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async ({ credential }) => {
            await loginWithGoogle(credential);
          }
        });
        renderGoogleButton();
        googleVisible.value = true;
      } catch (err) {
        googleVisible.value = false;
      }
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
      googleVisible,
      loginForm,
      registerForm,
      register,
      login,
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
    radial-gradient(circle at 18% 20%, rgba(20, 184, 166, 0.28), transparent 28%),
    radial-gradient(circle at 78% 24%, rgba(14, 165, 233, 0.22), transparent 38%),
    linear-gradient(140deg, rgba(2, 6, 23, 0.52), rgba(255, 255, 255, 0.08));
  z-index: 1;
}

.auth-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  min-height: 100vh;
}

.auth-kicker {
  margin: 0 0 12px;
  color: #0f766e;
  font-size: 12px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  font-weight: 700;
}

.auth-intro {
  margin: 0 0 4px;
  max-width: 34ch;
  color: #475569;
}

.auth-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}

.auth-tab {
  margin-top: 0;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(255, 255, 255, 0.6);
  color: #475569;
  box-shadow: none;
}

.auth-tab.active {
  background: linear-gradient(135deg, #14b8a6, #0891b2);
  border-color: transparent;
  color: white;
}

.auth-panel {
  margin-top: 14px;
}

.google-wrap {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
}

.auth-toast {
  margin: 16px 0 0;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(20, 184, 166, 0.1);
  border: 1px solid rgba(20, 184, 166, 0.24);
  color: #0f766e;
  font-size: 13px;
}

@media (prefers-reduced-motion: reduce) {
  .auth-bg-video {
    display: none;
  }

  .auth-page {
    background: linear-gradient(135deg, #f6fafc, #e9f3f7);
  }
}
</style>
