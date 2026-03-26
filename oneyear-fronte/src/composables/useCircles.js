import { computed, reactive } from 'vue';
import { useStore } from 'vuex';
import { createCircleApi, createInviteApi, fetchCirclesApi, joinCircleApi } from '../api/circles';

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function randomColor() {
  const h1 = Math.floor(random(0, 360));
  const h2 = (h1 + 120) % 360;
  return `conic-gradient(from 0deg, hsl(${h1} 85% 60%), hsl(${h2} 85% 62%), hsl(${h1} 85% 60%))`;
}

export function useCircles({ showMessage }) {
  const store = useStore();
  const circles = computed(() => store.state.circles.list);
  const bubbleStates = computed(() => store.state.circles.bubbleStates);

  const createCircleForm = reactive({ name: '', ownerId: 0 });
  const inviteForm = reactive({ circleId: '', ttlMinutes: 5, userId: 0 });
  const joinForm = reactive({ code: '', userId: 0 });

  async function fetchCircles() {
    try {
      const { data } = await fetchCirclesApi();
      await store.dispatch('circles/setCircles', data);
      initBubbleStates();
    } catch (err) {
      showMessage(err?.response?.data?.message || '加载圈子失败');
    }
  }

  async function createCircle(userId) {
    try {
      if (!createCircleForm.ownerId) {
        createCircleForm.ownerId = userId;
      }
      await createCircleApi(createCircleForm);
      showMessage('泡泡圈创建成功');
      createCircleForm.name = '';
      await fetchCircles();
    } catch (err) {
      showMessage(err?.response?.data?.message || '创建失败');
    }
  }

  async function createInvite() {
    try {
      const { data } = await createInviteApi(inviteForm.circleId, {
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
      const { data } = await joinCircleApi({
        code: joinForm.code,
        userId: joinForm.userId
      });
      showMessage(`加入成功，圈子ID: ${data.circleId}`);
      joinForm.code = '';
    } catch (err) {
      showMessage(err?.response?.data?.message || '加入失败');
    }
  }

  function setupFormsByUser(user) {
    if (!user) {
      return;
    }
    createCircleForm.ownerId = user.id;
    inviteForm.userId = user.id;
    joinForm.userId = user.id;
  }

  function clearCirclesState() {
    store.dispatch('circles/clearCircles');
  }

  function initBubbleStates() {
    const width = Math.max(window.innerWidth - 100, 280);
    const height = Math.max(window.innerHeight * 0.68, 360);

    circles.value.forEach((item) => {
      if (!bubbleStates.value[item.id]) {
        const size = item.type === 'system' ? random(92, 120) : random(82, 108);
        store.dispatch('circles/setBubbleState', {
          id: item.id,
          value: {
          x: random(10, Math.max(20, width - size)),
          y: random(10, Math.max(20, height - size)),
          vx: random(-0.8, 0.8) || 0.4,
          vy: random(-0.8, 0.8) || 0.5,
          size,
          background: randomColor()
          }
        });
      }
    });
  }

  function tick() {
    const width = Math.max(window.innerWidth - 80, 300);
    const height = Math.max(window.innerHeight * 0.68, 360);
    circles.value.forEach((item) => {
      const bubble = bubbleStates.value[item.id];
      if (!bubble) {
        return;
      }
      let nextX = bubble.x + bubble.vx;
      let nextY = bubble.y + bubble.vy;
      let nextVx = bubble.vx;
      let nextVy = bubble.vy;

      if (nextX <= 0 || nextX + bubble.size >= width) {
        nextVx *= -1;
      }
      if (nextY <= 0 || nextY + bubble.size >= height) {
        nextVy *= -1;
      }

      store.dispatch('circles/updateBubblePosition', {
        id: item.id,
        x: nextX,
        y: nextY,
        vx: nextVx,
        vy: nextVy
      });
    });
  }

  return {
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
  };
}
