import Combobox from '@github/combobox-nav';
import debounce from 'debounce';

export class SimpleAutocomplete extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
    <slot name="input"></slot>
    <slot name="list"></slot>
    `;
    const inputSlot = this.shadowRoot.querySelector('slot[name="input"]');
    const input = inputSlot.assignedElements().length > 0 ? inputSlot.assignedElements()[0] : undefined;
    input.addEventListener('input',
      debounce((e) => this.dispatchEvent(
        new CustomEvent('autocomplete-search', { detail: { query: input.value } })), 300));
    const listSlot = this.shadowRoot.querySelector('slot[name="list"]');
    const list = listSlot.assignedElements().length > 0 ? listSlot.assignedElements()[0] : undefined;
    const combobox = new Combobox(input, list)
    // when options appear, start intercepting keyboard events for navigation
    combobox.start();
    this.addEventListener("combobox-commit", ({detail, target}) => {
      if (this.getAttribute('clear-on-select')) {input.value = '';}
      target.dispatchEvent(new CustomEvent('autocomplete-commit', {detail, bubbles: true}));
    })
  }
}

customElements.define('simple-autocomplete', SimpleAutocomplete)