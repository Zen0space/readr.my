/**
 * Auror Client-Side API Bridge
 * Provides wrappers for all backend route handlers.
 */

const api = {
  // Base request wrapper
  async request(url, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // If sending FormData (e.g., file upload), do not set Content-Type header manually
    if (options.body instanceof FormData) {
      delete defaultHeaders['Content-Type'];
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Automatically handle unauthorized states
        if (response.status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          localStorage.removeItem('user');
          window.location.href = '/login?error=Session+expired';
          return null;
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error on ${url}:`, error);
      throw error;
    }
  },

  // Auth Operations
  async checkSession() {
    try {
      const data = await this.request('/api/auth/session');
      if (data && data.authenticated) {
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
      }
      localStorage.removeItem('user');
      return null;
    } catch (e) {
      localStorage.removeItem('user');
      return null;
    }
  },

  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data && data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  async register(username, email, password, role) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, role }),
    });
  },

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  },

  // Writings & Chapters
  async getWritings(params = {}) {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        searchParams.append(key, params[key]);
      }
    });
    const queryString = searchParams.toString();
    return this.request(`/api/writings${queryString ? '?' + queryString : ''}`);
  },

  async getWriting(id) {
    return this.request(`/api/writings/${id}`);
  },

  async createWriting(title, description, coverUrl, status = 'draft') {
    return this.request('/api/writings', {
      method: 'POST',
      body: JSON.stringify({ title, description, cover_url: coverUrl, status }),
    });
  },

  async updateWriting(id, title, description, coverUrl, status) {
    return this.request(`/api/writings/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, description, cover_url: coverUrl, status }),
    });
  },

  async deleteWriting(id) {
    return this.request(`/api/writings/${id}`, {
      method: 'DELETE',
    });
  },

  async getChapters(writingId) {
    return this.request(`/api/writings/${writingId}/chapters`);
  },

  async addChapter(writingId, title, content, chapterOrder, isPremium = false, coinPrice = 0, status = 'draft') {
    return this.request(`/api/writings/${writingId}/chapters`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        content,
        chapter_order: Number(chapterOrder),
        is_premium: Boolean(isPremium),
        coin_price: Number(coinPrice),
        status,
      }),
    });
  },

  async updateChapter(chapterId, title, content, chapterOrder, isPremium = false, coinPrice = 0, status = 'draft') {
    return this.request(`/api/chapters/${chapterId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title,
        content,
        chapter_order: Number(chapterOrder),
        is_premium: Boolean(isPremium),
        coin_price: Number(coinPrice),
        status,
      }),
    });
  },

  async deleteChapter(chapterId) {
    return this.request(`/api/chapters/${chapterId}`, {
      method: 'DELETE',
    });
  },

  async getChapter(chapterId) {
    return this.request(`/api/chapters/${chapterId}`);
  },

  async unlockChapter(chapterId) {
    return this.request(`/api/chapters/${chapterId}/unlock`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  // Wallet
  async getWalletBalance() {
    return this.request('/api/wallet/balance');
  },

  async getTransactions() {
    return this.request('/api/wallet/transactions');
  },

  async purchaseCoins(coinsId, mockCoins = null, mockPrice = null) {
    const payload = coinsId ? { coins_id: coinsId } : { coins: Number(mockCoins), price: Number(mockPrice) };
    return this.request('/api/wallet/purchase', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async requestPayout(amount) {
    return this.request('/api/wallet/payout', {
      method: 'POST',
      body: JSON.stringify({ amount: Number(amount) }),
    });
  },

  // Subscriptions
  async getSubscription() {
    return this.request('/api/subscription');
  },

  async subscribe(tier) {
    return this.request('/api/subscription', {
      method: 'POST',
      body: JSON.stringify({ tier }),
    });
  },

  // Library & Social
  async getLibrary() {
    return this.request('/api/library');
  },

  async addToLibrary(writingId) {
    return this.request('/api/library', {
      method: 'POST',
      body: JSON.stringify({ writing_id: writingId }),
    });
  },

  async removeFromLibrary(writingId) {
    return this.request('/api/library', {
      method: 'DELETE',
      body: JSON.stringify({ writing_id: writingId }),
    });
  },

  async toggleLike(writingId) {
    return this.request('/api/social/like', {
      method: 'POST',
      body: JSON.stringify({ writing_id: writingId }),
    });
  },

  async getComments(writingId, chapterId = null) {
    const url = `/api/social/comment?writing_id=${writingId}${chapterId ? '&chapter_id=' + chapterId : ''}`;
    return this.request(url);
  },

  async addComment(writingId, content, chapterId = null) {
    return this.request('/api/social/comment', {
      method: 'POST',
      body: JSON.stringify({ writing_id: writingId, content, chapter_id: chapterId }),
    });
  },

  async deleteComment(commentId) {
    return this.request(`/api/social/comment?id=${commentId}`, {
      method: 'DELETE',
    });
  },

  // File Upload
  async uploadFile(file, bucket = 'avatars') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    return this.request('/api/upload', {
      method: 'POST',
      body: formData,
    });
  },

  // Analytics
  async trackEvent(eventType, writingId = null, chapterId = null, metadata = {}) {
    return this.request('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ event_type: eventType, writing_id: writingId, chapter_id: chapterId, metadata }),
    });
  },

  async getAnalyticsDashboard() {
    return this.request('/api/analytics/dashboard');
  },

  // Admin User Management
  async getAdminUsers() {
    return this.request('/api/admin/users');
  },

  async updateAdminUser(userId, { role, status }) {
    return this.request('/api/admin/users', {
      method: 'PUT',
      body: JSON.stringify({ userId, role, status }),
    });
  },

  // Admin Content Moderation
  async getAdminReports() {
    return this.request('/api/admin/reports');
  },

  async updateAdminReport(reportId, { status, resolutionAction }) {
    return this.request('/api/admin/reports', {
      method: 'PUT',
      body: JSON.stringify({ reportId, status, resolutionAction }),
    });
  },
};

// Global Initialization and State Bindings
document.addEventListener('DOMContentLoaded', async () => {
  const currentPath = window.location.pathname;
  
  // Skip auth checks on login and register pages to prevent redirects loop
  const isAuthPage = currentPath.includes('/login') || currentPath.includes('/register');
  
  const user = await api.checkSession();
  
  if (!isAuthPage) {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    
    // Check Role Access
    if (currentPath.startsWith('/admin') && user.role !== 'admin') {
      window.location.href = '/';
      return;
    }
    
    if (currentPath.startsWith('/author') && user.role !== 'author' && user.role !== 'admin') {
      window.location.href = '/';
      return;
    }
    
    // Update global UI elements if they exist
    updateGlobalUI(user);
  }
});

function updateGlobalUI(user) {
  // Update username and role indicators
  document.querySelectorAll('[data-username]').forEach(el => el.textContent = user.username);
  document.querySelectorAll('[data-role]').forEach(el => {
    el.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  });
  
  // Update avatar images
  if (user.avatar_url) {
    document.querySelectorAll('img[alt="User Profile"]').forEach(img => {
      img.src = user.avatar_url;
    });
  }

  // Bind logout buttons
  document.querySelectorAll('a, button').forEach(el => {
    if (el.textContent.trim().toLowerCase() === 'sign out' || el.innerText.trim().toLowerCase() === 'sign out') {
      el.addEventListener('click', async (e) => {
        e.preventDefault();
        await api.logout();
      });
    }
  });

  // Dynamically update user-specific UI links based on role
  const isAuthor = user.role === 'author' || user.role === 'admin';
  const isAdmin = user.role === 'admin';

  // Toggle sections of side nav based on role
  document.querySelectorAll('[data-role-required]').forEach(el => {
    const roleReq = el.getAttribute('data-role-required');
    if (roleReq === 'author' && !isAuthor) el.style.display = 'none';
    if (roleReq === 'admin' && !isAdmin) el.style.display = 'none';
  });
}
