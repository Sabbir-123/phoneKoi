# 📱 Phone Koi - AI-Powered IMEI & Stolen Device Registry

**Phone Koi** is a premium, AI-driven mobile security and stolen device verification registry built to secure the second-hand mobile device market. The platform utilizes advanced real-time risk scores, dynamic trust algorithms, and Police GD cross-referencing to protect consumers and dealers against the acquisition of blacklisted or stolen electronics.

---

## ✨ Key Features

*   **🔍 Smart IMEI Safety Verification**: Instant mathematical verification of IMEI formats using Luhn validation, integrated with contextual guest redirects (`/login?redirectTo=/check`) that bring users back to their target results seamlessly upon registration.
*   **🔐 Multi-User Session Isolation**: Full security boundaries preventing cross-account cache leakage. Personal user details and query caches are mapped to email-suffixed LocalStorage keys (`search_history_${email}`, `profile_phone_${email}`) and loaded dynamically inside authentication promises.
*   **🛡️ Dynamic Community Trust Score**: Calculates a real-time credibility index from `50%` up to `100%` based on Phone, WhatsApp, and Home Address profile completions, combined with automated audits adjusting scores on approved (`+15%`) or rejected (`-25%`) theft reports.
*   **📊 Cinematic User Dashboard**: Displays live user-specific indicators for reported devices, search checks, and watchlist alerts, completely replacing residual mock statistics.
*   **⏱️ Chronological Activity Timeline**: Synthesizes and merges reported devices, check searches, and safety alerts into a single dynamic, real-time chronological activity timeline sorted newest first.
*   **💳 Check Quota Indicator & bKash Gateway**: Tracks active search token balance dynamically (`searchesLeft / searchLimit`), integrating custom bKash Send Money payment modals for direct subscription upgrades.
*   **📱 Responsive Viewport Auto-Restore**: Standardizes desktop flexbox structures and registers viewport resize listeners to automatically slide the minimized sidebar back into view when scaling screen sizes.
