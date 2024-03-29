# `<live-template>`

The `<live-template>` element provides a connected, or "live" template that connects to a stateful backend application provided by [Livestate](https://github.com/launchscout/live_state). After connecting to a LiveState channel, it will:

* render the initial state
* subscribe to state updates and re-render on changes
* push events to a Livestate channel which may then compute a new state

## Getting started

Live templates are primarily designed to add dynamic functionality to a static html website. The provide a similar experience to technologies like LiveView, but with no opinions on back end hosting environment: (eg, it doesn't matter where your html is served). 

The easiest way to start is to open an html file and add a `<live-template>` element. Here's an example of what this looks like:

```html
<live-template url="wss://live-template-example.fly.dev/live_state" topic="todo:all">
  <ul>
    <li :each="todo in todos" :text="todo">
  </ul>
  <form :onsubmit="sendEvent('add-todo')">
    <label>Todo item</label>
    <input :value="new_todo" name="todo" />
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

Add a `<live-template>` element. Connection attributes are:

* url: a WebSocket (ws: or wss:) url to connect to
* topic: the topic of the phoenix channel providing the state

These attributes are required unless `consume-context` is specified (see below).

## Template syntax

The template syntax is provided by the [sprae](https://github.com/dy/sprae) library. Earlier versions used templize, which is no longer supported by the author. Expressions are set on elements special attributes such as:

* `:each` to repeat
* `:text` to set a value
* `:onlick`, `:onsubmit` to attach event handlers

There a quite a few more, for the full list see the [sprae README](https://github.com/dy/sprae)

## Sending events

To send events to a LiveState backend, the `sendEvent()` function is provided and able to be called from event handlers in the template. It takes the name of the event to send to the channel, and will convert DOM events as follows:

* submit and input events will send the FormData and prevent the default event behaviour.
* click events will send the dataset of the element (any `data-` attributes).
* (more to come)

## Adding fallback content and avoiding early renders

To avoid the content of your live-template appearing before there is data, you can wrap your content in a template element like so:

```html
<live-template>
  <template>here is a <span :text="thing">thing</span> thats get rendered when connected</template>
  <div>this is what will be rendered before connection</div>
</live-template>
```

This will let you avoid the template rendering in an unevaluated "raw" state before the connection to LiveState happens. It will also let you add "fallback" content that will render before the connection is established.

## Context

If you have multiple `<live-template>` elements, you can have them share a `LiveState` instance using the [context protocol](https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md). To do so, use the `provide-context` attribute on an instance that specifies a `url` and `topic` attribute. This element will then register its LiveState instance using the value of this attribute, as well as setting a property of `window` (the value being used as the propery name). On another `<live-template>` instance you can use the `consume-context` attribute with the same name passed in to the other instances `provide-context` attribute. For the consuming instance, there is no need to specify url and topic as it will not be used.

Example:

```html
  <body>
    <live-template url="ws://localhost:4000/live_state" topic="todo:all" provide-context="mrstate">
      <template>
        <ul>
          <li :each="todo in todos" :text="todo">
        </ul>
        <form :onsubmit="sendEvent('add-todo')">
          <label>Todo item</label>
          <input :value="new_todo" name="todo" />
          <button>Add todo</button>
        </form>
      </template>
      <div>some fallback content</div>
    </live-template>
    <live-template consume-context="mrstate">
      <div :each="todo in todos" :text="todo"></div>
    </live-template>
  </body>
```

## Status

live-templates should be considered alpha quality.

## Future plans

* Support multiple templating implementations if desired (add an issue to support your favorite!)
* More examples