# Design Document: To-Do List Life Dashboard

## Overview

The To-Do List Life Dashboard is a client-side single-page application (SPA) built with plain HTML, CSS, and Vanilla JavaScript. It provides a personal productivity hub that runs entirely in the browser with no backend, no build tools, and no external dependencies.

The application bundles four independent widgets into a single viewport:

- **Greeting Widget** - live clock, date, and time-of-day greeting
- **Focus Timer** - Pomodoro-style 25-minute countdown with Start / Stop / Reset
- **Task Manager** - CRUD to-do list with completion toggling and inline editing
- **Quick Links** - saved shortcut buttons that open URLs in a new tab

All state is persisted exclusively in `window.localStorage` using a versioned JSON schema. The app loads as a single `index.html` file and works under the `file://` protocol, making it usable as a standalone page or a browser extension new-tab override.

---

## Architecture

### High-Level Structure

The application follows a **widget-based module pattern**: each widget is an isolated JavaScript IIFE that owns its own DOM references, state, and LocalStorage key. A thin bootstrap section in `app.js` initialises each widget in order. Widgets are fully independent with no cross-widget communication.

### File Structure

Per Requirement 6.3, exactly one HTML entry point, one CSS file in `css/`, and one JavaScript file in `js/`:

```
/
+-- index.html
+-- css/
|   +-- style.css
+-- js/
    +-- app.js
```

### Execution Model

1. `DOMContentLoaded` fires; the `app.js` bootstrap runs.
2. Each widget's `init()` is called sequentially.
3. `init()` reads from `localStorage`, renders initial state, and attaches event listeners.
4. The Greeting Widget starts a `setInterval` (60 s) to refresh the time display.
5. The Focus Timer manages its own `setInterval` (1 s) for the countdown.
6. No global mutable state is shared between widgets.

---
## Components and Interfaces

### GreetingWidget

**Responsibilities:** Display current time (HH:MM), current date, and a time-of-day greeting. Refresh every minute without a page reload.

**Public interface:**

```js
GreetingWidget.init()   // attaches to DOM, starts 60s interval
```

**Internal functions:**

```js
_getGreeting(hour)      // returns "Good morning" | "Good afternoon" | "Good evening"
_formatTime(date)       // returns "HH:MM" (24-hour, zero-padded)
_formatDate(date)       // returns "Monday, 4 July 2026"
_render()               // reads current Date(), calls helpers, updates DOM text nodes
```

**Greeting boundary rules:**

| Hour range (24 h) | Greeting         |
|-------------------|------------------|
| 00 - 11           | "Good morning"   |
| 12 - 17           | "Good afternoon" |
| 18 - 23           | "Good evening"   |

---

### FocusTimerWidget

**Responsibilities:** 25-minute Pomodoro countdown. Manage Start, Stop, Reset controls. Disable/enable controls per timer state. Notify user at 00:00.

**Public interface:**

```js
FocusTimerWidget.init()
```

**Internal functions:**

```js
_start()                  // begins setInterval(1000), transitions state to Running
_stop()                   // clears interval, retains remaining time, state to Paused
_reset()                  // clears interval, restores to 1500 s, state to Stopped
_tick()                   // decrements remainingSeconds, updates display, triggers _onComplete at 0
_onComplete()             // stops interval, shows notification/alert, state to Completed
_updateDisplay(seconds)   // formats to "MM:SS", sets innerText of display element
_updateControls(state)    // sets disabled/enabled on Start, Stop, Reset buttons
```

**Control states by timer state:**

| Timer State | Start    | Stop     | Reset   |
|-------------|----------|----------|---------|
| Stopped     | enabled  | disabled | enabled |
| Running     | disabled | enabled  | enabled |
| Paused      | enabled  | disabled | enabled |
| Completed   | disabled | enabled  | enabled |

---
### TaskManagerWidget

**Responsibilities:** Add, edit (inline), toggle complete, and delete tasks. Persist to and restore from `localStorage`. Show strikethrough on completed tasks. Show empty-state guidance when list is empty.

**Public interface:**

```js
TaskManagerWidget.init()
```

**Internal functions:**

```js
_addTask(description)     // trims, validates non-empty, creates Task, saves, re-renders
_deleteTask(id)           // removes task by id, saves, re-renders
_toggleComplete(id)       // flips task.completed, saves, re-renders
_startEdit(id)            // replaces task text node with <input>, focuses it
_saveEdit(id, newText)    // trims, validates non-empty, updates description, saves, re-renders
_render()                 // clears and rebuilds task list DOM from state array
_save()                   // StorageService.set('tld_tasks_v1', tasks)
_load()                   // StorageService.get('tld_tasks_v1', [])
_generateId()             // Date.now().toString() + '_' + Math.random().toString(36).slice(2,6)
```

---

### QuickLinksWidget

**Responsibilities:** Add links (label + URL), display as clickable buttons, delete links, open in new tab. Validate label and URL. Persist/restore from `localStorage`. Show empty-state guidance when empty.

**Public interface:**

```js
QuickLinksWidget.init()
```

**Internal functions:**

```js
_addLink(label, url)    // validates both fields, creates Link, saves, re-renders
_deleteLink(id)         // removes link by id, saves, re-renders
_openLink(url)          // window.open(url, '_blank', 'noopener,noreferrer')
_validateUrl(url)       // returns true if url is non-empty and passes URL constructor check
_render()               // clears and rebuilds links panel DOM from state array
_save()                 // StorageService.set('tld_links_v1', links)
_load()                 // StorageService.get('tld_links_v1', [])
_generateId()           // same pattern as TaskManagerWidget
_showError(message)     // sets innerText of inline error element, makes it visible
_clearError()           // hides inline error element
```

---

### StorageService (shared utility)

A small shared plain-object utility providing safe `localStorage` access with error recovery per Requirement 5.3.

```js
const StorageService = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (e) {
      return fallback;   // malformed JSON - silent recovery
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};
```

---
## Data Models

### Storage Keys

| Key             | Owner             | Type     |
|-----------------|-------------------|----------|
| `tld_tasks_v1`  | TaskManagerWidget | `Task[]` |
| `tld_links_v1`  | QuickLinksWidget  | `Link[]` |

The `_v1` suffix encodes the schema version (Requirement 5.2). A future breaking change bumps to `_v2`; old data under the original key is discarded.

### Task Object

```json
{
  "id": "1720000000000_a3f2",
  "description": "Buy milk",
  "completed": false,
  "createdAt": 1720000000000
}
```

| Field         | Type    | Constraint                    |
|---------------|---------|-------------------------------|
| `id`          | string  | unique, generated on creation |
| `description` | string  | non-empty after trim          |
| `completed`   | boolean | toggled by complete control   |
| `createdAt`   | number  | `Date.now()` at creation time |

### Link Object

```json
{
  "id": "1720000001000_b9c1",
  "label": "GitHub",
  "url": "https://github.com",
  "createdAt": 1720000001000
}
```

| Field       | Type   | Constraint                    |
|-------------|--------|-------------------------------|
| `id`        | string | unique, generated on creation |
| `label`     | string | non-empty after trim          |
| `url`       | string | non-empty, passes URL check   |
| `createdAt` | number | `Date.now()` at creation time |

### Schema Error Recovery

`StorageService.get()` wraps `JSON.parse` in a `try/catch`. On failure (malformed JSON) or non-array result, the fallback (`[]`) is returned silently, satisfying Requirement 5.3.

---
## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system -- essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Greeting covers every hour exactly once

*For any* hour value in [0, 23], `_getGreeting(hour)` SHALL return exactly one of "Good morning", "Good afternoon", or "Good evening". For hours in [0, 11] the result is "Good morning"; for [12, 17] it is "Good afternoon"; for [18, 23] it is "Good evening". The function never returns null, undefined, or any other value.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 2: Timer display round-trip

*For any* integer in [0, 1500], formatting it with `_updateDisplay(seconds)` into a "MM:SS" string and then parsing that string back to total seconds SHALL produce the original value.

**Validates: Requirements 2.5**

---

### Property 3: Task addition grows list and sets description

*For any* task list and any valid (non-empty, non-whitespace-only) task description string, calling `_addTask(description)` SHALL increase the task list length by exactly one AND the new task's trimmed description SHALL equal the trimmed input string.

**Validates: Requirements 3.2, 3.7**

---

### Property 4: Whitespace-only task descriptions are rejected

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), calling `_addTask` with that string SHALL leave the task list unchanged.

**Validates: Requirements 3.3**

---

### Property 5: Completion toggle is an involution

*For any* task, calling `_toggleComplete(id)` twice in succession SHALL return the task's `completed` field to its original value. That is, `toggle(toggle(task)).completed === task.completed`.

**Validates: Requirements 3.4**

---

### Property 6: Task deletion removes the task from the list

*For any* task list containing a task with a given id, calling `_deleteTask(id)` SHALL produce a list that does not contain any task with that id.

**Validates: Requirements 3.6**

---

### Property 7: Task persistence round-trip

*For any* array of valid task objects, calling `_save()` followed by `_load()` SHALL return an array that is deeply equal to the original (same ids, descriptions, completed values, and createdAt timestamps).

**Validates: Requirements 3.7, 3.8, 5.2**

---

### Property 8: Link addition grows the links list

*For any* links list and any valid (non-empty label, valid URL) link, calling `_addLink(label, url)` SHALL increase the links list length by exactly one AND the new link SHALL have the correct label and url fields.

**Validates: Requirements 4.2, 4.6**

---

### Property 9: Link deletion removes the link from the list

*For any* links list containing a link with a given id, calling `_deleteLink(id)` SHALL produce a list that does not contain any link with that id.

**Validates: Requirements 4.5**

---

### Property 10: Link persistence round-trip

*For any* array of valid link objects, calling `_save()` followed by `_load()` SHALL return an array that is deeply equal to the original (same ids, labels, urls, and createdAt timestamps).

**Validates: Requirements 4.6, 4.7, 5.2**

---

### Property 11: Storage error recovery on malformed data

*For any* arbitrary string stored as a raw `localStorage` value under a known key, `StorageService.get(key, [])` SHALL return `[]` without throwing an exception.

**Validates: Requirements 5.3**

---
## Error Handling

### Input Validation Errors

| Widget       | Invalid input                    | Behaviour                                        |
|--------------|----------------------------------|--------------------------------------------------|
| TaskManager  | Empty or whitespace-only text    | Reject, retain focus on input, no state change   |
| TaskManager  | Empty edit result                | Reject edit, restore original text               |
| QuickLinks   | Empty label or empty URL         | Reject, display inline validation message        |
| QuickLinks   | Malformed URL string             | Reject, display inline validation message        |

URL validation uses the `URL` constructor (`new URL(value)`) inside a `try/catch`. This handles absolute URLs correctly without a regex.

### LocalStorage Errors

- **Corrupted data (unparseable JSON):** `StorageService.get` catches the exception and returns the fallback. Widgets initialise with an empty list.
- **`localStorage` quota exceeded on write:** `StorageService.set` does not currently wrap writes in try/catch. A future enhancement could add this. The spec does not require handling quota errors.
- **`localStorage` unavailable:** Not in scope per Requirement 6, which targets latest stable browsers where localStorage is available.

### Timer Edge Cases

- **Double-click on Start:** The Start button is disabled while Running (Requirement 2.7), preventing duplicate `setInterval` calls.
- **Reset while running:** `_reset()` calls `clearInterval` before restoring state, ensuring no stale ticks fire after reset.
- **Page refresh while timer is running:** Timer state is intentionally not persisted to `localStorage`. On reload the timer resets to 25:00. This is the expected Pomodoro behaviour.

---
