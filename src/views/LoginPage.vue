<template>
    <div class="MatcLoginPage MactMainGradient">
        <div class="MatcLoginPageDialog">
            <div class="MatcLoginPageContainer">
                <div class="MatcLoginLoader">
                    <div class="MatcLoginLoaderSpinner"></div>
                    <div class="MatcLoginLoaderText">Authenticating...</div>
                </div>
            </div>
        </div>
    </div>
</template>


<style lang="scss">
    @import "../style/components/login.scss";
    @import '../style/toolbar/tab.scss';

    .MatcLoginLoader {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        padding: 40px;
    }

    .MatcLoginLoaderSpinner {
        width: 48px;
        height: 48px;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
    }

    .MatcLoginLoaderText {
        color: #fff;
        font-size: 18px;
        font-weight: 500;
        text-align: center;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>

<script>
import Services from 'services/Services'
import Logger from 'common/Logger'

export default {
  name: "LoginPage",
  mixins: [],
  props: ['user'],
  data: function() {
    return {
        isAuthenticating: true,
        checkInterval: null
    }
  },
  watch: {
    'user' (v) {
      this.logger.log(6, 'watch', 'user >> ' + (v ? v.email : 'null'))
      this.checkAuthentication()
    }
  },
  methods: {
      checkAuthentication() {
        const userService = Services.getUserService()
        const currentUser = userService.getUser()
        
        // Check if user is authenticated (not a guest)
        if (currentUser && currentUser.role && currentUser.role !== 'guest') {
          this.logger.info('checkAuthentication', 'User authenticated: ' + currentUser.email)
          this.isAuthenticating = false
          if (this.checkInterval) {
            clearInterval(this.checkInterval)
            this.checkInterval = null
          }
          // Emit login event to parent component
          this.$emit('login', currentUser)
          this.$root.$emit('UserLogin', currentUser)
        }
      },
      async attemptAuthentication() {
        this.logger.info('attemptAuthentication', 'Starting authentication')
        this.isAuthenticating = true
        
        try {
          // Try to load/authenticate user
          const userService = Services.getUserService()
          const user = await userService.load()
          
          this.logger.info('attemptAuthentication', 'Load completed, user: ' + (user ? user.email : 'null'))
          
          // Check if authentication was successful
          if (user && user.role && user.role !== 'guest') {
            this.logger.info('attemptAuthentication', 'Authentication successful')
            this.isAuthenticating = false
            this.$emit('login', user)
            this.$root.$emit('UserLogin', user)
          } else {
            this.logger.info('attemptAuthentication', 'Still guest, will continue checking')
            // Continue checking periodically
            this.startPeriodicCheck()
          }
        } catch (error) {
          this.logger.error('attemptAuthentication', 'Error during authentication', error)
          // Continue checking periodically even on error
          this.startPeriodicCheck()
        }
      },
      startPeriodicCheck() {
        // Check every 2 seconds if user becomes authenticated
        if (this.checkInterval) {
          clearInterval(this.checkInterval)
        }
        this.checkInterval = setInterval(() => {
          this.checkAuthentication()
        }, 2000)
      }
  },
  async mounted() {
    this.logger = new Logger('LoginPage')
    this.logger.log(1, 'mounted', 'Starting authentication flow')
    
    // Start authentication attempt
    await this.attemptAuthentication()
    
    // Also watch for user prop changes
    if (this.user) {
      this.checkAuthentication()
    }
  },
  beforeDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }
}
</script>