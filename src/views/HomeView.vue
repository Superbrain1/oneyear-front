<template>
  <div class="forum-shell">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">OY</div>
        <div>
          <p class="eyebrow">City Badminton Forum</p>
          <h1>羽毛球同城社区</h1>
          <p class="topbar-subtitle">从实战讨论到组局报名、闲置交易和社区治理，把高频羽球场景收在同一个入口。</p>
        </div>
      </div>
      <div class="topbar-tools">
        <input v-model.trim="globalSearch" class="search-input" placeholder="搜索帖子、新闻、活动、交易" />
        <button class="ghost-btn" type="button" @click="handleLogout">退出登录</button>
      </div>
    </header>

    <section class="hero-banner">
      <div>
        <p class="eyebrow">OneYear Network</p>
        <h2>{{ bootstrap.hero.title }}</h2>
        <p class="hero-copy">{{ bootstrap.hero.subtitle }}</p>
        <div class="hero-actions">
          <button type="button" @click="openComposer">发布帖子</button>
          <button class="ghost-btn" type="button" @click="router.push('/compose?type=activity')">发起活动</button>
          <button class="ghost-btn" type="button" @click="router.push('/compose?type=marketplace')">发布交易</button>
        </div>
      </div>
      <div class="hero-metrics">
        <article class="metric-card">
          <strong>{{ bootstrap.hero.overview.postCount || 0 }}</strong>
          <span>帖子</span>
        </article>
        <article class="metric-card">
          <strong>{{ bootstrap.hero.overview.userCount || 0 }}</strong>
          <span>球友</span>
        </article>
        <article class="metric-card">
          <strong>{{ bootstrap.hero.overview.activityCount || 0 }}</strong>
          <span>活动</span>
        </article>
        <article class="metric-card">
          <strong>{{ bootstrap.hero.overview.marketplaceCount || 0 }}</strong>
          <span>交易</span>
        </article>
      </div>
    </section>

    <p v-if="message" class="flash-message">{{ message }}</p>

    <nav class="tabbar">
      <button
        v-for="item in navTabs"
        :key="item.key"
        class="tab-btn"
        :class="{ active: activeTab === item.key }"
        type="button"
        @click="activeTab = item.key"
      >
        {{ item.label }}
      </button>
    </nav>

    <section class="page-panel">
      <template v-if="activeTab === 'home'">
        <div class="panel-head">
          <div>
            <p class="eyebrow">首页</p>
            <h3>全站最新内容流</h3>
          </div>
          <div class="toolbar">
            <select v-model="postFilters.category">
              <option value="">全部话题</option>
              <option v-for="item in postCategories" :key="item" :value="item">{{ item }}</option>
            </select>
            <select v-model="postFilters.contentType">
              <option value="">全部形式</option>
              <option v-for="item in postContentTypes" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
        </div>
        <div class="content-grid">
          <article v-for="post in filteredFeaturedPosts" :key="post.id" class="content-card clickable preview-card" @click="openPost(post.id)">
            <div class="row-between">
              <div class="author-line">
                <span class="avatar-badge">{{ userInitials(post.username) }}</span>
                <strong>{{ post.username }}</strong>
                <span class="mini-tag">Lv.{{ post.level }}</span>
                <span v-if="post.isPinned" class="mini-tag accent">置顶</span>
              </div>
              <span class="mini-tag">{{ post.contentType }}</span>
            </div>
            <h4>{{ post.title }}</h4>
            <p class="summary">{{ post.summary }}</p>
            <div class="stats-line">
              <span>{{ post.city }}</span>
              <span>{{ post.publishedLabel }}</span>
              <span>赞 {{ post.likesCount }}</span>
              <span>评 {{ post.commentsCount }}</span>
            </div>
            <div class="reaction-row">
              <button
                type="button"
                :class="{ active: post.isLiked }"
                @click.stop="handleToggleReaction(post.id, 'like')"
              >
                {{ post.isLiked ? '已点赞' : '点赞' }} · {{ post.likesCount }}
              </button>
              <button
                type="button"
                :class="{ active: post.isFavorited }"
                @click.stop="handleToggleReaction(post.id, 'favorite')"
              >
                {{ post.isFavorited ? '已收藏' : '收藏' }} · {{ post.favoritesCount }}
              </button>
              <button
                v-if="post.previewComments && post.previewComments.length"
                type="button"
                class="mobile-preview-btn"
                :class="{ active: activePreviewPostId === post.id }"
                @click.stop="togglePreview(post.id)"
              >
                {{ activePreviewPostId === post.id ? '收起评论' : `看评论 ${post.previewComments.length}` }}
              </button>
            </div>
            <div
              v-if="post.previewComments && post.previewComments.length"
              class="preview-popover"
              :class="{ 'mobile-open': activePreviewPostId === post.id }"
            >
              <p class="preview-title">最新评论预览</p>
              <article
                v-for="item in post.previewComments"
                :key="item.id"
                class="preview-comment clickable-comment"
                @click.stop="openPostComment(post.id, item.id)"
              >
                <strong>{{ item.username }}</strong>
                <span class="preview-comment-copy" v-html="highlightPreviewKeyword(item.content)"></span>
                <small>{{ item.publishedLabel }}</small>
              </article>
            </div>
          </article>
        </div>
      </template>

      <template v-else-if="activeTab === 'hot'">
        <div class="panel-head">
          <div>
            <p class="eyebrow">最热</p>
            <h3>热度与推荐混合榜</h3>
          </div>
        </div>
        <div class="list-panel">
          <article v-for="post in hotPosts" :key="post.id" class="rank-card clickable preview-card" @click="openPost(post.id)">
            <div class="rank-index">{{ post.rank }}</div>
            <div class="rank-body">
              <div class="row-between">
                <h4>{{ post.title }}</h4>
                <strong class="heat-value">热度 {{ post.heat }}</strong>
              </div>
              <p class="summary">{{ post.summary }}</p>
              <div class="stats-line">
                <span>{{ post.username }}</span>
                <span>{{ post.city }}</span>
                <span>{{ post.publishedLabel }}</span>
              </div>
              <div class="reaction-row">
                <button
                  type="button"
                  :class="{ active: post.isLiked }"
                  @click.stop="handleToggleReaction(post.id, 'like')"
                >
                  {{ post.isLiked ? '已点赞' : '点赞' }} · {{ post.likesCount }}
                </button>
                <button
                  type="button"
                  :class="{ active: post.isFavorited }"
                  @click.stop="handleToggleReaction(post.id, 'favorite')"
                >
                  {{ post.isFavorited ? '已收藏' : '收藏' }} · {{ post.favoritesCount }}
                </button>
                <button
                  v-if="post.previewComments && post.previewComments.length"
                  type="button"
                  class="mobile-preview-btn"
                  :class="{ active: activePreviewPostId === post.id }"
                  @click.stop="togglePreview(post.id)"
                >
                  {{ activePreviewPostId === post.id ? '收起评论' : `看评论 ${post.previewComments.length}` }}
                </button>
              </div>
              <div
                v-if="post.previewComments && post.previewComments.length && (!isMobileView || activePreviewPostId === post.id)"
                class="preview-popover inline"
              >
                <p class="preview-title">最新评论预览</p>
                <article
                  v-for="item in post.previewComments"
                  :key="item.id"
                  class="preview-comment clickable-comment"
                  @click.stop="openPostComment(post.id, item.id)"
                >
                  <strong>{{ item.username }}</strong>
                  <span class="preview-comment-copy" v-html="highlightPreviewKeyword(item.content)"></span>
                  <small>{{ item.publishedLabel }}</small>
                </article>
              </div>
            </div>
          </article>
        </div>
      </template>

      <template v-else-if="activeTab === 'levels'">
        <div class="panel-head">
          <div>
            <p class="eyebrow">等级</p>
            <h3>等级体系与球友梯队</h3>
          </div>
          <div class="level-summary">
            <strong>Lv.{{ currentUser.level || 1 }}</strong>
            <span>{{ levelTitle(currentUser.level || 1) }}</span>
          </div>
        </div>
        <div class="levels-layout">
          <article class="sticky-card">
            <h4>我的进度</h4>
            <p class="summary">{{ currentUser.bio || '完善个人资料，建立更清晰的球友画像。' }}</p>
            <div class="badge-card">
              <span class="mini-tag accent">当前勋章</span>
              <strong>{{ bootstrap.levels.myProgress?.badge || bootstrap.profile?.badge || '初羽徽章' }}</strong>
            </div>
            <div class="progress-track">
              <span :style="{ width: `${bootstrap.profile?.progress?.percent || 0}%` }"></span>
            </div>
            <p class="muted">{{ bootstrap.profile?.progress?.current || 0 }} / {{ bootstrap.profile?.progress?.nextLevelExp || 120 }}</p>
            <p class="summary">{{ levelBenefits(currentUser.level || 1) }}</p>
            <div class="leader-list">
              <h4>等级榜单</h4>
              <article
                v-for="item in bootstrap.levels.leaders || []"
                :key="`leader-${item.username}-${item.city}`"
                class="compact-line"
              >
                <strong>{{ item.username }}</strong>
                <small>{{ item.city }} · Lv.{{ item.level }} · {{ item.exp }} EXP</small>
              </article>
            </div>
          </article>
          <div class="levels-grid">
            <article v-for="item in bootstrap.levels.levels" :key="item.level" class="content-card">
              <div class="row-between">
                <h4>Lv.{{ item.level }} {{ item.title }}</h4>
                <span class="mini-tag">{{ item.requiredExp }} EXP</span>
              </div>
              <p class="summary">{{ item.benefits }}</p>
              <div class="stats-line">
                <span>人数 {{ item.userCount }}</span>
                <span>均值 {{ item.avgExp }}</span>
              </div>
            </article>
            <article class="content-card level-detail-card">
              <div class="row-between">
                <h4>等级任务</h4>
                <span class="mini-tag">实时进度</span>
              </div>
              <div class="task-list">
                <article v-for="item in bootstrap.levels.myProgress?.tasks || []" :key="`task-${item.id}`" class="task-item">
                  <div class="row-between">
                    <strong>{{ item.title }}</strong>
                    <span>{{ item.progressCount }}/{{ item.targetCount }}</span>
                  </div>
                  <p class="summary">{{ item.description }}</p>
                  <div class="progress-track thin">
                    <span :style="{ width: `${item.percent}%` }"></span>
                  </div>
                  <small class="muted">{{ item.isCompleted ? `已完成，奖励 ${item.rewardExp} EXP` : `完成可得 ${item.rewardExp} EXP` }}</small>
                </article>
              </div>
            </article>
            <article class="content-card level-detail-card">
              <div class="row-between">
                <h4>经验明细</h4>
                <span class="mini-tag">最近 8 条</span>
              </div>
              <article
                v-for="item in bootstrap.levels.myProgress?.logs || []"
                :key="`log-${item.description}-${item.publishedLabel}`"
                class="compact-line"
              >
                <strong>{{ item.description }}</strong>
                <small>+{{ item.deltaExp }} EXP · {{ item.publishedLabel }}</small>
              </article>
            </article>
            <article class="content-card level-detail-card">
              <div class="row-between">
                <h4>升级记录</h4>
                <span class="mini-tag">成长轨迹</span>
              </div>
              <article
                v-for="item in bootstrap.levels.myProgress?.records || []"
                :key="`record-${item.previousLevel}-${item.nextLevel}-${item.publishedLabel}`"
                class="compact-line"
              >
                <strong>Lv.{{ item.previousLevel }} -> Lv.{{ item.nextLevel }}</strong>
                <small>{{ item.publishedLabel }}</small>
              </article>
            </article>
          </div>
        </div>
      </template>

      <template v-else-if="activeTab === 'news'">
        <div class="panel-head">
          <div>
            <p class="eyebrow">新闻</p>
            <h3>羽坛资讯</h3>
          </div>
          <select v-model="newsCategory">
            <option value="">全部分类</option>
            <option v-for="item in newsCategories" :key="item" :value="item">{{ item }}</option>
          </select>
        </div>
        <article v-if="headlineNews" class="headline-card clickable" @click="openNews(headlineNews.id)">
          <span class="mini-tag accent">头条</span>
          <h4>{{ headlineNews.title }}</h4>
          <p class="summary">{{ headlineNews.summary }}</p>
          <p class="muted">{{ headlineNews.source }} · {{ headlineNews.publishedLabel }}</p>
          <div class="stats-line">
            <span>{{ headlineNews.category }}</span>
            <span>评 {{ headlineNews.commentsCount || 0 }}</span>
            <span>赞 {{ headlineNews.likesCount || 0 }}</span>
          </div>
        </article>
        <div class="content-grid narrow">
          <article v-for="item in secondaryNews" :key="item.id" class="content-card clickable" @click="openNews(item.id)">
            <h4>{{ item.title }}</h4>
            <p class="summary">{{ item.summary }}</p>
            <p class="muted">{{ item.source }} · {{ item.category }}</p>
            <div class="stats-line">
              <span>{{ item.publishedLabel }}</span>
              <span>评 {{ item.commentsCount || 0 }}</span>
              <span>赞 {{ item.likesCount || 0 }}</span>
            </div>
          </article>
        </div>
      </template>

      <template v-else-if="activeTab === 'matches'">
        <div class="panel-head">
          <div>
            <p class="eyebrow">比赛</p>
            <h3>赛程看板</h3>
          </div>
        </div>
        <div class="content-grid narrow">
          <article v-for="item in bootstrap.matches" :key="item.id" class="content-card clickable" @click="openMatch(item.id)">
            <div class="row-between">
              <span class="mini-tag">{{ item.matchType }}</span>
              <span class="mini-tag accent">{{ item.status }}</span>
            </div>
            <h4>{{ item.title }}</h4>
            <p class="summary">{{ item.highlight }}</p>
            <div class="stats-line">
              <span>{{ item.location }}</span>
              <span>{{ formatAbsoluteTime(item.startTime) }}</span>
              <span>{{ item.currentScore }}</span>
            </div>
          </article>
        </div>
      </template>

      <template v-else-if="activeTab === 'cities'">
        <div class="panel-head">
          <div>
            <p class="eyebrow">城市</p>
            <h3>同城内容聚合</h3>
          </div>
          <div class="toolbar">
            <input v-model.trim="citySearch" class="search-input compact-search" placeholder="搜索城市或场馆" />
            <button class="ghost-btn" type="button" @click="locateCity">定位到我的城市</button>
            <select v-model="selectedCity">
              <option v-for="city in filteredCities" :key="city.id" :value="city.name">{{ city.name }}</option>
            </select>
          </div>
        </div>
        <div class="city-layout">
          <aside class="city-list">
            <button
              v-for="city in filteredCities"
              :key="city.id"
              class="city-item"
              :class="{ active: city.name === selectedCity }"
              type="button"
              @click="selectedCity = city.name"
            >
              <strong>{{ city.name }}</strong>
              <span>{{ city.tier }}</span>
              <small>{{ city.postCount }} 帖子 · {{ city.activityCount }} 活动</small>
            </button>
          </aside>
          <div class="city-panels">
            <div class="sub-block">
              <h4>同城帖子</h4>
              <article v-for="post in cityPosts" :key="post.id" class="content-card clickable compact preview-card" @click="openPost(post.id)">
                <div class="author-line">
                  <span class="avatar-badge small">{{ userInitials(post.username) }}</span>
                  <strong>{{ post.title }}</strong>
                </div>
                <p class="summary">{{ post.summary }}</p>
                <div class="reaction-row">
                  <button
                    type="button"
                    :class="{ active: post.isLiked }"
                    @click.stop="handleToggleReaction(post.id, 'like')"
                  >
                    {{ post.isLiked ? '已点赞' : '点赞' }} · {{ post.likesCount }}
                  </button>
                  <button
                    type="button"
                    :class="{ active: post.isFavorited }"
                    @click.stop="handleToggleReaction(post.id, 'favorite')"
                  >
                    {{ post.isFavorited ? '已收藏' : '收藏' }} · {{ post.favoritesCount }}
                  </button>
                  <button
                    v-if="post.previewComments && post.previewComments.length"
                    type="button"
                    class="mobile-preview-btn"
                    :class="{ active: activePreviewPostId === post.id }"
                    @click.stop="togglePreview(post.id)"
                  >
                    {{ activePreviewPostId === post.id ? '收起评论' : `看评论 ${post.previewComments.length}` }}
                  </button>
                </div>
                <div
                  v-if="post.previewComments && post.previewComments.length"
                  class="preview-popover"
                  :class="{ 'mobile-open': activePreviewPostId === post.id }"
                >
                  <p class="preview-title">最新评论预览</p>
                  <article
                    v-for="item in post.previewComments"
                    :key="item.id"
                    class="preview-comment clickable-comment"
                    @click.stop="openPostComment(post.id, item.id)"
                  >
                    <strong>{{ item.username }}</strong>
                    <span class="preview-comment-copy" v-html="highlightPreviewKeyword(item.content)"></span>
                    <small>{{ item.publishedLabel }}</small>
                  </article>
                </div>
              </article>
            </div>
            <div class="sub-block">
              <h4>同城活动</h4>
              <article v-for="item in cityActivities" :key="item.id" class="content-card compact">
                <strong>{{ item.title }}</strong>
                <p class="summary">{{ item.summary }}</p>
              </article>
            </div>
            <div class="sub-block">
              <h4>同城场馆</h4>
              <article v-for="item in cityVenues" :key="item.id" class="content-card compact clickable" @click="openVenue(item.id)">
                <strong>{{ item.name }}</strong>
                <p class="summary">{{ item.address }}</p>
                <p class="muted">{{ item.businessHours }} · {{ item.priceRange }}</p>
              </article>
            </div>
            <div class="sub-block">
              <h4>同城交易</h4>
              <article v-for="item in cityMarketplace" :key="item.id" class="content-card compact clickable" @click="openMarketplace(item.id)">
                <strong>{{ item.title }}</strong>
                <p class="summary">{{ item.summary }}</p>
                <p class="muted">{{ item.type }} · ￥{{ item.price }} · {{ item.city }}</p>
              </article>
            </div>
            <div class="sub-block">
              <h4>提交新场馆</h4>
              <input v-model.trim="venueSubmission.name" placeholder="场馆名称" />
              <input v-model.trim="venueSubmission.address" placeholder="详细地址" />
              <input v-model.trim="venueSubmission.businessHours" placeholder="营业时间" />
              <input v-model.trim="venueSubmission.priceRange" placeholder="价格区间" />
              <textarea v-model.trim="venueSubmission.note" rows="3" placeholder="补充场地、灯光、订场方式等"></textarea>
              <button type="button" @click="handleSubmitVenue">提交场馆信息</button>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="activeTab === 'activities'">
        <div class="panel-head">
          <div>
            <p class="eyebrow">活动</p>
            <h3>线下娱乐活动</h3>
          </div>
          <div class="toolbar">
            <select v-model="activityFilters.type">
              <option value="">全部类型</option>
              <option v-for="item in activityTypes" :key="item" :value="item">{{ item }}</option>
            </select>
            <select v-model="activityFilters.city">
              <option value="">全部城市</option>
              <option v-for="item in cityOptions" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
        </div>
        <div class="content-grid narrow">
          <article v-for="item in filteredActivities" :key="item.id" class="content-card clickable" @click="openActivity(item.id)">
            <div class="row-between">
              <span class="mini-tag">{{ item.type }}</span>
              <span class="mini-tag accent">Lv.{{ item.levelLimit }}+</span>
            </div>
            <h4>{{ item.title }}</h4>
            <p class="summary">{{ item.summary }}</p>
            <div class="stats-line">
              <span>{{ item.city }}</span>
              <span>{{ item.venueName }}</span>
              <span>{{ item.signedCount }}/{{ item.capacity }}</span>
            </div>
            <button type="button" :disabled="item.isJoined" @click.stop="handleRegisterActivity(item.id)">
              {{ item.isJoined ? '已报名' : '立即报名' }}
            </button>
          </article>
        </div>
      </template>

      <template v-else-if="activeTab === 'marketplace'">
        <div class="panel-head">
          <div>
            <p class="eyebrow">交易</p>
            <h3>闲置交易</h3>
          </div>
          <div class="toolbar">
            <select v-model="marketplaceFilters.type">
              <option value="">全部类型</option>
              <option value="出售">出售</option>
              <option value="求购">求购</option>
            </select>
            <select v-model="marketplaceFilters.category">
              <option value="">全部分类</option>
              <option v-for="item in marketplaceCategories" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
        </div>
        <div class="content-grid narrow">
          <article v-for="item in filteredMarketplace" :key="item.id" class="content-card clickable" @click="openMarketplace(item.id)">
            <div class="row-between">
              <span class="mini-tag" :class="{ accent: item.type === '出售' }">{{ item.type }}</span>
              <strong>￥{{ item.price }}</strong>
            </div>
            <h4>{{ item.title }}</h4>
            <p class="summary">{{ item.summary }}</p>
            <div class="stats-line">
              <span>{{ item.category }}</span>
              <span>{{ item.conditionLevel }}</span>
              <span>{{ item.city }}</span>
            </div>
          </article>
        </div>
      </template>

      <template v-else>
        <div class="panel-head">
          <div>
            <p class="eyebrow">个人中心</p>
            <h3>资料与互动面板</h3>
          </div>
        </div>
        <div class="profile-layout">
          <article class="sticky-card">
            <h4>{{ currentUser.username }}</h4>
            <p class="muted">{{ currentUser.email }}</p>
            <p class="summary">{{ currentUser.bio || '还没有个性签名。' }}</p>
            <div class="stats-line">
              <span>帖子 {{ dashboard.stats?.postCount || bootstrap.profile?.stats?.postCount || 0 }}</span>
              <span>草稿 {{ dashboard.stats?.draftCount || 0 }}</span>
              <span>活动 {{ dashboard.stats?.activityCount || bootstrap.profile?.stats?.activityCount || 0 }}</span>
              <span>交易 {{ dashboard.stats?.marketplaceCount || bootstrap.profile?.stats?.marketplaceCount || 0 }}</span>
              <span>未读 {{ dashboard.stats?.unreadCount || bootstrap.profile?.stats?.unreadCount || 0 }}</span>
            </div>
          </article>
          <div class="profile-stack">
            <article class="content-card">
              <div class="panel-head">
                <div>
                  <h4>我的主页</h4>
                  <p class="muted">把内容、互动和通知统一到一个面板里管理。</p>
                </div>
                <button class="ghost-btn" type="button" @click="loadDashboard">刷新主页</button>
              </div>
              <div class="mini-tabs">
                <button
                  v-for="item in profileTabs"
                  :key="item.key"
                  type="button"
                  class="mini-tab-btn"
                  :class="{ active: profileSection === item.key }"
                  @click="profileSection = item.key"
                >
                  {{ item.label }}
                </button>
              </div>

              <div v-if="profileSection === 'content'" class="profile-section">
                <div class="section-split">
                  <div class="sub-block">
                    <h4>我的草稿</h4>
                    <article
                      v-for="item in dashboard.myContent?.drafts || []"
                      :key="`my-draft-${item.id}`"
                      class="compact-line clickable"
                      @click="router.push(`/compose?type=post&draftId=${item.id}`)"
                    >
                      <strong>{{ item.title || '未命名草稿' }}</strong>
                      <small>{{ item.publishedLabel }} · {{ item.category || '技术讨论' }} · 草稿</small>
                    </article>
                  </div>
                  <div class="sub-block">
                    <h4>我的帖子</h4>
                    <article
                      v-for="item in dashboard.myContent?.posts || []"
                      :key="`my-post-${item.id}`"
                      class="compact-line clickable"
                      @click="openPost(item.id)"
                    >
                      <strong>{{ item.title }}</strong>
                      <small>{{ item.publishedLabel }} · 赞 {{ item.likesCount }} · 评 {{ item.commentsCount }}</small>
                    </article>
                  </div>
                  <div class="sub-block">
                    <h4>我的活动</h4>
                    <article
                      v-for="item in dashboard.myContent?.activities || []"
                      :key="`my-activity-${item.id}`"
                      class="compact-line clickable"
                      @click="openActivity(item.id)"
                    >
                      <strong>{{ item.title }}</strong>
                      <small>{{ item.city }} · {{ item.venueName }} · {{ item.publishedLabel }}</small>
                    </article>
                  </div>
                  <div class="sub-block">
                    <h4>我的交易</h4>
                    <article
                      v-for="item in dashboard.myContent?.marketplace || []"
                      :key="`my-market-${item.id}`"
                      class="compact-line clickable"
                      @click="openMarketplace(item.id)"
                    >
                      <strong>{{ item.title }}</strong>
                      <small>{{ item.type }} · ￥{{ item.price }} · {{ item.publishedLabel }}</small>
                    </article>
                  </div>
                </div>
              </div>

              <div v-else-if="profileSection === 'interactions'" class="profile-section">
                <div class="section-split">
                  <div class="sub-block">
                    <h4>点赞记录</h4>
                    <article
                      v-for="item in dashboard.interactions?.likedPosts || []"
                      :key="`liked-${item.id}`"
                      class="compact-line clickable"
                      @click="openPost(item.id)"
                    >
                      <strong>{{ item.title }}</strong>
                      <small>{{ item.publishedLabel }} · 赞 {{ item.likesCount }} · 评 {{ item.commentsCount }}</small>
                    </article>
                  </div>
                  <div class="sub-block">
                    <h4>收藏记录</h4>
                    <article
                      v-for="item in dashboard.interactions?.favoritedPosts || []"
                      :key="`favorited-${item.id}`"
                      class="compact-line clickable"
                      @click="openPost(item.id)"
                    >
                      <strong>{{ item.title }}</strong>
                      <small>{{ item.category }} · {{ item.publishedLabel }}</small>
                    </article>
                  </div>
                  <div class="sub-block">
                    <h4>评论记录</h4>
                    <article
                      v-for="item in dashboard.interactions?.comments || []"
                      :key="`comment-${item.id}`"
                      class="compact-line clickable"
                      @click="openPostComment(item.postId, item.id)"
                    >
                      <strong>{{ item.postTitle }}</strong>
                      <small>{{ item.content }} · {{ item.publishedLabel }}</small>
                    </article>
                  </div>
                </div>
              </div>

              <div v-else class="profile-section">
                <div class="sub-block">
                  <div class="row-between">
                    <div>
                      <p class="eyebrow">通知中心</p>
                      <h4>消息通知</h4>
                    </div>
                    <div class="toolbar">
                      <button class="ghost-btn" type="button" @click="handleReadAllNotifications">全部已读</button>
                      <button class="ghost-btn" type="button" @click="handleClearReadNotifications">清空已读</button>
                    </div>
                  </div>
                  <div class="mini-tabs notification-tabs">
                    <button
                      v-for="item in notificationTabs"
                      :key="`notification-tab-${item.key}`"
                      type="button"
                      class="mini-tab-btn"
                      :class="{ active: activeNotificationFilter === item.key }"
                      @click="activeNotificationFilter = item.key"
                    >
                      {{ item.label }} · {{ notificationCounts[item.key] || 0 }}
                    </button>
                  </div>
                  <article
                    v-for="item in filteredNotifications"
                    :key="`notification-${item.id}`"
                    class="notification-card"
                    :class="[item.type, { unread: !item.isRead }]"
                    @click="handleOpenNotification(item)"
                  >
                    <div class="row-between">
                      <strong>{{ item.title }}</strong>
                      <span class="mini-tag">{{ notificationTypeLabel(item.type) }}</span>
                    </div>
                    <p class="summary">{{ item.body }}</p>
                    <small class="muted">{{ item.publishedLabel }}</small>
                    <button
                      v-if="!item.isRead"
                      class="ghost-btn inline-btn"
                      type="button"
                      @click.stop="handleMarkNotificationRead(item.id)"
                    >
                      标记已读
                    </button>
                    <button
                      v-if="item.actionUrl"
                      class="ghost-btn inline-btn"
                      type="button"
                      @click.stop="router.push(item.actionUrl)"
                    >
                      查看详情
                    </button>
                    <button
                      v-if="item.type === 'trade'"
                      class="ghost-btn inline-btn"
                      type="button"
                      @click.stop="router.push('/messages')"
                    >
                      进入私信中心
                    </button>
                  </article>
                  <p v-if="filteredNotifications.length === 0" class="summary muted">
                    当前分类下还没有通知。
                  </p>
                </div>
                <div class="section-split relation-section">
                  <div class="sub-block">
                    <h4>我的关注</h4>
                    <article
                      v-for="item in dashboard.relations?.following || []"
                      :key="`following-${item.id}`"
                      class="compact-line clickable"
                      @click="router.push(`/users/${item.id}`)"
                    >
                      <strong>{{ item.username }}</strong>
                      <small>{{ item.city }} · Lv.{{ item.level }}</small>
                    </article>
                  </div>
                  <div class="sub-block">
                    <h4>我的粉丝</h4>
                    <article
                      v-for="item in dashboard.relations?.followers || []"
                      :key="`follower-${item.id}`"
                      class="compact-line clickable"
                      @click="router.push(`/users/${item.id}`)"
                    >
                      <strong>{{ item.username }}</strong>
                      <small>{{ item.city }} · Lv.{{ item.level }}</small>
                    </article>
                  </div>
                </div>
              </div>
            </article>
            <article class="content-card">
              <h4>社区资料</h4>
              <select v-model="communityProfile.city">
                <option v-for="item in cityOptions" :key="item" :value="item">{{ item }}</option>
              </select>
              <textarea v-model.trim="communityProfile.bio" rows="4" placeholder="介绍你的球风、频率与偏好"></textarea>
              <button type="button" @click="handleUpdateCommunityProfile">保存社区资料</button>
            </article>
            <article class="content-card">
              <h4>账号资料</h4>
              <input v-model.trim="accountProfile.username" placeholder="用户名" />
              <input v-model.trim="accountProfile.email" placeholder="邮箱" />
              <input v-model.trim="accountProfile.password" type="password" placeholder="新密码，不改可留空" />
              <button type="button" @click="handleUpdateAccount">保存账号信息</button>
            </article>
            <article v-if="isModerator" class="content-card">
              <div class="row-between">
                <h4>治理后台</h4>
                <div class="toolbar">
                  <button class="ghost-btn" type="button" @click="loadModeration">刷新审核</button>
                  <button v-if="isSuperAdmin" class="ghost-btn" type="button" @click="loadAdminUsers">刷新用户</button>
                </div>
              </div>
              <div v-if="isSuperAdmin" class="sub-block">
                <h4>主管理员账号管理</h4>
                <article v-for="item in adminUsers" :key="item.id" class="admin-user">
                  <p>#{{ item.id }} · {{ item.username }} · {{ item.role }}</p>
                  <input v-model.trim="item.editUsername" placeholder="用户名" />
                  <input v-model.trim="item.editEmail" placeholder="邮箱" />
                  <input v-model.trim="item.editPassword" type="password" placeholder="重置密码" />
                  <select v-model="item.editRole">
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                  <div class="toolbar">
                    <button type="button" @click="saveAdminUser(item)">保存资料</button>
                    <button class="ghost-btn" type="button" @click="saveAdminRole(item)">更新角色</button>
                  </div>
                </article>
              </div>
              <div class="moderation-grid">
                <div class="sub-block">
                  <div class="row-between moderation-head">
                    <div>
                      <p class="eyebrow">治理驾驶舱</p>
                      <h4>治理概览</h4>
                    </div>
                    <span class="section-mark">实时总览</span>
                  </div>
                  <div class="content-grid narrow">
                    <article class="content-card compact">
                      <strong>{{ moderation.stats?.totalUserCount || 0 }}</strong>
                      <small>社区用户</small>
                    </article>
                    <article class="content-card compact">
                      <strong>{{ moderation.stats?.totalPostCount || 0 }}</strong>
                      <small>可见帖子</small>
                    </article>
                    <article class="content-card compact">
                      <strong>{{ moderation.stats?.totalNewsCount || 0 }}</strong>
                      <small>可见新闻</small>
                    </article>
                    <article class="content-card compact">
                      <strong>{{ moderation.stats?.totalActivityCount || 0 }}</strong>
                      <small>活动总量</small>
                    </article>
                    <article class="content-card compact">
                      <strong>{{ moderation.stats?.totalMarketplaceCount || 0 }}</strong>
                      <small>可见交易</small>
                    </article>
                    <article class="content-card compact">
                      <strong>{{ moderation.stats?.pendingActivityCount || 0 }}</strong>
                      <small>待审核活动</small>
                    </article>
                    <article class="content-card compact">
                      <strong>{{ moderation.stats?.pendingCommentReportCount || 0 }}</strong>
                      <small>待处理举报</small>
                    </article>
                    <article class="content-card compact">
                      <strong>{{ moderation.stats?.pendingVenueSubmissionCount || 0 }}</strong>
                      <small>待处理场馆提报</small>
                    </article>
                    <article class="content-card compact">
                      <strong>{{ moderation.stats?.approvedActivityCount || 0 }}</strong>
                      <small>已通过活动</small>
                    </article>
                    <article class="content-card compact">
                      <strong>{{ moderation.stats?.approvedVenueSubmissionCount || 0 }}</strong>
                      <small>已通过场馆提报</small>
                    </article>
                    <article class="content-card compact">
                      <strong>{{ moderation.stats?.rejectedVenueSubmissionCount || 0 }}</strong>
                      <small>已驳回场馆提报</small>
                    </article>
                    <article class="content-card compact">
                      <strong>{{ moderation.stats?.hiddenPostCount || 0 }}</strong>
                      <small>已隐藏帖子</small>
                    </article>
                    <article class="content-card compact">
                      <strong>{{ moderation.stats?.hiddenNewsCount || 0 }}</strong>
                      <small>已隐藏新闻</small>
                    </article>
                    <article class="content-card compact">
                      <strong>{{ moderation.stats?.hiddenMarketplaceCount || 0 }}</strong>
                      <small>已隐藏交易</small>
                    </article>
                  </div>
                </div>
                <div class="sub-block">
                  <div class="row-between moderation-head">
                    <div>
                      <p class="eyebrow">效率视图</p>
                      <h4>审核效率</h4>
                    </div>
                    <span class="section-mark accent">近 24h 重点</span>
                  </div>
                  <div class="content-grid narrow">
                    <article class="content-card compact">
                      <strong>{{ formatMinutes(moderation.stats?.efficiency?.avgCommentReportHandleMinutes) }}</strong>
                      <small>评论举报平均处理</small>
                    </article>
                    <article class="content-card compact">
                      <strong>{{ formatMinutes(moderation.stats?.efficiency?.avgActivityReviewMinutes) }}</strong>
                      <small>活动平均审核</small>
                    </article>
                    <article class="content-card compact">
                      <strong>{{ moderation.stats?.efficiency?.moderationActionsLast24h || 0 }}</strong>
                      <small>近 24h 处理动作</small>
                    </article>
                    <article class="content-card compact">
                      <strong>{{ moderation.stats?.efficiency?.reportsLast24h || 0 }}</strong>
                      <small>近 24h 新举报</small>
                    </article>
                  </div>
                </div>
                <div class="sub-block">
                  <div class="row-between moderation-head">
                    <div>
                      <p class="eyebrow">趋势面板</p>
                      <h4>最近 7 天趋势</h4>
                    </div>
                    <span class="section-mark">节奏变化</span>
                  </div>
                  <div class="trend-board">
                    <article
                      v-for="item in moderation.stats?.trend || []"
                      :key="`trend-${item.day}`"
                      class="trend-card"
                    >
                      <strong>{{ item.label }}</strong>
                      <div class="trend-metric">
                        <span>帖子 {{ item.posts }}</span>
                        <div class="trend-bar"><i :style="{ width: ratioWidth(item.posts, moderation.stats?.trendPeaks?.posts) }" /></div>
                      </div>
                      <div class="trend-metric">
                        <span>活动 {{ item.activities }}</span>
                        <div class="trend-bar"><i :style="{ width: ratioWidth(item.activities, moderation.stats?.trendPeaks?.activities) }" /></div>
                      </div>
                      <div class="trend-metric">
                        <span>举报 {{ item.reports }}</span>
                        <div class="trend-bar warn"><i :style="{ width: ratioWidth(item.reports, moderation.stats?.trendPeaks?.reports) }" /></div>
                      </div>
                      <div class="trend-metric">
                        <span>处理 {{ item.handled }}</span>
                        <div class="trend-bar success"><i :style="{ width: ratioWidth(item.handled, moderation.stats?.trendPeaks?.handled) }" /></div>
                      </div>
                    </article>
                  </div>
                </div>
                <div class="sub-block">
                  <div class="row-between moderation-head">
                    <div>
                      <p class="eyebrow">活动工单</p>
                      <h4>待审核活动</h4>
                    </div>
                    <div class="toolbar">
                      <button type="button" data-testid="moderation-batch-activities-approve" @click="handleModerateBatch('activities', 'approve')">全部通过</button>
                      <button class="ghost-btn" type="button" data-testid="moderation-batch-activities-reject" @click="handleModerateBatch('activities', 'reject')">全部驳回</button>
                    </div>
                  </div>
                  <article
                    v-for="item in moderation.pendingActivities || []"
                    :key="`pending-activity-${item.id}`"
                    class="admin-card"
                  >
                    <strong>{{ item.title }}</strong>
                    <small>{{ item.username }} · {{ item.city }} · {{ item.publishedLabel }}</small>
                    <div class="toolbar">
                      <button type="button" @click="handleModerateActivity(item.id, 'approved')">通过</button>
                      <button class="ghost-btn" type="button" @click="handleModerateActivity(item.id, 'rejected')">驳回</button>
                      <button class="ghost-btn" type="button" @click="openActivity(item.id)">查看详情</button>
                    </div>
                  </article>
                </div>
                <div class="sub-block">
                  <div class="row-between moderation-head">
                    <div>
                      <p class="eyebrow">风控工单</p>
                      <h4>评论举报</h4>
                    </div>
                    <div class="toolbar">
                      <button type="button" data-testid="moderation-batch-reports-delete" @click="handleModerateBatch('reports', 'delete_comment')">全部删评</button>
                      <button class="ghost-btn" type="button" data-testid="moderation-batch-reports-dismiss" @click="handleModerateBatch('reports', 'dismiss')">全部忽略</button>
                    </div>
                  </div>
                  <article
                    v-for="item in moderation.commentReports || []"
                    :key="`report-${item.id}`"
                    class="admin-card"
                  >
                    <strong>{{ item.postTitle }}</strong>
                    <p class="summary">{{ item.content }}</p>
                    <small>{{ item.reporterName }} 举报 · {{ item.publishedLabel }}</small>
                    <div class="toolbar">
                      <button type="button" @click="handleModerateCommentReport(item.id, 'delete_comment')">删除评论</button>
                      <button class="ghost-btn" type="button" @click="handleModerateCommentReport(item.id, 'dismiss')">忽略举报</button>
                    </div>
                  </article>
                </div>
                <div class="sub-block">
                  <div class="row-between moderation-head">
                    <div>
                      <p class="eyebrow">内容治理</p>
                      <h4>帖子审核列表</h4>
                    </div>
                  </div>
                  <article
                    v-for="item in moderation.moderatedPosts || []"
                    :key="`moderated-post-${item.id}`"
                    class="admin-card"
                  >
                    <strong>{{ item.title }}</strong>
                    <small>{{ item.username }} · {{ item.category }} · {{ item.city }} · {{ item.publishedLabel }}</small>
                    <div class="toolbar">
                      <button
                        v-if="item.moderationStatus !== 'hidden'"
                        type="button"
                        @click="handleModeratePost(item.id, 'hide')"
                      >
                        隐藏
                      </button>
                      <button
                        v-else
                        type="button"
                        @click="handleModeratePost(item.id, 'restore')"
                      >
                        恢复
                      </button>
                      <button class="ghost-btn" type="button" @click="openPost(item.id)">查看详情</button>
                    </div>
                  </article>
                </div>
                <div class="sub-block">
                  <div class="row-between moderation-head">
                    <div>
                      <p class="eyebrow">资讯治理</p>
                      <h4>新闻审核列表</h4>
                    </div>
                  </div>
                  <article
                    v-for="item in moderation.moderatedNews || []"
                    :key="`moderated-news-${item.id}`"
                    class="admin-card"
                  >
                    <strong>{{ item.title }}</strong>
                    <small>{{ item.source }} · {{ item.category }} · {{ item.publishedLabel }}</small>
                    <div class="toolbar">
                      <button
                        v-if="item.moderationStatus !== 'hidden'"
                        type="button"
                        @click="handleModerateNews(item.id, 'hide')"
                      >
                        隐藏
                      </button>
                      <button
                        v-else
                        type="button"
                        @click="handleModerateNews(item.id, 'restore')"
                      >
                        恢复
                      </button>
                      <button class="ghost-btn" type="button" @click="openNews(item.id)">查看详情</button>
                    </div>
                  </article>
                </div>
                <div class="sub-block">
                  <div class="row-between moderation-head">
                    <div>
                      <p class="eyebrow">交易治理</p>
                      <h4>交易审核列表</h4>
                    </div>
                  </div>
                  <article
                    v-for="item in moderation.moderatedMarketplace || []"
                    :key="`moderated-marketplace-${item.id}`"
                    class="admin-card"
                  >
                    <strong>{{ item.title }}</strong>
                    <small>{{ item.username }} · {{ item.category }} · {{ item.city }} · {{ item.publishedLabel }}</small>
                    <div class="toolbar">
                      <button
                        v-if="item.moderationStatus !== 'hidden'"
                        type="button"
                        @click="handleModerateMarketplace(item.id, 'hide')"
                      >
                        隐藏
                      </button>
                      <button
                        v-else
                        type="button"
                        @click="handleModerateMarketplace(item.id, 'restore')"
                      >
                        恢复
                      </button>
                      <button class="ghost-btn" type="button" @click="openMarketplace(item.id)">查看详情</button>
                    </div>
                  </article>
                </div>
                <div class="sub-block">
                  <div class="row-between moderation-head">
                    <div>
                      <p class="eyebrow">城市资源</p>
                      <h4>场馆提报</h4>
                    </div>
                    <div class="toolbar">
                      <button type="button" data-testid="moderation-batch-venues-approve" @click="handleModerateBatch('venues', 'approve')">全部通过</button>
                      <button class="ghost-btn" type="button" data-testid="moderation-batch-venues-reject" @click="handleModerateBatch('venues', 'reject')">全部驳回</button>
                    </div>
                  </div>
                  <article
                    v-for="item in moderation.venueSubmissions || []"
                    :key="`venue-submission-${item.id}`"
                    class="admin-card"
                  >
                    <strong>{{ item.name }}</strong>
                    <p class="summary">{{ item.address }}</p>
                    <small>{{ item.username }} · {{ item.city }} · {{ item.publishedLabel }}</small>
                    <div class="toolbar">
                      <button type="button" @click="handleModerateVenueSubmission(item.id, 'approve')">通过</button>
                      <button class="ghost-btn" type="button" @click="handleModerateVenueSubmission(item.id, 'reject')">驳回</button>
                    </div>
                  </article>
                </div>
                <div class="sub-block">
                  <div class="row-between moderation-head">
                    <div>
                      <p class="eyebrow">审计轨迹</p>
                      <h4>最近处理记录</h4>
                    </div>
                    <span class="section-mark">可追溯</span>
                  </div>
                  <article
                    v-for="item in moderation.auditTrail || []"
                    :key="`audit-${item.id}`"
                    class="admin-card audit-card"
                  >
                    <div class="row-between">
                      <strong>{{ item.summary }}</strong>
                      <span class="mini-tag">{{ item.action }}</span>
                    </div>
                    <small>
                      {{ item.actorName || '系统' }} · {{ item.targetType }} · {{ item.publishedLabel }}
                    </small>
                    <p v-if="item.reason" class="summary">{{ item.reason }}</p>
                  </article>
                </div>
              </div>
            </article>
          </div>
        </div>
      </template>
    </section>

    <button class="fab-compose" type="button" @click="openComposer">
      发帖
    </button>

    <transition name="action-feedback">
      <div v-if="actionFeedback.text" class="action-feedback" :class="actionFeedback.type">
        {{ actionFeedback.text }}
      </div>
    </transition>
  </div>
</template>

<script>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useAuth } from '../composables/useAuth';
import { useMessage } from '../composables/useMessage';
import { getMe, listAdminUsers, updateAdminUser, updateAdminUserRole, updateMe } from '../api/auth';
import {
  createForumVenueSubmission,
  clearReadForumNotifications,
  fetchForumBootstrap,
  fetchForumModerationDashboard,
  fetchForumMyDashboard,
  manageForumActivity,
  markAllForumNotificationsRead,
  markForumNotificationRead,
  moderateForumActivitiesBatch,
  moderateForumCommentReport,
  moderateForumCommentReportsBatch,
  moderateForumMarketplace,
  moderateForumNews,
  moderateForumPost,
  moderateForumVenueSubmission,
  moderateForumVenueSubmissionsBatch,
  registerForumActivity,
  toggleForumReaction,
  updateForumProfile
} from '../api/forum';

const navTabs = [
  { key: 'home', label: '首页' },
  { key: 'hot', label: '最热' },
  { key: 'levels', label: '等级' },
  { key: 'news', label: '新闻' },
  { key: 'matches', label: '比赛' },
  { key: 'cities', label: '城市' },
  { key: 'activities', label: '活动' },
  { key: 'marketplace', label: '交易' },
  { key: 'profile', label: '个人中心' }
];

const profileTabs = [
  { key: 'content', label: '我的内容' },
  { key: 'interactions', label: '我的互动' },
  { key: 'notifications', label: '消息通知' }
];

const notificationTabs = [
  { key: 'all', label: '全部' },
  { key: 'system', label: '系统治理' },
  { key: 'interaction', label: '互动通知' },
  { key: 'activity', label: '活动通知' },
  { key: 'trade', label: '交易通知' }
];

const postCategories = ['技术讨论', '装备分享', '赛事吐槽', '日常打卡', '官方公告'];
const postContentTypes = ['图文', '视频', '纯文字'];
const activityTypes = ['友谊赛', '新手教学', '球友聚会', '大型赛事'];
const marketplaceCategories = ['羽毛球拍', '羽毛球鞋', '运动服饰', '配件', '其他'];

function emptyBootstrap() {
  return {
    hero: { title: '', subtitle: '', overview: { postCount: 0, userCount: 0, activityCount: 0, marketplaceCount: 0 } },
    posts: { featured: [], hot: [], cityPosts: [], rising: [] },
    levels: { levels: [], leaders: [] },
    news: [],
    matches: [],
    cities: { selectedCity: '上海', cities: [], venues: [] },
    activities: [],
    marketplace: [],
    profile: { user: null, stats: {}, latestPosts: [], notifications: [], progress: { current: 0, nextLevelExp: 120, percent: 0 } }
  };
}

function emptyDashboard() {
  return {
    user: null,
    stats: {},
    myContent: { drafts: [], posts: [], activities: [], marketplace: [] },
    interactions: { likedPosts: [], favoritedPosts: [], comments: [] },
    notifications: [],
    relations: { following: [], followers: [] }
  };
}

function contains(text, keyword) {
  return String(text || '').toLowerCase().includes(String(keyword || '').toLowerCase());
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function levelTitle(level) {
  const titles = ['新手球友', '热身选手', '稳定入门', '跃升选手', '进阶选手', '城市主力', '战术核心', '硬核球友', '板块骨干', '传奇馆主'];
  return titles[level - 1] || `等级 ${level}`;
}

function levelBenefits(level) {
  if (level <= 3) return '可发布普通帖子与参与评论互动';
  if (level <= 6) return '可发布活动帖子，获得更高内容曝光';
  if (level <= 8) return '可申请活动协办、参与同城推荐位';
  return '可申请板块管理员，参与社区治理';
}

export default {
  name: 'HomeView',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const store = useStore();
    const { message, showMessage } = useMessage();
    const { logout } = useAuth({ showMessage });

    const bootstrap = ref(emptyBootstrap());
    const dashboard = ref(emptyDashboard());
    const activeTab = ref('home');
    const activePreviewPostId = ref(null);
    const isMobileView = ref(false);
    const actionFeedback = reactive({ text: '', type: 'info' });
    let actionFeedbackTimer = null;
    const profileSection = ref('content');
    const activeNotificationFilter = ref('all');
    const globalSearch = ref('');
    const selectedCity = ref('上海');
    const citySearch = ref('');
    const newsCategory = ref('');
    const adminUsers = ref([]);
    const moderation = ref({
      stats: {},
      pendingActivities: [],
      commentReports: [],
      venueSubmissions: [],
      moderatedPosts: [],
      moderatedNews: [],
      moderatedMarketplace: [],
      auditTrail: []
    });

    const postFilters = reactive({ category: '', contentType: '' });
    const activityFilters = reactive({ type: '', city: '' });
    const marketplaceFilters = reactive({ type: '', category: '' });
    const communityProfile = reactive({ city: '上海', bio: '' });
    const accountProfile = reactive({ username: '', email: '', password: '' });
    const venueSubmission = reactive({
      name: '',
      address: '',
      businessHours: '',
      priceRange: '',
      note: ''
    });

    const currentUser = computed(() => store.state.auth.user || {});
    const isModerator = computed(() => ['admin', 'super_admin'].includes(currentUser.value?.role));
    const isSuperAdmin = computed(() => currentUser.value?.role === 'super_admin');
    const cityOptions = computed(() => bootstrap.value.cities.cities.map((item) => item.name));
    const filteredCities = computed(() => bootstrap.value.cities.cities.filter((item) => {
      const keyword = citySearch.value;
      return !keyword || contains(item.name, keyword) || contains(item.tier, keyword);
    }));
    const newsCategories = computed(() => [...new Set(bootstrap.value.news.map((item) => item.category))]);

    function syncViewportMode() {
      if (typeof window === 'undefined') {
        return;
      }
      isMobileView.value = window.innerWidth <= 900;
      if (!isMobileView.value) {
        activePreviewPostId.value = null;
      }
    }

    function showActionFeedback(text, type = 'info') {
      actionFeedback.text = text;
      actionFeedback.type = type;
      if (actionFeedbackTimer) {
        clearTimeout(actionFeedbackTimer);
      }
      actionFeedbackTimer = setTimeout(() => {
        actionFeedback.text = '';
      }, 1800);
    }

    const filteredFeaturedPosts = computed(() => bootstrap.value.posts.featured.filter((item) => {
      const keyword = globalSearch.value;
      return (!keyword || [item.title, item.summary, item.username, item.city].some((value) => contains(value, keyword)))
        && (!postFilters.category || item.category === postFilters.category)
        && (!postFilters.contentType || item.contentType === postFilters.contentType);
    }));

    const hotPosts = computed(() => bootstrap.value.posts.hot.filter((item) => {
      const keyword = globalSearch.value;
      return !keyword || [item.title, item.summary, item.username].some((value) => contains(value, keyword));
    }));

    const filteredNews = computed(() => bootstrap.value.news.filter((item) => {
      const keyword = globalSearch.value;
      return (!keyword || [item.title, item.summary, item.source].some((value) => contains(value, keyword)))
        && (!newsCategory.value || item.category === newsCategory.value);
    }));

    const headlineNews = computed(() => filteredNews.value[0] || null);
    const secondaryNews = computed(() => filteredNews.value.slice(1));

    const filteredActivities = computed(() => bootstrap.value.activities.filter((item) => {
      const keyword = globalSearch.value;
      return (!keyword || [item.title, item.summary, item.city, item.venueName].some((value) => contains(value, keyword)))
        && (!activityFilters.type || item.type === activityFilters.type)
        && (!activityFilters.city || item.city === activityFilters.city);
    }));

    const filteredMarketplace = computed(() => bootstrap.value.marketplace.filter((item) => {
      const keyword = globalSearch.value;
      return (!keyword || [item.title, item.summary, item.city].some((value) => contains(value, keyword)))
        && (!marketplaceFilters.type || item.type === marketplaceFilters.type)
        && (!marketplaceFilters.category || item.category === marketplaceFilters.category);
    }));

    const notificationCounts = computed(() => {
      const counts = { all: 0, system: 0, interaction: 0, activity: 0, trade: 0 };
      (dashboard.value.notifications || []).forEach((item) => {
        counts.all += 1;
        if (Object.prototype.hasOwnProperty.call(counts, item.type)) {
          counts[item.type] += 1;
        }
      });
      return counts;
    });

    const filteredNotifications = computed(() => {
      if (activeNotificationFilter.value === 'all') {
        return dashboard.value.notifications || [];
      }
      return (dashboard.value.notifications || []).filter((item) => item.type === activeNotificationFilter.value);
    });

    const cityPosts = computed(() => bootstrap.value.posts.featured.filter((item) => item.city === selectedCity.value).slice(0, 4));
    const cityActivities = computed(() => bootstrap.value.activities.filter((item) => item.city === selectedCity.value).slice(0, 4));
    const cityMarketplace = computed(() => bootstrap.value.marketplace.filter((item) => item.city === selectedCity.value).slice(0, 4));
    const cityVenues = computed(() => {
      const own = bootstrap.value.cities.venues.filter((item) => {
        const matchedCity = item.city === selectedCity.value;
        const matchedSearch = !citySearch.value || [item.name, item.address, item.city].some((value) => contains(value, citySearch.value));
        return matchedCity && matchedSearch;
      });
      return own.length > 0 ? own : bootstrap.value.cities.venues.slice(0, 3);
    });

    function syncForms(user) {
      communityProfile.city = user?.city || bootstrap.value.cities.selectedCity || '上海';
      communityProfile.bio = user?.bio || '';
      accountProfile.username = user?.username || '';
      accountProfile.email = user?.email || '';
      accountProfile.password = '';
      selectedCity.value = communityProfile.city;
    }

    async function loadBootstrap() {
      const { data } = await fetchForumBootstrap();
      bootstrap.value = data;
      syncForms(data.profile?.user || currentUser.value);
    }

    async function loadDashboard() {
      try {
        const { data } = await fetchForumMyDashboard();
        dashboard.value = data;
      } catch (error) {
        showMessage(error?.response?.data?.message || '个人主页数据加载失败');
      }
    }

    async function syncMe() {
      const { data } = await getMe();
      await store.dispatch('auth/setAuth', { token: store.state.auth.token, user: data.user });
      syncForms(data.user);
    }

    async function handleRegisterActivity(activityId) {
      try {
        await registerForumActivity(activityId);
        showActionFeedback('活动报名成功', 'success');
        await loadBootstrap();
      } catch (error) {
        showMessage(error?.response?.data?.message || '活动报名失败');
      }
    }

    function applyReactionToList(list, postId, type, active, counts) {
      return list.map((item) => {
        if (item.id !== postId) {
          return item;
        }
        return {
          ...item,
          likesCount: counts.likesCount,
          favoritesCount: counts.favoritesCount,
          isLiked: type === 'like' ? active : item.isLiked,
          isFavorited: type === 'favorite' ? active : item.isFavorited,
          heat: Math.round(item.views * 0.2 + item.commentsCount * 0.5 + counts.likesCount * 0.3)
        };
      });
    }

    async function handleToggleReaction(postId, type) {
      try {
        const { data } = await toggleForumReaction(postId, type);
        bootstrap.value = {
          ...bootstrap.value,
          posts: {
            ...bootstrap.value.posts,
            featured: applyReactionToList(bootstrap.value.posts.featured, postId, type, data.active, data.counts),
            hot: applyReactionToList(bootstrap.value.posts.hot, postId, type, data.active, data.counts),
            cityPosts: applyReactionToList(bootstrap.value.posts.cityPosts, postId, type, data.active, data.counts),
            rising: applyReactionToList(bootstrap.value.posts.rising, postId, type, data.active, data.counts)
          }
        };
        showActionFeedback(
          type === 'like'
            ? (data.active ? '点赞成功' : '已取消点赞')
            : (data.active ? '收藏成功' : '已取消收藏'),
          data.active ? 'success' : 'info'
        );
      } catch (error) {
        showMessage(error?.response?.data?.message || '操作失败');
      }
    }

    function togglePreview(postId) {
      const next = activePreviewPostId.value === postId ? null : postId;
      activePreviewPostId.value = next;
      if (next) {
        showActionFeedback('已展开评论预览', 'info');
      }
    }

    async function handleUpdateCommunityProfile() {
      try {
        await updateForumProfile({ city: communityProfile.city, bio: communityProfile.bio });
        await syncMe();
        await loadBootstrap();
        await loadDashboard();
        showMessage('社区资料已更新');
      } catch (error) {
        showMessage(error?.response?.data?.message || '社区资料更新失败');
      }
    }

    async function handleUpdateAccount() {
      try {
        const payload = {};
        if (accountProfile.username) payload.username = accountProfile.username;
        if (accountProfile.email) payload.email = accountProfile.email;
        if (accountProfile.password) payload.password = accountProfile.password;
        const { data } = await updateMe(payload);
        await store.dispatch('auth/setAuth', { token: data.token || store.state.auth.token, user: data.user });
        syncForms(data.user);
        await loadDashboard();
        showMessage('账号信息已更新');
      } catch (error) {
        showMessage(error?.response?.data?.message || '账号信息更新失败');
      }
    }

    async function loadAdminUsers() {
      try {
        const { data } = await listAdminUsers();
        adminUsers.value = data.map((item) => ({
          ...item,
          editUsername: item.username,
          editEmail: item.email,
          editPassword: '',
          editRole: item.role === 'super_admin' ? 'admin' : item.role
        }));
      } catch (error) {
        showMessage(error?.response?.data?.message || '加载管理员失败');
      }
    }

    async function loadModeration() {
      try {
        const { data } = await fetchForumModerationDashboard();
        moderation.value = data;
      } catch (error) {
        showMessage(error?.response?.data?.message || '治理面板加载失败');
      }
    }

    async function saveAdminRole(item) {
      try {
        await updateAdminUserRole(item.id, item.editRole);
        showMessage('角色已更新');
        await loadAdminUsers();
      } catch (error) {
        showMessage(error?.response?.data?.message || '角色更新失败');
      }
    }

    async function saveAdminUser(item) {
      try {
        const payload = { username: item.editUsername, email: item.editEmail };
        if (item.editPassword) payload.password = item.editPassword;
        await updateAdminUser(item.id, payload);
        if (item.role !== 'super_admin' && item.editRole !== item.role) {
          await updateAdminUserRole(item.id, item.editRole);
        }
        showMessage('用户资料已更新');
        await loadAdminUsers();
      } catch (error) {
        showMessage(error?.response?.data?.message || '用户更新失败');
      }
    }

    async function handleModerateCommentReport(reportId, action) {
      try {
        const { data } = await moderateForumCommentReport(reportId, action);
        showMessage(data.message || '举报处理完成');
        await loadModeration();
      } catch (error) {
        showMessage(error?.response?.data?.message || '举报处理失败');
      }
    }

    async function handleModeratePost(postId, action) {
      try {
        const { data } = await moderateForumPost(postId, action);
        showMessage(data.message || '帖子治理完成');
        await loadModeration();
        await loadBootstrap();
      } catch (error) {
        showMessage(error?.response?.data?.message || '帖子治理失败');
      }
    }

    async function handleModerateNews(newsId, action) {
      try {
        const { data } = await moderateForumNews(newsId, action);
        showMessage(data.message || '新闻治理完成');
        await loadModeration();
        await loadBootstrap();
      } catch (error) {
        showMessage(error?.response?.data?.message || '新闻治理失败');
      }
    }

    async function handleModerateMarketplace(itemId, action) {
      try {
        const { data } = await moderateForumMarketplace(itemId, action);
        showMessage(data.message || '交易治理完成');
        await loadModeration();
        await loadBootstrap();
      } catch (error) {
        showMessage(error?.response?.data?.message || '交易治理失败');
      }
    }

    async function handleModerateVenueSubmission(submissionId, action) {
      try {
        const { data } = await moderateForumVenueSubmission(submissionId, action);
        showMessage(data.message || '场馆提报处理完成');
        await loadModeration();
        await loadBootstrap();
      } catch (error) {
        showMessage(error?.response?.data?.message || '场馆提报处理失败');
      }
    }

    async function handleModerateActivity(activityId, reviewStatus) {
      try {
        await manageForumActivity(activityId, { reviewStatus });
        showMessage(reviewStatus === 'approved' ? '活动已通过审核' : '活动已驳回');
        await loadModeration();
        await loadBootstrap();
      } catch (error) {
        showMessage(error?.response?.data?.message || '活动审核失败');
      }
    }

    async function handleModerateBatch(scope, action) {
      try {
        if (scope === 'activities') {
          await moderateForumActivitiesBatch(action);
        } else if (scope === 'reports') {
          await moderateForumCommentReportsBatch(action);
        } else if (scope === 'venues') {
          await moderateForumVenueSubmissionsBatch(action);
        }
        showMessage('批量处理完成');
        await loadModeration();
        await loadBootstrap();
      } catch (error) {
        showMessage(error?.response?.data?.message || '批量处理失败');
      }
    }

    function openPost(id) {
      router.push(`/posts/${id}`);
    }

    function openPostComment(postId, commentId) {
      router.push({
        path: `/posts/${postId}`,
        query: { commentId: String(commentId) }
      });
    }

    function userInitials(username) {
      return String(username || '?').slice(0, 1).toUpperCase();
    }

    function highlightPreviewKeyword(content) {
      const keyword = globalSearch.value.trim();
      const safeContent = escapeHtml(content);
      if (!keyword) {
        return safeContent;
      }
      const pattern = new RegExp(`(${escapeRegExp(keyword)})`, 'ig');
      return safeContent.replace(pattern, '<mark>$1</mark>');
    }

    function openComposer() {
      router.push('/compose?type=post');
    }

    function openNews(id) {
      router.push(`/news/${id}`);
    }

    function openActivity(id) {
      router.push(`/activities/${id}`);
    }

    function openMarketplace(id) {
      router.push(`/marketplace/${id}`);
    }

    function openVenue(id) {
      router.push(`/venues/${id}`);
    }

    function locateCity() {
      selectedCity.value = currentUser.value?.city || bootstrap.value.cities.selectedCity || '上海';
      showActionFeedback(`已定位到 ${selectedCity.value}`, 'success');
    }

    async function handleSubmitVenue() {
      try {
        await createForumVenueSubmission({
          city: selectedCity.value,
          ...venueSubmission
        });
        venueSubmission.name = '';
        venueSubmission.address = '';
        venueSubmission.businessHours = '';
        venueSubmission.priceRange = '';
        venueSubmission.note = '';
        showMessage('场馆信息已提交，等待审核');
      } catch (error) {
        showMessage(error?.response?.data?.message || '场馆提交失败');
      }
    }

    function openMatch(id) {
      router.push(`/matches/${id}`);
    }

    function handleOpenNotification(item) {
      if (!item.isRead) {
        handleMarkNotificationRead(item.id);
      }
      if (item.actionUrl) {
        router.push(item.actionUrl);
      } else if (item.type === 'trade') {
        router.push('/messages');
      }
    }

    function notificationTypeLabel(type) {
      const map = {
        system: '系统治理',
        interaction: '互动通知',
        activity: '活动通知',
        trade: '交易通知'
      };
      return map[type] || type;
    }

    async function handleMarkNotificationRead(notificationId) {
      try {
        await markForumNotificationRead(notificationId);
        dashboard.value = {
          ...dashboard.value,
          notifications: (dashboard.value.notifications || []).map((item) => (
            item.id === notificationId ? { ...item, isRead: true } : item
          )),
          stats: {
            ...dashboard.value.stats,
            unreadCount: Math.max((dashboard.value.stats?.unreadCount || 1) - 1, 0)
          }
        };
      } catch (error) {
        showMessage(error?.response?.data?.message || '通知已读失败');
      }
    }

    async function handleReadAllNotifications() {
      try {
        await markAllForumNotificationsRead();
        dashboard.value = {
          ...dashboard.value,
          notifications: (dashboard.value.notifications || []).map((item) => ({ ...item, isRead: true })),
          stats: {
            ...dashboard.value.stats,
            unreadCount: 0
          }
        };
        showMessage('已全部标记为已读');
      } catch (error) {
        showMessage(error?.response?.data?.message || '全部已读失败');
      }
    }

    async function handleClearReadNotifications() {
      try {
        const { data } = await clearReadForumNotifications();
        dashboard.value = {
          ...dashboard.value,
          notifications: (dashboard.value.notifications || []).filter((item) => !item.isRead)
        };
        showMessage(data.message || '已清空已读通知');
      } catch (error) {
        showMessage(error?.response?.data?.message || '清空已读失败');
      }
    }

    function formatAbsoluteTime(value) {
      return new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }

    function formatMinutes(value) {
      if (!Number.isFinite(Number(value))) {
        return '--';
      }
      const minutes = Number(value);
      if (minutes < 60) {
        return `${Math.round(minutes)} 分钟`;
      }
      return `${(minutes / 60).toFixed(1)} 小时`;
    }

    function ratioWidth(value, peak) {
      const current = Number(value) || 0;
      const max = Number(peak) || 0;
      if (!current || !max) {
        return '8%';
      }
      return `${Math.max(8, Math.round((current / max) * 100))}%`;
    }

    function normalizeTabKey(value) {
      if (!value) {
        return 'home';
      }
      const aliasMap = {
        home: 'home',
        hot: 'hot',
        levels: 'levels',
        news: 'news',
        matches: 'matches',
        city: 'cities',
        cities: 'cities',
        activities: 'activities',
        marketplace: 'marketplace',
        profile: 'profile'
      };
      return aliasMap[String(value)] || 'home';
    }

    function syncTabFromRoute() {
      activeTab.value = normalizeTabKey(route.query.tab);
    }

    async function handleLogout() {
      await logout();
    }

    onMounted(async () => {
      syncTabFromRoute();
      syncViewportMode();
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', syncViewportMode);
      }
      await loadBootstrap();
      await loadDashboard();
      if (isModerator.value) {
        await loadModeration();
      }
      if (isSuperAdmin.value) {
        await loadAdminUsers();
      }
    });

    watch(() => route.query.tab, syncTabFromRoute);
    watch(profileSection, (value) => {
      if (value === 'notifications') {
        activeNotificationFilter.value = 'all';
      }
    });

    onBeforeUnmount(() => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', syncViewportMode);
      }
      if (actionFeedbackTimer) {
        clearTimeout(actionFeedbackTimer);
      }
    });

    return {
      message,
      navTabs,
      profileTabs,
      notificationTabs,
      bootstrap,
      dashboard,
      activeTab,
      activePreviewPostId,
      isMobileView,
      actionFeedback,
      profileSection,
      activeNotificationFilter,
      globalSearch,
      postCategories,
      postContentTypes,
      activityTypes,
      marketplaceCategories,
      postFilters,
      activityFilters,
      marketplaceFilters,
      filteredFeaturedPosts,
      hotPosts,
      headlineNews,
      secondaryNews,
      filteredActivities,
      filteredMarketplace,
      selectedCity,
      citySearch,
      cityOptions,
      filteredCities,
      cityPosts,
      cityActivities,
      cityMarketplace,
      cityVenues,
      newsCategory,
      newsCategories,
      currentUser,
      notificationCounts,
      filteredNotifications,
      communityProfile,
      accountProfile,
      venueSubmission,
      isModerator,
      isSuperAdmin,
      adminUsers,
      moderation,
      handleLogout,
      openPost,
      openPostComment,
      openActivity,
      openMarketplace,
      openVenue,
      locateCity,
      handleSubmitVenue,
      openMatch,
      handleOpenNotification,
      handleMarkNotificationRead,
      handleReadAllNotifications,
      handleClearReadNotifications,
      notificationTypeLabel,
      formatMinutes,
      ratioWidth,
      userInitials,
      openComposer,
      openNews,
      togglePreview,
      highlightPreviewKeyword,
      handleRegisterActivity,
      handleToggleReaction,
      handleUpdateCommunityProfile,
      handleUpdateAccount,
      loadAdminUsers,
      loadModeration,
      loadDashboard,
      saveAdminRole,
      saveAdminUser,
      handleModerateCommentReport,
      handleModeratePost,
      handleModerateNews,
      handleModerateMarketplace,
      handleModerateVenueSubmission,
      handleModerateActivity,
      handleModerateBatch,
      formatAbsoluteTime,
      levelTitle,
      levelBenefits
    };
  }
};
</script>

<style scoped>
.forum-shell {
  max-width: 1260px;
  margin: 0 auto;
  padding: 24px 20px 80px;
}

.topbar,
.hero-banner,
.tabbar,
.page-panel {
  border: 1px solid rgba(255, 255, 255, 0.62);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.82)),
    radial-gradient(circle at top right, rgba(20, 184, 166, 0.1), transparent 28%),
    radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.08), transparent 24%);
  box-shadow: 0 28px 72px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(18px);
}

.topbar,
.panel-head,
.row-between {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.topbar {
  padding: 20px 24px;
  border-radius: 30px;
}

.brand {
  display: flex;
  gap: 18px;
  align-items: center;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border-radius: 20px;
  font-weight: 800;
  letter-spacing: -0.06em;
  color: #f8fafc;
  background:
    radial-gradient(circle at 30% 30%, rgba(255,255,255,0.28), transparent 30%),
    linear-gradient(135deg, #0f766e, #14b8a6 58%, #38bdf8);
  box-shadow: 0 18px 34px rgba(20, 184, 166, 0.24);
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #0f766e;
  font-weight: 700;
}

.topbar h1,
.hero-banner h2,
.panel-head h3 {
  margin: 0;
  color: #0f172a;
  letter-spacing: -0.03em;
}

.topbar-subtitle,
.hero-copy,
.summary,
.muted {
  color: #64748b;
}

.topbar-tools,
.toolbar,
.stats-line,
.author-line,
.reaction-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  min-width: 260px;
}

.ghost-btn {
  width: auto;
  margin-top: 0;
  padding: 10px 16px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(255,255,255,0.7);
  color: #334155;
  box-shadow: none;
}

.hero-banner {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 18px;
  margin-top: 18px;
  padding: 28px;
  border-radius: 34px;
  position: relative;
  overflow: hidden;
}

.hero-banner::after {
  content: "";
  position: absolute;
  right: -40px;
  top: -24px;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 40% 40%, rgba(255,255,255,0.72), rgba(255,255,255,0.08) 42%, transparent 60%),
    linear-gradient(135deg, rgba(20,184,166,0.18), rgba(14,165,233,0.08));
  filter: blur(2px);
  pointer-events: none;
}

.hero-metrics,
.content-grid,
.levels-grid {
  display: grid;
  gap: 14px;
}

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 22px;
}

.hero-metrics {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-self: stretch;
}

.metric-card,
.content-card,
.headline-card,
.sticky-card,
.rank-card {
  padding: 18px;
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255,255,255,0.72)),
    radial-gradient(circle at top right, rgba(20,184,166,0.08), transparent 30%);
  border: 1px solid rgba(255,255,255,0.58);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.06);
}

.metric-card strong {
  display: block;
  font-size: 28px;
  color: #0f172a;
}

.metric-card span {
  color: #475569;
}

.flash-message {
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(20,184,166,0.2);
  background: rgba(20,184,166,0.08);
  color: #0f766e;
}

.tabbar {
  display: flex;
  gap: 10px;
  margin-top: 18px;
  padding: 14px;
  border-radius: 26px;
  overflow-x: auto;
}

.tab-btn {
  width: auto;
  min-width: 82px;
  margin-top: 0;
  padding: 11px 17px;
  border-radius: 999px;
  border: 1px solid rgba(148,163,184,0.14);
  background: rgba(255,255,255,0.66);
  color: #475569;
  box-shadow: none;
}

.tab-btn.active {
  background: linear-gradient(135deg, #0f766e, #14b8a6 55%, #38bdf8);
  color: #f8fafc;
}

.page-panel {
  margin-top: 18px;
  padding: 24px;
  border-radius: 30px;
  min-height: 620px;
}

.content-grid {
  margin-top: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.content-grid.narrow,
.levels-grid {
  grid-template-columns: 1fr;
}

.preview-card {
  position: relative;
  overflow: hidden;
}

.clickable {
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.clickable:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 24px 50px rgba(15, 23, 42, 0.12);
}

.preview-popover {
  position: absolute;
  right: 14px;
  bottom: 14px;
  width: min(320px, calc(100% - 28px));
  opacity: 0;
  transform: translateY(10px) scale(0.98);
  pointer-events: none;
  transition: opacity 180ms ease, transform 180ms ease, box-shadow 180ms ease;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(20, 184, 166, 0.16);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.94)),
    radial-gradient(circle at top right, rgba(20, 184, 166, 0.08), transparent 26%);
  backdrop-filter: blur(10px);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
}

.preview-card:hover .preview-popover {
  opacity: 1;
  transform: translateY(0) scale(1);
  box-shadow: 0 24px 50px rgba(2, 6, 23, 0.36);
}

.preview-popover.mobile-open {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
  box-shadow: 0 24px 50px rgba(2, 6, 23, 0.36);
}

.preview-popover.inline {
  position: static;
  width: 100%;
  margin-top: 10px;
  opacity: 1;
  transform: none;
  pointer-events: auto;
}

.preview-title {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #0f766e;
}

.preview-comment {
  display: grid;
  gap: 3px;
  padding: 8px 0;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.clickable-comment {
  cursor: pointer;
  transition: transform 140ms ease, color 140ms ease;
}

.clickable-comment:hover {
  transform: translateX(2px);
}

.preview-comment:first-of-type {
  border-top: none;
  padding-top: 0;
}

.preview-comment strong {
  font-size: 12px;
}

.preview-comment span,
.preview-comment small {
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
}

.preview-comment-copy :deep(mark) {
  padding: 0 4px;
  border-radius: 6px;
  background: rgba(250, 204, 21, 0.22);
  color: #fef08a;
}

.reaction-row button {
  width: auto;
  margin-top: 4px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.88);
  border: 1px solid rgba(148,163,184,0.16);
  color: #475569;
  box-shadow: none;
}

.reaction-row button.active {
  background: linear-gradient(135deg, #0f766e, #14b8a6 55%, #38bdf8);
  color: #f8fafc;
  box-shadow: 0 10px 22px rgba(20, 184, 166, 0.24);
}

.mobile-preview-btn {
  display: none;
}

.mobile-preview-btn.active {
  background: rgba(14,165,233,0.18);
  border-color: rgba(125,211,252,0.26);
  color: #e0f2fe;
}

.mini-tag {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: #0f766e;
  background: rgba(20,184,166,0.1);
}

.mini-tag.accent {
  color: #9a3412;
  background: rgba(245,158,11,0.14);
}

.avatar-badge {
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: #052e2b;
  background: linear-gradient(135deg, #67e8f9, #86efac);
  box-shadow: 0 8px 22px rgba(34, 197, 94, 0.16);
}

.avatar-badge.small {
  width: 24px;
  height: 24px;
  font-size: 11px;
}

.rank-card {
  display: grid;
  grid-template-columns: 70px 1fr;
  gap: 14px;
}

.rank-index {
  display: grid;
  place-items: center;
  border-radius: 18px;
  font-size: 30px;
  font-weight: 800;
  color: #7dd3fc;
  background: rgba(255,255,255,0.04);
}

.heat-value {
  color: #86efac;
}

.badge-card,
.task-item {
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
}

.badge-card {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}

.badge-card strong {
  font-size: 22px;
}

.levels-layout,
.city-layout,
.profile-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
  margin-top: 18px;
}

.city-list,
.city-panels,
.profile-stack {
  display: grid;
  gap: 12px;
}

.city-item {
  width: 100%;
  margin-top: 0;
  padding: 14px;
  text-align: left;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.62);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74)),
    radial-gradient(circle at top right, rgba(14,165,233,0.06), transparent 28%);
  color: #334155;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.05);
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
}

.city-item.active {
  border-color: rgba(14,165,233,0.26);
  background:
    linear-gradient(180deg, rgba(224,242,254,0.96), rgba(186,230,253,0.46)),
    rgba(14,165,233,0.08);
  box-shadow: 0 18px 34px rgba(14, 165, 233, 0.12);
}

.city-item:hover {
  transform: translateY(-2px);
}

.sub-block {
  display: grid;
  gap: 10px;
}

.section-split {
  display: grid;
  gap: 16px;
}

.leader-list,
.task-list {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.level-detail-card {
  align-self: start;
}

.progress-track.thin {
  height: 8px;
  margin: 4px 0;
}

.mini-tabs {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.mini-tab-btn {
  width: auto;
  margin-top: 0;
  padding: 9px 14px;
  border-radius: 999px;
  border: 1px solid rgba(148,163,184,0.16);
  background: rgba(255,255,255,0.76);
  color: #475569;
  box-shadow: none;
  transition: transform 140ms ease, border-color 140ms ease, background 140ms ease, color 140ms ease;
}

.mini-tab-btn.active {
  background: linear-gradient(135deg, #0369a1, #0ea5e9 58%, #67e8f9);
  border-color: transparent;
  color: #f8fafc;
}

.mini-tab-btn:hover {
  transform: translateY(-1px);
}

.profile-section {
  padding: 4px 0 2px;
}

.compact {
  padding: 14px;
}

.compact-line {
  display: grid;
  gap: 4px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(148,163,184,0.14);
  transition: transform 140ms ease, color 140ms ease;
}

.compact-line:last-child {
  border-bottom: none;
}

.compact-line:hover {
  transform: translateX(2px);
}

.notification-card {
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.62);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.78)),
    radial-gradient(circle at top right, rgba(14,165,233,0.06), transparent 26%);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.05);
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
}

.notification-card.unread {
  border-color: rgba(14,165,233,0.24);
  background:
    linear-gradient(180deg, rgba(224,242,254,0.94), rgba(255,255,255,0.82)),
    radial-gradient(circle at top right, rgba(14,165,233,0.08), transparent 24%);
  box-shadow: 0 18px 36px rgba(14, 165, 233, 0.1);
}

.notification-card.system {
  border-left: 3px solid rgba(245, 158, 11, 0.75);
}

.notification-card.interaction {
  border-left: 3px solid rgba(14, 165, 233, 0.78);
}

.notification-card.activity {
  border-left: 3px solid rgba(20, 184, 166, 0.78);
}

.notification-card.trade {
  border-left: 3px solid rgba(249, 115, 22, 0.78);
}

.notification-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 38px rgba(15, 23, 42, 0.08);
}

.notification-tabs {
  margin-bottom: 8px;
}

.inline-btn {
  width: auto;
  margin-top: 8px;
}

.admin-user {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(148,163,184,0.16);
}

.moderation-grid {
  display: grid;
  gap: 18px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid rgba(148,163,184,0.16);
}

.moderation-head {
  margin-bottom: 12px;
}

.moderation-head h4 {
  margin: 0;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.section-mark {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: #0369a1;
  background: rgba(14,165,233,0.1);
  border: 1px solid rgba(14,165,233,0.14);
}

.section-mark.accent {
  color: #9a3412;
  background: rgba(245,158,11,0.12);
  border-color: rgba(245,158,11,0.16);
}

.admin-card {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.62);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.78)),
    radial-gradient(circle at top right, rgba(14,165,233,0.06), transparent 26%);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.05);
}

.admin-card strong {
  color: #0f172a;
}

.admin-card small,
.admin-card .summary {
  color: #64748b;
}

.trend-board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(148px, 1fr));
  gap: 12px;
}

.trend-card {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.62);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.78)),
    radial-gradient(circle at top right, rgba(20,184,166,0.08), transparent 24%);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.05);
}

.trend-card strong {
  color: #0f172a;
}

.trend-metric {
  display: grid;
  gap: 6px;
}

.trend-metric span {
  font-size: 12px;
  color: #64748b;
}

.trend-bar {
  height: 7px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  overflow: hidden;
}

.trend-bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.88), rgba(59, 130, 246, 0.92));
}

.trend-bar.warn i {
  background: linear-gradient(90deg, rgba(251, 191, 36, 0.92), rgba(249, 115, 22, 0.94));
}

.trend-bar.success i {
  background: linear-gradient(90deg, rgba(74, 222, 128, 0.92), rgba(16, 185, 129, 0.94));
}

.audit-card .mini-tag {
  text-transform: lowercase;
}

.fab-compose {
  position: fixed;
  right: 28px;
  bottom: 28px;
  width: auto;
  min-width: 88px;
  padding: 14px 18px;
  border-radius: 999px;
  box-shadow: 0 18px 44px rgba(20, 184, 166, 0.34);
  animation: fabFloat 3.8s ease-in-out infinite;
}

.action-feedback {
  position: fixed;
  left: 50%;
  bottom: 98px;
  transform: translateX(-50%);
  z-index: 20;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.62);
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(10px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
  color: #334155;
}

.action-feedback.success {
  border-color: rgba(20,184,166,0.24);
  color: #0f766e;
}

.action-feedback.info {
  border-color: rgba(14,165,233,0.24);
  color: #0369a1;
}

.action-feedback-enter-active,
.action-feedback-leave-active {
  transition: opacity 220ms ease, transform 220ms ease, filter 220ms ease;
}

.action-feedback-enter-from,
.action-feedback-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px) scale(0.98);
  filter: blur(4px);
}

@keyframes fabFloat {
  0%, 100% {
    transform: translateY(0);
    box-shadow: 0 18px 44px rgba(20, 184, 166, 0.34);
  }
  50% {
    transform: translateY(-3px);
    box-shadow: 0 24px 54px rgba(20, 184, 166, 0.4);
  }
}

textarea {
  width: 100%;
  resize: vertical;
  margin-top: 10px;
  min-height: 118px;
}

@media (max-width: 960px) {
  .hero-banner,
  .levels-layout,
  .city-layout,
  .profile-layout,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .preview-popover {
    display: none;
  }

  .preview-popover.inline {
    display: block;
  }

  .preview-popover.mobile-open {
    display: block;
    position: static;
    width: 100%;
    margin-top: 10px;
    pointer-events: auto;
  }

  .mobile-preview-btn {
    display: inline-flex;
  }
}

@media (max-width: 720px) {
  .forum-shell {
    padding: 14px 14px 84px;
  }

  .topbar,
  .panel-head,
  .topbar-tools {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    min-width: 0;
  }

  .fab-compose {
    right: 16px;
    bottom: 16px;
  }

  .action-feedback {
    bottom: 84px;
    width: calc(100% - 28px);
    text-align: center;
  }
}
</style>
