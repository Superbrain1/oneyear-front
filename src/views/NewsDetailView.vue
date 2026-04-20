<template>
  <div class="news-shell">
    <header class="news-topbar">
      <button class="ghost-btn" type="button" @click="router.push('/home')">返回首页</button>
      <div class="meta-tags">
        <span class="mini-tag accent">{{ detail.news?.category }}</span>
        <span class="mini-tag">{{ detail.news?.source }}</span>
      </div>
    </header>

    <p v-if="message" class="flash-message">{{ message }}</p>

    <div v-if="detail.news" class="news-layout">
      <main class="news-main">
        <section class="news-card hero-card">
          <div class="hero-strip">
            <span class="hero-badge">羽坛资讯</span>
            <span class="hero-badge accent">{{ detail.news?.category }}</span>
          </div>
          <p class="eyebrow">羽坛资讯</p>
          <h1>{{ detail.news.title }}</h1>
          <p class="lead">{{ detail.news.summary }}</p>
          <div class="quick-stats">
            <article class="quick-stat">
              <strong>{{ detail.news.views }}</strong>
              <span>阅读量</span>
            </article>
            <article class="quick-stat">
              <strong>{{ detail.news.commentsCount }}</strong>
              <span>评论数</span>
            </article>
            <article class="quick-stat">
              <strong>{{ detail.news.sharesCount }}</strong>
              <span>分享数</span>
            </article>
          </div>
          <div class="stats-line">
            <span>{{ detail.news.source }}</span>
            <span>{{ detail.news.publishedLabel }}</span>
            <span>阅读 {{ detail.news.views }}</span>
            <span>评论 {{ detail.news.commentsCount }}</span>
            <span>点赞 {{ detail.news.likesCount }}</span>
            <span>分享 {{ detail.news.sharesCount }}</span>
          </div>
          <div class="reaction-row">
            <button type="button" :class="{ active: detail.news.isLiked }" @click="toggleReaction('like')">
              {{ detail.news.isLiked ? '已点赞' : '点赞' }}
            </button>
            <button class="ghost-btn" type="button" @click="toggleReaction('share')">分享</button>
          </div>
        </section>

        <section class="news-card">
          <div class="section-head">
            <div>
              <p class="eyebrow">正文</p>
              <h3>新闻详情</h3>
            </div>
          </div>
          <div class="news-content">{{ detail.news.content }}</div>
        </section>

        <section class="news-card">
          <div class="section-head">
            <div>
              <p class="eyebrow">评论区</p>
              <h3>{{ detail.news.commentsCount || 0 }} 条评论</h3>
            </div>
          </div>
          <div class="comment-form">
            <textarea
              v-model.trim="commentForm.content"
              rows="4"
              placeholder="补充你的看法、赛场观察或装备判断"
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
            <p v-if="!detail.comments.length" class="empty-copy">还没有评论，欢迎发表第一条观点。</p>
          </div>
        </section>
      </main>

      <aside class="news-side">
        <section class="news-card side-card">
          <p class="eyebrow">上下篇</p>
          <button v-if="detail.previous" class="nav-card" type="button" @click="openNews(detail.previous.id)">
            <span>上一篇</span>
            <strong>{{ detail.previous.title }}</strong>
          </button>
          <p v-else class="empty-copy">已经是最新一篇。</p>
          <button v-if="detail.next" class="nav-card" type="button" @click="openNews(detail.next.id)">
            <span>下一篇</span>
            <strong>{{ detail.next.title }}</strong>
          </button>
          <p v-else class="empty-copy">已经是最早一篇。</p>
        </section>
      </aside>
    </div>
  </div>
</template>

<script>
import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMessage } from '../composables/useMessage';
import { createForumNewsComment, fetchForumNewsDetail, toggleForumNewsReaction } from '../api/forum';

function emptyDetail() {
  return {
    news: null,
    comments: [],
    previous: null,
    next: null
  };
}

export default {
  name: 'NewsDetailView',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const { message, showMessage } = useMessage();
    const detail = ref(emptyDetail());
    const commentForm = reactive({ content: '' });

    async function loadDetail() {
      try {
        const { data } = await fetchForumNewsDetail(route.params.id);
        detail.value = data;
      } catch (error) {
        showMessage(error?.response?.data?.message || '新闻详情加载失败');
      }
    }

    async function handleCreateComment() {
      try {
        const { data } = await createForumNewsComment(route.params.id, { content: commentForm.content });
        detail.value = {
          ...detail.value,
          comments: [...detail.value.comments, data.comment],
          news: {
            ...detail.value.news,
            commentsCount: (detail.value.news?.commentsCount || 0) + 1
          }
        };
        commentForm.content = '';
        showMessage('新闻评论发布成功');
      } catch (error) {
        showMessage(error?.response?.data?.message || '新闻评论发布失败');
      }
    }

    async function toggleReaction(type) {
      try {
        const { data } = await toggleForumNewsReaction(route.params.id, type);
        if (type === 'share') {
          const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/news/${route.params.id}` : '';
          if (shareUrl && navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(shareUrl);
          }
        }
        detail.value = {
          ...detail.value,
          news: {
            ...detail.value.news,
            isLiked: type === 'like' ? data.active : detail.value.news.isLiked,
            likesCount: data.counts.likesCount,
            sharesCount: data.counts.sharesCount
          }
        };
        showMessage(type === 'share' ? '新闻链接已复制并记录分享' : (data.active ? '新闻点赞成功' : '已取消新闻点赞'));
      } catch (error) {
        showMessage(error?.response?.data?.message || '新闻互动失败');
      }
    }

    function openNews(id) {
      router.push(`/news/${id}`);
    }

    onMounted(loadDetail);
    watch(() => route.params.id, loadDetail);

    return {
      router,
      message,
      detail,
      commentForm,
      handleCreateComment,
      toggleReaction,
      openNews
    };
  }
};
</script>

<style scoped>
.news-shell {
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px 20px 56px;
}

.news-topbar,
.news-card {
  border: 1px solid rgba(255, 255, 255, 0.62);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.82)),
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.1), transparent 25%),
    radial-gradient(circle at bottom left, rgba(20, 184, 166, 0.08), transparent 22%);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(18px);
}

.news-topbar,
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

.news-topbar {
  padding: 16px 18px;
  border-radius: 24px;
}

.news-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) 320px;
  gap: 18px;
  margin-top: 18px;
}

.news-card {
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
  background: rgba(14, 165, 233, 0.1);
  border: 1px solid rgba(14,165,233,0.14);
}

.hero-badge.accent,
.mini-tag.accent {
  color: #0f766e;
  background: rgba(20,184,166,0.1);
  border-color: rgba(20,184,166,0.14);
}

.news-card + .news-card,
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

.news-content {
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

.comment-form textarea {
  width: 100%;
  resize: vertical;
  min-height: 118px;
}

.comment-form button {
  margin-top: 12px;
  width: auto;
}

.comment-list {
  display: grid;
  gap: 12px;
  margin-top: 18px;
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
  .news-layout,
  .quick-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .news-shell {
    padding: 14px 14px 36px;
  }
}
</style>
