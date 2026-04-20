<template>
  <div class="venue-shell">
    <header class="venue-topbar">
      <button class="ghost-btn" type="button" @click="router.back()">返回</button>
      <div class="meta-tags">
        <span class="mini-tag">{{ detail.venue?.city }}</span>
        <span class="mini-tag accent">评分 {{ detail.venue?.averageRating || 0 }}</span>
      </div>
    </header>

    <p v-if="message" class="flash-message">{{ message }}</p>

    <div v-if="detail.venue" class="venue-layout">
      <main class="venue-main">
        <section class="venue-card">
          <div class="hero-strip">
            <span class="hero-badge">场馆档案</span>
            <span class="hero-badge accent">评分 {{ detail.venue?.averageRating || 0 }}</span>
          </div>
          <p class="eyebrow">场馆详情</p>
          <h1>{{ detail.venue.name }}</h1>
          <p class="summary">{{ detail.venue.address }}</p>
          <div class="quick-stats">
            <article class="quick-stat">
              <strong>{{ detail.venue.favoriteCount }}</strong>
              <span>收藏人数</span>
            </article>
            <article class="quick-stat">
              <strong>{{ detail.venue.reviewCount }}</strong>
              <span>评价数</span>
            </article>
            <article class="quick-stat">
              <strong>{{ detail.venue.averageRating || 0 }}</strong>
              <span>平均评分</span>
            </article>
          </div>
          <div class="stats-line">
            <span>{{ detail.venue.businessHours }}</span>
            <span>{{ detail.venue.priceRange }}</span>
            <span>收藏 {{ detail.venue.favoriteCount }}</span>
            <span>评价 {{ detail.venue.reviewCount }}</span>
          </div>
          <div class="action-row">
            <button type="button" :class="{ active: detail.venue.isFavorited }" @click="toggleFavorite">
              {{ detail.venue.isFavorited ? '已收藏' : '收藏场馆' }}
            </button>
          </div>
          <p class="detail-copy">{{ detail.venue.evaluation }}</p>
        </section>

        <section class="venue-card">
          <div class="section-head">
            <div>
              <p class="eyebrow">球友评价</p>
              <h3>{{ detail.reviews.length }} 条评论</h3>
            </div>
          </div>
          <div class="review-form">
            <select v-model.number="reviewForm.rating">
              <option v-for="item in [5,4,3,2,1]" :key="item" :value="item">{{ item }} 星</option>
            </select>
            <textarea v-model.trim="reviewForm.content" rows="4" placeholder="说说场地、灯光、价格或约球体验"></textarea>
            <button type="button" @click="handleCreateReview">发布评价</button>
          </div>
          <div class="review-list">
            <article v-for="item in detail.reviews" :key="item.id" class="review-item">
              <div class="row-between">
                <strong>{{ item.username }}</strong>
                <span class="mini-tag accent">{{ item.rating }} 星</span>
              </div>
              <p>{{ item.content }}</p>
              <small class="muted">{{ item.city }} · {{ item.publishedLabel }}</small>
            </article>
          </div>
        </section>
      </main>

      <aside class="venue-side">
        <section class="venue-card">
          <p class="eyebrow">同城场馆</p>
          <article v-for="item in detail.relatedVenues || []" :key="item.id" class="related-item" @click="openVenue(item.id)">
            <strong>{{ item.name }}</strong>
            <small>{{ item.address }}</small>
          </article>
        </section>
      </aside>
    </div>
  </div>
</template>

<script>
import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMessage } from '../composables/useMessage';
import { createForumVenueReview, fetchForumVenueDetail, toggleForumVenueFavorite } from '../api/forum';

function emptyDetail() {
  return { venue: null, reviews: [], relatedVenues: [] };
}

export default {
  name: 'VenueDetailView',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const { message, showMessage } = useMessage();
    const detail = ref(emptyDetail());
    const reviewForm = reactive({ rating: 5, content: '' });

    async function loadDetail() {
      try {
        const { data } = await fetchForumVenueDetail(route.params.id);
        detail.value = data;
      } catch (error) {
        showMessage(error?.response?.data?.message || '场馆详情加载失败');
      }
    }

    async function toggleFavorite() {
      try {
        const { data } = await toggleForumVenueFavorite(route.params.id);
        detail.value = {
          ...detail.value,
          venue: {
            ...detail.value.venue,
            isFavorited: data.active,
            favoriteCount: data.favoriteCount
          }
        };
        showMessage(data.message || '场馆收藏状态已更新');
      } catch (error) {
        showMessage(error?.response?.data?.message || '场馆收藏失败');
      }
    }

    async function handleCreateReview() {
      try {
        const { data } = await createForumVenueReview(route.params.id, { ...reviewForm });
        detail.value = {
          ...detail.value,
          reviews: [data.review, ...(detail.value.reviews || [])],
          venue: {
            ...detail.value.venue,
            reviewCount: (detail.value.venue?.reviewCount || 0) + 1
          }
        };
        reviewForm.rating = 5;
        reviewForm.content = '';
        showMessage(data.message || '场馆评价已发布');
      } catch (error) {
        showMessage(error?.response?.data?.message || '场馆评价失败');
      }
    }

    function openVenue(id) {
      router.push(`/venues/${id}`);
    }

    onMounted(loadDetail);
    watch(() => route.params.id, loadDetail);

    return {
      router,
      message,
      detail,
      reviewForm,
      toggleFavorite,
      handleCreateReview,
      openVenue
    };
  }
};
</script>

<style scoped>
.venue-shell {
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px 20px 56px;
}

.venue-topbar,
.venue-card {
  border: 1px solid rgba(255,255,255,0.62);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.82)),
    radial-gradient(circle at top right, rgba(14,165,233,0.1), transparent 25%),
    radial-gradient(circle at bottom left, rgba(20,184,166,0.08), transparent 22%);
  box-shadow: 0 24px 64px rgba(15,23,42,0.1);
  backdrop-filter: blur(18px);
}

.venue-topbar,
.stats-line,
.section-head,
.row-between,
.action-row {
  display:flex;
  justify-content:space-between;
  gap:12px;
  align-items:center;
  flex-wrap:wrap;
}

.venue-topbar {
  padding:16px 18px;
  border-radius:24px;
}

.venue-layout {
  display:grid;
  grid-template-columns:minmax(0,1.8fr) 320px;
  gap:18px;
  margin-top:18px;
}

.venue-card {
  padding:22px;
  border-radius:28px;
}

.venue-card + .venue-card {
  margin-top:18px;
}

.hero-strip,
.quick-stats {
  display:flex;
  gap:10px;
  flex-wrap:wrap;
}

.hero-strip {
  margin-bottom:14px;
}

.hero-badge,
.mini-tag {
  display:inline-flex;
  align-items:center;
  padding:6px 11px;
  border-radius:999px;
  font-size:12px;
  font-weight:700;
}

.hero-badge,
.mini-tag {
  color:#0369a1;
  background:rgba(14,165,233,0.1);
  border:1px solid rgba(14,165,233,0.14);
}

.hero-badge.accent,
.mini-tag.accent {
  color:#0f766e;
  background:rgba(20,184,166,0.1);
  border-color:rgba(20,184,166,0.14);
}

.eyebrow {
  margin:0 0 6px;
  font-size:11px;
  letter-spacing:0.18em;
  text-transform:uppercase;
  color:#0369a1;
  font-weight:700;
}

.summary,
.muted,
.detail-copy {
  color:#64748b;
}

.detail-copy {
  line-height:1.8;
  color:#334155;
}

.quick-stats {
  display:grid;
  grid-template-columns:repeat(3, minmax(0,1fr));
  gap:12px;
  margin:18px 0;
}

.quick-stat,
.review-item,
.related-item {
  display:grid;
  gap:8px;
  padding:14px;
  border-radius:18px;
  border:1px solid rgba(255,255,255,0.62);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.78)),
    radial-gradient(circle at top right, rgba(14,165,233,0.06), transparent 28%);
  box-shadow: 0 16px 30px rgba(15,23,42,0.05);
}

.quick-stat strong {
  display:block;
  font-size:24px;
  color:#0f172a;
}

.quick-stat span {
  color:#64748b;
  font-size:13px;
}

.ghost-btn,
.action-row button,
.review-form button {
  width:auto;
}

.ghost-btn {
  margin-top:0;
  padding:10px 16px;
  border-radius:14px;
  border:1px solid rgba(148,163,184,0.22);
  background:rgba(255,255,255,0.82);
  color:#334155;
  box-shadow:none;
}

.action-row button.active {
  background: linear-gradient(135deg, #0f766e, #14b8a6 55%, #38bdf8);
  color:#f8fafc;
}

.review-form textarea,
.review-form select {
  width:100%;
}

.review-form textarea {
  min-height:118px;
}

.review-list {
  display:grid;
  gap:12px;
  margin-top:18px;
}

.related-item {
  cursor:pointer;
  margin-top:12px;
}

.flash-message {
  margin-top:16px;
  padding:14px 16px;
  border-radius:16px;
  border:1px solid rgba(20,184,166,0.2);
  background:rgba(20,184,166,0.08);
  color:#0f766e;
}

@media (max-width:980px) {
  .venue-layout,
  .quick-stats {
    grid-template-columns:1fr;
  }
}

@media (max-width:720px) {
  .venue-shell {
    padding:14px 14px 36px;
  }
}
</style>
