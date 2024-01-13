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
      {{foo}}
    </live-template>
    `);
    setupLiveState(el);
    expect(el.innerHTML).to.contain('bar');
  });

  it('sends click events', async () => {
    const el = await fixture(`
    <live-template>
      <button data-thing="wut" onclick={{send('wuzzle')}}></button>
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
      <form onsubmit={{send('it')}}>
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

  it('allows for nested templates and fallback content', async () => {
    const el = await fixture(`
    <live-template>
      <div>fall back!</div>
      <template>
        {{foo}}
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
        {{foo}}
      </live-template>
      <live-template consume-context="daState" id="consumer">
        {{foo}}
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
