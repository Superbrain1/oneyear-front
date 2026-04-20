<template>
  <div class="comment-tree">
    <article
      v-for="item in comments"
      :key="item.id"
      class="comment-item"
      :class="{
        nested: depth > 0,
        highlighted: Number(highlightedId) === Number(item.id),
        flashing: Number(flashCommentId) === Number(item.id)
      }"
      :data-comment-id="item.id"
    >
      <div class="timeline-dot"></div>
      <div class="comment-main">
        <div class="row-between">
          <div class="author-line">
            <strong>{{ item.username }}</strong>
            <span class="mini-tag">Lv.{{ item.level }}</span>
            <span class="muted">{{ item.city }}</span>
          </div>
          <span class="muted">{{ item.publishedLabel }}</span>
        </div>
        <p>
          <span v-if="item.replyToUsername" class="reply-mention">@{{ item.replyToUsername }}</span>
          {{ item.content }}
        </p>
        <div class="comment-actions">
          <button v-if="!item.isDeleted" class="reply-btn" type="button" @click="$emit('reply', item)">回复</button>
          <button
            v-if="!item.isDeleted"
            class="reply-btn"
            :class="{ active: item.isLiked }"
            type="button"
            @click="$emit('like', item)"
          >
            {{ item.isLiked ? '已赞' : '点赞' }} <span v-if="item.likesCount">· {{ item.likesCount }}</span>
          </button>
          <button
            v-if="!item.isDeleted && !item.isReported"
            class="reply-btn warn"
            type="button"
            @click="$emit('report', item)"
          >
            举报
          </button>
          <span v-else-if="item.isReported" class="action-state">已举报</span>
          <button
            v-if="item.canDelete && !item.isDeleted"
            class="reply-btn warn"
            type="button"
            @click="$emit('delete', item)"
          >
            删除
          </button>
          <button
            v-if="item.replies && item.replies.length"
            class="reply-btn"
            type="button"
            @click="toggleExpanded(item.id)"
          >
            {{ expandedIds.has(item.id) ? '收起回复' : `展开 ${item.replies.length} 条回复` }}
          </button>
        </div>

        <div v-if="item.replies && item.replies.length && expandedIds.has(item.id)" class="reply-children">
          <CommentTree
            :comments="item.replies"
            :depth="depth + 1"
            :highlighted-id="highlightedId"
            @reply="$emit('reply', $event)"
            @like="$emit('like', $event)"
            @report="$emit('report', $event)"
            @delete="$emit('delete', $event)"
          />
        </div>
      </div>
    </article>
  </div>
</template>

<script>
export default {
  name: 'CommentTree',
  props: {
    comments: {
      type: Array,
      default: () => []
    },
    depth: {
      type: Number,
      default: 0
    },
    highlightedId: {
      type: [Number, String],
      default: null
    }
  },
  data() {
    return {
      expandedIds: new Set(),
      flashCommentId: null,
      flashTimer: null
    };
  },
  methods: {
    containsHighlighted(items) {
      return items.some((item) => {
        if (Number(item.id) === Number(this.highlightedId)) {
          return true;
        }
        return item.replies?.length ? this.containsHighlighted(item.replies) : false;
      });
    },
    syncExpandedByHighlight() {
      if (!this.highlightedId) {
        return;
      }
      const next = new Set(this.expandedIds);
      for (const item of this.comments) {
        if (item.replies?.length && this.containsHighlighted(item.replies)) {
          next.add(item.id);
        }
      }
      this.expandedIds = next;
    },
    toggleExpanded(id) {
      const next = new Set(this.expandedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      this.expandedIds = next;
    },
    triggerFlash() {
      if (!this.highlightedId) {
        return;
      }
      this.flashCommentId = Number(this.highlightedId);
      if (this.flashTimer) {
        clearTimeout(this.flashTimer);
      }
      this.flashTimer = setTimeout(() => {
        this.flashCommentId = null;
        this.flashTimer = null;
      }, 1400);
    }
  },
  mounted() {
    this.syncExpandedByHighlight();
    this.triggerFlash();
  },
  beforeUnmount() {
    if (this.flashTimer) {
      clearTimeout(this.flashTimer);
    }
  },
  watch: {
    highlightedId() {
      this.syncExpandedByHighlight();
      this.triggerFlash();
    },
    comments: {
      deep: true,
      handler() {
        this.syncExpandedByHighlight();
      }
    }
  }
};
</script>

<style scoped>
.comment-tree {
  display: grid;
  gap: 12px;
}

.comment-item {
  display: grid;
  grid-template-columns: 12px 1fr;
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.78)),
    radial-gradient(circle at top right, rgba(14,165,233,0.06), transparent 28%);
  border: 1px solid rgba(255,255,255,0.62);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.05);
}

.comment-item.nested {
  background:
    linear-gradient(180deg, rgba(248,250,252,0.96), rgba(241,245,249,0.86)),
    radial-gradient(circle at top right, rgba(20,184,166,0.06), transparent 24%);
}

.comment-item.highlighted {
  border-color: rgba(14, 165, 233, 0.28);
  background: rgba(14, 165, 233, 0.08);
  box-shadow: 0 0 0 1px rgba(14, 165, 233, 0.12), 0 18px 34px rgba(15, 23, 42, 0.08);
}

.comment-item.flashing {
  animation: comment-flash 1.3s ease-out;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  margin-top: 4px;
  border-radius: 999px;
  background: linear-gradient(135deg, #67e8f9, #22c55e);
  box-shadow: 0 0 0 4px rgba(103, 232, 249, 0.08);
}

.comment-main {
  min-width: 0;
}

.row-between,
.author-line,
.comment-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.mini-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: #0369a1;
  background: rgba(14,165,233,0.1);
  border: 1px solid rgba(14,165,233,0.14);
}

.muted {
  color: #64748b;
}

.reply-btn {
  width: auto;
  margin-top: 2px;
  padding: 0;
  border: none;
  background: transparent;
  color: #0369a1;
  box-shadow: none;
}

.reply-btn.active {
  color: #0f766e;
}

.reply-btn.warn {
  color: #b91c1c;
}

.action-state {
  color: #b45309;
  font-size: 13px;
}

.reply-mention {
  margin-right: 6px;
  color: #0f766e;
}

.reply-children {
  margin-top: 12px;
  padding-left: 16px;
  border-left: 1px solid rgba(14, 165, 233, 0.16);
}

@keyframes comment-flash {
  0% {
    transform: scale(0.985);
    border-color: rgba(250, 204, 21, 0.72);
    background: rgba(250, 204, 21, 0.16);
    box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.22), 0 20px 36px rgba(15, 23, 42, 0.08);
  }

  35% {
    transform: scale(1.01);
    border-color: rgba(14, 165, 233, 0.42);
    background: rgba(14, 165, 233, 0.14);
    box-shadow: 0 0 0 8px rgba(14, 165, 233, 0.08), 0 24px 44px rgba(15, 23, 42, 0.1);
  }

  100% {
    transform: scale(1);
    border-color: rgba(14, 165, 233, 0.28);
    background: rgba(14, 165, 233, 0.08);
    box-shadow: 0 0 0 1px rgba(14, 165, 233, 0.12), 0 18px 34px rgba(15, 23, 42, 0.08);
  }
}
</style>
