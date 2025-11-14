import Vue from 'vue';
import App from './App.vue';
import router from './router';
import VueI18n from 'vue-i18n';

import Services from 'services/Services';
import Logger from 'common/Logger';

async function start() {
  const logLevel = process.env.VUE_APP_LOG_LEVEL !== undefined
    ? Number(process.env.VUE_APP_LOG_LEVEL)
    : (process.env.NODE_ENV !== 'production' ? 5 : 0);
  Logger.setDebugLevel(logLevel);

  await Services.initConfig();
  await Services.getUserService().load();

  Vue.use(VueI18n);
  Vue.config.productionTip = false;

  new Vue({
    router,
    i18n: new VueI18n({
      locale: 'en',
      fallbackLocale: 'en',
      messages: {
        'en': require('./nls/en.json'),
        'en-uk': require('./nls/en.json'),
        'en-us': require('./nls/en.json'),
        'cn': require('./nls/cn.json'),
        'de': require('./nls/de.json'),
        'pt-br': require('./nls/pt_br.json'),
        'pt': require('./nls/pt_br.json')
      }
    }),
    render: (h) => h(App)
  }).$mount('#app');
}

start();
