# `<live-template>`

The `<live-template>` element provides a connected, or "live" template that connects to a stateful backend application provided by [Livesate](https://github.com/launchscout/live_state). After connecting to a LiveState channel, it will:

* render the initial state
* subscribe to state updates and re-render on changes
* push events to a Livestate channel which may then compute a new state

## Getting started

Live templates are primarily designed to add dynamic functionality to a static html website. The provide similar experience to technologies like LiveView, but with no opinions on back end hosting environment: (eg, it doesn't matter where your html is served). 

The easiest way to start is to open an html file and add a `<live-template>` element. You can try this with the example below:

```html
<script src=""></script>
<live-template url="wss://live-template-example.fly.dev/live_state" topic="todos">
  <ul>
    <li :each={{todo in todos}}>{{todo}}</li>
  </ul>

  <form onsubmit={{send('add-todo')}}>
    <label>Todo item</label>
    <input name="todo" />
    <button>Add todo</button>
  </form>
</live-template>
```

Any http server capable of serving html files should be able to serve this "web app". `npx http-server .` should suffice.

## How it works

The `<live-template>` element connects to a LiveState backend. LiveState is built on the same excellent technology stack that powers LiveView: Phoenix Channels, Phoenix, Elixir, and Erlang. This allows us to host the persistent conversational state of every user connected to a LiveTemplate application in a way that scales efficiently across millions of connected users. 

## Installation

You can install locally using npm:

```
npm install live-template
```

Alternatively, you can use a script tag to fetch it from your favorite npm CDN:

## Usage

Add a `<live-template>` element. Required attributes are:

* url: a WebSocket (ws: or wss:) url to connect to
* topic: the topic of the phoenix channel providing the state

## Template syntax

The template syntax is provided by the [templize](https://github.com/dy/templize) library. Expressions are surrounded by `{{}}`. See templize docs for all supported feature.

## Sending events

To send events to a LiveState backend, the `send()` function is provided and able to be called from event handlers in the template. It expects an event name as an argument. It will convert DOM events as follows:

* submit and input events will send the FormData and prevent the default event behaviour.
* click events will send the dataset of the element (any `data-` attributes).
* (more to come)

## Status

live-templates should be considered alpha quality. Template implementation uses templize which itself tracks the W3C work to standardize template instantiation. Because this work is ongoing, future syntax and implementation is subject to change.
