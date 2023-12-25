import templize, {directive} from 'templize/templize.js';
import LiveState from 'phx-live-state';

export class LiveTemplateElement extends HTMLElement {
  connectedCallback() {
    if (this.getAttribute('url') && this.getAttribute('topic')) {
      this.liveState = new LiveState({
        url: this.getAttribute('url'),
        topic: this.getAttribute('topic')
      });
      this.connectLiveState();
    }
  }

  connectLiveState() {
    this.liveState.connect();
    this.liveState.addEventListener('livestate-change', ({ detail: { state } }) => {
      if (this.updater) {
        this.updater(state);
      } else {
        const send = (eventName) => (e) => this.sendEvent(eventName, e);
        const [params, update] = templize(this, { ...state, send });
        this.updater = update;
      }
    });
  }

  sendEvent(eventName, e) {
    if (e instanceof SubmitEvent) {
      const form = e.target;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      this['liveState'].pushEvent(eventName, data);
    } else if (e instanceof InputEvent) {
      const form = e.target.form;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      this['liveState'].pushEvent(eventName, data);
    } else {
      console.log(e);
      this['liveState'].pushEvent(eventName, e.target.dataset)
    }
    e.preventDefault();
  }
}

window.customElements.define('live-template', LiveTemplateElement);