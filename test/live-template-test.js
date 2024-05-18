import '../src/live-template';
import { expect } from "@esm-bundle/chai";
import { fixture } from '@open-wc/testing';
import sinon from 'sinon';
import { Channel } from 'phoenix';
import LiveState from 'phx-live-state';

const setupLiveState = (el) => {
  el.liveState = new LiveState({url: 'ws://localhost:4000', topic: 'foo'});
  el.liveState.connect = sinon.stub();
  el.connectLiveState();
  el.liveState.eventTarget.dispatchEvent(new CustomEvent('livestate-change', {
    detail: {
      state: {foo: 'bar'},
      version: 1
    }
  }));
}

describe('render template', () => {
  it('renders state from liveState', async () => {
    const el = await fixture(`
    <live-template>
      <span :text="foo"></span>
    </live-template>
    `);
    setupLiveState(el);
    expect(el.innerHTML).to.contain('bar');
  });

  it('sends click events', async () => {
    const el = await fixture(`
    <live-template>
      <button data-thing="wut" :onclick="sendEvent('wuzzle')"></button>
    </live-template>
    `);
    setupLiveState(el);    
    const pushStub = sinon.stub();
    el.liveState.pushEvent = pushStub;
    const button = el.querySelector('button');
    button.click();
    const pushCall = pushStub.getCall(0);
    expect(pushCall.args[0]).to.equal('wuzzle');
    expect(pushCall.args[1].thing).to.equal('wut');
  });
  it('sends form events', async () => {
    const el = await fixture(`
    <live-template>
      <form :onsubmit="sendEvent('it')">
        <input name="foo" value="bar" />
        <input name="bar" value="wuzzle" />
        <button type="submit">save</button>
      </form>
    </live-template>
    `);
    setupLiveState(el);
    const pushStub = sinon.stub();
    el.liveState.pushEvent = pushStub;
    const button = el.querySelector('button');
    button.click();
    const pushCall = pushStub.getCall(0);
    expect(pushCall.args[0]).to.equal('it');
    expect(pushCall.args[1].foo).to.equal('bar');
    expect(pushCall.args[1].bar).to.equal('wuzzle');
  });
  it('sends events from directivs', async () => {
    const el = await fixture(`
    <live-template>
      <form :sendsubmit="it">
        <input name="foo" value="bar" />
        <input name="bar" value="wuzzle" />
        <button type="submit">save</button>
      </form>
    </live-template>
    `);
    setupLiveState(el);
    const pushStub = sinon.stub();
    el.liveState.pushEvent = pushStub;
    const button = el.querySelector('button');
    button.click();
    const pushCall = pushStub.getCall(0);
    expect(pushCall.args[0]).to.equal('it');
    expect(pushCall.args[1].foo).to.equal('bar');
    expect(pushCall.args[1].bar).to.equal('wuzzle');
  });

  it('sends custom events with element data', async () => {
    const el = await fixture(`
    <live-template custom-events="bar,bang">
      <span id="foo" data-wuzzle="blarg" :sendbar="bar" :sendbang="bang"></span>
    </live-template>
    `);
    setupLiveState(el);
    const pushStub = sinon.stub();
    el.liveState.pushEvent = pushStub;
    const span = el.querySelector('#foo');
    span.dispatchEvent(new CustomEvent('bar', {detail: {bing: 'bong'}, bubbles: true}))
    span.dispatchEvent(new CustomEvent('bang', {detail: {wuzzle: 'overwrite'}, bubbles: true}))
    const pushCall = pushStub.getCall(0);
    expect(pushCall.args[0]).to.equal('bar');
    expect(pushCall.args[1].bing).to.equal('bong');
    expect(pushCall.args[1].wuzzle).to.equal('blarg');
    const secondCall = pushStub.getCall(1);
    expect(secondCall.args[0]).to.equal('bang');
    expect(secondCall.args[1].wuzzle).to.equal('overwrite');
  });

  it('allows for nested templates and fallback content', async () => {
    const el = await fixture(`
    <live-template>
      <div>fall back!</div>
      <template>
        <span :text="foo"></span>
      </template>
    </live-template>

    `)
    expect(el.innerHTML).to.contain('fall back!');
    setupLiveState(el);
    expect(el.innerHTML).to.contain('bar');
    expect(el.innerHTML).not.to.contain('fall back!');
  });

  it('can share livestate instance using context', async () => {
    const el = await fixture(`
    <div>
      <live-template provide-context="daState" url="ws://localhost:4000" topic="wut" id="provider">
        <span :text="foo"></span>
      </live-template>
      <live-template consume-context="daState" id="consumer">
        <span :text="foo"></span>
      </live-template>
    </div>
    `)
    const provider = el.querySelector('#provider');
    const liveState = provider.liveState;
    expect(liveState).to.exist;
    liveState.connect = sinon.stub();
    provider.connectLiveState();
    liveState.eventTarget.dispatchEvent(new CustomEvent('livestate-change', {
      detail: {
        state: {foo: 'bar'},
        version: 1
      }
    }));
    const consumer = el.querySelector('#consumer');
    expect(provider.innerHTML).to.contain('bar');
    expect(consumer.innerHTML).to.contain('bar');
  });

});
