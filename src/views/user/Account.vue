<template>
  <div class="VommondContentContainer">


    <div class="MatcContent MatcMarginTopXXL ">
      <div class="MatcSection">
        <div class="container" v-if="user">
          <h2>My Account</h2>

          <p class="MatcLead MatcMarginBottomXL">
            View your account information
          </p>
          <div class="row">

            <div class="col-md-8 " v-if="isQuxAuth">
              <div class="MatcAccountInfo">
                <div class="form-group">
                  <label>Email</label>
                  <div class="MatcAccountValue">{{ user.email || 'Not set' }}</div>
                </div>

                <div class="form-group">
                  <label>Name</label>
                  <div class="MatcAccountValue">{{ user.name || 'Not set' }}</div>
                </div>

                <div class="form-group">
                  <label>Lastname</label>
                  <div class="MatcAccountValue">{{ user.lastname || 'Not set' }}</div>
                </div>

                <div class="MatcErrorLabel" v-if="error">
                  {{ error }}
                </div>
              </div>
            </div>
            <div class="col-md-8" v-else>
              <p class="MatcLead MatcMarginBottomXL">
                Your credentials are managed in Keycloak. Contact your admin for help.
              </p>
            </div>
   
          </div>
          <div class="row ">
            <div class="col-md-8 MatcMarginTopXXL">
         
              <p class="MatcDangerBox">
             
                If you want to delete your account, click <a @click="retire">here</a>. All your data will
                be removed, including your prototypes. If you want to save them, export them as *.zip files.
              </p>
            </div>

          </div>
        </div>


      </div>
    </div>
  </div>
</template>
<script>
import lang from 'dojo/_base/lang'
import on from 'dojo/on'

import Dialog from 'common/Dialog'
import DomBuilder from 'common/DomBuilder'
import Logger from "common/Logger";
import DojoWidget from "dojo/DojoWidget";
import Services from "services/Services";
export default {
  name: "Account",
  mixins: [DojoWidget],
  data: function () {
    return {
      error: '',
      user: null
    };
  },
  watch: {},
  components: {},
  computed: {
    isQuxAuth() {
      return Services.getConfig().auth !== 'keycloak'
    }
  },
  methods: {
    async retire() {
      this.logger.log(0, "retire", "entry");

      const db = new DomBuilder();
      const dialog = db.div("MatcDialog").build();
      const name = this.user.name ? this.user.name : this.user.email;

      db.h3("", this.getNLS("user.retire.hi") + name + ",")
        .build(dialog);

      db.div("MatcMarginTop", this.getNLS("user.retire.msg"), true)
        .build(dialog);

      const bar = db
        .div("MatcButtonBar MatcMarginTopXXL")
        .build(dialog);

      const del = db
        .a("MatcButton MatcButtonDanger", this.getNLS("btn.delete"))
        .build(bar);

      const cancel = db
        .a("MatcLinkButton", this.getNLS("btn.cancel"))
        .build(bar);

      const d = new Dialog();
      d.popup(dialog, this.$refs.retireBUTTON);
      d.own(on(del, "click", lang.hitch(this, "_retireUser", d, dialog)));
      d.own(on(cancel, "click", function () {
        d.close();
      }));
    },

    _retireUser(d, dialog) {
      Services.getUserService().retire(this.user); // this._doGet("/rest/retire");
      d.shake();
      dialog.innerHTML = this.getNLS("user.retire.cusoon");
      d.own(
        on(d, "close", () => {
          this.$root.$emit("logout");
        })
      );
    },

  },
  async mounted() {
    this.logger = new Logger("Finish");
    const userService = Services.getUserService();
    let user = userService.getUser();
    
    // If user not available, try to load it
    if (!user || (user.role === 'guest')) {
      this.logger.info("mounted", "User not loaded, attempting to load");
      user = await userService.load();
    }
    
    // Get the user ID (could be id or _id)
    const userId = user?.id || user?._id;
    
    if (!userId) {
      this.logger.error("mounted", "User ID not found", user);
      this.error = "User not found. Please login again.";
      return;
    }
    
    try {
      const full = await userService.loadById(userId);
      this.user = full;
      this.logger.info("mounted", "exit >> " + this.user.email);
    } catch (error) {
      this.logger.error("mounted", "Error loading user", error);
      this.error = "Error loading user data. Please try again.";
    }
  }
};
</script>

<style lang="scss" scoped>
.MatcAccountInfo {
  .form-group {
    margin-bottom: 24px;
    
    label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #363636;
    }
  }
  
  .MatcAccountValue {
    padding: 10px 12px;
    background-color: #f5f5f5;
    border: 1px solid #dbdbdb;
    border-radius: 4px;
    color: #363636;
    font-size: 16px;
    min-height: 20px;
  }
}
</style>
