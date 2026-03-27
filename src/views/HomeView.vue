<template>
  <div class="page">
    <div class="panel">
      <div class="row">
        <div>当前用户：{{ user?.username }}（{{ user?.role || 'user' }}） ID {{ user?.id }}</div>
        <button style="max-width:130px" @click="handleLogout">退出登录</button>
      </div>
      <p v-if="message" style="margin-bottom:0">{{ message }}</p>
    </div>

    <div class="panel">
      <h3>个人信息</h3>
      <input v-model="profileForm.username" placeholder="用户名" />
      <input v-model="profileForm.email" placeholder="邮箱" />
      <input v-model="profileForm.password" type="password" placeholder="新密码（留空则不修改）" />
      <button @click="handleUpdateProfile">保存我的信息</button>
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
      <button @click="handleCreateCircle">创建泡泡圈</button>
    </div>

    <div class="panel">
      <h3>生成邀请码（仅圈主）</h3>
      <div class="row">
        <input v-model="inviteForm.circleId" placeholder="圈子ID" />
        <select v-model="inviteForm.ttlMinutes">
          <option v-for="m in [1, 3, 5, 10, 15, 20, 25, 30]" :key="m" :value="m">{{ m }}分钟</option>
        </select>
      </div>
      <button @click="createInvite">生成邀请码</button>
    </div>

    <div class="panel">
      <h3>通过邀请码加入</h3>
      <input v-model="joinForm.code" maxlength="8" placeholder="输入8位邀请码" />
      <button @click="joinCircle">加入圈子</button>
    </div>

    <div v-if="isSuperAdmin" class="panel">
      <h3>管理员控制台（主管理员）</h3>
      <button @click="loadAdminUsers">刷新用户列表</button>

      <div
        v-for="item in adminUsers"
        :key="item.id"
        style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,.1)"
      >
        <p style="margin:0 0 8px 0">
          #{{ item.id }} {{ item.username }} / {{ item.email }} / 角色：{{ item.role }}
        </p>
        <input v-model="item.editUsername" placeholder="用户名" />
        <input v-model="item.editEmail" placeholder="邮箱" />
        <input v-model="item.editPassword" type="password" placeholder="重置密码（留空不改）" />
        <div class="row">
          <select v-model="item.editRole">
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <button @click="saveAdminUser(item)">保存信息</button>
          <button @click="saveAdminRole(item)">仅更新角色</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useStore } from 'vuex';
import { useAuth } from '../composables/useAuth';
import { useCircles } from '../composables/useCircles';
import { useMessage } from '../composables/useMessage';
import { listAdminUsers, updateAdminUser, updateAdminUserRole, updateMe } from '../api/auth';

export default {
  name: 'HomeView',
  setup() {
    const store = useStore();
    const user = computed(() => store.state.auth.user);
    const token = computed(() => store.state.auth.token);
    const isSuperAdmin = computed(() => user.value?.role === 'super_admin');
    const adminUsers = ref([]);

    const profileForm = reactive({
      username: user.value?.username || '',
      email: user.value?.email || '',
      password: ''
    });

    const { message, showMessage } = useMessage();
    const {
      circles,
      bubbleStates,
      createCircleForm,
      inviteForm,
      joinForm,
      fetchCircles,
      createCircle,
      createInvite,
      joinCircle,
      setupFormsByUser,
      clearCirclesState,
      tick
    } = useCircles({ showMessage });

    const { logout } = useAuth({ showMessage });

    const timer = ref(null);

    onMounted(async () => {
      if (user.value) {
        setupFormsByUser(user.value);
      }
      await fetchCircles();
      timer.value = setInterval(tick, 16);

      if (isSuperAdmin.value) {
        await loadAdminUsers();
      }
    });

    onBeforeUnmount(() => {
      if (timer.value) {
        clearInterval(timer.value);
      }
    });

    function handleLogout() {
      logout(() => {
        clearCirclesState();
        if (timer.value) {
          clearInterval(timer.value);
        }
      });
    }

    function handleCreateCircle() {
      return createCircle(user.value?.id);
    }

    async function handleUpdateProfile() {
      try {
        const payload = {};
        if (profileForm.username?.trim()) {
          payload.username = profileForm.username.trim();
        }
        if (profileForm.email?.trim()) {
          payload.email = profileForm.email.trim();
        }
        if (profileForm.password?.trim()) {
          payload.password = profileForm.password.trim();
        }

        const { data } = await updateMe(payload);
        profileForm.password = '';
        await store.dispatch('auth/setAuth', {
          token: data.token || token.value,
          user: data.user
        });
        showMessage('个人信息已更新');
      } catch (err) {
        showMessage(err?.response?.data?.message || '更新失败');
      }
    }

    async function loadAdminUsers() {
      try {
        const { data } = await listAdminUsers();
        adminUsers.value = data.map((item) => ({
          ...item,
          editUsername: item.username,
          editEmail: item.email,
          editPassword: '',
          editRole: item.role === 'super_admin' ? 'admin' : item.role
        }));
      } catch (err) {
        showMessage(err?.response?.data?.message || '加载用户失败');
      }
    }

    async function saveAdminRole(item) {
      try {
        await updateAdminUserRole(item.id, item.editRole);
        showMessage('角色更新成功');
        await loadAdminUsers();
      } catch (err) {
        showMessage(err?.response?.data?.message || '角色更新失败');
      }
    }

    async function saveAdminUser(item) {
      try {
        const payload = {
          username: item.editUsername,
          email: item.editEmail
        };
        if (item.editPassword?.trim()) {
          payload.password = item.editPassword.trim();
        }
        await updateAdminUser(item.id, payload);

        if (item.role !== 'super_admin' && item.editRole !== item.role) {
          await updateAdminUserRole(item.id, item.editRole);
        }

        showMessage('用户信息更新成功');
        await loadAdminUsers();
      } catch (err) {
        showMessage(err?.response?.data?.message || '用户更新失败');
      }
    }

    return {
      user,
      isSuperAdmin,
      profileForm,
      adminUsers,
      circles,
      bubbleStates,
      createCircleForm,
      inviteForm,
      joinForm,
      message,
      handleLogout,
      handleCreateCircle,
      handleUpdateProfile,
      loadAdminUsers,
      saveAdminRole,
      saveAdminUser,
      createInvite,
      joinCircle
    };
  }
};
</script>
