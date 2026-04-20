<template>
  <div class="detail-shell">
    <header class="detail-topbar">
      <button class="ghost-btn" type="button" @click="router.push('/home')">返回首页</button>
      <div class="detail-meta-actions">
        <span class="mini-tag">{{ detail.post?.contentType }}</span>
        <span class="mini-tag accent">{{ detail.post?.category }}</span>
      </div>
    </header>

    <p v-if="message" class="flash-message">{{ message }}</p>

    <div class="detail-layout">
      <main class="detail-main">
        <section class="detail-card hero-post">
          <div class="hero-strip">
            <span class="hero-badge">社区讨论</span>
            <span class="hero-badge accent">{{ detail.post?.category }}</span>
          </div>
          <div class="author-line">
            <strong class="author-link" @click="openAuthor(detail.post?.authorId)">{{ detail.post?.username }}</strong>
            <span class="mini-tag">Lv.{{ detail.post?.level }}</span>
            <span class="muted">{{ detail.post?.city }} · {{ detail.post?.publishedLabel }}</span>
          </div>
          <h1>{{ detail.post?.title }}</h1>
          <p class="lead">{{ detail.post?.summary }}</p>
          <div class="quick-stats">
            <article class="quick-stat">
              <strong>{{ detail.post?.views || 0 }}</strong>
              <span>阅读量</span>
            </article>
            <article class="quick-stat">
              <strong>{{ detail.post?.commentsCount || 0 }}</strong>
              <span>评论数</span>
            </article>
            <article class="quick-stat">
              <strong>{{ detail.post?.likesCount || 0 }}</strong>
              <span>点赞数</span>
            </article>
          </div>
          <div class="tag-row">
            <span v-for="tag in detail.post?.tags || []" :key="tag" class="topic-tag">{{ tag }}</span>
          </div>
          <div class="stats-line">
            <span>浏览 {{ detail.post?.views || 0 }}</span>
            <span>评论 {{ detail.post?.commentsCount || 0 }}</span>
            <span>点赞 {{ detail.post?.likesCount || 0 }}</span>
            <span>收藏 {{ detail.post?.favoritesCount || 0 }}</span>
          </div>
          <div class="reaction-row">
            <button type="button" :class="{ active: detail.post?.isLiked }" @click="toggleReaction('like')">
              {{ detail.post?.isLiked ? '已点赞' : '点赞' }}
            </button>
            <button type="button" :class="{ active: detail.post?.isFavorited }" @click="toggleReaction('favorite')">
              {{ detail.post?.isFavorited ? '已收藏' : '收藏' }}
            </button>
          </div>
          <div v-if="detail.post?.canManage" class="manage-row">
            <button class="ghost-btn" type="button" @click="router.push(`/compose?type=post&id=${detail.post.id}`)">编辑帖子</button>
            <button class="ghost-btn danger-btn" type="button" @click="handleDeletePost">删除帖子</button>
          </div>
        </section>

        <section class="detail-card content-card">
          <div class="section-head">
            <div>
              <p class="eyebrow">正文</p>
              <h3>帖子详情</h3>
            </div>
          </div>
          <div class="post-content">{{ detail.post?.content }}</div>
        </section>

        <section class="detail-card comment-card">
          <div class="section-head">
            <div>
              <p class="eyebrow">评论区</p>
              <h3>{{ detail.post?.commentsCount || 0 }} 条互动</h3>
            </div>
          </div>

          <div v-if="highlightedCommentId" class="comment-tools">
            <span class="mini-tag accent">已定位评论 #{{ highlightedCommentId }}</span>
            <div class="comment-tool-actions">
              <button
                v-if="previousFocusedCommentId"
                class="ghost-btn"
                type="button"
                @click="backToPreviousComment"
              >
                返回上一条定位评论
              </button>
              <button class="ghost-btn" type="button" @click="copyCommentLink">评论分享链接</button>
            </div>
          </div>

          <div v-if="replyTarget" class="reply-target">
            回复给：@{{ replyTarget.username }} · 仅支持一层楼中楼回复
            <button class="reply-cancel" type="button" @click="clearReply">取消回复</button>
          </div>

          <div class="comment-form">
            <textarea
              v-model.trim="commentForm.content"
              rows="4"
              placeholder="写下你的观点、补充或实战反馈"
            ></textarea>
            <button type="button" @click="handleCreateComment">发布评论</button>
          </div>

          <div ref="commentSection">
            <CommentTree
              :comments="detail.comments || []"
              :highlighted-id="highlightedCommentId"
              @reply="setReplyTarget"
              @like="handleToggleCommentLike"
              @report="handleReportComment"
              @delete="handleDeleteComment"
            />
          </div>
        </section>
      </main>

      <aside class="detail-side">
        <section class="detail-card side-card">
          <p class="eyebrow">作者信息</p>
          <h4 class="author-link" @click="openAuthor(detail.post?.authorId)">{{ detail.post?.username }}</h4>
          <p class="muted">{{ detail.post?.authorCity }} · Lv.{{ detail.post?.level }}</p>
          <p class="summary">{{ detail.post?.authorBio || '这个球友还没有留下个人简介。' }}</p>
          <div class="author-note">如果这篇内容对你有帮助，建议继续查看作者近期帖子，通常能读到更完整的打法和装备偏好。</div>
        </section>

        <section class="detail-card side-card">
          <div class="section-head compact-head">
            <div>
              <p class="eyebrow">作者更多帖子</p>
              <h3>继续看这位球友</h3>
            </div>
          </div>
          <article
            v-for="item in detail.recommendations?.authorPosts || []"
            :key="`author-${item.id}`"
            class="related-item"
            @click="openRelated(item.id)"
          >
            <strong>{{ item.title }}</strong>
            <span>{{ item.category }} · {{ item.city }}</span>
            <small>{{ item.publishedLabel }}</small>
          </article>
          <p v-if="!(detail.recommendations?.authorPosts || []).length" class="empty-copy">作者暂时还没有更多公开帖子。</p>
        </section>

        <section class="detail-card side-card">
          <div class="section-head compact-head">
            <div>
              <p class="eyebrow">同标签推荐</p>
              <h3>同话题继续延伸</h3>
            </div>
          </div>
          <article
            v-for="item in detail.recommendations?.tagPosts || []"
            :key="`tag-${item.id}`"
            class="related-item"
            @click="openRelated(item.id)"
          >
            <strong>{{ item.title }}</strong>
            <span>{{ item.category }} · {{ item.city }}</span>
            <small>{{ item.publishedLabel }}</small>
          </article>
          <p v-if="!(detail.recommendations?.tagPosts || []).length" class="empty-copy">当前标签下还没有更多可推荐内容。</p>
        </section>

        <section class="detail-card side-card">
          <div class="section-head compact-head">
            <div>
              <p class="eyebrow">同城相关讨论</p>
              <h3>看看本地球友在聊什么</h3>
            </div>
          </div>
          <article
            v-for="item in detail.recommendations?.cityPosts || []"
            :key="`city-${item.id}`"
            class="related-item"
            @click="openRelated(item.id)"
          >
            <strong>{{ item.title }}</strong>
            <span>{{ item.category }} · {{ item.city }}</span>
            <small>{{ item.publishedLabel }}</small>
          </article>
          <p v-if="!(detail.recommendations?.cityPosts || []).length" class="empty-copy">同城讨论还比较少，后续会优先补充。</p>
        </section>
      </aside>
    </div>
  </div>
</template>

<script>
import { nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CommentTree from '../components/CommentTree.vue';
import { useMessage } from '../composables/useMessage';
import {
  createForumComment,
  deleteForumPost,
  deleteForumComment,
  fetchForumPostDetail,
  reportForumComment,
  toggleForumCommentReaction,
  toggleForumReaction
} from '../api/forum';

function emptyDetail() {
  return {
    post: null,
    comments: [],
    relatedPosts: [],
    recommendations: {
      authorPosts: [],
      tagPosts: [],
      cityPosts: []
    },
    authorProfile: null
  };
}

function insertReply(list, comment) {
  for (const item of list) {
    if (item.id === comment.parentId) {
      item.replies = item.replies || [];
      item.replies.push(comment);
      return true;
    }
    if (item.replies?.length && insertReply(item.replies, comment)) {
      return true;
    }
  }
  return false;
}

function findCommentById(list, commentId) {
  for (const item of list || []) {
    if (Number(item.id) === Number(commentId)) {
      return item;
    }
    if (item.replies?.length) {
      const nested = findCommentById(item.replies, commentId);
      if (nested) {
        return nested;
      }
    }
  }
  return null;
}

function buildCommentSummary(comment) {
  if (!comment) {
    return '';
  }
  const prefix = comment.replyToUsername ? `回复 @${comment.replyToUsername}：` : '';
  const content = String(comment.content || '').replace(/\s+/g, ' ').trim();
  const text = `${prefix}${content}`;
  return text.length > 42 ? `${text.slice(0, 42)}...` : text;
}

function updateCommentInTree(list, commentId, updater) {
  return (list || []).map((item) => {
    if (Number(item.id) === Number(commentId)) {
      return updater(item);
    }
    if (item.replies?.length) {
      return {
        ...item,
        replies: updateCommentInTree(item.replies, commentId, updater)
      };
    }
    return item;
  });
}

export default {
  name: 'PostDetailView',
  components: {
    CommentTree
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const { message, showMessage } = useMessage();
    const detail = ref(emptyDetail());
    const commentForm = reactive({ content: '' });
    const replyTarget = ref(null);
    const commentSection = ref(null);
    const highlightedCommentId = ref(route.query.commentId || '');
    const previousFocusedCommentId = ref('');
    const focusHistory = ref([]);
    const skipHistoryRecord = ref(false);

    async function scrollToComment(commentId) {
      if (!commentId) {
        return;
      }
      await nextTick();
      const target = commentSection.value?.querySelector(`[data-comment-id="${commentId}"]`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    async function loadDetail() {
      try {
        const { data } = await fetchForumPostDetail(route.params.id);
        detail.value = data;
        replyTarget.value = null;
        highlightedCommentId.value = route.query.commentId || '';
        await scrollToComment(highlightedCommentId.value);
      } catch (error) {
        showMessage(error?.response?.data?.message || '帖子详情加载失败');
      }
    }

    async function handleCreateComment() {
      try {
        const { data } = await createForumComment(route.params.id, {
          content: commentForm.content,
          parentId: replyTarget.value?.id
        });
        const nextComments = JSON.parse(JSON.stringify(detail.value.comments || []));
        if (data.comment.parentId) {
          insertReply(nextComments, data.comment);
        } else {
          nextComments.push(data.comment);
        }
        detail.value = {
          ...detail.value,
          comments: nextComments,
          post: {
            ...detail.value.post,
            commentsCount: (detail.value.post?.commentsCount || 0) + 1
          }
        };
        commentForm.content = '';
        replyTarget.value = null;
        showMessage('评论发布成功');
      } catch (error) {
        showMessage(error?.response?.data?.message || '评论发布失败');
      }
    }

    async function toggleReaction(type) {
      try {
        const { data } = await toggleForumReaction(route.params.id, type);
        detail.value = {
          ...detail.value,
          post: {
            ...detail.value.post,
            likesCount: data.counts.likesCount,
            favoritesCount: data.counts.favoritesCount,
            isLiked: type === 'like' ? data.active : detail.value.post.isLiked,
            isFavorited: type === 'favorite' ? data.active : detail.value.post.isFavorited
          }
        };
      } catch (error) {
        showMessage(error?.response?.data?.message || '互动失败');
      }
    }

    async function handleToggleCommentLike(comment) {
      try {
        const { data } = await toggleForumCommentReaction(route.params.id, comment.id, 'like');
        detail.value = {
          ...detail.value,
          comments: updateCommentInTree(detail.value.comments, comment.id, (item) => ({
            ...item,
            isLiked: data.active,
            likesCount: data.counts.likesCount
          }))
        };
      } catch (error) {
        showMessage(error?.response?.data?.message || '评论点赞失败');
      }
    }

    async function handleReportComment(comment) {
      try {
        await reportForumComment(route.params.id, comment.id);
        detail.value = {
          ...detail.value,
          comments: updateCommentInTree(detail.value.comments, comment.id, (item) => ({
            ...item,
            isReported: true
          }))
        };
        showMessage('评论已举报');
      } catch (error) {
        showMessage(error?.response?.data?.message || '评论举报失败');
      }
    }

    async function handleDeleteComment(comment) {
      try {
        await deleteForumComment(route.params.id, comment.id);
        detail.value = {
          ...detail.value,
          comments: updateCommentInTree(detail.value.comments, comment.id, (item) => ({
            ...item,
            content: '该评论已删除',
            isDeleted: true,
            canDelete: false,
            isLiked: false,
            isReported: false,
            username: '已删除用户',
            level: 0,
            city: '',
            likesCount: 0
          })),
          post: {
            ...detail.value.post,
            commentsCount: Math.max((detail.value.post?.commentsCount || 1) - 1, 0)
          }
        };
        if (replyTarget.value && Number(replyTarget.value.id) === Number(comment.id)) {
          replyTarget.value = null;
        }
        showMessage('评论已删除');
      } catch (error) {
        showMessage(error?.response?.data?.message || '评论删除失败');
      }
    }

    async function handleDeletePost() {
      try {
        await deleteForumPost(route.params.id);
        showMessage('帖子已删除');
        router.push('/home');
      } catch (error) {
        showMessage(error?.response?.data?.message || '帖子删除失败');
      }
    }

    function buildCommentQuery(commentId) {
      return commentId ? { ...route.query, commentId: String(commentId) } : { ...route.query, commentId: undefined };
    }

    function backToPreviousComment() {
      const previous = focusHistory.value[focusHistory.value.length - 1];
      if (!previous) {
        return;
      }
      focusHistory.value = focusHistory.value.slice(0, -1);
      previousFocusedCommentId.value = focusHistory.value[focusHistory.value.length - 1] || '';
      skipHistoryRecord.value = true;
      router.push({
        path: route.path,
        query: buildCommentQuery(previous)
      });
    }

    async function copyCommentLink() {
      if (!highlightedCommentId.value || typeof window === 'undefined' || !navigator?.clipboard?.writeText) {
        showMessage('当前环境不支持复制评论链接');
        return;
      }
      const url = `${window.location.origin}${route.path}?commentId=${encodeURIComponent(highlightedCommentId.value)}`;
      const targetComment = findCommentById(detail.value.comments, highlightedCommentId.value);
      const summary = buildCommentSummary(targetComment);
      const shareText = [
        detail.value.post?.title ? `帖子：${detail.value.post.title}` : '',
        summary ? `评论：${summary}` : '',
        url
      ].filter(Boolean).join('\n');
      try {
        await navigator.clipboard.writeText(shareText);
        showMessage(summary ? '评论摘要与链接已复制' : '评论链接已复制');
      } catch (error) {
        showMessage('评论链接复制失败');
      }
    }

    function setReplyTarget(item) {
      replyTarget.value = item;
    }

    function clearReply() {
      replyTarget.value = null;
    }

    function openRelated(id) {
      router.push(`/posts/${id}`);
    }

    function openAuthor(id) {
      if (!id) return;
      router.push(`/users/${id}`);
    }

    onMounted(loadDetail);
    watch(() => route.params.id, async () => {
      focusHistory.value = [];
      previousFocusedCommentId.value = '';
      skipHistoryRecord.value = false;
      await loadDetail();
    });
    watch(() => route.query.commentId, async (value, oldValue) => {
      if (!skipHistoryRecord.value && oldValue && value && oldValue !== value) {
        focusHistory.value = [...focusHistory.value, String(oldValue)].slice(-8);
        previousFocusedCommentId.value = focusHistory.value[focusHistory.value.length - 1] || '';
      } else if (skipHistoryRecord.value) {
        skipHistoryRecord.value = false;
      }
      highlightedCommentId.value = value || '';
      await scrollToComment(highlightedCommentId.value);
    });

    return {
      router,
      message,
      detail,
      commentForm,
      replyTarget,
      commentSection,
      highlightedCommentId,
      previousFocusedCommentId,
      handleCreateComment,
      toggleReaction,
      handleToggleCommentLike,
      handleReportComment,
      handleDeleteComment,
      handleDeletePost,
      backToPreviousComment,
      copyCommentLink,
      setReplyTarget,
      clearReply,
      openRelated,
      openAuthor
    };
  }
};
</script>

<style scoped>
.detail-shell {
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px 20px 56px;
}

.detail-topbar,
.detail-card {
  border: 1px solid rgba(255, 255, 255, 0.62);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.82)),
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.1), transparent 25%),
    radial-gradient(circle at bottom left, rgba(20, 184, 166, 0.08), transparent 22%);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(18px);
}

.detail-topbar,
.row-between,
.section-head,
.author-line,
.stats-line,
.tag-row,
.detail-meta-actions,
.reaction-row,
.manage-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.detail-topbar {
  padding: 16px 18px;
  border-radius: 24px;
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) 320px;
  gap: 18px;
  margin-top: 18px;
}

.detail-card {
  padding: 22px;
  border-radius: 28px;
}

.hero-post {
  position: relative;
  overflow: hidden;
}

.hero-post::after {
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

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: #0369a1;
  background: rgba(14, 165, 233, 0.1);
  border: 1px solid rgba(14,165,233,0.14);
}

.hero-badge.accent {
  color: #0f766e;
  background: rgba(20,184,166,0.1);
  border-color: rgba(20,184,166,0.14);
}

.detail-card + .detail-card,
.side-card + .side-card {
  margin-top: 18px;
}

.hero-post h1,
.section-head h3,
.compact-head h3 {
  margin: 0;
  color: #0f172a;
  letter-spacing: -0.03em;
}

.lead,
.summary,
.post-content,
.muted,
.related-item span {
  color: #64748b;
}

.lead,
.post-content {
  line-height: 1.8;
}

.post-content {
  white-space: pre-wrap;
  color: #334155;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.quick-stat,
.related-item {
  padding: 14px;
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

.mini-tag,
.topic-tag {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: #0369a1;
  background: rgba(14, 165, 233, 0.1);
}

.mini-tag.accent,
.topic-tag {
  color: #0f766e;
  background: rgba(20, 184, 166, 0.12);
}

.ghost-btn {
  width: auto;
  margin-top: 0;
  padding: 10px 16px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(255, 255, 255, 0.82);
  color: #334155;
  box-shadow: none;
}

.reaction-row button,
.comment-form button,
.reply-cancel {
  width: auto;
}

.reaction-row button.active {
  background: linear-gradient(135deg, #0f766e, #14b8a6 55%, #38bdf8);
  color: #f8fafc;
}

.danger-btn {
  border-color: rgba(248, 113, 113, 0.3);
  color: #b91c1c;
}

.comment-form textarea {
  width: 100%;
  resize: vertical;
  min-height: 118px;
}

.reply-target {
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(14,165,233,0.08);
  border: 1px solid rgba(14,165,233,0.18);
  color: #0369a1;
}

.reply-cancel {
  margin-left: 8px;
  padding: 0;
  border: none;
  background: transparent;
  color: #0369a1;
  box-shadow: none;
}

.comment-tools,
.comment-tool-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.comment-tools {
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(14, 165, 233, 0.16);
  background: rgba(14, 165, 233, 0.08);
  justify-content: space-between;
}

.author-link {
  cursor: pointer;
}

.compact-head {
  margin-bottom: 12px;
}

.related-item {
  display: grid;
  gap: 4px;
  cursor: pointer;
}

.related-item + .related-item {
  margin-top: 10px;
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

.eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #0369a1;
  font-weight: 700;
}

.author-note {
  margin-top: 14px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(20, 184, 166, 0.08);
  border: 1px solid rgba(20, 184, 166, 0.12);
  color: #475569;
  line-height: 1.7;
}

@media (max-width: 980px) {
  .detail-layout,
  .quick-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .detail-shell {
    padding: 14px 14px 36px;
  }

  .detail-topbar,
  .row-between,
  .section-head,
  .comment-tools {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
