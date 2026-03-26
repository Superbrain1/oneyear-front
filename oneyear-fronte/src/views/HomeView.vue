<template>
  <div class="page">
    <div class="panel">
      <div class="row">
        <div>当前用户：{{ user?.username }}（ID {{ user?.id }}）</div>
        <button style="max-width:130px" @click="handleLogout">退出登录</button>
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
  </div>
</template>

<script>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useAuth } from '../composables/useAuth';
import { useCircles } from '../composables/useCircles';
import { useMessage } from '../composables/useMessage';

export default {
  name: 'HomeView',
  setup() {
    const store = useStore();
    const user = computed(() => store.state.auth.user);

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

    return {
      user,
      circles,
      bubbleStates,
      createCircleForm,
      inviteForm,
      joinForm,
      message,
      handleLogout,
      handleCreateCircle,
      createInvite,
      joinCircle
    };
  }
};
</script>
