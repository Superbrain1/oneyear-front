<template>
  <div class="profile-shell">
    <header class="profile-topbar">
      <button class="ghost-btn" type="button" @click="router.back()">返回</button>
    </header>

    <p v-if="message" class="flash-message">{{ message }}</p>

    <div class="profile-layout" v-if="profile.author">
      <aside class="hero-card">
        <div class="hero-strip">
          <span class="hero-badge">球友主页</span>
          <span class="hero-badge accent">Lv.{{ profile.author.level }}</span>
        </div>
        <span class="mini-tag accent">Lv.{{ profile.author.level }}</span>
        <h1>{{ profile.author.username }}</h1>
        <p class="muted">{{ profile.author.city }} · {{ profile.author.role }}</p>
        <p class="summary">{{ profile.author.bio || '这个球友还没有留下个人简介。' }}</p>
        <div class="quick-stats">
          <article class="quick-stat">
            <strong>{{ profile.stats.postCount }}</strong>
            <span>帖子</span>
          </article>
          <article class="quick-stat">
            <strong>{{ profile.stats.activityCount }}</strong>
            <span>活动</span>
          </article>
          <article class="quick-stat">
            <strong>{{ profile.stats.marketplaceCount }}</strong>
            <span>交易</span>
          </article>
        </div>
        <div class="stats-line">
          <span>帖子 {{ profile.stats.postCount }}</span>
          <span>活动 {{ profile.stats.activityCount }}</span>
          <span>交易 {{ profile.stats.marketplaceCount }}</span>
          <span>关注 {{ profile.stats.followingCount || 0 }}</span>
          <span>粉丝 {{ profile.stats.followerCount || 0 }}</span>
        </div>
        <div class="hero-actions">
          <button
            v-if="currentUserId && Number(profile.author.id) !== currentUserId"
            class="ghost-btn"
            type="button"
            @click="handleToggleFollow"
          >
            {{ profile.relation?.isFollowing ? '已关注' : '关注作者' }}
          </button>
          <button
            v-if="currentUserId && Number(profile.author.id) !== currentUserId"
            type="button"
            @click="router.push(`/messages?userId=${profile.author.id}`)"
          >
            私信联系
          </button>
        </div>
      </aside>

      <main class="content-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">作者主页</p>
            <h3>最近发布</h3>
          </div>
          <span class="section-mark">实战内容优先</span>
        </div>
        <div class="post-list">
          <article
            v-for="item in profile.latestPosts"
            :key="item.id"
            class="post-card"
            @click="router.push(`/posts/${item.id}`)"
          >
            <div class="row-between">
              <h4>{{ item.title }}</h4>
              <span class="mini-tag">{{ item.category }}</span>
            </div>
            <p class="summary">{{ item.summary }}</p>
            <div class="stats-line">
              <span>{{ item.publishedLabel }}</span>
              <span>赞 {{ item.likesCount }}</span>
              <span>评 {{ item.commentsCount }}</span>
            </div>
          </article>
        </div>

        <div class="sub-section">
          <div class="panel-head">
            <div>
              <p class="eyebrow">活动记录</p>
              <h3>最近活动</h3>
            </div>
          </div>
          <div class="post-list">
            <article
              v-for="item in profile.activities || []"
              :key="`activity-${item.id}`"
              class="post-card"
              @click="router.push(`/activities/${item.id}`)"
            >
              <div class="row-between">
                <h4>{{ item.title }}</h4>
                <span class="mini-tag">{{ item.type }}</span>
              </div>
              <p class="summary">{{ item.city }} · {{ item.venueName }}</p>
              <div class="stats-line">
                <span>{{ item.publishedLabel }}</span>
                <span>{{ item.signedCount }}/{{ item.capacity }} 人</span>
                <span>{{ item.status }}</span>
              </div>
            </article>
          </div>
        </div>

        <div class="sub-section">
          <div class="panel-head">
            <div>
              <p class="eyebrow">交易记录</p>
              <h3>最近闲置交易</h3>
            </div>
          </div>
          <div class="post-list">
            <article
              v-for="item in profile.marketplace || []"
              :key="`market-${item.id}`"
              class="post-card"
              @click="router.push(`/marketplace/${item.id}`)"
            >
              <div class="row-between">
                <h4>{{ item.title }}</h4>
                <span class="mini-tag">{{ item.type }}</span>
              </div>
              <p class="summary">{{ item.summary }}</p>
              <div class="stats-line">
                <span>{{ item.city }}</span>
                <span>￥{{ item.price }}</span>
                <span>{{ item.publishedLabel }}</span>
              </div>
            </article>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useMessage } from '../composables/useMessage';
import { fetchForumUserProfile, toggleForumFollow } from '../api/forum';

export default {
  name: 'UserProfileView',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const { message, showMessage } = useMessage();
    const profile = ref({ author: null, stats: {}, latestPosts: [], activities: [], marketplace: [] });
    const currentUserId = computed(() => Number(store.state.auth.user?.id || 0));

    async function loadProfile() {
      try {
        const { data } = await fetchForumUserProfile(route.params.id);
        profile.value = data;
      } catch (error) {
        showMessage(error?.response?.data?.message || '作者主页加载失败');
      }
    }

    async function handleToggleFollow() {
      try {
        const { data } = await toggleForumFollow(route.params.id);
        profile.value = {
          ...profile.value,
          relation: {
            ...(profile.value.relation || {}),
            isFollowing: data.active
          },
          stats: {
            ...profile.value.stats,
            followingCount: data.counts.followingCount,
            followerCount: data.counts.followerCount
          }
        };
        showMessage(data.message || '关注状态已更新');
      } catch (error) {
        showMessage(error?.response?.data?.message || '关注操作失败');
      }
    }

    onMounted(loadProfile);
    watch(() => route.params.id, loadProfile);

    return {
      router,
      message,
      profile,
      currentUserId,
      handleToggleFollow
    };
  }
};
</script>

<style scoped>
.profile-shell {
  max-width: 1160px;
  margin: 0 auto;
  padding: 24px 20px 56px;
}

.profile-topbar,
.hero-card,
.content-panel {
  border: 1px solid rgba(255,255,255,0.62);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.82)),
    radial-gradient(circle at top right, rgba(14,165,233,0.1), transparent 25%),
    radial-gradient(circle at bottom left, rgba(20,184,166,0.08), transparent 22%);
  box-shadow: 0 24px 64px rgba(15,23,42,0.1);
  backdrop-filter: blur(18px);
}

.profile-topbar {
  padding: 16px 18px;
  border-radius: 24px;
}

.profile-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 18px;
  margin-top: 18px;
}

.hero-card,
.content-panel {
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
  top: -40px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 35%, rgba(255,255,255,0.76), rgba(255,255,255,0.06) 44%, transparent 58%),
    linear-gradient(135deg, rgba(14,165,233,0.14), rgba(20,184,166,0.08));
  pointer-events: none;
}

.panel-head,
.row-between,
.stats-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #0f766e;
  font-weight: 700;
}

.hero-card h1,
.panel-head h3 {
  margin: 0;
  color: #0f172a;
  letter-spacing: -0.03em;
}

.hero-strip,
.quick-stats,
.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-strip {
  margin-bottom: 14px;
}

.hero-badge,
.mini-tag,
.section-mark {
  display: inline-flex;
  align-items: center;
  padding: 6px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.hero-badge,
.section-mark {
  color: #0369a1;
  background: rgba(14,165,233,0.1);
  border: 1px solid rgba(14,165,233,0.14);
}

.hero-badge.accent,
.mini-tag {
  color: #0f766e;
  background: rgba(20,184,166,0.1);
  border: 1px solid rgba(20,184,166,0.14);
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.quick-stat,
.post-card {
  padding: 16px;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74)),
    radial-gradient(circle at top right, rgba(14,165,233,0.06), transparent 28%);
  border: 1px solid rgba(255,255,255,0.62);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.05);
}

.quick-stat strong {
  display: block;
  font-size: 24px;
  color: #0f172a;
  letter-spacing: -0.03em;
}

.quick-stat span {
  color: #64748b;
  font-size: 13px;
}

.post-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.sub-section {
  margin-top: 24px;
}

.post-card {
  cursor: pointer;
}

.hero-actions {
  margin-top: 18px;
}

.hero-actions button {
  width: auto;
}

.summary,
.muted {
  color: #64748b;
  line-height: 1.7;
}

.ghost-btn {
  width: auto;
  margin-top: 0;
  padding: 10px 16px;
  border-radius: 14px;
  border: 1px solid rgba(148,163,184,0.22);
  background: rgba(255,255,255,0.82);
  color: #334155;
  box-shadow: none;
}

.flash-message {
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(20,184,166,0.2);
  background: rgba(20,184,166,0.08);
  color: #0f766e;
}

@media (max-width: 900px) {
  .profile-layout,
  .quick-stats {
    grid-template-columns: 1fr;
  }
}
</style>
