<template>
  <div class="activity-shell">
    <header class="activity-topbar">
      <button class="ghost-btn" type="button" @click="router.back()">返回</button>
      <div class="meta-actions">
        <span class="mini-tag">{{ detail.activity?.type }}</span>
        <span class="mini-tag accent">Lv.{{ detail.activity?.levelLimit }}+</span>
      </div>
    </header>

    <p v-if="message" class="flash-message">{{ message }}</p>

    <div v-if="detail.activity" class="activity-layout">
      <main class="activity-main">
        <section class="activity-card hero-card">
          <div class="hero-strip">
            <span class="hero-badge">同城组局</span>
            <span class="hero-badge accent">实时状态：{{ detail.activity.status }}</span>
          </div>
          <div class="row-between">
            <div>
              <p class="eyebrow">线下活动</p>
              <h1>{{ detail.activity.title }}</h1>
            </div>
            <span class="status-pill">{{ detail.activity.status }}</span>
          </div>
          <p class="lead">{{ detail.activity.summary }}</p>
          <div class="quick-stats">
            <article class="quick-stat">
              <strong>{{ detail.activity.signedCount }}/{{ detail.activity.capacity }}</strong>
              <span>当前报名</span>
            </article>
            <article class="quick-stat">
              <strong>Lv.{{ detail.activity.levelLimit }}+</strong>
              <span>参与门槛</span>
            </article>
            <article class="quick-stat">
              <strong>{{ reviewStatusLabel(detail.activity.reviewStatus) }}</strong>
              <span>审核状态</span>
            </article>
          </div>
          <div class="meta-grid">
            <article class="meta-item">
              <strong>城市</strong>
              <span>{{ detail.activity.city }}</span>
            </article>
            <article class="meta-item">
              <strong>场馆</strong>
              <span>{{ detail.activity.venueName }}</span>
            </article>
            <article class="meta-item">
              <strong>开始时间</strong>
              <span>{{ formatDateTime(detail.activity.startTime) }}</span>
            </article>
            <article class="meta-item">
              <strong>报名截止</strong>
              <span>{{ formatDateTime(detail.activity.signupDeadline) }}</span>
            </article>
            <article class="meta-item">
              <strong>人数</strong>
              <span>{{ detail.activity.signedCount }}/{{ detail.activity.capacity }}</span>
            </article>
            <article class="meta-item">
              <strong>发起人</strong>
              <span>{{ detail.activity.organizerName }} · Lv.{{ detail.activity.organizerLevel }}</span>
            </article>
          </div>
          <p class="address-copy">{{ detail.activity.address }}</p>
          <div class="status-bar">
            <span class="status-chip">审核状态：{{ reviewStatusLabel(detail.activity.reviewStatus) }}</span>
            <span class="status-chip">可见性：{{ detail.activity.visibilityLabel }}</span>
            <span class="status-chip">提醒状态：{{ detail.activity.reminderStatus }}</span>
            <span v-if="detail.activity.penaltyStatus" class="status-chip warning">限制提示：{{ detail.activity.penaltyStatus }}</span>
          </div>
          <div class="action-row">
            <button
              v-if="!detail.activity.canManage && !detail.activity.isJoined"
              type="button"
              :disabled="detail.activity.isSignupClosed || detail.activity.signedCount >= detail.activity.capacity"
              @click="handleRegister"
            >
              {{ detail.activity.isSignupClosed ? '报名已截止' : '立即报名' }}
            </button>
            <button v-else-if="!detail.activity.canManage" class="ghost-btn" type="button" @click="handleCancelRegistration">取消报名</button>
          </div>

          <div v-if="detail.activity.canManage" class="manage-panel">
            <div class="section-head">
              <div>
                <p class="eyebrow">发起人管理视角</p>
                <h3>活动运营状态</h3>
              </div>
            </div>
            <div class="manage-grid">
              <article class="meta-item">
                <strong>当前审核</strong>
                <span>{{ reviewStatusLabel(detail.activity.reviewStatus) }}</span>
              </article>
              <article class="meta-item">
                <strong>当前运营</strong>
                <span>{{ detail.activity.status }}</span>
              </article>
            </div>
            <div class="action-row">
              <button
                v-if="detail.activity.status !== 'closed' && detail.activity.reviewStatus === 'approved'"
                class="ghost-btn"
                type="button"
                @click="handleManageActivity({ status: 'closed' })"
              >
                关闭活动
              </button>
              <button
                v-if="detail.activity.status === 'closed' && detail.activity.reviewStatus === 'approved'"
                class="ghost-btn"
                type="button"
                @click="handleManageActivity({ status: 'published' })"
              >
                重新开放
              </button>
              <button
                v-if="detail.activity.reviewStatus === 'rejected'"
                class="ghost-btn"
                type="button"
                @click="handleManageActivity({ reviewStatus: 'pending' })"
              >
                重新提交审核
              </button>
            </div>
          </div>

          <div v-if="detail.activity.canReview" class="manage-panel review-panel">
            <div class="section-head">
              <div>
                <p class="eyebrow">管理员审核</p>
                <h3>审核动作</h3>
              </div>
            </div>
            <div class="action-row">
              <button type="button" @click="handleManageActivity({ reviewStatus: 'approved', status: 'published' })">审核通过</button>
              <button class="ghost-btn" type="button" @click="handleManageActivity({ reviewStatus: 'rejected' })">驳回活动</button>
              <button class="ghost-btn" type="button" @click="handleManageActivity({ reviewStatus: 'pending' })">转回待审核</button>
            </div>
          </div>
        </section>

        <section class="activity-card">
          <div class="section-head">
            <div>
              <p class="eyebrow">参与提醒</p>
              <h3>活动注意事项</h3>
            </div>
          </div>
          <div class="notes-list">
            <article v-for="item in detail.activity.notes || []" :key="item" class="note-card">
              {{ item }}
            </article>
          </div>
        </section>

        <section class="activity-card">
          <div class="section-head">
            <div>
              <p class="eyebrow">活动反馈</p>
              <h3>{{ detail.activity.feedbackCount || 0 }} 条评价 · 平均 {{ detail.activity.averageRating || 0 }} 分</h3>
            </div>
          </div>

          <div v-if="detail.activity.canLeaveFeedback" class="comment-form feedback-form">
            <div class="rating-row">
              <label for="feedback-rating">活动评分</label>
              <select id="feedback-rating" v-model.number="feedbackForm.rating" data-testid="activity-feedback-rating">
                <option :value="5">5 星，体验很好</option>
                <option :value="4">4 星，整体不错</option>
                <option :value="3">3 星，中规中矩</option>
                <option :value="2">2 星，体验一般</option>
                <option :value="1">1 星，需要改进</option>
              </select>
            </div>
            <textarea
              v-model.trim="feedbackForm.content"
              rows="4"
              placeholder="评价组织节奏、场馆安排、球友氛围，为之后报名的人提供参考"
              data-testid="activity-feedback-input"
            ></textarea>
            <button type="button" data-testid="activity-feedback-submit" @click="handleCreateFeedback">提交评价</button>
          </div>

          <p v-else class="summary muted">
            {{ feedbackHint(detail.activity) }}
          </p>

          <div class="comment-list">
            <article v-for="item in detail.feedback || []" :key="`feedback-${item.id}`" class="comment-card">
              <div class="row-between">
                <div class="comment-author">
                  <strong>{{ item.username }}</strong>
                  <span class="mini-tag">Lv.{{ item.level }}</span>
                  <span class="mini-tag accent">{{ item.rating }} 星</span>
                </div>
                <small class="muted">{{ item.publishedLabel }}</small>
              </div>
              <p class="comment-content">{{ item.content }}</p>
            </article>
          </div>
        </section>

        <section class="activity-card">
          <div class="section-head">
            <div>
              <p class="eyebrow">活动评论</p>
              <h3>{{ detail.comments.length }} 条讨论</h3>
            </div>
          </div>

          <div class="comment-form">
            <textarea
              v-model.trim="commentForm.content"
              rows="4"
              placeholder="提问活动细节、约同城球友或补充注意事项"
              data-testid="activity-comment-input"
            ></textarea>
            <button type="button" data-testid="activity-comment-submit" @click="handleCreateComment">发布评论</button>
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
          </div>
        </section>
      </main>

      <aside class="activity-side">
        <section class="activity-card side-card">
          <p class="eyebrow">报名列表</p>
          <h3>已报名球友</h3>
          <article v-for="item in detail.participants" :key="item.id" class="participant-card">
            <div class="row-between">
              <strong>{{ item.username }}</strong>
              <span class="mini-tag">Lv.{{ item.level }}</span>
            </div>
            <small class="muted">{{ item.city }} · {{ item.joinedLabel }}</small>
          </article>
        </section>

        <section class="activity-card side-card">
          <p class="eyebrow">组织信息</p>
          <h3>{{ detail.activity.organizerName }}</h3>
          <p class="summary">{{ detail.activity.organizerBio || '这位发起人还没有填写组织简介。' }}</p>
          <div class="organizer-note">适合先私信确认到场时间、补位需求和球馆规则，再决定是否参加。</div>
          <div class="action-row">
            <button class="ghost-btn" type="button" @click="router.push(`/users/${detail.activity.organizerId}`)">查看主页</button>
            <button
              v-if="!detail.activity.canManage"
              type="button"
              data-testid="activity-contact-organizer"
              @click="router.push(`/messages?userId=${detail.activity.organizerId}`)"
            >
              私信发起人
            </button>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<script>
import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMessage } from '../composables/useMessage';
import {
  cancelForumActivityRegistration,
  createForumActivityComment,
  createForumActivityFeedback,
  fetchForumActivityDetail,
  manageForumActivity,
  registerForumActivity
} from '../api/forum';

function emptyDetail() {
  return {
    activity: null,
    participants: [],
    comments: [],
    feedback: []
  };
}

export default {
  name: 'ActivityDetailView',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const { message, showMessage } = useMessage();
    const detail = ref(emptyDetail());
    const commentForm = reactive({ content: '' });
    const feedbackForm = reactive({ rating: 5, content: '' });

    async function loadDetail() {
      try {
        const { data } = await fetchForumActivityDetail(route.params.id);
        detail.value = data;
      } catch (error) {
        showMessage(error?.response?.data?.message || '活动详情加载失败');
      }
    }

    async function handleRegister() {
      try {
        await registerForumActivity(route.params.id);
        await loadDetail();
        showMessage('报名成功');
      } catch (error) {
        showMessage(error?.response?.data?.message || '活动报名失败');
      }
    }

    async function handleCancelRegistration() {
      try {
        await cancelForumActivityRegistration(route.params.id);
        await loadDetail();
        showMessage('已取消报名');
      } catch (error) {
        showMessage(error?.response?.data?.message || '取消报名失败');
      }
    }

    async function handleCreateComment() {
      try {
        const { data } = await createForumActivityComment(route.params.id, { content: commentForm.content });
        detail.value = {
          ...detail.value,
          comments: [...detail.value.comments, data.comment]
        };
        commentForm.content = '';
        showMessage('活动评论发布成功');
      } catch (error) {
        showMessage(error?.response?.data?.message || '活动评论发布失败');
      }
    }

    async function handleCreateFeedback() {
      try {
        const { data } = await createForumActivityFeedback(route.params.id, {
          rating: feedbackForm.rating,
          content: feedbackForm.content
        });
        detail.value = {
          ...detail.value,
          activity: {
            ...detail.value.activity,
            canLeaveFeedback: false,
            feedbackCount: (detail.value.activity?.feedbackCount || 0) + 1,
            averageRating: detail.value.feedback?.length
              ? Number((
                ((detail.value.activity?.averageRating || 0) * detail.value.feedback.length + feedbackForm.rating)
                / (detail.value.feedback.length + 1)
              ).toFixed(1))
              : Number(feedbackForm.rating)
          },
          feedback: [data.feedback, ...(detail.value.feedback || [])]
        };
        feedbackForm.rating = 5;
        feedbackForm.content = '';
        showMessage('活动评价提交成功');
      } catch (error) {
        showMessage(error?.response?.data?.message || '活动评价提交失败');
      }
    }

    async function handleManageActivity(payload) {
      try {
        await manageForumActivity(route.params.id, payload);
        await loadDetail();
        showMessage('活动状态已更新');
      } catch (error) {
        showMessage(error?.response?.data?.message || '活动状态更新失败');
      }
    }

    function formatDateTime(value) {
      return value ? new Date(value).toLocaleString('zh-CN') : '';
    }

    function reviewStatusLabel(value) {
      if (value === 'approved') return '已通过';
      if (value === 'rejected') return '已驳回';
      return '待审核';
    }

    function feedbackHint(activity) {
      if (!activity?.hasStarted) {
        return '活动开始后才开放评价。';
      }
      if (!activity?.isJoined) {
        return '仅报名参与过本次活动的用户可提交评价。';
      }
      return '你已经提交过本次活动评价。';
    }

    onMounted(loadDetail);
    watch(() => route.params.id, loadDetail);

    return {
      router,
      message,
      detail,
      commentForm,
      feedbackForm,
      handleRegister,
      handleCancelRegistration,
      handleCreateComment,
      handleCreateFeedback,
      handleManageActivity,
      formatDateTime,
      reviewStatusLabel,
      feedbackHint
    };
  }
};
</script>

<style scoped>
.activity-shell {
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px 20px 56px;
}

.activity-topbar,
.activity-card {
  border: 1px solid rgba(255, 255, 255, 0.62);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.82)),
    radial-gradient(circle at top right, rgba(20, 184, 166, 0.1), transparent 26%),
    radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.08), transparent 22%);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(18px);
}

.activity-topbar,
.row-between,
.section-head,
.comment-author,
.meta-actions,
.action-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.activity-topbar {
  padding: 16px 18px;
  border-radius: 24px;
}

.hero-card {
  position: relative;
  overflow: hidden;
}

.hero-card::after {
  content: "";
  position: absolute;
  right: -30px;
  top: -48px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 35%, rgba(255,255,255,0.78), rgba(255,255,255,0.06) 44%, transparent 58%),
    linear-gradient(135deg, rgba(20,184,166,0.16), rgba(14,165,233,0.08));
  pointer-events: none;
}

.activity-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) 320px;
  gap: 18px;
  margin-top: 18px;
}

.activity-card {
  padding: 22px;
  border-radius: 28px;
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

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: #0f766e;
  background: rgba(20, 184, 166, 0.1);
  border: 1px solid rgba(20, 184, 166, 0.16);
}

.hero-badge.accent {
  color: #9a3412;
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.16);
}

.side-card + .side-card,
.activity-card + .activity-card {
  margin-top: 18px;
}

.hero-card h1,
.section-head h3,
.side-card h3 {
  margin: 0;
  color: #0f172a;
  letter-spacing: -0.03em;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #0f766e;
  font-weight: 700;
}

.lead,
.summary,
.muted,
.address-copy,
.comment-content {
  color: #64748b;
}

.lead,
.comment-content {
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
.comment-card,
.participant-card {
  padding: 14px;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.72)),
    radial-gradient(circle at top right, rgba(20,184,166,0.06), transparent 28%);
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

.meta-grid,
.comment-list {
  display: grid;
  gap: 12px;
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

.status-pill,
.mini-tag {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: #0f766e;
  background: rgba(20,184,166,0.1);
}

.mini-tag.accent,
.status-pill {
  color: #9a3412;
  background: rgba(245,158,11,0.14);
}

.address-copy {
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(15, 118, 110, 0.06);
  border: 1px solid rgba(20, 184, 166, 0.12);
}

.status-bar,
.manage-grid {
  display: grid;
  gap: 12px;
}

.status-bar {
  margin-top: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.manage-grid {
  margin-top: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.status-chip {
  display: inline-flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(255,255,255,0.78);
  border: 1px solid rgba(148,163,184,0.18);
  color: #334155;
}

.status-chip.warning {
  color: #9a3412;
  background: rgba(245, 158, 11, 0.12);
}

.notes-list {
  display: grid;
  gap: 10px;
}

.note-card {
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.62);
  background: linear-gradient(180deg, rgba(255,255,255,0.84), rgba(255,255,255,0.72));
  color: #475569;
  line-height: 1.7;
}

.action-row {
  margin-top: 18px;
}

.manage-panel {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid rgba(148,163,184,0.16);
}

.comment-form textarea {
  width: 100%;
  resize: vertical;
  min-height: 118px;
}

.feedback-form {
  margin-bottom: 18px;
}

.rating-row {
  display: grid;
  gap: 8px;
}

.rating-row label {
  font-size: 13px;
  color: #475569;
}

.rating-row select {
  width: 100%;
}

.comment-form button,
.ghost-btn {
  width: auto;
}

.comment-form button {
  margin-top: 12px;
}

.participant-card + .participant-card {
  margin-top: 10px;
}

.ghost-btn {
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

.organizer-note {
  margin-top: 14px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(14, 165, 233, 0.08);
  border: 1px solid rgba(14, 165, 233, 0.12);
  color: #475569;
  line-height: 1.7;
}

@media (max-width: 980px) {
  .activity-layout,
  .quick-stats,
  .meta-grid,
  .status-bar,
  .manage-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .activity-shell {
    padding: 14px 14px 36px;
  }

  .activity-topbar,
  .row-between,
  .section-head {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
