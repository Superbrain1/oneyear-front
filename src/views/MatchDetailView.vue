<template>
  <div class="match-shell">
    <header class="match-topbar">
      <button class="ghost-btn" type="button" @click="router.push('/home')">返回首页</button>
      <div class="meta-tags">
        <span class="mini-tag">{{ detail.match?.matchType }}</span>
        <span class="mini-tag accent">{{ detail.match?.status }}</span>
      </div>
    </header>

    <p v-if="message" class="flash-message">{{ message }}</p>

    <div v-if="detail.match" class="match-layout">
      <main class="match-main">
        <section class="match-card hero-card">
          <div class="hero-strip">
            <span class="hero-badge">赛事追踪</span>
            <span class="hero-badge accent">{{ detail.match?.status }}</span>
          </div>
          <p class="eyebrow">赛事详情</p>
          <h1>{{ detail.match.title }}</h1>
          <p class="lead">{{ detail.match.highlight }}</p>
          <div class="quick-stats">
            <article class="quick-stat">
              <strong>{{ detail.match.currentScore }}</strong>
              <span>当前比分</span>
            </article>
            <article class="quick-stat">
              <strong>{{ detail.match.reminderCount }}</strong>
              <span>提醒人数</span>
            </article>
            <article class="quick-stat">
              <strong>{{ detail.comments.length }}</strong>
              <span>讨论条数</span>
            </article>
          </div>
          <div class="stats-line">
            <span>{{ detail.match.location }}</span>
            <span>{{ formatAbsoluteTime(detail.match.startTime) }}</span>
            <span>当前比分 {{ detail.match.currentScore }}</span>
            <span>关注 {{ detail.match.reminderCount }}</span>
          </div>
          <div class="reaction-row">
            <button type="button" :class="{ active: detail.match.isSubscribed }" @click="toggleReminder">
              {{ detail.match.isSubscribed ? '已设置提醒' : '设置提醒' }}
            </button>
          </div>
        </section>

        <section class="match-card">
          <div class="section-head">
            <div>
              <p class="eyebrow">赛事解读</p>
              <h3>比赛信息</h3>
            </div>
          </div>
          <div class="match-content">{{ detail.match.content }}</div>
        </section>

        <section class="match-card">
          <div class="section-head">
            <div>
              <p class="eyebrow">比分进程</p>
              <h3>赛况面板</h3>
            </div>
          </div>
          <div class="timeline-list">
            <article v-for="item in detail.match.timeline || []" :key="item.label" class="timeline-item">
              <strong>{{ item.label }}</strong>
              <span>{{ item.score }}</span>
            </article>
            <p v-if="!(detail.match.timeline || []).length" class="empty-copy">当前还没有比分进程数据。</p>
          </div>
        </section>

        <section class="match-card">
          <div class="section-head">
            <div>
              <p class="eyebrow">赛事评论</p>
              <h3>{{ detail.comments.length }} 条评论</h3>
            </div>
          </div>
          <div class="comment-form">
            <textarea
              v-model.trim="commentForm.content"
              rows="4"
              placeholder="讨论对阵、节奏、临场走势或提醒价值"
            ></textarea>
            <button type="button" @click="handleCreateComment">发表评论</button>
          </div>
          <div class="comment-list">
            <article v-for="item in detail.comments" :key="item.id" class="comment-item">
              <div class="comment-head">
                <strong>{{ item.username }}</strong>
                <span class="mini-tag">Lv.{{ item.level }}</span>
                <small class="muted">{{ item.city }} · {{ item.publishedLabel }}</small>
              </div>
              <p>{{ item.content }}</p>
            </article>
            <p v-if="!detail.comments.length" class="empty-copy">还没有人讨论这场比赛。</p>
          </div>
        </section>
      </main>

      <aside class="match-side">
        <section class="match-card side-card">
          <p class="eyebrow">前后赛事</p>
          <button v-if="detail.previous" class="nav-card" type="button" @click="openMatch(detail.previous.id)">
            <span>上一场</span>
            <strong>{{ detail.previous.title }}</strong>
          </button>
          <p v-else class="empty-copy">已经是最晚开始的一场。</p>
          <button v-if="detail.next" class="nav-card" type="button" @click="openMatch(detail.next.id)">
            <span>下一场</span>
            <strong>{{ detail.next.title }}</strong>
          </button>
          <p v-else class="empty-copy">已经是最早开始的一场。</p>
        </section>
      </aside>
    </div>
  </div>
</template>

<script>
import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMessage } from '../composables/useMessage';
import { createForumMatchComment, fetchForumMatchDetail, toggleForumMatchReminder } from '../api/forum';

function emptyDetail() {
  return {
    match: null,
    comments: [],
    previous: null,
    next: null
  };
}

export default {
  name: 'MatchDetailView',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const { message, showMessage } = useMessage();
    const detail = ref(emptyDetail());
    const commentForm = reactive({ content: '' });

    async function loadDetail() {
      try {
        const { data } = await fetchForumMatchDetail(route.params.id);
        detail.value = data;
      } catch (error) {
        showMessage(error?.response?.data?.message || '赛事详情加载失败');
      }
    }

    async function handleCreateComment() {
      try {
        const { data } = await createForumMatchComment(route.params.id, { content: commentForm.content });
        detail.value = {
          ...detail.value,
          comments: [...detail.value.comments, data.comment]
        };
        commentForm.content = '';
        showMessage('赛事评论发布成功');
      } catch (error) {
        showMessage(error?.response?.data?.message || '赛事评论发布失败');
      }
    }

    async function toggleReminder() {
      try {
        const { data } = await toggleForumMatchReminder(route.params.id);
        detail.value = {
          ...detail.value,
          match: {
            ...detail.value.match,
            isSubscribed: data.active,
            reminderCount: data.reminderCount
          }
        };
        showMessage(data.message || '赛事提醒已更新');
      } catch (error) {
        showMessage(error?.response?.data?.message || '赛事提醒更新失败');
      }
    }

    function openMatch(id) {
      router.push(`/matches/${id}`);
    }

    function formatAbsoluteTime(value) {
      return new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }

    onMounted(loadDetail);
    watch(() => route.params.id, loadDetail);

    return {
      router,
      message,
      detail,
      commentForm,
      handleCreateComment,
      toggleReminder,
      openMatch,
      formatAbsoluteTime
    };
  }
};
</script>

<style scoped>
.match-shell {
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px 20px 56px;
}

.match-topbar,
.match-card {
  border: 1px solid rgba(255, 255, 255, 0.62);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.82)),
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.1), transparent 25%),
    radial-gradient(circle at bottom left, rgba(20, 184, 166, 0.08), transparent 22%);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(18px);
}

.match-topbar,
.stats-line,
.reaction-row,
.section-head,
.comment-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.match-topbar {
  padding: 16px 18px;
  border-radius: 24px;
}

.match-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) 320px;
  gap: 18px;
  margin-top: 18px;
}

.match-card {
  padding: 22px;
  border-radius: 28px;
}

.hero-card {
  position: relative;
  overflow: hidden;
}

.hero-card::after {
  content: "";
  position: absolute;
  right: -30px;
  top: -46px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 35%, rgba(255,255,255,0.76), rgba(255,255,255,0.06) 44%, transparent 58%),
    linear-gradient(135deg, rgba(14,165,233,0.14), rgba(20,184,166,0.08));
  pointer-events: none;
}

.hero-strip,
.quick-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-strip {
  margin-bottom: 14px;
}

.hero-badge,
.mini-tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.hero-badge,
.mini-tag {
  color: #0369a1;
  background: rgba(14,165,233,0.1);
  border: 1px solid rgba(14,165,233,0.14);
}

.hero-badge.accent,
.mini-tag.accent {
  color: #0f766e;
  background: rgba(20,184,166,0.1);
  border-color: rgba(20,184,166,0.14);
}

.match-card + .match-card,
.side-card + .side-card {
  margin-top: 18px;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #0369a1;
  font-weight: 700;
}

.lead,
.muted,
.empty-copy {
  color: #64748b;
}

.match-content {
  white-space: pre-wrap;
  line-height: 1.85;
  color: #334155;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 18px 0;
}

.quick-stat,
.timeline-item,
.comment-item,
.nav-card {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.62);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.78)),
    radial-gradient(circle at top right, rgba(14,165,233,0.06), transparent 28%);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.05);
}

.quick-stat strong {
  display: block;
  font-size: 24px;
  color: #0f172a;
}

.quick-stat span {
  color: #64748b;
  font-size: 13px;
}

.reaction-row button,
.ghost-btn,
.nav-card {
  width: auto;
}

.ghost-btn {
  margin-top: 0;
  padding: 10px 16px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(255, 255, 255, 0.82);
  color: #334155;
  box-shadow: none;
}

.reaction-row button.active {
  background: linear-gradient(135deg, #0f766e, #14b8a6 55%, #38bdf8);
  color: #f8fafc;
}

.timeline-list,
.comment-list {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.comment-form textarea {
  width: 100%;
  resize: vertical;
  min-height: 118px;
}

.comment-form button {
  margin-top: 12px;
  width: auto;
}

.nav-card {
  margin-top: 12px;
  text-align: left;
  cursor: pointer;
  color: #334155;
}

.flash-message {
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(20,184,166,0.2);
  background: rgba(20,184,166,0.08);
  color: #0f766e;
}

@media (max-width: 980px) {
  .match-layout,
  .quick-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .match-shell {
    padding: 14px 14px 36px;
  }
}
</style>
