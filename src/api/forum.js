import api from './client';

export function fetchForumBootstrap() {
  return api.get('/forum/bootstrap');
}

export function fetchForumNewsDetail(newsId) {
  return api.get(`/forum/news/${newsId}`);
}

export function createForumNewsComment(newsId, payload) {
  return api.post(`/forum/news/${newsId}/comments`, payload);
}

export function toggleForumNewsReaction(newsId, type) {
  return api.post(`/forum/news/${newsId}/reactions/${type}`);
}

export function fetchForumMatchDetail(matchId) {
  return api.get(`/forum/matches/${matchId}`);
}

export function createForumMatchComment(matchId, payload) {
  return api.post(`/forum/matches/${matchId}/comments`, payload);
}

export function toggleForumMatchReminder(matchId) {
  return api.post(`/forum/matches/${matchId}/reminder`);
}

export function fetchForumVenueDetail(venueId) {
  return api.get(`/forum/venues/${venueId}`);
}

export function toggleForumVenueFavorite(venueId) {
  return api.post(`/forum/venues/${venueId}/favorite`);
}

export function createForumVenueReview(venueId, payload) {
  return api.post(`/forum/venues/${venueId}/reviews`, payload);
}

export function createForumVenueSubmission(payload) {
  return api.post('/forum/venues/submissions', payload);
}

export function fetchForumModerationDashboard() {
  return api.get('/forum/admin/moderation');
}

export function moderateForumCommentReport(reportId, action) {
  return api.post(`/forum/admin/comment-reports/${reportId}`, { action });
}

export function moderateForumVenueSubmission(submissionId, action) {
  return api.post(`/forum/admin/venue-submissions/${submissionId}`, { action });
}

export function moderateForumCommentReportsBatch(action) {
  return api.post('/forum/admin/comment-reports/batch', { action });
}

export function moderateForumVenueSubmissionsBatch(action) {
  return api.post('/forum/admin/venue-submissions/batch', { action });
}

export function moderateForumActivitiesBatch(action) {
  return api.post('/forum/admin/activities/batch', { action });
}

export function moderateForumPost(postId, action) {
  return api.post(`/forum/admin/posts/${postId}`, { action });
}

export function moderateForumNews(newsId, action) {
  return api.post(`/forum/admin/news/${newsId}`, { action });
}

export function moderateForumMarketplace(itemId, action) {
  return api.post(`/forum/admin/marketplace/${itemId}`, { action });
}

export function createForumPost(payload) {
  return api.post('/forum/posts', payload);
}

export function updateForumPost(postId, payload) {
  return api.put(`/forum/posts/${postId}`, payload);
}

export function deleteForumPost(postId) {
  return api.delete(`/forum/posts/${postId}`);
}

export function fetchForumPostDraft(draftId) {
  return api.get(`/forum/post-drafts/${draftId}`);
}

export function saveForumPostDraft(payload) {
  return api.post('/forum/post-drafts', payload);
}

export function deleteForumPostDraft(draftId) {
  return api.delete(`/forum/post-drafts/${draftId}`);
}

export function fetchForumPostDetail(postId) {
  return api.get(`/forum/posts/${postId}`);
}

export function createForumComment(postId, payload) {
  return api.post(`/forum/posts/${postId}/comments`, payload);
}

export function toggleForumCommentReaction(postId, commentId, type) {
  return api.post(`/forum/posts/${postId}/comments/${commentId}/reactions/${type}`);
}

export function reportForumComment(postId, commentId) {
  return api.post(`/forum/posts/${postId}/comments/${commentId}/report`);
}

export function deleteForumComment(postId, commentId) {
  return api.delete(`/forum/posts/${postId}/comments/${commentId}`);
}

export function toggleForumReaction(postId, type) {
  return api.post(`/forum/posts/${postId}/reactions/${type}`);
}

export function fetchForumUserProfile(userId) {
  return api.get(`/forum/users/${userId}`);
}

export function toggleForumFollow(userId) {
  return api.post(`/forum/users/${userId}/follow`);
}

export function fetchForumMyDashboard() {
  return api.get('/forum/me/dashboard');
}

export function markForumNotificationRead(notificationId) {
  return api.post(`/forum/notifications/${notificationId}/read`);
}

export function markAllForumNotificationsRead() {
  return api.post('/forum/notifications/read-all');
}

export function clearReadForumNotifications() {
  return api.delete('/forum/notifications/read');
}

export function createForumActivity(payload) {
  return api.post('/forum/activities', payload);
}

export function fetchForumActivityDetail(activityId) {
  return api.get(`/forum/activities/${activityId}`);
}

export function manageForumActivity(activityId, payload) {
  return api.put(`/forum/activities/${activityId}/manage`, payload);
}

export function registerForumActivity(activityId) {
  return api.post(`/forum/activities/${activityId}/register`);
}

export function cancelForumActivityRegistration(activityId) {
  return api.delete(`/forum/activities/${activityId}/register`);
}

export function createForumActivityComment(activityId, payload) {
  return api.post(`/forum/activities/${activityId}/comments`, payload);
}

export function createForumActivityFeedback(activityId, payload) {
  return api.post(`/forum/activities/${activityId}/feedback`, payload);
}

export function fetchForumMarketplaceDetail(itemId) {
  return api.get(`/forum/marketplace/${itemId}`);
}

export function createMarketplaceItem(payload) {
  return api.post('/forum/marketplace', payload);
}

export function updateMarketplaceItem(itemId, payload) {
  return api.put(`/forum/marketplace/${itemId}`, payload);
}

export function updateMarketplaceStatus(itemId, status) {
  return api.put(`/forum/marketplace/${itemId}/status`, { status });
}

export function deleteMarketplaceItem(itemId) {
  return api.delete(`/forum/marketplace/${itemId}`);
}

export function createMarketplaceComment(itemId, payload) {
  return api.post(`/forum/marketplace/${itemId}/comments`, payload);
}

export function fetchForumConversations() {
  return api.get('/forum/messages');
}

export function createForumConversation(payload) {
  return api.post('/forum/messages/conversations', payload);
}

export function fetchForumConversationDetail(conversationId) {
  return api.get(`/forum/messages/${conversationId}`);
}

export function sendForumMessage(conversationId, payload) {
  return api.post(`/forum/messages/${conversationId}`, payload);
}

export function updateForumProfile(payload) {
  return api.put('/forum/profile', payload);
}
