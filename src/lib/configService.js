import { supabase } from "./supabaseClient";

/**
 * ConfigService - Manages system configuration stored in Supabase
 * This allows API keys and secrets to be stored securely in the database
 * instead of being bundled in the desktop app.
 */
class ConfigService {
  constructor() {
    this.config = {};
    this.loaded = false;
    this.loading = null; // Promise to prevent concurrent loads
  }

  /**
   * Load all system config from Supabase
   * @returns {Promise<Object>} Configuration object
   */
  async loadConfig() {
    // If already loaded, return cached config
    if (this.loaded) {
      return this.config;
    }

    // If currently loading, return the existing promise
    if (this.loading) {
      return this.loading;
    }

    // Start loading
    this.loading = this._fetchConfig();

    try {
      const config = await this.loading;
      this.loaded = true;
      return config;
    } finally {
      this.loading = null;
    }
  }

  /**
   * Internal method to fetch config from Supabase
   * @private
   */
  async _fetchConfig() {
    try {
      console.log("📡 Loading system config from Supabase...");

      const { data, error } = await supabase
        .from("system_config")
        .select("key, value");

      if (error) {
        console.error("❌ Failed to load system config:", error);
        throw new Error(`Failed to load system config: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.warn("⚠️ No system config found in database");
        return this.config;
      }

      // Convert array to key-value object
      this.config = data.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});

      console.log(
        `✅ System config loaded: ${Object.keys(this.config).length} keys`,
      );
      return this.config;
    } catch (error) {
      console.error("❌ Error loading system config:", error);
      throw error;
    }
  }

  /**
   * Get a specific config value
   * @param {string} key - Config key to retrieve
   * @param {*} defaultValue - Default value if key not found
   * @returns {*} Config value or default
   */
  get(key, defaultValue = null) {
    if (!this.loaded) {
      console.warn("⚠️ Config not loaded yet. Call loadConfig() first.");
      return defaultValue;
    }
    return this.config[key] ?? defaultValue;
  }

  /**
   * Get all config
   * @returns {Object} All configuration
   */
  getAll() {
    if (!this.loaded) {
      console.warn("⚠️ Config not loaded yet. Call loadConfig() first.");
      return {};
    }
    return { ...this.config };
  }

  /**
   * Check if a config key exists
   * @param {string} key - Config key to check
   * @returns {boolean} True if key exists
   */
  has(key) {
    return key in this.config;
  }

  /**
   * Reload config from database
   * @returns {Promise<Object>} Updated configuration
   */
  async reload() {
    this.loaded = false;
    this.config = {};
    return this.loadConfig();
  }
}

// Export singleton instance
export const configService = new ConfigService();
