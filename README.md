# `<live-template>`

The `<live-template>` element provides a connected, or "live" template that connects to a stateful backend application provided by [Livesate](https://github.com/launchscout/live_state). After connecting to a LiveState channel, it will:

* render the initial state
* subscribe to state updates and re-render on changes
* push events to a Livestate channel which may then compute a new state

## Getting started

Live templates are primarily designed to add dynamic functionality to a static html website. The provide a similar experience to technologies like LiveView, but with no opinions on back end hosting environment: (eg, it doesn't matter where your html is served). 

The easiest way to start is to open an html file and add a `<live-template>` element. Here's an example of what this looks like:

```html
<live-template url="wss://live-template-example.fly.dev/live_state" topic="todo:all">
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

In this example, the template will connect to a LiveState channel at the specified url and topic. In this case the channel will send an initial state with a single item, and will handle the `add-todo` event to add items to the list, which will then be pushed down as a state update. `live-template` will convert the form submit event to a custom event of the specified name using the form data as a payload (see below).

The channel code looks like this:

```elixir
defmodule LiveTemplatesExampleWeb.TodoChannel do
  @moduledoc false

  use LiveState.Channel, web_module: LiveTemplatesExampleWeb

  @impl true
  def init(_channel, _params, _socket) do
    {:ok, %{todos: ["Add an item"]}}
  end

  @impl true
  def handle_event("add-todo", %{"todo" => todo}, %{todos: todos} = state) do
    {:noreply, Map.put(state, :todos, todos ++ [todo])}
  end

end
```

This example is included in the `index.html` file in this repo and is also deployed as a [codepen](https://codepen.io/superchris-the-lessful/pen/GRepMGe). Locally, you can `npm start` to serve it up using a simple http server. Note that no transformation or build is occuring. Instead, an import map is used to resolve all the dependencies. Big shout out to [jspm](https://jspm.org) for making this easy!

## How it works

The `<live-template>` element connects to a [LiveState](https://github.com/launchscout/live_state) backend. LiveState is built on the same excellent technology stack that powers LiveView: Phoenix Channels, Phoenix, Elixir, and Erlang. This allows us to host the persistent conversational state of every user connected to a LiveTemplate application in a way that scales efficiently across millions of connected users. 

## Installation

You can install locally using npm:

```
npm install live-template
```

You can also use `live-template` without any build tool at all by using an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap). See index.html for a working example.

## Usage

Add a `<live-template>` element. Required attributes are:

* url: a WebSocket (ws: or wss:) url to connect to
* topic: the topic of the phoenix channel providing the state

## Template syntax

The template syntax is provided by the [templize](https://github.com/dy/templize) library. Expressions are surrounded by `{{}}`. See templize docs for all supported expressions and features.

## Sending events

To send events to a LiveState backend, the `send()` function is provided and able to be called from event handlers in the template. It expects an event name as an argument. It will convert DOM events as follows:

* submit and input events will send the FormData and prevent the default event behaviour.
* click events will send the dataset of the element (any `data-` attributes).
* (more to come)

## Status

live-templates should be considered alpha quality. Template implementation uses templize which itself tracks the W3C work to standardize template instantiation. Because this work is ongoing, future syntax and implementation is subject to change.
