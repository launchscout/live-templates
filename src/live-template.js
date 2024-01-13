import templize, {directive} from 'templize/templize.js';
import LiveState from 'phx-live-state';
import { registerContext, observeContext } from 'wc-context';
import { parse, NodeTemplatePart, TemplateInstance } from 'template-parts'

export class LiveTemplateElement extends HTMLElement {
  connectedCallback() {
    if (this.getAttribute('consume-context')) {
      const contextName = this.getAttribute('consume-context')
      observeContext(this, contextName, this, (el, liveState) => {
        this.liveState = liveState;
        this.connectLiveState();
      });
    }
    if (this.getAttribute('url') && this.getAttribute('topic')) {
      this.liveState = new LiveState({
        url: this.getAttribute('url'),
        topic: this.getAttribute('topic')
      });
      const provideContext = this.getAttribute('provide-context');
      if (provideContext) {
        registerContext(document, provideContext, this.liveState);
      }
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
        const [params, update] = this.buildTemplate({ ...state, send });
        this.updater = update;
      }
    });
  }

  buildTemplate(state) {
    const template = this.querySelector("template");
    if (template) {
      const tpl = templize(template.content, state);
      this.replaceChildren(template.content);
      return tpl;
    } else {
      return templize(this, state)
    }
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