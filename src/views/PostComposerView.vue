<template>
  <div class="composer-shell">
    <header class="composer-topbar">
      <button class="ghost-btn" type="button" @click="router.push('/home')">返回首页</button>
      <div class="composer-tabs">
        <button
          v-for="item in tabs"
          :key="item.key"
          class="tab-btn"
          :class="{ active: activeType === item.key }"
          type="button"
          @click="activeType = item.key"
        >
          {{ item.label }}
        </button>
      </div>
    </header>

    <p v-if="message" class="flash-message">{{ message }}</p>

    <section class="composer-panel">
      <div class="panel-head">
        <div>
          <p class="eyebrow">发布中心</p>
          <h1>{{ currentTitle }}</h1>
          <p v-if="activeType === 'post' && postDraftStatus" class="muted-line">{{ postDraftStatus }}</p>
        </div>
        <div class="panel-summary">
          <span class="summary-pill">{{ activeType === 'post' ? '内容讨论' : activeType === 'activity' ? '同城组局' : '闲置交易' }}</span>
          <span class="summary-pill accent">{{ activeType === 'post' ? '优先写清观点与摘要' : activeType === 'activity' ? '优先写清时间地点和门槛' : '优先写清成色与交易方式' }}</span>
        </div>
      </div>

      <div v-if="activeType === 'post'" class="form-grid">
        <input v-model.trim="postForm.title" placeholder="帖子标题" />
        <select v-model="postForm.category">
          <option v-for="item in postCategories" :key="item" :value="item">{{ item }}</option>
        </select>
        <select v-model="postForm.contentType">
          <option v-for="item in postContentTypes" :key="item" :value="item">{{ item }}</option>
        </select>
        <select v-model="postForm.city">
          <option v-for="item in cityOptions" :key="item" :value="item">{{ item }}</option>
        </select>
        <textarea v-model.trim="postForm.summary" rows="3" placeholder="写一个 30-80 字摘要"></textarea>
        <textarea v-model.trim="postForm.content" rows="10" placeholder="展开你的完整内容"></textarea>
        <div class="action-row">
          <button class="ghost-btn" type="button" @click="handleSavePostDraft">保存草稿</button>
          <button type="button" @click="handleCreatePost">{{ postActionLabel }}</button>
        </div>
      </div>

      <div v-else-if="activeType === 'activity'" class="form-grid">
        <input v-model.trim="activityForm.title" placeholder="活动名称" />
        <select v-model="activityForm.type">
          <option v-for="item in activityTypes" :key="item" :value="item">{{ item }}</option>
        </select>
        <select v-model="activityForm.city">
          <option v-for="item in cityOptions" :key="item" :value="item">{{ item }}</option>
        </select>
        <input v-model.trim="activityForm.venueName" placeholder="场馆名称" />
        <input v-model.trim="activityForm.address" placeholder="详细地址" />
        <input v-model="activityForm.startTime" type="datetime-local" />
        <input v-model="activityForm.signupDeadline" type="datetime-local" />
        <input v-model.number="activityForm.capacity" type="number" min="2" max="200" placeholder="人数上限" />
        <input v-model.number="activityForm.levelLimit" type="number" min="1" max="10" placeholder="最低等级" />
        <textarea v-model.trim="activityForm.summary" rows="6" placeholder="活动介绍、注意事项、适合人群"></textarea>
        <button type="button" @click="handleCreateActivity">发布活动</button>
      </div>

      <div v-else class="form-grid">
        <select v-model="marketplaceForm.type">
          <option value="出售">出售</option>
          <option value="求购">求购</option>
        </select>
        <select v-model="marketplaceForm.category">
          <option v-for="item in marketplaceCategories" :key="item" :value="item">{{ item }}</option>
        </select>
        <input v-model.trim="marketplaceForm.title" placeholder="物品名称" />
        <input v-model.trim="marketplaceForm.conditionLevel" placeholder="成色" />
        <input v-model.number="marketplaceForm.price" type="number" min="1" placeholder="价格" />
        <select v-model="marketplaceForm.city">
          <option v-for="item in cityOptions" :key="item" :value="item">{{ item }}</option>
        </select>
        <label class="upload-field">
          <span>上传交易图片（最多 3 张）</span>
          <input type="file" accept="image/*" multiple @change="handleMarketplaceImageChange" />
        </label>
        <div v-if="marketplaceForm.imageUrls.length" class="image-preview-grid">
          <div v-for="(image, index) in marketplaceForm.imageUrls" :key="`${image}-${index}`" class="image-preview-card">
            <img :src="image" alt="交易图片预览" class="image-preview" />
            <button class="ghost-btn" type="button" @click="removeMarketplaceImage(index)">移除图片</button>
          </div>
        </div>
        <textarea v-model.trim="marketplaceForm.summary" rows="6" placeholder="描述物品状态、交易方式与需求"></textarea>
        <button type="button" @click="handleCreateMarketplace">{{ marketplaceActionLabel }}</button>
      </div>
    </section>
  </div>
</template>

<script>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useMessage } from '../composables/useMessage';
import {
  createForumActivity,
  createForumPost,
  createMarketplaceItem,
  deleteForumPostDraft,
  fetchForumBootstrap,
  fetchForumPostDetail,
  fetchForumPostDraft,
  fetchForumMarketplaceDetail,
  saveForumPostDraft,
  updateForumPost,
  updateMarketplaceItem
} from '../api/forum';

const tabs = [
  { key: 'post', label: '帖子' },
  { key: 'activity', label: '活动' },
  { key: 'marketplace', label: '交易' }
];

const postCategories = ['技术讨论', '装备分享', '赛事吐槽', '日常打卡', '官方公告'];
const postContentTypes = ['图文', '视频', '纯文字'];
const activityTypes = ['友谊赛', '新手教学', '球友聚会', '大型赛事'];
const marketplaceCategories = ['羽毛球拍', '羽毛球鞋', '运动服饰', '配件', '其他'];

function toIso(value) {
  return value ? new Date(value).toISOString() : '';
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

export default {
  name: 'PostComposerView',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const { message, showMessage } = useMessage();
    const activeType = ref(route.query.type || 'post');
    const editingPostId = ref(route.query.id || '');
    const editingPostDraftId = ref(route.query.draftId || '');
    const editingMarketplaceId = ref(route.query.id || '');
    const cityOptions = ref(['上海']);
    const postDraftStatus = ref('');

    const postForm = reactive({
      title: '',
      category: '技术讨论',
      contentType: '图文',
      city: '',
      summary: '',
      content: ''
    });

    const activityForm = reactive({
      title: '',
      type: '球友聚会',
      city: '',
      venueName: '',
      address: '',
      startTime: '',
      signupDeadline: '',
      capacity: 12,
      levelLimit: 4,
      summary: ''
    });

    const marketplaceForm = reactive({
      type: '出售',
      category: '羽毛球拍',
      title: '',
      conditionLevel: '',
      price: 199,
      city: '',
      summary: '',
      imageUrls: []
    });

    const currentTitle = computed(() => {
      const found = tabs.find((item) => item.key === activeType.value);
      return found ? `发布${found.label}` : '发布内容';
    });

    const postActionLabel = computed(() => (editingPostId.value ? '保存帖子修改' : '发布帖子'));
    const marketplaceActionLabel = computed(() => (editingMarketplaceId.value ? '保存交易信息' : '发布交易信息'));

    function syncDefaultCity() {
      const city = store.state.auth.user?.city || cityOptions.value[0] || '上海';
      postForm.city = city;
      activityForm.city = city;
      marketplaceForm.city = city;
    }

    function buildComposeQuery(type) {
      if (type === 'post') {
        if (editingPostId.value) {
          return { type, id: editingPostId.value };
        }
        if (editingPostDraftId.value) {
          return { type, draftId: editingPostDraftId.value };
        }
      }
      if (type === 'marketplace' && editingMarketplaceId.value) {
        return { type, id: editingMarketplaceId.value };
      }
      return { type };
    }

    async function loadOptions() {
      const { data } = await fetchForumBootstrap();
      cityOptions.value = data.cities.cities.map((item) => item.name);
      syncDefaultCity();
    }

    async function loadPostDraftData() {
      if (activeType.value !== 'post' || !editingPostDraftId.value || editingPostId.value) {
        return;
      }
      const { data } = await fetchForumPostDraft(editingPostDraftId.value);
      postForm.title = data.draft.title;
      postForm.category = data.draft.category;
      postForm.contentType = data.draft.contentType;
      postForm.city = data.draft.city;
      postForm.summary = data.draft.summary;
      postForm.content = data.draft.content;
      postDraftStatus.value = `当前正在编辑草稿，最近保存于 ${data.draft.publishedLabel}`;
    }

    async function loadPostEditData() {
      if (activeType.value !== 'post' || !editingPostId.value) {
        return;
      }
      try {
        const { data } = await fetchForumPostDetail(editingPostId.value);
        postForm.title = data.post.title;
        postForm.category = data.post.category;
        postForm.contentType = data.post.contentType;
        postForm.city = data.post.city;
        postForm.summary = data.post.summary;
        postForm.content = data.post.content;
        postDraftStatus.value = '当前正在编辑已发布帖子';
      } catch (error) {
        showMessage(error?.response?.data?.message || '帖子编辑数据加载失败');
      }
    }

    async function loadMarketplaceEditData() {
      if (activeType.value !== 'marketplace' || !editingMarketplaceId.value) {
        return;
      }
      const { data } = await fetchForumMarketplaceDetail(editingMarketplaceId.value);
      marketplaceForm.type = data.item.type;
      marketplaceForm.category = data.item.category;
      marketplaceForm.title = data.item.title;
      marketplaceForm.conditionLevel = data.item.conditionLevel;
      marketplaceForm.price = Number(data.item.price);
      marketplaceForm.city = data.item.city;
      marketplaceForm.summary = data.item.summary;
      marketplaceForm.imageUrls = Array.isArray(data.item.imageUrls) ? [...data.item.imageUrls] : (data.item.imageUrl ? [data.item.imageUrl] : []);
    }

    async function handleCreatePost() {
      try {
        if (editingPostId.value) {
          await updateForumPost(editingPostId.value, { ...postForm });
          showMessage('帖子已更新');
          router.push(`/posts/${editingPostId.value}`);
          return;
        }

        const { data } = await createForumPost({ ...postForm });
        if (editingPostDraftId.value) {
          await deleteForumPostDraft(editingPostDraftId.value);
        }
        showMessage('帖子发布成功');
        router.push(`/posts/${data.id}`);
      } catch (error) {
        showMessage(error?.response?.data?.message || '帖子发布失败');
      }
    }

    async function handleSavePostDraft() {
      try {
        const { data } = await saveForumPostDraft({
          draftId: editingPostDraftId.value ? Number(editingPostDraftId.value) : undefined,
          ...postForm
        });
        editingPostDraftId.value = String(data.draft.id);
        postDraftStatus.value = `草稿已保存，最近更新于 ${data.draft.publishedLabel}`;
        if (!editingPostId.value) {
          router.replace({ path: '/compose', query: { type: 'post', draftId: String(data.draft.id) } });
        }
        showMessage(data.message || '草稿已保存');
      } catch (error) {
        showMessage(error?.response?.data?.message || '草稿保存失败');
      }
    }

    async function handleCreateActivity() {
      try {
        const { data } = await createForumActivity({
          ...activityForm,
          startTime: toIso(activityForm.startTime),
          signupDeadline: toIso(activityForm.signupDeadline),
          capacity: Number(activityForm.capacity),
          levelLimit: Number(activityForm.levelLimit)
        });
        showMessage(data.message || '活动发布成功');
        router.push(`/activities/${data.id}`);
      } catch (error) {
        showMessage(error?.response?.data?.message || '活动发布失败');
      }
    }

    async function handleCreateMarketplace() {
      try {
        const payload = {
          ...marketplaceForm,
          price: Number(marketplaceForm.price),
          imageUrls: [...marketplaceForm.imageUrls]
        };
        if (editingMarketplaceId.value) {
          await updateMarketplaceItem(editingMarketplaceId.value, payload);
          showMessage('交易信息已更新');
          router.push(`/marketplace/${editingMarketplaceId.value}`);
          return;
        }
        const { data } = await createMarketplaceItem(payload);
        showMessage('交易发布成功');
        router.push(`/marketplace/${data.id}`);
      } catch (error) {
        showMessage(error?.response?.data?.message || '交易发布失败');
      }
    }

    async function handleMarketplaceImageChange(event) {
      const files = Array.from(event.target.files || []).slice(0, 3);
      if (!files.length) {
        return;
      }
      try {
        const nextImages = [];
        for (const file of files) {
          nextImages.push(await readFileAsDataUrl(file));
        }
        marketplaceForm.imageUrls = [...marketplaceForm.imageUrls, ...nextImages].slice(0, 3);
        showMessage('图片已加入交易预览');
      } catch (error) {
        showMessage('图片上传失败');
      } finally {
        event.target.value = '';
      }
    }

    function removeMarketplaceImage(index) {
      marketplaceForm.imageUrls = marketplaceForm.imageUrls.filter((_, currentIndex) => currentIndex !== index);
    }

    watch(activeType, (value) => {
      postDraftStatus.value = '';
      router.replace({ path: '/compose', query: buildComposeQuery(value) });
    });
    watch(() => route.query.id, async (value) => {
      editingMarketplaceId.value = activeType.value === 'marketplace' ? (value || '') : '';
      editingPostId.value = activeType.value === 'post' ? (value || '') : '';
      if (activeType.value === 'post') {
        await loadPostEditData();
      }
      if (activeType.value === 'marketplace') {
        await loadMarketplaceEditData();
      }
    });
    watch(() => route.query.draftId, async (value) => {
      editingPostDraftId.value = activeType.value === 'post' ? (value || '') : '';
      if (activeType.value === 'post') {
        await loadPostDraftData();
      }
    });

    onMounted(async () => {
      await loadOptions();
      await loadPostEditData();
      await loadPostDraftData();
      await loadMarketplaceEditData();
    });

    return {
      router,
      message,
      tabs,
      activeType,
      currentTitle,
      postActionLabel,
      marketplaceActionLabel,
      cityOptions,
      postCategories,
      postContentTypes,
      activityTypes,
      marketplaceCategories,
      postDraftStatus,
      postForm,
      activityForm,
      marketplaceForm,
      handleMarketplaceImageChange,
      removeMarketplaceImage,
      handleCreatePost,
      handleSavePostDraft,
      handleCreateActivity,
      handleCreateMarketplace
    };
  }
};
</script>

<style scoped>
.composer-shell {
  max-width: 1040px;
  margin: 0 auto;
  padding: 24px 20px 56px;
}

.composer-topbar,
.composer-panel {
  border: 1px solid rgba(255, 255, 255, 0.62);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.82)),
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.1), transparent 25%),
    radial-gradient(circle at bottom left, rgba(20, 184, 166, 0.08), transparent 22%);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(18px);
}

.composer-topbar,
.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.composer-topbar {
  padding: 16px 18px;
  border-radius: 24px;
}

.composer-tabs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tab-btn,
.ghost-btn {
  width: auto;
  margin-top: 0;
  padding: 10px 16px;
  border-radius: 999px;
}

.tab-btn {
  border: 1px solid rgba(148,163,184,0.16);
  background: rgba(255,255,255,0.7);
  color: #475569;
  box-shadow: none;
}

.tab-btn.active {
  background: linear-gradient(135deg, #0f766e, #14b8a6 55%, #38bdf8);
  color: #f8fafc;
}

.ghost-btn {
  border: 1px solid rgba(148,163,184,0.22);
  background: rgba(255,255,255,0.82);
  color: #334155;
  box-shadow: none;
}

.composer-panel {
  margin-top: 18px;
  padding: 24px;
  border-radius: 30px;
  position: relative;
  overflow: hidden;
}

.composer-panel::after {
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

.eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #0f766e;
  font-weight: 700;
}

.composer-panel h1 {
  margin: 0;
  color: #0f172a;
  letter-spacing: -0.03em;
}

.muted-line {
  margin: 8px 0 0;
  color: #64748b;
}

.panel-summary {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.summary-pill {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: #0f766e;
  background: rgba(20,184,166,0.1);
  border: 1px solid rgba(20,184,166,0.14);
}

.summary-pill.accent {
  color: #9a3412;
  background: rgba(245,158,11,0.12);
  border-color: rgba(245,158,11,0.14);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.form-grid textarea,
.action-row,
.form-grid button {
  grid-column: 1 / -1;
}

.action-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.flash-message {
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(20,184,166,0.2);
  background: rgba(20,184,166,0.08);
  color: #0f766e;
}

textarea {
  width: 100%;
  resize: vertical;
  margin-top: 10px;
  min-height: 120px;
}

.upload-field,
.image-preview-card {
  display: grid;
  gap: 10px;
}

.image-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.upload-field span {
  color: #475569;
}

.image-preview-card {
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.62);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74)),
    radial-gradient(circle at top right, rgba(14,165,233,0.06), transparent 28%);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.05);
}

.image-preview {
  width: 100%;
  max-height: 320px;
  object-fit: cover;
  border-radius: 16px;
}

@media (max-width: 720px) {
  .composer-shell {
    padding: 14px 14px 36px;
  }

  .composer-topbar,
  .panel-head {
    flex-direction: column;
    align-items: stretch;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
