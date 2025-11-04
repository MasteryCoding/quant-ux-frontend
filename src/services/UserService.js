import AbstractService from './AbstractService'
import Logger from '../common/Logger'
import Cookies from 'js-cookie'

class UserService extends AbstractService{

    constructor () {
        super()
        this.logger = new Logger('UserService')
        this.language = 'en'
        this.GUEST = {
            id: -1,
            name: "Guest",
            email: "guest@quant-ux.com",
            role: "guest",
            lastlogin: 0,
            lastNotification: 0,
            tos: false,
            paidUntil: 0,
            plan: "Free"
        }
    }

    /**
     * Exchange authorization cookie for Quant-UX JWT token
     */
    async exchangeToken () {
        try {
            this.logger.info('exchangeToken()', 'Attempting token exchange')
            const authCookie = Cookies.get('authorization')
            
            if (!authCookie) {
                this.logger.info('exchangeToken()', 'No authorization cookie found')
                return null
            }

            const response = await fetch('/rest/user/token-exchange', {
                method: 'POST',
                headers: {
                    'Authorization': authCookie,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })

            if (response.ok) {
                const user = await response.json()
                if (user && user.token) {
                    this.logger.info('exchangeToken()', 'Token exchange successful')
                    this.setUser(user)
                    return user
                }
            } else {
                this.logger.error('exchangeToken()', 'Token exchange failed', response.status)
            }
        } catch (error) {
            this.logger.error('exchangeToken()', 'Error during token exchange', error)
        }
        return null
    }

    save (userID, data) {
        return this._post('rest/user/' + userID + ".json", data)
    }

    logout () {
        localStorage.removeItem('quxUser');
        Cookies.remove('quxUserLoggedIn')
        Cookies.remove('quxUserLoggedIn', { path: '/' })
        Cookies.remove('authorization')
        Cookies.remove('authorization', { path: '/' })
        this.user = this.GUEST
        location.href = "#/"
    }

    async load () {
        if (!this.user) {
            this.logger.info('load()', 'Loading user')
            
            // First, try to load from localStorage
            let s = localStorage.getItem('quxUser')
            if (s) {
                try {
                    const user = JSON.parse(s)
                    this.setTTL(user)
                    if (this.isValidUser(user)) {
                        this.logger.info('load()', 'Valid user from localStorage')
                        this.user = user
                        this.setToken(this.getToken())
                        return this.user
                    } else {
                        this.logger.info('load()', 'User token expired, attempting refresh')
                    }
                } catch (error) {
                    this.logger.error('load', 'Could not parse stored user', s)
                }
            }

            // If no valid user, try token exchange
            const user = await this.exchangeToken()
            if (user) {
                this.user = user
                return this.user
            }

            // Default to guest
            this.logger.info('load()', 'No valid authentication, using guest')
            this.user = this.GUEST
        }
        return this.user
    }

    async loadById (id) {
        return await this._get('/rest/user/' + id + '.json')
    }

    getNotications () {
        return this._get('/rest/notifications.json')
    }

    setLastNotication () {
        return this._post('/rest/user/notification/last.json')
    }

    getLastNotication () {
        return this._get('/rest/user/notification/last.json')
    }

    getUser () {
        return this.user
    }

    getToken () {
        /**
         * We might have an issue here on first loads!
         * Make sure we check the local storage.
         */
        if (!this.user) {
            // Note: load() is now async, but we need to maintain backwards compatibility
            // Caller should ensure load() is called before getToken()
            const s = localStorage.getItem('quxUser')
            if (s) {
                try {
                    const user = JSON.parse(s)
                    if (this.isValidUser(user)) {
                        this.user = user
                    }
                } catch (error) {
                    this.logger.error('getToken', 'could not parse', s)
                }
            }
        }

        if (this.user && this.user.token) {
            if (this.isValidUser(this.user)) {
                return this.user.token
            } else {
                this.logger.error('getToken', 'Error > Token has timed out')
                if (this.errorHandler) {
                    this.errorHandler('', {
                        tokenTimedOut: true
                    })
                }
            }
        }
        return null;
    }

    isValidUser (u) {
        if (u.exp && u.exp > 0) {
            if (u.exp > new Date().getTime()) {
                return true
            } else {
                this.logger.error('isValidUser', 'Error > Token has timed out')
                this.logout()
            }
        }
        return false
    }

    setTTL (u) {
        if (u.token) {
            let jwt = this.parseJwt(u.token)
            if (jwt) {
                // JWT uses seconds
                u.exp = jwt.exp * 1000
                if (this.ttlTimeout) {
                    clearTimeout(this.ttlTimeout)
                }
                let waitTime = u.exp - new Date().getTime() - (5 * 60 * 1000)
                this.ttlTimeout = setTimeout(() => {
                    location.href = `#/logout.html`
                }, waitTime)
                this.logger.log(-1, 'setTTL', 'User valid until', new Date(u.exp))
                this.logger.log(-1, 'setTTL', 'Auto logout in ' + (waitTime / 1000) + ' sec')
            } else {
                this.logger.log(-1, 'setTTL', 'exit > NO token')
            }
        }
    }

    parseJwt (token) {
        try {
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            this.logger.error('parseJwt', 'error > could not parse token', e)
        }
        return null
    }

    setUser (u) {
        this.setTTL(u)
        this.user = u
        localStorage.setItem('quxUser', JSON.stringify(u));
    }

    setLanguage (language) {
        this.language = language
        localStorage.setItem('quxLanguage', this.language);
    }

    getLanguage () {
        let s = localStorage.getItem('quxLanguage')
        if (s) {
            this.language = s
        } else {
            this.language = navigator.language
        }
        return this.language
    }

    contact (name, email, message) {
        return this._post("/rest/contact", {
            name: name,
            email: email,
            message: message
        })
    }

    deleteImage (user) {
        return this._delete( "/rest/user/" + user.id + "/images/" + user.image);
    }

}
export default new UserService()
