const { createApp, ref, reactive, computed, onMounted, onBeforeUnmount } = Vue;

const api = axios.create({
  baseURL: 'http://127.0.0.1:3000/api',
  timeout: 10000
});

createApp({
  setup() {
    const token = ref(localStorage.getItem('token') || '');
    const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

    const loginForm = reactive({ email: '', password: '' });
    const registerForm = reactive({ username: '', email: '', password: '' });

    const circles = ref([]);
    const bubbleStates = reactive({});
    const timer = ref(null);

    const createCircleForm = reactive({ name: '', ownerId: 0 });
    const inviteForm = reactive({ circleId: '', ttlMinutes: 5, userId: 0 });
    const joinForm = reactive({ code: '', userId: 0 });

    const message = ref('');

    const isLoggedIn = computed(() => Boolean(token.value));

    function showMessage(text) {
      message.value = text;
      setTimeout(() => {
        if (message.value === text) message.value = '';
      }, 3000);
    }

    async function register() {
      try {
        await api.post('/auth/register', registerForm);
        showMessage('注册成功，请登录');
        registerForm.username = '';
        registerForm.email = '';
        registerForm.password = '';
      } catch (err) {
        showMessage(err?.response?.data?.message || '注册失败');
      }
    }

    async function login() {
      try {
        const { data } = await api.post('/auth/login', loginForm);
        token.value = data.token;
        user.value = data.user;
        localStorage.setItem('token', token.value);
        localStorage.setItem('user', JSON.stringify(user.value));
        createCircleForm.ownerId = user.value.id;
        inviteForm.userId = user.value.id;
        joinForm.userId = user.value.id;
        await fetchCircles();
      } catch (err) {
        showMessage(err?.response?.data?.message || '登录失败');
      }
    }

    function logout() {
      token.value = '';
      user.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      circles.value = [];
      if (timer.value) clearInterval(timer.value);
    }

    async function fetchCircles() {
      try {
        const { data } = await api.get('/circles');
        circles.value = data;
        initBubbleStates();
      } catch (err) {
        showMessage(err?.response?.data?.message || '加载圈子失败');
      }
    }

    function random(min, max) {
      return Math.random() * (max - min) + min;
    }

    function randomColor() {
      const h1 = Math.floor(random(0, 360));
      const h2 = (h1 + 120) % 360;
      return `conic-gradient(from 0deg, hsl(${h1} 85% 60%), hsl(${h2} 85% 62%), hsl(${h1} 85% 60%))`;
    }

    function initBubbleStates() {
      const width = Math.max(window.innerWidth - 100, 280);
      const height = Math.max(window.innerHeight * 0.68, 360);
      circles.value.forEach((item) => {
        if (!bubbleStates[item.id]) {
          const size = item.type === 'system' ? random(92, 120) : random(82, 108);
          bubbleStates[item.id] = {
            x: random(10, Math.max(20, width - size)),
            y: random(10, Math.max(20, height - size)),
            vx: random(-0.8, 0.8) || 0.4,
            vy: random(-0.8, 0.8) || 0.5,
            size,
            background: randomColor()
          };
        }
      });
    }

    function tick() {
      const width = Math.max(window.innerWidth - 80, 300);
      const height = Math.max(window.innerHeight * 0.68, 360);
      circles.value.forEach((item) => {
        const b = bubbleStates[item.id];
        if (!b) return;
        b.x += b.vx;
        b.y += b.vy;

        if (b.x <= 0 || b.x + b.size >= width) b.vx *= -1;
        if (b.y <= 0 || b.y + b.size >= height) b.vy *= -1;
      });
    }

    async function createCircle() {
      try {
        if (!createCircleForm.ownerId) createCircleForm.ownerId = user.value.id;
        await api.post('/circles', createCircleForm);
        showMessage('泡泡圈创建成功');
        createCircleForm.name = '';
        await fetchCircles();
      } catch (err) {
        showMessage(err?.response?.data?.message || '创建失败');
      }
    }

    async function createInvite() {
      try {
        const { data } = await api.post(`/circles/${inviteForm.circleId}/invite`, {
          userId: inviteForm.userId,
          ttlMinutes: Number(inviteForm.ttlMinutes)
        });
        showMessage(`邀请码: ${data.code}，有效 ${data.ttlMinutes} 分钟`);
      } catch (err) {
        showMessage(err?.response?.data?.message || '生成邀请码失败');
      }
    }

    async function joinCircle() {
      try {
        const { data } = await api.post('/circles/join', {
          code: joinForm.code,
          userId: joinForm.userId
        });
        showMessage(`加入成功，圈子ID: ${data.circleId}`);
        joinForm.code = '';
      } catch (err) {
        showMessage(err?.response?.data?.message || '加入失败');
      }
    }

    onMounted(async () => {
      if (isLoggedIn.value && user.value) {
        createCircleForm.ownerId = user.value.id;
        inviteForm.userId = user.value.id;
        joinForm.userId = user.value.id;
        await fetchCircles();
      }

      timer.value = setInterval(tick, 16);
    });

    onBeforeUnmount(() => {
      if (timer.value) clearInterval(timer.value);
    });

    return {
      token,
      user,
      isLoggedIn,
      loginForm,
      registerForm,
      circles,
      bubbleStates,
      createCircleForm,
      inviteForm,
      joinForm,
      message,
      register,
      login,
      logout,
      createCircle,
      createInvite,
      joinCircle
    };
  },
  template: `
    <div class="page">
      <div v-if="!isLoggedIn" class="auth">
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
      </div>

      <div v-else>
        <div class="panel">
          <div class="row">
            <div>当前用户：{{ user.username }}（ID {{ user.id }}）</div>
            <button style="max-width:130px" @click="logout">退出登录</button>
          </div>
          <p v-if="message" style="margin-bottom:0">{{ message }}</p>
        </div>

        <div class="hero" style="margin-top:16px">
          <div
            v-for="item in circles"
            :key="item.id"
            class="bubble"
            :style="{
              width: bubbleStates[item.id]?.size + 'px',
              height: bubbleStates[item.id]?.size + 'px',
              transform: 'translate(' + bubbleStates[item.id]?.x + 'px,' + bubbleStates[item.id]?.y + 'px)',
              background: bubbleStates[item.id]?.background
            }"
            :title="item.name"
          >
            {{ item.name }}
          </div>
          <button class="fab" title="创建泡泡圈">+</button>
        </div>

        <div class="panel">
          <h3>创建自定义泡泡圈</h3>
          <input v-model="createCircleForm.name" placeholder="圈子名称（2-20字）" />
          <button @click="createCircle">创建泡泡圈</button>
        </div>

        <div class="panel">
          <h3>生成邀请码（仅圈主）</h3>
          <div class="row">
            <input v-model="inviteForm.circleId" placeholder="圈子ID" />
            <select v-model="inviteForm.ttlMinutes">
              <option v-for="m in [1,3,5,10,15,20,25,30]" :key="m" :value="m">{{ m }}分钟</option>
            </select>
          </div>
          <button @click="createInvite">生成邀请码</button>
        </div>

        <div class="panel">
          <h3>通过邀请码加入</h3>
          <input v-model="joinForm.code" maxlength="8" placeholder="输入8位邀请码" />
          <button @click="joinCircle">加入圈子</button>
        </div>
      </div>
    </div>
  `
}).mount('#app');
