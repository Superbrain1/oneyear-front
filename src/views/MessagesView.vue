<template>
  <div class="messages-shell">
    <header class="messages-topbar">
      <button class="ghost-btn" type="button" @click="router.back()">返回</button>
      <div>
        <p class="eyebrow">私信中心</p>
        <h1>站内私信</h1>
      </div>
    </header>

    <p v-if="message" class="flash-message">{{ message }}</p>

    <div class="messages-layout">
      <aside class="messages-sidebar">
        <div class="section-head">
          <div>
            <p class="eyebrow">会话列表</p>
            <h3>{{ conversations.length }} 个会话</h3>
          </div>
          <span class="sidebar-state">{{ conversations.some((item) => item.unreadCount) ? '有未读消息' : '已全部同步' }}</span>
        </div>
        <article
          v-for="item in conversations"
          :key="item.id"
          class="conversation-card"
          :class="{ active: activeConversationId === item.id, unread: item.unreadCount && activeConversationId !== item.id }"
          :data-testid="`conversation-card-${item.id}`"
          @click="openConversation(item.id)"
        >
          <div class="row-between">
            <strong>{{ item.peerUsername }}</strong>
            <div class="card-badges">
              <span v-if="item.unreadCount" class="unread-dot">{{ item.unreadCount }}</span>
              <span v-else class="read-pill">已读</span>
            </div>
          </div>
          <p class="summary">{{ item.contextType === 'marketplace' ? `交易：${item.contextTitle}` : '普通私信' }}</p>
          <small class="muted">{{ item.lastMessage || '还没有消息' }} · {{ item.updatedLabel }}</small>
          <small class="card-status" :class="{ unread: item.unreadCount }">
            {{ item.unreadCount ? `${item.unreadLabel} · ${item.lastUnreadLabel || '刚刚收到'}` : '对话已经同步到已读' }}
          </small>
        </article>
      </aside>

      <main class="messages-main">
        <template v-if="activeConversation">
          <section class="messages-card">
            <div class="conversation-hero">
              <div class="hero-copy">
                <p class="eyebrow">当前会话</p>
                <h2>{{ activeConversation.peer?.username }}</h2>
                <p class="summary">围绕明确上下文沟通交易、约球或活动细节，减少碎片化私信带来的信息丢失。</p>
              </div>
              <div class="hero-meta">
                <span class="hero-chip">{{ activeConversation.contextType === 'marketplace' ? '交易沟通' : '普通私信' }}</span>
                <span class="hero-chip accent">{{ readSync.justMarkedReadCount > 0 ? `已同步 ${readSync.justMarkedReadCount} 条` : '当前无未读' }}</span>
              </div>
            </div>
            <div class="section-head">
              <div>
                <p class="eyebrow">当前会话</p>
                <h3>{{ activeConversation.peer?.username }}</h3>
              </div>
              <div class="meta-line">
                <span class="mini-tag" v-if="activeConversation.contextType === 'marketplace'">交易沟通</span>
                <span class="muted" v-if="activeConversation.contextTitle">{{ activeConversation.contextTitle }}</span>
              </div>
            </div>

            <div class="sync-banner" :class="{ active: readSync.justMarkedReadCount > 0 }">
              <strong>{{ readSync.justMarkedReadCount > 0 ? '已读同步完成' : '会话状态' }}</strong>
              <span>{{ readSync.justMarkedReadLabel }}</span>
            </div>

            <article
              v-if="activeConversation.contextType === 'marketplace' && activeConversation.contextItem"
              class="context-card"
            >
              <div class="context-media">
                <img
                  v-if="activeConversation.contextItem.imageUrl"
                  :src="activeConversation.contextItem.imageUrl"
                  :alt="activeConversation.contextItem.title"
                />
                <div v-else class="context-placeholder">
                  {{ activeConversation.contextItem.title.slice(0, 1) }}
                </div>
              </div>
              <div class="context-copy">
                <p class="eyebrow">交易上下文</p>
                <h4>{{ activeConversation.contextItem.title }}</h4>
                <div class="context-meta">
                  <span>￥{{ activeConversation.contextItem.price }}</span>
                  <span>{{ activeConversation.contextItem.city }}</span>
                  <span>{{ contextStatusLabel(activeConversation.contextItem.status) }}</span>
                </div>
                <p class="muted">这段私信围绕该商品发起，当前聊天记录和交易场景是一一对应的。</p>
                <button type="button" class="ghost-btn" @click="router.push(`/marketplace/${activeConversation.contextItem.id}`)">
                  查看交易详情
                </button>
              </div>
            </article>

            <div class="message-list">
              <article
                v-for="item in messages"
                :key="item.id"
                class="message-item"
                :class="{ mine: item.senderId === currentUserId }"
              >
                <div class="message-bubble">
                  <p>{{ item.content }}</p>
                  <small>{{ item.publishedLabel }}</small>
                </div>
              </article>
            </div>

            <div class="composer-row">
              <textarea
                v-model.trim="draft"
                rows="4"
                placeholder="输入你想沟通的交易细节、时间地点或补充问题"
                data-testid="message-draft-input"
              ></textarea>
              <button type="button" data-testid="message-send-submit" @click="handleSend">发送消息</button>
            </div>
          </section>
        </template>
        <section v-else class="messages-card empty-state">
          <p class="eyebrow">暂无会话</p>
          <h3>从交易详情页点击“私信联系”后，会自动创建会话。</h3>
        </section>
      </main>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useMessage } from '../composables/useMessage';
import {
  createForumConversation,
  fetchForumConversationDetail,
  fetchForumConversations,
  sendForumMessage
} from '../api/forum';

export default {
  name: 'MessagesView',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const { message, showMessage } = useMessage();
    const conversations = ref([]);
    const activeConversationId = ref(Number(route.query.conversationId) || 0);
    const activeConversation = ref(null);
    const messages = ref([]);
    const draft = ref('');
    const readSync = ref({
      justMarkedReadCount: 0,
      justMarkedReadLabel: '当前已是最新状态'
    });

    const currentUserId = computed(() => Number(store.state.auth.user?.id || 0));

    async function loadConversations() {
      const { data } = await fetchForumConversations();
      conversations.value = data.conversations;
    }

    async function openConversation(conversationId) {
      const { data } = await fetchForumConversationDetail(conversationId);
      activeConversationId.value = conversationId;
      activeConversation.value = data.conversation;
      messages.value = data.messages;
      readSync.value = data.readSync || {
        justMarkedReadCount: 0,
        justMarkedReadLabel: '当前已是最新状态'
      };
      conversations.value = conversations.value.map((item) => (
        item.id === conversationId
          ? { ...item, unreadCount: 0, unreadLabel: '已读', lastUnreadLabel: '' }
          : item
      ));
      await loadConversations();
    }

    async function ensureConversationFromQuery() {
      const targetUserId = Number(route.query.userId || 0);
      const contextId = Number(route.query.itemId || 0);
      if (!targetUserId) {
        return;
      }
      const { data } = await createForumConversation({
        targetUserId,
        contextType: contextId ? 'marketplace' : 'direct',
        contextId: contextId || undefined
      });
      activeConversationId.value = data.conversation.id;
      activeConversation.value = data.conversation;
      messages.value = data.messages;
      readSync.value = data.readSync || {
        justMarkedReadCount: 0,
        justMarkedReadLabel: '当前已是最新状态'
      };
      router.replace({ path: '/messages', query: { conversationId: String(data.conversation.id) } });
      await loadConversations();
    }

    async function handleSend() {
      try {
        const { data } = await sendForumMessage(activeConversationId.value, { content: draft.value });
        messages.value = [...messages.value, data.entry];
        draft.value = '';
        readSync.value = {
          justMarkedReadCount: 0,
          justMarkedReadLabel: '消息已发出，等待对方查看'
        };
        await loadConversations();
      } catch (error) {
        showMessage(error?.response?.data?.message || '消息发送失败');
      }
    }

    function contextStatusLabel(status) {
      if (status === 'active') {
        return '在售中';
      }
      if (status === 'completed') {
        return '已成交';
      }
      return status || '未知状态';
    }

    onMounted(async () => {
      try {
        await loadConversations();
        if (route.query.userId) {
          await ensureConversationFromQuery();
          return;
        }
        if (activeConversationId.value) {
          await openConversation(activeConversationId.value);
        }
      } catch (error) {
        showMessage(error?.response?.data?.message || '私信加载失败');
      }
    });

    watch(() => route.query.conversationId, async (value) => {
      const id = Number(value || 0);
      if (id) {
        await openConversation(id);
      }
    });

    return {
      router,
      message,
      conversations,
      activeConversationId,
      activeConversation,
      messages,
      draft,
      readSync,
      currentUserId,
      contextStatusLabel,
      openConversation,
      handleSend
    };
  }
};
</script>

<style scoped>
.messages-shell {
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px 20px 56px;
}

.messages-topbar,
.messages-sidebar,
.messages-card {
  border: 1px solid rgba(255, 255, 255, 0.62);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.82)),
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.1), transparent 25%),
    radial-gradient(circle at bottom left, rgba(20, 184, 166, 0.08), transparent 22%);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(18px);
}

.messages-topbar,
.row-between,
.section-head,
.meta-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.messages-topbar {
  padding: 16px 18px;
  border-radius: 24px;
}

.messages-topbar h1,
.section-head h3 {
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

.messages-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 18px;
  margin-top: 18px;
}

.messages-sidebar,
.messages-card {
  padding: 22px;
  border-radius: 28px;
}

.conversation-hero,
.hero-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.conversation-hero {
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
  padding: 18px;
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.76)),
    radial-gradient(circle at top right, rgba(14,165,233,0.08), transparent 24%);
  border: 1px solid rgba(255,255,255,0.62);
}

.conversation-hero h2 {
  margin: 0;
  color: #0f172a;
  letter-spacing: -0.04em;
}

.hero-copy {
  max-width: 46ch;
}

.hero-chip,
.sidebar-state,
.unread-dot,
.mini-tag,
.read-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
}

.hero-chip,
.sidebar-state,
.mini-tag {
  color: #0f766e;
  background: rgba(20,184,166,0.1);
  border: 1px solid rgba(20,184,166,0.14);
}

.hero-chip.accent {
  color: #9a3412;
  background: rgba(245,158,11,0.12);
  border-color: rgba(245,158,11,0.16);
}

.conversation-card {
  display: grid;
  gap: 6px;
  margin-top: 12px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.62);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,255,255,0.74)),
    radial-gradient(circle at top right, rgba(14,165,233,0.06), transparent 26%);
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.05);
}

.conversation-card:hover {
  transform: translateY(-2px);
}

.conversation-card.active {
  border-color: rgba(14,165,233,0.24);
  background: rgba(14,165,233,0.1);
}

.conversation-card.unread {
  border-color: rgba(14,165,233,0.38);
  background:
    linear-gradient(135deg, rgba(224, 242, 254, 0.96), rgba(186, 230, 253, 0.42)),
    rgba(255,255,255,0.04);
  box-shadow: inset 3px 0 0 #0ea5e9, 0 18px 42px rgba(14, 165, 233, 0.12);
}

.summary,
.muted {
  color: #64748b;
  line-height: 1.7;
}

.card-badges {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.read-pill {
  color: #475569;
  background: rgba(148, 163, 184, 0.12);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.card-status {
  color: #64748b;
}

.card-status.unread {
  color: #0369a1;
}

.sync-banner,
.context-card {
  margin-top: 16px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.62);
}

.sync-banner {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  background: rgba(255,255,255,0.82);
  color: #475569;
}

.sync-banner.active {
  border-color: rgba(20, 184, 166, 0.22);
  background: rgba(20, 184, 166, 0.08);
  color: #0f766e;
}

.context-card {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 16px;
  padding: 14px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74)),
    radial-gradient(circle at top right, rgba(14,165,233,0.06), transparent 24%);
}

.context-media img,
.context-placeholder {
  width: 100%;
  height: 120px;
  border-radius: 16px;
}

.context-media img {
  object-fit: cover;
}

.context-placeholder {
  display: grid;
  place-items: center;
  background: rgba(14,165,233,0.12);
  color: #0369a1;
  font-size: 28px;
  font-weight: 700;
}

.context-copy h4 {
  margin: 0;
  font-size: 20px;
  color: #0f172a;
}

.context-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 10px 0;
  color: #475569;
}

.message-list {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.message-item {
  display: flex;
}

.message-item.mine {
  justify-content: flex-end;
}

.message-bubble {
  max-width: min(520px, 100%);
  padding: 14px;
  border-radius: 18px;
  background: rgba(255,255,255,0.86);
  border: 1px solid rgba(255,255,255,0.62);
  color: #334155;
  box-shadow: 0 16px 28px rgba(15, 23, 42, 0.05);
}

.message-item.mine .message-bubble {
  background: linear-gradient(135deg, rgba(20,184,166,0.14), rgba(14,165,233,0.14));
  border-color: rgba(14,165,233,0.18);
}

.message-bubble p {
  margin: 0 0 8px;
  line-height: 1.7;
}

.composer-row {
  margin-top: 18px;
}

.composer-row textarea {
  width: 100%;
  resize: vertical;
  min-height: 118px;
}

.composer-row button,
.ghost-btn {
  width: auto;
}

.composer-row button {
  margin-top: 12px;
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

.empty-state {
  display: grid;
  place-items: center;
  min-height: 320px;
  text-align: center;
}

@media (max-width: 980px) {
  .messages-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .messages-shell {
    padding: 14px 14px 36px;
  }

  .messages-topbar,
  .section-head,
  .conversation-hero {
    flex-direction: column;
    align-items: stretch;
  }

  .sync-banner,
  .context-card {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
