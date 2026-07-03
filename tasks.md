# Implementation Plan: To-Do List Life Dashboard

## Overview
 a single-page personal productivity dashboard using plain HTML, CSS, and Vanilla JavaScript. The app uses a single `index.html`, `css/style.css`, and `js/app.js`. Each widget is an IIFE module. State persists via `StorageService` wrapping `localStorage`. No frameworks, no build tools, works under `file://`.

---

## Tasks

- [x] 1. Scaffold the project file structure
  - [x] 1.1 Create the directory layout and empty entry-point files
    - Create `index.html`, `css/style.css`, and `js/app.js` at the project root
    - Add a minimal HTML5 boilerplate to `index.html` that links `css/style.css` in `<head>` and `js/app.js` before `</body>`
    - Verify all three files exist and the HTML references are correct
    - _Requirements: 6.3, 6.4_

- [ ] 2. Implement StorageService
  - [ ] 2.1 Write the `StorageService` plain-object utility in `js/app.js`
    - Implement `get(key, fallback)`: reads from `localStorage`, parses JSON, returns fallback on null/non-array/parse error
    - Implement `set(key, value)`: serialises value to JSON and writes to `localStorage`
    - Define the utility before any widget IIFEs so it is available at widget init time
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 2.2 Write property test for `StorageService` error recovery (Property 11)
    - **Property 11: Storage error recovery on malformed data**
    - **Validates: Requirements 5.3**
    - For any arbitrary string stored under a key, `StorageService.get(key, [])` must return `[]` without throwing

- [ ] 3. Implement GreetingWidget
  - [ ] 3.1 Add the `GreetingWidget` IIFE to `js/app.js`
    - Implement `_getGreeting(hour)` returning Good morning (0-11), Good afternoon (12-17), or Good evening (18-23)
    - Implement `_formatTime(date)` producing zero-padded HH:MM (24-hour)
    - Implement `_formatDate(date)` producing e.g. Monday, 4 July 2026
    - Implement `_render()` that reads new Date(), calls helpers, and updates DOM text nodes
    - Implement `init()` calling `_render()` immediately and starting a setInterval of 60000 ms
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 3.2 Write property test for greeting coverage (Property 1)
    - **Property 1: Greeting covers every hour exactly once**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**
    - For every integer hour in [0, 23], `_getGreeting(hour)` must return exactly one of the three greeting strings and never return null/undefined

- [ ] 4. Implement FocusTimerWidget
  - [ ] 4.1 Add the `FocusTimerWidget` IIFE to `js/app.js`
    - Define internal state: remainingSeconds=1500, timerState (Stopped/Running/Paused/Completed), intervalId
    - Implement `_updateDisplay(seconds)` formatting to MM:SS and setting the display element text
    - Implement `_updateControls(state)` enabling/disabling Start, Stop, Reset per the state table in the design
    - Implement `_tick()`: decrement remainingSeconds, call `_updateDisplay`, call `_onComplete` at 0
    - Implement `_onComplete()`: clear interval, call `_updateControls('Completed')`, notify user
    - Implement `_start()`, `_stop()`, `_reset()` per their design contracts
    - Implement `init()` attaching click listeners and rendering initial Stopped state
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [ ]* 4.2 Write property test for timer display round-trip (Property 2)
    - **Property 2: Timer display round-trip**
    - **Validates: Requirements 2.5**
    - For any integer in [0, 1500], formatting with `_updateDisplay` and parsing MM:SS back to seconds must equal the original value

- [ ] 5. Implement TaskManagerWidget
  - [ ] 5.1 Add the `TaskManagerWidget` IIFE to `js/app.js`
    - Implement `_generateId()` using Date.now().toString() + '_' + Math.random().toString(36).slice(2,6)
    - Implement `_load()` via StorageService.get('tld_tasks_v1', [])
    - Implement `_save()` via StorageService.set('tld_tasks_v1', tasks)
    - Implement `_addTask(description)`: trim, reject empty/whitespace-only, create Task {id, description, completed:false, createdAt}, push, save, re-render
    - Implement `_deleteTask(id)`: filter out by id, save, re-render
    - Implement `_toggleComplete(id)`: flip task.completed, save, re-render
    - Implement `_startEdit(id)` and `_saveEdit(id, newText)`: replace text node with input, focus, validate non-empty on save, restore original on empty
    - Implement `_render()`: clear and rebuild task list DOM; strikethrough for completed; show empty-state when list is empty
    - Implement `init()` calling _load(), _render(), and attaching add-task form submit listener
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [ ]* 5.2 Write property test for task addition (Property 3)
    - **Property 3: Task addition grows list and sets description**
    - **Validates: Requirements 3.2, 3.7**
    - For any valid description, _addTask must increase list length by 1 and set trimmed description

  - [ ]* 5.3 Write property test for whitespace rejection (Property 4)
    - **Property 4: Whitespace-only task descriptions are rejected**
    - **Validates: Requirements 3.3**
    - For any whitespace-only string, _addTask must leave the task list unchanged

  - [ ]* 5.4 Write property test for completion toggle involution (Property 5)
    - **Property 5: Completion toggle is an involution**
    - **Validates: Requirements 3.4**
    - For any task, calling _toggleComplete(id) twice must return completed to its original value

  - [ ]* 5.5 Write property test for task deletion (Property 6)
    - **Property 6: Task deletion removes the task from the list**
    - **Validates: Requirements 3.6**
    - For any list containing a task with a given id, _deleteTask(id) must produce a list with no task having that id

  - [ ]* 5.6 Write property test for task persistence round-trip (Property 7)
    - **Property 7: Task persistence round-trip**
    - **Validates: Requirements 3.7, 3.8, 5.2**
    - For any valid Task[], calling _save() then _load() must return an array deeply equal to the original

- [ ] 6. Checkpoint - Task widget complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement QuickLinksWidget
  - [ ] 7.1 Add the `QuickLinksWidget` IIFE to `js/app.js`
    - Implement `_generateId()` (same pattern as TaskManagerWidget)
    - Implement `_load()` via StorageService.get('tld_links_v1', [])
    - Implement `_save()` via StorageService.set('tld_links_v1', links)
    - Implement `_validateUrl(url)`: returns true if non-empty and new URL(url) does not throw
    - Implement `_addLink(label, url)`: validate both fields, create Link {id, label, url, createdAt}, push, save, re-render; show inline error on failure
    - Implement `_deleteLink(id)`: filter out by id, save, re-render
    - Implement `_openLink(url)`: window.open(url, '_blank', 'noopener,noreferrer')
    - Implement `_showError(message)` and `_clearError()` targeting the inline error element
    - Implement `_render()`: clear and rebuild links panel; render each link as a clickable button with delete control; show empty-state when empty
    - Implement `init()` calling _load(), _render(), and attaching add-link form submit listener
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 7.2 Write property test for link addition (Property 8)
    - **Property 8: Link addition grows the links list**
    - **Validates: Requirements 4.2, 4.6**
    - For any valid (non-empty label, valid URL) pair, _addLink must increase list length by 1 with correct label/url

  - [ ]* 7.3 Write property test for link deletion (Property 9)
    - **Property 9: Link deletion removes the link from the list**
    - **Validates: Requirements 4.5**
    - For any list containing a link with a given id, _deleteLink(id) must produce a list with no link having that id

  - [ ]* 7.4 Write property test for link persistence round-trip (Property 10)
    - **Property 10: Link persistence round-trip**
    - **Validates: Requirements 4.6, 4.7, 5.2**
    - For any valid Link[], calling _save() then _load() must return an array deeply equal to the original
