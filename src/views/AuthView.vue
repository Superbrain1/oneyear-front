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
        <h1>OneYear 泡泡论坛</h1>
        <p class="muted">前端与后端已分离，登录后进入泡泡首页。</p>

        <h3>登录</h3>
        <input v-model="loginForm.email" placeholder="邮箱" />
        <input v-model="loginForm.password" type="password" placeholder="密码" />
        <button @click="login">登录</button>

        <h3 style="margin-top:18px">注册</h3>
        <input v-model="registerForm.username" placeholder="用户名" />
        <input v-model="registerForm.email" placeholder="邮箱" />
        <input v-model="registerForm.password" type="password" placeholder="密码" />
        <button @click="register">注册</button>

        <p v-if="message" style="margin-bottom:0">{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuth } from '../composables/useAuth';
import { useMessage } from '../composables/useMessage';

export default {
  name: 'AuthView',
  setup() {
    const { message, showMessage } = useMessage();

    const { loginForm, registerForm, register, login } = useAuth({
      showMessage
    });

    return {
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
    radial-gradient(circle at 78% 24%, rgba(14, 165, 233, 0.22), transparent 38%),
    linear-gradient(140deg, rgba(2, 6, 23, 0.62), rgba(2, 6, 23, 0.34));
  z-index: 1;
}

.auth-content {
  position: relative;
  z-index: 2;
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
