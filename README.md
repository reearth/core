# @reearth/core

- **Visualizer**: Map
- **Map**: Engine + mantle

![Architecture](docs/architecture.svg)

## Context

We have some type of the context to expose the interface for the map API. The map API is the abstracted map engine API. For example, we are using Cesium as the map engine, but we have a plan to support another map engine in the future. To do this, we define the interface as the map API. The map API is abstracted as MapRef internally. The MapRef has two type of API for now. First one is EngineRef that is API to access to the map engine's API. And second one is LayersRef that is API to access to the abstracted layer system. This manages the data to display for the map engine.

We have the context as the follows.

- FeatureContext ... It works as the interface for exposing the map API to the Feature components and the Layers component.
- WidgetContext ... It works as the interface for exposing the map API to the Widget components.
- VisualizerContext ... It works as the interface for exposing the map API to Visualizer.

By defining these context as the interface, we can understand which API for the map API is used in each layer. And if there are some features of the map API depends on the layer, we can absorb the feature in the context.

## Devlopment

You have several way to develop this library.
1. You can use storybook: `yarn storybook`
2. You can use example project: `yarn dev`
3. You can also use different project with this library: `yarn build && yarn link`, then `cd ../other-project && yarn link @reearth/core`

## Releasing (alpha)

Alpha versions are published to npm via **npm Trusted Publishing (OIDC)**: no npm token is stored anywhere, and every release ships with a signed [provenance](https://docs.npmjs.com/generating-provenance-statements) attestation. Releasing is a two-step, approval-gated flow that you drive from the **Actions** tab, so you never publish from your laptop.

```mermaid
flowchart TD
    A["👤 Run 'Prepare Alpha Release'<br/>(Actions → Run workflow)"] --> B["🤖 Bumps the version and opens<br/>a release/alpha-* PR"]
    B --> C["👤 Review and merge the release PR"]
    C --> D["🤖 'Release Alpha' runs on merge,<br/>then pauses at the approval gate"]
    D --> E["👤 Approve the npm-publish deployment"]
    E --> F["🤖 Build, tag vX.Y.Z, and<br/>npm publish (OIDC + provenance)"]
    F --> G["📦 Published to npm<br/>(dist-tag: alpha)"]

    classDef human fill:#dbeafe,stroke:#3b82f6,color:#1e3a8a;
    classDef auto fill:#f1f5f9,stroke:#94a3b8,color:#334155;
    classDef done fill:#dcfce7,stroke:#22c55e,color:#166534;
    class A,C,E human;
    class B,D,F auto;
    class G done;
```

**👤 = you do it · 🤖 = happens automatically**

1. **Start a release.** In the **Actions** tab, open **Prepare Alpha Release** → **Run workflow** (on `alpha`).
2. 🤖 It bumps the prerelease version (`…-alpha.N` → `…-alpha.N+1`) and opens a `release/alpha-*` PR. _To release a specific version instead, edit `version` in `package.json` on that PR before merging._
3. **Review and merge** the release PR.
4. 🤖 Merging triggers **Release Alpha**, which builds and then **pauses for approval**.
5. **Approve** the `npm-publish` deployment: open the running job → **Review deployments** → approve.
6. 🤖 It tags `vX.Y.Z` and runs `npm publish --provenance`. Done ✅

Verify any published version with `npm audit signatures`.

> **Note:** `beta` and `latest` currently use a separate, token-based release workflow and are not part of this OIDC flow yet.
