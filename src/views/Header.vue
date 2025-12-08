<template>
  <div class="MatcHeader" id="">
 
      <div class="MatcHeaderLeft">
     
        <a href="#/" ref="myPrototype">
          <img src="../style/img/QUXLogoBlack.svg" class="MatcHeaderLogo" ref="logo">
          Quant-UX
        </a>

      </div>
      <div class="container MatcHeaderCenter">
        <div class="MatcHeaderCenterLeft">
         
      
        </div>
        <div class="MatcHeaderCenterRight">
       
        </div>
      </div>
      <div class="MatcHeaderRight">
   
        <!--  
          <a class="" href="#/help.html">
            <QIcon icon="Book" :tooltip="$t('header.tooltip.documentation')"/>
          </a>
         <AccountButton :user="user"/> -->
        <!-- <a class="" href="#/my-account.html">
          <QIcon icon="Account"/>
          {{ $t('header.my-account') }}
        </a>
        <a class="" href="#/logout.html">{{ $t('header.logout') }}</a>
      -->
       
      </div>

</div>
</template>

<style lang="scss">
@import "../style/components/menu.scss";
</style>


<script>

import Logger from 'common/Logger'
// import AccountButton from 'page/AccountButton'
import _Tooltip from "common/_Tooltip";

export default {
  name: "Header",
  mixins: [_Tooltip],
  props: ['user'],
  data: function () {
    return {
    }
  },
  watch: {
    'user'(v) {
      this.logger.log(6, 'watch', 'user >> ' + v.email)
      this.user = v
    }
  },
  components: {
    // 'AccountButton': AccountButton
  },
  methods: {
  },
  async mounted() {
    this.logger = new Logger('Header')
    this.logger.log(7, 'mounted', 'exit >> ' + this.user.email)

    this.addTooltip(this.$refs.logo, this.$t("header.tooltip.my-prototypes"))
    this.addTooltip(this.$refs.myPrototype, this.$t("header.tooltip.my-prototypes"))
  }
}
</script>

