# AGENTS.md

## Purpose

This project is a lightweight web application for drawing studies.

The application displays a 3D model that users can inspect from different angles while drawing. The project prioritizes:

* Simplicity
* Shareability
* Mobile usability
* Performance
* Extensibility

All implementation decisions should preserve these goals.

---

## Project Documentation

Before making changes, read:

1. `docs/001.app.md` — application specification
2. `docs/002.settings.md` — settings registry and URL serialization contract

The documentation is the source of truth.

If implementation and documentation disagree:

* Follow the documentation.
* Update the implementation.
* Do not silently introduce new behavior.

---

## Core Architectural Principles

### URL is the Source of Truth

All user-configurable state must be serializable into the URL.

A shared URL must reconstruct the scene as closely as possible.

Requirements:

* Every configurable setting must define serialization.
* Every configurable setting must define deserialization.
* Missing query parameters imply default values.
* Invalid query parameter values must fall back safely.

Do not create state that cannot be reconstructed from the URL unless explicitly documented.

---

### Settings Registry Owns Settings

Settings must be registered in the settings registry.

Do not:

* Create ad-hoc settings
* Hardcode settings into UI components
* Manually manage query parameters for individual settings

Adding a setting should be accomplished by:

1. Registering the setting definition
2. Applying the value to the scene

The registry should handle:

* Defaults
* Validation
* UI generation
* Serialization
* Deserialization

---

### Event-Driven Rendering

The renderer must remain idle whenever possible.

Do not introduce:

* Permanent animation loops
* Polling
* Continuous rendering without justification

Rendering should occur only when:

* Camera changes
* Controls move
* Model changes
* Settings change
* Viewport changes

Idle scenes should consume near-zero CPU.

---

### Progressive Enhancement

The application is expected to grow gradually.

Prefer solutions that:

* Allow future settings
* Allow future model formats
* Allow future scene controls

Avoid premature abstraction.

Avoid introducing frameworks unless explicitly required.

---

## UI Principles

### Mobile First

All controls must remain usable on touch devices.

Requirements:

* Minimum 44×44px touch targets
* Reasonable spacing
* Swipe-friendly interactions

---

### Scene Remains Visible

The model viewer is the primary interface.

Settings panels should not completely obscure the scene whenever possible.

---

### Native HTML Controls

Use standard DOM elements.

Prefer:

* button
* select
* input

Avoid custom controls unless necessary.

---

## Three.js Guidelines

### Model Normalization

All loaded models should be normalized before display.

Normalization includes:

1. Centering
2. Uniform scaling
3. Camera fitting

The viewer should provide a consistent experience regardless of source model size.

---

### Supported Model Formats

Use dynamic imports for loaders.

Loaders should only be loaded when required.

Avoid increasing initial bundle size unnecessarily.

---

### Fallback Model

The viewer must never start empty.

If loading fails:

* Show a non-blocking error
* Load the fallback model
* Keep the application functional

---

## State Management

### Defaults

Every setting must have a default value.

Defaults should be defined in exactly one place.

---

### Versioning

URL state formats should be versioned.

If serialization changes:

* Increment the version
* Maintain backward compatibility where practical

---

## Code Organization

Favor small modules with clear responsibilities.

Preferred structure:

```text
src/
├─ viewer/
├─ models/
├─ camera/
├─ settings/
├─ url/
└─ ui/
```

Keep responsibilities separated.

Examples:

* Model loading belongs in `models/`
* URL serialization belongs in `url/`
* Settings definitions belong in `settings/`

---

## Performance Expectations

Performance is a feature.

Before introducing new code, consider:

* Bundle size
* Runtime allocations
* Render frequency
* Mobile performance

Prefer simpler solutions unless complexity provides measurable value.

---

## When Extending the Application

Before adding a new feature:

1. Determine whether it is user-configurable.
2. If configurable, register it as a setting.
3. Define URL serialization.
4. Define URL deserialization.
5. Ensure shared URLs preserve behavior.
6. Ensure rendering remains event-driven.

Features that cannot satisfy these requirements should be discussed before implementation.

---

## Non-Goals

Do not introduce:

* React
* Vue
* Angular
* Global state libraries
* CSS frameworks
* Continuous render loops

unless the project documentation is explicitly updated to require them.

Keep the application small, understandable, and dependency-light.
