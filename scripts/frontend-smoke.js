const fs = require('fs');
const path = require('path');
const assert = require('assert');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

function expectIncludes(source, pattern, message) {
  assert(
    source.includes(pattern),
    `${message}\nMissing pattern: ${pattern}`
  );
}

function expectRegex(source, pattern, message) {
  assert(
    pattern.test(source),
    `${message}\nMissing regex: ${pattern}`
  );
}

function run() {
  const routerSource = read('src/router/index.js');
  const activityViewSource = read('src/views/ActivityDetailView.vue');
  const marketplaceViewSource = read('src/views/MarketplaceDetailView.vue');
  const messagesViewSource = read('src/views/MessagesView.vue');
  const homeViewSource = read('src/views/HomeView.vue');

  expectIncludes(routerSource, "path: '/activities/:id'", 'activity detail route should exist');
  expectIncludes(routerSource, "path: '/marketplace/:id'", 'marketplace detail route should exist');
  expectIncludes(routerSource, "path: '/messages'", 'messages route should exist');

  expectIncludes(activityViewSource, 'data-testid="activity-feedback-rating"', 'activity feedback rating selector should exist');
  expectIncludes(activityViewSource, 'data-testid="activity-feedback-input"', 'activity feedback input selector should exist');
  expectIncludes(activityViewSource, 'data-testid="activity-feedback-submit"', 'activity feedback submit selector should exist');
  expectIncludes(activityViewSource, 'data-testid="activity-comment-submit"', 'activity comment submit selector should exist');
  expectIncludes(activityViewSource, 'data-testid="activity-contact-organizer"', 'activity organizer contact selector should exist');
  expectRegex(activityViewSource, /handleCreateFeedback/, 'activity feedback handler should exist');

  expectIncludes(marketplaceViewSource, 'data-testid="marketplace-comment-submit"', 'marketplace comment submit selector should exist');
  expectIncludes(marketplaceViewSource, 'data-testid="marketplace-contact-seller"', 'marketplace seller contact selector should exist');
  expectRegex(marketplaceViewSource, /router\.push\(`\/messages\?userId=\$\{detail\.item\.sellerId\}&itemId=\$\{detail\.item\.id\}`\)/, 'marketplace contact button should deep-link to messages view');

  expectIncludes(messagesViewSource, 'data-testid="message-draft-input"', 'message draft selector should exist');
  expectIncludes(messagesViewSource, 'data-testid="message-send-submit"', 'message send selector should exist');
  expectRegex(messagesViewSource, /createForumConversation\(/, 'messages view should be able to create a conversation from query params');
  expectRegex(messagesViewSource, /sendForumMessage\(/, 'messages view should send messages');
  expectRegex(messagesViewSource, /conversation-card-\$\{item\.id\}/, 'messages view should expose stable conversation selectors');

  expectIncludes(homeViewSource, 'data-testid="moderation-batch-activities-approve"', 'batch activity approve selector should exist');
  expectIncludes(homeViewSource, 'data-testid="moderation-batch-reports-delete"', 'batch report delete selector should exist');
  expectIncludes(homeViewSource, 'data-testid="moderation-batch-venues-approve"', 'batch venue approve selector should exist');
  expectRegex(homeViewSource, /handleModerateBatch\('activities', 'approve'\)/, 'home view should wire activity batch action');
  expectRegex(homeViewSource, /handleModerateBatch\('reports', 'delete_comment'\)/, 'home view should wire report batch action');
  expectRegex(homeViewSource, /handleModerateBatch\('venues', 'approve'\)/, 'home view should wire venue batch action');

  console.log('[frontend-smoke] critical interaction selectors and route hooks are present');
}

try {
  run();
} catch (error) {
  console.error('[frontend-smoke] failed:', error.message);
  process.exit(1);
}
