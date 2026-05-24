# 📱 Phone Koi - AI-Powered IMEI & Stolen Device Registry

**Phone Koi** is a premium, AI-driven mobile security and stolen device verification registry built to secure the second-hand mobile device market. The platform utilizes advanced real-time risk scores, dynamic trust algorithms, and Police GD cross-referencing to protect consumers and dealers against the acquisition of blacklisted or stolen electronics.

---

## ✨ Key Features

### 🔍 Smart IMEI Safety Verification
*   **Luhn Validation**: Instant mathematical verification of IMEI structure.
*   **Registry Check**: Immediate lookup against active police logs and community stolen reports.
*   **Smart Redirects**: Saves search targets, routes guests to `/login`, and returns them to their target result seamlessly on registration.

### 🔐 Multi-User Session Isolation
*   **Privacy Boundaries**: Prevents any cross-account data leaks or search history leaks.
*   **Suffixed Caching**: Isolates all user details in LocalStorage using email-prefixed keys.
*   **Secure Loading**: Synchronizes client-side parsing inside active authentication promises.

### 🛡️ Dynamic Community Trust Score
*   **Credibility Index**: Calculates a real-time trust percentage (`50%` to `100%`) based on profile completions.
*   **Verification Audits**: Automatically boosts score (`+15%`) for verified police reports or penalizes submissions (`-25%`) on rejections.

### 📊 Cinematic User Dashboard
*   **Live Metrics**: Displays user-specific statistics for reported devices, checks, and alerts with zero mock data.
*   **Dynamic Timeline**: Synthesizes reports, searches, and safety alerts into a single chronological feed sorted newest first.

### 💳 Search Quota & bKash Gateway
*   **Balance Tracking**: Displays active remaining checks (`searchesLeft / searchLimit`) in real-time in the sidebar.
*   **bKash Checkout**: Integrates secure Send Money verification modals for manual admin subscription reviews.

### 📱 Responsive Viewport Auto-Restore
*   **Auto-Restore Sidebar**: Deploys dynamic resize listeners to automatically slide the minimized sidebar back into view when scaling screen sizes.
