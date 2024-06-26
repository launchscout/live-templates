import LiveState from 'phx-live-state';
import { registerContext, observeContext } from 'wc-context';
import sprae, { directive } from 'sprae';

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
    directive.sendclick = this.sendEventDirective('click');
    directive.sendsubmit = this.sendEventDirective('submit');
    directive.sendinput = this.sendEventDirective('input');
    if (this.getAttribute('custom-events')) {
      const customEvents = this.getAttribute('custom-events').split(',');
      for (const customEvent of customEvents) {
        console.log('adding directive for', customEvent);
        directive[`send${customEvent}`] = this.sendEventDirective(customEvent);
      }
    }
  }

  connectLiveState() {
    this.liveState.connect();
    this.liveState.addEventListener('livestate-change', ({ detail: { state } }) => {
      console.log('got state', state);
      this.buildTemplate();
      sprae(this, { ...state, sendEvent: (n) => (e) => this.sendEvent(n, e) });
    });
  }

  buildTemplate() {
    const template = this.querySelector("template");
    if (template) {
      this.replaceChildren(template.content);
    }
  }

  sendEventDirective(eventName) {
    const dir = (el, evaluate, state, name) => {
      let removeOldListener;
      return () => {
        removeOldListener?.();
        const handler = (e) => {
          this.sendEvent(evaluate, e);
        };
        removeOldListener = () => el.removeEventListener(eventName, handler);
        el.addEventListener(eventName, handler);
      }
    }
    dir.parse = (value) => value;
    return dir;
  }

  sendEvent(eventName, e) {
    if (e instanceof SubmitEvent) {
      const form = e.target;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      this['liveState'].pushEvent(eventName, data);
    } else if (e instanceof InputEvent) {
      const input = e.target;
      const payload = {};
      payload[input.getAttribute('name')] = input.value;
      this['liveState'].pushEvent(eventName, payload);
    } else if (e instanceof CustomEvent) {
      const detail = e.detail;
      const payload = Object.assign({}, e.target.dataset, detail);
      this['liveState'].pushEvent(eventName, payload);
    } else {
      this['liveState'].pushEvent(eventName, e.target.dataset)
    }
    e.preventDefault();
  }
}

window.customElements.define('live-template', LiveTemplateElement);