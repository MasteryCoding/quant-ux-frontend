import Logger from '../../core/Logger'

/**
 * Stubbed CollabService - Collaboration features have been removed
 * This service is kept as a no-op to avoid breaking BaseController
 */
export default class CollabService {

    constructor(appId ='OhOh'){
      Logger.log(2, 'CollabService() - STUBBED', appId)
      this.events = []
      this.appId = appId
    }

    setModel (m) {
      this.appId = m.id
    }

    reset () {
      this.events = []
    }

    // eslint-disable-next-line no-unused-vars
    createEvent (changes) {
      // No-op: collaboration disabled
      return {
        id: 'stub',
        appId: this.appId,
        ts: new Date().getTime(),
        changes: []
      }
    }

    // eslint-disable-next-line no-unused-vars
    applyEvent (model, event) {
      // No-op: collaboration disabled
      return model
    }

    // eslint-disable-next-line no-unused-vars
    pushEvent(event) {
      // No-op: collaboration disabled
    }

}
