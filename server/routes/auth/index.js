const { createClient } = require('@supabase/supabase-js');
const config = require('./config');
const service = require('./service');

let supabase;

const LoginUserManagementModule = {
  name: 'login-user-management',

  async init() {
    if (!config.enabled) {
      console.info(`[${this.name}] disabled — skipping init`);
      return;
    }
    supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    service.init(supabase);
    console.info(`[${this.name}] initialized`);
  },

  async createUser(payload, callerUserId) {
    return service.createUser(payload, callerUserId);
  },

  async updateUser(payload, callerUserId) {
    return service.updateUser(payload, callerUserId);
  },

  async deleteUser(userId, callerUserId) {
    return service.deleteUser(userId, callerUserId);
  },

  async createBootstrapAdmin(payload) {
    return service.createBootstrapAdmin(payload ?? {});
  },

  async teardown() {
    console.info(`[${this.name}] torn down`);
  },
};

module.exports = LoginUserManagementModule;
