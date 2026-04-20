<template>
  <div class="market-shell">
    <header class="market-topbar">
      <button class="ghost-btn" type="button" @click="router.back()">返回</button>
      <div class="meta-actions">
        <span class="mini-tag" :class="{ accent: detail.item?.type === '出售' }">{{ detail.item?.type }}</span>
        <span class="mini-tag">{{ detail.item?.category }}</span>
      </div>
    </header>

    <p v-if="message" class="flash-message">{{ message }}</p>

    <div v-if="detail.item" class="market-layout">
      <main class="market-main">
        <section class="market-card hero-card">
          <div class="hero-strip">
            <span class="hero-badge">{{ detail.item.type }}</span>
            <span class="hero-badge accent">{{ detail.item.status === 'active' ? '正在交易中' : '状态已变更' }}</span>
          </div>
          <div class="hero-media">
            <img v-if="activeImageUrl" :src="activeImageUrl" alt="交易图片" class="hero-image" />
            <div v-else class="image-placeholder">{{ detail.item.title.slice(0, 1) }}</div>
            <div class="hero-copy">
              <div class="row-between">
                <div>
                  <p class="eyebrow">闲置交易</p>
                  <h1>{{ detail.item.title }}</h1>
                </div>
                <strong class="price-value">￥{{ detail.item.price }}</strong>
              </div>
              <p class="lead">{{ detail.item.summary }}</p>
            </div>
          </div>
          <div class="quick-stats">
            <article class="quick-stat">
              <strong>￥{{ detail.item.price }}</strong>
              <span>当前价格</span>
            </article>
            <article class="quick-stat">
              <strong>{{ detail.item.conditionLevel }}</strong>
              <span>物品成色</span>
            </article>
            <article class="quick-stat">
              <strong>{{ detail.item.commentCount || detail.comments.length || 0 }}</strong>
              <span>咨询条数</span>
            </article>
          </div>
          <div v-if="detail.item.imageUrls && detail.item.imageUrls.length > 1" class="thumb-row">
            <button
              v-for="(image, index) in detail.item.imageUrls"
              :key="`${image}-${index}`"
              type="button"
              class="thumb-btn"
              :class="{ active: activeImageUrl === image }"
              @click="activeImageUrl = image"
            >
              <img :src="image" alt="交易缩略图" />
            </button>
          </div>
          <div class="meta-grid">
            <article class="meta-item">
              <strong>交易类型</strong>
              <span>{{ detail.item.type }}</span>
            </article>
            <article class="meta-item">
              <strong>分类</strong>
              <span>{{ detail.item.category }}</span>
            </article>
            <article class="meta-item">
              <strong>成色</strong>
              <span>{{ detail.item.conditionLevel }}</span>
            </article>
            <article class="meta-item">
              <strong>城市</strong>
              <span>{{ detail.item.city }}</span>
            </article>
            <article class="meta-item">
              <strong>发布时间</strong>
              <span>{{ detail.item.publishedLabel }}</span>
            </article>
            <article class="meta-item">
              <strong>状态</strong>
              <span>{{ detail.item.status }}</span>
            </article>
          </div>
          <div v-if="detail.item.canManage" class="manage-row">
            <button type="button" @click="router.push(`/compose?type=marketplace&id=${detail.item.id}`)">编辑交易</button>
            <button
              v-if="detail.item.status === 'active'"
              class="ghost-btn"
              type="button"
              @click="handleUpdateStatus('completed')"
            >
              标记成交
            </button>
            <button
              v-else
              class="ghost-btn"
              type="button"
              @click="handleUpdateStatus('active')"
            >
              重新上架
            </button>
            <button class="ghost-btn danger-btn" type="button" @click="handleDelete">删除交易</button>
          </div>
        </section>

        <section class="market-card">
          <div class="section-head">
            <div>
              <p class="eyebrow">交易说明</p>
              <h3>物品详情</h3>
            </div>
          </div>
          <p class="detail-copy">{{ detail.item.summary }}</p>
          <div class="notice-box">
            平台仅提供信息展示，不参与交易流程。建议优先线下当面交易，并自行核验物品真伪和卖家身份。
          </div>
        </section>

        <section class="market-card">
          <div class="section-head">
            <div>
              <p class="eyebrow">咨询区</p>
              <h3>{{ detail.item.commentCount || detail.comments.length || 0 }} 条交易咨询</h3>
            </div>
          </div>
          <div class="comment-form">
            <textarea
              v-model.trim="commentForm.content"
              rows="4"
              placeholder="咨询成色、交易方式、面交时间或验货细节"
              data-testid="marketplace-comment-input"
            ></textarea>
            <button type="button" data-testid="marketplace-comment-submit" @click="handleCreateComment">发布咨询</button>
          </div>
          <div class="comment-list">
            <article v-for="item in detail.comments" :key="item.id" class="comment-card">
              <div class="row-between">
                <div class="comment-author">
                  <strong>{{ item.username }}</strong>
                  <span class="mini-tag">Lv.{{ item.level }}</span>
                  <span class="muted">{{ item.city }}</span>
                </div>
                <small class="muted">{{ item.publishedLabel }}</small>
              </div>
              <p class="comment-content">{{ item.content }}</p>
            </article>
            <p v-if="!detail.comments.length" class="empty-copy">当前还没有人咨询这条交易。</p>
          </div>
        </section>
      </main>

      <aside class="market-side">
        <section class="market-card side-card">
          <p class="eyebrow">卖家信息</p>
          <h3>{{ detail.item.sellerName }}</h3>
          <p class="muted">{{ detail.item.sellerCity }} · Lv.{{ detail.item.sellerLevel }}</p>
          <p class="summary">{{ detail.item.sellerBio || '这位卖家还没有留下更多简介。' }}</p>
          <div class="seller-note">建议先通过私信确认验货方式、面交时间和配件完整度，再决定是否继续交易。</div>
          <div class="manage-row">
            <button class="ghost-btn" type="button" @click="router.push(`/users/${detail.item.sellerId}`)">查看主页</button>
            <button
              v-if="!detail.item.canManage"
              type="button"
              data-testid="marketplace-contact-seller"
              @click="router.push(`/messages?userId=${detail.item.sellerId}&itemId=${detail.item.id}`)"
            >
              私信联系
            </button>
          </div>
        </section>

        <section class="market-card side-card">
          <p class="eyebrow">卖家更多交易</p>
          <article
            v-for="item in detail.recommendations?.sameSeller || []"
            :key="`seller-${item.id}`"
            class="related-item"
            @click="openItem(item.id)"
          >
            <strong>{{ item.title }}</strong>
            <span>{{ item.type }} · ￥{{ item.price }}</span>
            <small>{{ item.publishedLabel }}</small>
          </article>
          <p v-if="!(detail.recommendations?.sameSeller || []).length" class="empty-copy">卖家当前没有更多在售交易。</p>
        </section>

        <section class="market-card side-card">
          <p class="eyebrow">同类推荐</p>
          <article
            v-for="item in detail.recommendations?.sameCategory || []"
            :key="`category-${item.id}`"
            class="related-item"
            @click="openItem(item.id)"
          >
            <strong>{{ item.title }}</strong>
            <span>{{ item.city }} · ￥{{ item.price }}</span>
            <small>{{ item.publishedLabel }}</small>
          </article>
          <p v-if="!(detail.recommendations?.sameCategory || []).length" class="empty-copy">当前分类下还没有更多推荐。</p>
        </section>
      </aside>
    </div>
  </div>
</template>

<script>
import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMessage } from '../composables/useMessage';
import { createMarketplaceComment, deleteMarketplaceItem, fetchForumMarketplaceDetail, updateMarketplaceStatus } from '../api/forum';

function emptyDetail() {
  return {
    item: null,
    comments: [],
    recommendations: {
      sameSeller: [],
      sameCategory: []
    }
  };
}

export default {
  name: 'MarketplaceDetailView',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const { message, showMessage } = useMessage();
    const detail = ref(emptyDetail());
    const commentForm = reactive({ content: '' });
    const activeImageUrl = ref('');

    async function loadDetail() {
      try {
        const { data } = await fetchForumMarketplaceDetail(route.params.id);
        detail.value = data;
        activeImageUrl.value = data.item?.imageUrl || data.item?.imageUrls?.[0] || '';
      } catch (error) {
        showMessage(error?.response?.data?.message || '交易详情加载失败');
      }
    }

    function openItem(id) {
      router.push(`/marketplace/${id}`);
    }

    async function handleUpdateStatus(status) {
      try {
        await updateMarketplaceStatus(route.params.id, status);
        await loadDetail();
        showMessage(status === 'completed' ? '交易已标记成交' : '交易已重新上架');
      } catch (error) {
        showMessage(error?.response?.data?.message || '交易状态更新失败');
      }
    }

    async function handleDelete() {
      try {
        await deleteMarketplaceItem(route.params.id);
        showMessage('交易信息已删除');
        router.push('/home');
      } catch (error) {
        showMessage(error?.response?.data?.message || '删除交易失败');
      }
    }

    async function handleCreateComment() {
      try {
        const { data } = await createMarketplaceComment(route.params.id, { content: commentForm.content });
        detail.value = {
          ...detail.value,
          comments: [...detail.value.comments, data.comment],
          item: {
            ...detail.value.item,
            commentCount: (detail.value.item?.commentCount || 0) + 1
          }
        };
        commentForm.content = '';
        showMessage(data.message || '交易咨询已发布');
      } catch (error) {
        showMessage(error?.response?.data?.message || '交易咨询发布失败');
      }
    }

    onMounted(loadDetail);
    watch(() => route.params.id, loadDetail);

    return {
      router,
      message,
      detail,
      commentForm,
      activeImageUrl,
      openItem,
      handleCreateComment,
      handleUpdateStatus,
      handleDelete
    };
  }
};
</script>

<style scoped>
.market-shell {
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px 20px 56px;
}

.market-topbar,
.market-card {
  border: 1px solid rgba(255, 255, 255, 0.62);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.82)),
    radial-gradient(circle at top right, rgba(249, 115, 22, 0.1), transparent 25%),
    radial-gradient(circle at bottom left, rgba(20, 184, 166, 0.08), transparent 22%);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(18px);
}

.market-topbar,
.row-between,
.meta-actions,
.section-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.market-topbar {
  padding: 16px 18px;
  border-radius: 24px;
}

.market-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) 320px;
  gap: 18px;
  margin-top: 18px;
}

.market-card {
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
  right: -36px;
  top: -36px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 35%, rgba(255,255,255,0.74), rgba(255,255,255,0.06) 44%, transparent 58%),
    linear-gradient(135deg, rgba(249,115,22,0.14), rgba(20,184,166,0.08));
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

.hero-badge {
  color: #9a3412;
  background: rgba(249,115,22,0.12);
  border: 1px solid rgba(249,115,22,0.16);
}

.hero-badge.accent {
  color: #0f766e;
  background: rgba(20,184,166,0.1);
  border-color: rgba(20,184,166,0.16);
}

.market-card + .market-card,
.side-card + .side-card {
  margin-top: 18px;
}

.hero-media,
.meta-grid {
  display: grid;
  gap: 16px;
}

.hero-media {
  grid-template-columns: 180px 1fr;
  align-items: center;
}

.thumb-row {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.thumb-btn {
  width: 72px;
  height: 72px;
  padding: 0;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.05);
  overflow: hidden;
}

.thumb-btn.active {
  border-color: rgba(56, 189, 248, 0.48);
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.18);
}

.thumb-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  display: grid;
  place-items: center;
  min-height: 180px;
  border-radius: 24px;
  font-size: 54px;
  font-weight: 800;
  color: #431407;
  background: linear-gradient(135deg, #fdba74, #fde68a);
}

.hero-image {
  width: 100%;
  min-height: 180px;
  max-height: 240px;
  object-fit: cover;
  border-radius: 24px;
}

.hero-card h1,
.section-head h3,
.side-card h3 {
  margin: 0;
  color: #0f172a;
  letter-spacing: -0.03em;
}

.price-value {
  font-size: 32px;
  color: #c2410c;
  letter-spacing: -0.04em;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #c2410c;
  font-weight: 700;
}

.lead,
.summary,
.muted,
.detail-copy,
.related-item span {
  color: #64748b;
}

.detail-copy {
  line-height: 1.8;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.quick-stat,
.meta-item,
.notice-box,
.related-item,
.comment-card {
  padding: 14px;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74)),
    radial-gradient(circle at top right, rgba(249,115,22,0.06), transparent 28%);
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

.meta-grid {
  margin-top: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.meta-item strong {
  display: block;
  margin-bottom: 6px;
  color: #0f172a;
}

.notice-box {
  margin-top: 16px;
  color: #7c2d12;
  line-height: 1.7;
}

.comment-form {
  display: grid;
  gap: 12px;
}

.comment-list {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.comment-card {
  padding: 16px;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.comment-content {
  margin: 10px 0 0;
  color: #475569;
  line-height: 1.7;
}

.manage-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 18px;
}

.related-item {
  display: grid;
  gap: 4px;
  cursor: pointer;
}

.related-item + .related-item {
  margin-top: 10px;
}

.mini-tag.accent {
  color: #0f766e;
  background: rgba(20,184,166,0.12);
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

.danger-btn {
  color: #b91c1c;
  border-color: rgba(248, 113, 113, 0.3);
}

.empty-copy {
  margin: 0;
  color: #64748b;
  line-height: 1.7;
}

.flash-message {
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(20,184,166,0.2);
  background: rgba(20,184,166,0.08);
  color: #0f766e;
}

.seller-note {
  margin-top: 14px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(249, 115, 22, 0.08);
  border: 1px solid rgba(249, 115, 22, 0.14);
  color: #7c2d12;
  line-height: 1.7;
}

@media (max-width: 980px) {
  .market-layout,
  .hero-media,
  .quick-stats,
  .meta-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .market-shell {
    padding: 14px 14px 36px;
  }

  .market-topbar,
  .row-between,
  .section-head {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
