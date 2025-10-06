# Effects Tools Research and Specification

> Last updated: 2025-10-06

## 1. Purpose

This document consolidates competitive research and technical specifications for building a professional-grade effects and painting subsystem across mobile, tablet, and desktop platforms. It serves as a reference for product strategy, engineering architecture, and backlog planning.

## 2. Competitive Feature Analysis

### 2.1 Feature Comparison Snapshot

| App | Transform Tools | Guides & Symmetry | Stroke Stability & Prediction | Image Import & File Fidelity | Advanced Brushes & Effects | Key Performance Notes |
| --- | --- | --- | --- | --- | --- | --- |
| **Procreate (iPadOS)** | Freeform, Uniform, Warp, Liquify; on-canvas numeric adjustments via HUD; quick gestures for flip/rotate | Drawing Guides with 2D grid, isometric, perspective (1-3 point), symmetry (radial, quadrant); QuickShape snapping | StreamLine stabilization with adjustable strength; Predictive assistance via QuickShape auto-snap | Imports PSD with layers/folders, TIFF, PNG, JPEG; maintains layer blend modes but flattens some adjustments | 200+ brush engines, dual-texture stamps, dynamic filters, on-canvas Liquify, clone, color dynamics | 120Hz Metal-accelerated canvas; deferred rendering keeps brushes responsive; heavy liquify ops can cause temporary resolution downscaling |
| **Adobe Fresco (iPadOS/Windows)** | Transform with on-canvas handles, multi-layer transform, liquify; Photoshop round-trip | Snap-to guides, perspective grids, symmetry (vertical/horizontal), motion path guides | Stroke smoothing slider, pressure/tilt mapping, velocity-based taper; predictive path smoothing | PSD (cloud/live), layered PDF, PNG, JPG; full fidelity with Photoshop blend modes & masks | Vector, pixel, and Live Watercolor/Oil brushes; brush settings share Adobe Brush JSON; GPU-based live brushes | Mercury Graphics Engine (DirectX/Metal); adaptive resolution; live brushes GPU-intensive but throttled when battery low |
| **Adobe Photoshop (Desktop/iPad)** | Free Transform, Warp, Perspective Warp, Puppet Warp; precise numeric entry; smart transforms | Guides, grids, rulers, numerous symmetry modes via Paint Symmetry; vanishing point grid | Smoothing slider with real-time preview, stroke catch-up, path-based editing | Broad format support incl. PSD/PSB, TIFF, EXR; maintains smart objects & adjustment layers | Extensive brush engine with dual brush, texture, scattering; filter gallery with live preview, Camera Raw & neural filters | Mercury Graphics Engine leverages GPU for blur, liquify, neural filters; fallback CPU path slower |
| **Autodesk Sketchbook (iOS/Android/Windows)** | Free transform, distort, perspective transform; tool-specific numeric entry minimal | Predictive Stroke with shape recognition; radial, x/y symmetry, 1-3 point perspective, ellipse guides | Predictive stroke auto-snaps shapes; Stroke Stabilizer with strength slider; smoothing calibrations | Imports layered PSD (flattening adjustment layers), TIFF, PNG; reference image layer support | Brush Library with stamp/custom textures, blending modes; gradient fill, flipbook animation | Mobile uses OpenGL ES with tiling to sustain 60fps; predictive stroke can lag on low-end devices |
| **Krita (Windows/Linux/macOS)** | Free, Cage, Liquify, Mesh transform; numeric controls in tool options; multi-layer transform | Assistants for perspective, ellipse, rulers; symmetry tool with multiple axes and mandala mode | Stabilizer with weighted smoothing, dynamic distance; “Magnetism” predictive cursor | Wide format support including PSD (high fidelity for layers/masks), TIFF, ORA; color-managed workflow | >30 brush engines (pixel, smudge, particle, chalk, clone); filter masks and layers; wrap-around mode | Uses OpenGL/Direct3D for canvas; can leverage multi-threaded CPU+GPU; complex filters may need render-delay preview |
| **Clip Studio Paint (Win/macOS/iPad/Android)** | Free transform, mesh transform, lattice, perspective transform; precise numeric entry & timelines | Rulers (parallel, perspective multi-vanishing point, symmetry up to 16 segments); snapping to 3D models | Stabilization with per-brush control, correction lines, post-stroke adjust; adjustable pen pressure curves | Supports PSD/PSB (layers, masks, vector layers), TIFF, BMP, PNG; can import 3D assets | Advanced brush engine with custom tip textures, particle/sprays, sub-tools; filter layers, tone curves | GPU acceleration optional; CPU fallback; large canvases require memory caching; 3D & filter features can lower FPS |

### 2.2 UX Patterns & Unique Mechanics

- **On-canvas controls**: Procreate and Clip Studio emphasize radial HUDs and direct manipulation handles to reduce panel hopping. Adobe apps rely on contextual property bars plus on-canvas gizmos for precision.
- **Quick shape correction**: Procreate’s QuickShape and Sketchbook’s Predictive Stroke auto-recognize geometric primitives, toggled with minimal gestures. Offering manual override prevents accidental snapping.
- **Layer-aware transforms**: Photoshop and Clip Studio allow multi-layer transforms with smart bounding boxes; Procreate’s “Uniform/Warp” toggle is streamlined but limited for precise numeric input.
- **Symmetry toggles**: Krita and Clip Studio expose symmetry options per tool with preview overlays. Procreate centralizes symmetry in Drawing Guides making it easy to toggle at canvas level.
- **Performance tradeoffs**: Live liquify and GPU-heavy filters drop canvas resolution temporarily (Procreate, Photoshop). Fresco throttles live brushes based on thermal state. Krita occasionally uses delayed previews for complex mesh transforms.

### 2.3 Takeaways for Our Effects Tools

1. Provide **dual interaction paradigm**: quick HUD sliders for touch, plus precise numeric fields for stylus/mouse workflows.
2. Offer **canvas-level guides** with per-brush overrides to mirror Procreate’s simplicity while retaining Clip Studio’s depth.
3. Implement **configurable stroke stabilization** with visual feedback (e.g., trailing ghost path) to reassure users.
4. Ensure **import fidelity** by preserving layer hierarchies and blend modes where possible; warn before flattening specialized adjustments.
5. Invest in **GPU adaptive quality**: degrade preview resolution rather than frame rate during heavy filters.

## 3. Filter Controls & GPU Feasibility

### 3.1 Professional Filter UX Patterns

- **Live preview with on-canvas handles**: Photoshop’s Liquify and Warp filters show immediate results while dragging; Clip Studio’s Tone Curve overlays histogram context in-panel while updating canvas in real time.
- **Parameter stacks**: Procreate’s Adjustments panel exposes sliders with tap-to-enter numeric values, including effect mix/balance. Krita’s Filter Layers store parameter state non-destructively in the layer stack.
- **Presets & favorites**: Fresco and Photoshop allow saving presets per filter; Procreate has recent adjustments history but no named presets. Suggest providing user-named presets with thumbnail previews.
- **Keyboard & gesture shortcuts**: Photoshop uses modifier keys for constrained transforms; Procreate leverages two-finger tap to reset slider. Design for quick reset/compare toggles.
- **Non-destructive pipelines**: Krita filter masks and Photoshop Smart Filters maintain editable stacks. Our filter controller should allow toggling, reordering, and editing parameters post-application.

### 3.2 Technical Feasibility of GPU-Accelerated Filters

| Platform | Recommended API | Notes on Feasibility |
| --- | --- | --- |
| iPadOS/iOS | **Metal + Metal Performance Shaders (MPS)** | Supports compute kernels for blur, convolution, FFT. Achieves sub-16ms frame budget with tile-based rendering; use `MTLSharedEvent` to sync GPU/CPU for UI updates. Fallback to CPU via Accelerate for older devices.
| Android | **Vulkan (primary) / OpenGL ES 3.1 (fallback)** | Vulkan compute queues deliver predictable latency; vendors like Qualcomm expose Adreno GPU filters via Vulkan. Need pipeline cache management and descriptor pooling to avoid hitching. GLES path should reduce kernel complexity.
| Windows | **DirectX 12 / DirectCompute** | Integrate with DXGI swapchain; use multi-queue to overlap compute and copy. For Pen/Ink apps, leverage Wintab/Pointer events while GPU filter runs asynchronously. Provide CPU fallback using AVX2.
| macOS | **Metal** | Similar to iPad but with higher compute budgets; consider Core Image for quick prototyping, later migrate to custom Metal kernels for better control.
| Web/Desktop Cross-Platform | **WGPU/WebGPU** | Enables unified shader code via WGSL. On desktop we can use wgpu-rs or Dawn; web build via WebAssembly. Need caution with browser GPU sandbox timeouts; keep kernels < 4ms or chunked.

**Latency targets**: For live filter adjustments, aim for <8ms GPU compute per frame at 4K canvas by using tiled processing, half-float buffers, and progressive refinement (coarse-to-fine).

**Memory considerations**: Maintain ping-pong render targets, reuse descriptor sets, and compress history snapshots using delta encoding for undo.

**Thermal & battery management**: Monitor OS thermal signals (iOS `ProcessInfo.thermalState`, Android `ThermalStatusListener`). Reduce update frequency or resolution when throttling occurs, similar to Fresco’s live brush strategy.

## 4. High-Fidelity Input Handling

### 4.1 Data Sources by Platform

- **Apple Pencil (iPadOS)**: Sample via `UIPencilInteraction` / `UITouch` delivering force (0-4.166), azimuth, altitude, estimated properties (azimuth, altitude, force prediction). Maintain coalesced touches for high-resolution input and use predicted touches for latency masking.
- **Windows (Wintab / Windows Ink)**: Access pressure (0-1024+), `tiltX`, `tiltY`, barrel button, rotation (art pens). Use high-frequency pointer events (`PointerPrediction` API) to anticipate path.
- **Android (Stylus via MotionEvent)**: `MotionEvent.getAxisValue` for pressure, tilt, orientation, button states. Coalesce historical samples for smoothing.
- **Wacom & external tablets (macOS/Windows)**: Provide rotation, tangential pressure; ensure abstraction layer exposes these extended parameters even if platform APIs differ.

### 4.2 Stroke Fidelity Strategies

1. **Sample buffering**: Collect raw samples at device frequency (up to 240Hz) and resample to internal 120Hz for processing to avoid aliasing.
2. **Prediction & smoothing**: Blend OS-provided predicted points with our own Kalman-based predictor for latency-sensitive strokes while allowing fallback to raw input for fast scribbles.
3. **Pressure curves**: Allow per-brush custom pressure curve (Bezier) plus global calibration similar to Clip Studio.
4. **Tilt/rotation mapping**: Map tilt to brush elongation or texture direction; rotation to stamp rotation with inertia smoothing.
5. **Velocity-based dynamics**: Use velocity to control size/opacity taper with configurable thresholds; ensure clamp to avoid zero-size segments on slow strokes.
6. **Sampling jitter control**: Provide “catch-up” rendering where the stroke catches the stylus when smoothing is high, as seen in Photoshop.

### 4.3 Data Abstraction Layer

Define a `PointerSample` struct: `{ position: Vec2, timestamp: f64, pressure: f32, tilt: Vec2, rotation: f32, velocity: Vec2, predicted: bool }`. Wrap platform APIs to populate this consistently. Maintain per-stroke buffers in lock-free ring buffers for multi-threaded processing.

## 5. External File Support & Fidelity

- **PSD/PSB**: Preserve layer hierarchy, masks, blend modes, adjustment layers (where supported). For unsupported adjustments, store metadata in custom layer tag and offer reapply instructions when exporting back.
- **TIFF**: Handle multi-page and channel data; keep embedded color profiles.
- **PNG/JPEG/WebP**: Import as raster layers; store EXIF orientation and color profile. JPEG is lossy, warn when re-exporting.
- **KRA/ORA**: Optional for interoperability with Krita/MyPaint communities; map to internal structure when possible.
- **Brush assets**: Support ABR/BRUSHSET import to seed brush library; map parameters to our schema with best-effort conversion.
- **Color management**: Use ICC profile conversion on import; maintain internal working space (e.g., linear sRGB or Display P3). Offer soft-proof preview similar to Photoshop.
- **Linked references**: Provide lighter-weight Reference Layers pointing to external files with reload capability, like Procreate’s reference images.

## 6. Rendering Stack Recommendations

| Platform | Preferred Stack | Rationale | Contingencies |
| --- | --- | --- | --- |
| iPadOS/iOS | Metal + MetalKit swapchain + MPS | Lowest-latency path with direct Apple Pencil integration; supports tile-based deferred rendering and compute workloads for filters. | For rapid prototyping, leverage Metal-cpp wrappers; fallback to Core Animation layers for UI overlays. |
| Android | Vulkan (primary), ANGLE + OpenGL ES 3.1 (fallback) | Vulkan grants explicit control over memory, enabling tiled attachment rendering for large canvases; integrates well with AHardwareBuffer for zero-copy textures. | Use Vulkan-Hpp for type safety; fallback to GLES on devices lacking Vulkan drivers, with caution on 8k canvas support. |
| Windows | DirectX 12 + DXGI flip model | Ensures 120Hz presentation with tearing-free composition; integrates with DirectComposition for UI. | Provide DirectX 11 fallback using feature level 11_0 for older GPUs. |
| macOS | Metal + CAMetalLayer | Shared code with iPad; supports ProMotion displays and unified shader library. | Offer OpenGL legacy path only for development tools. |
| Web/Desktop Cross-platform | WGPU (native) / WebGPU (browser) | Single shader codebase (WGSL) compiled to SPIR-V/Metal/DXIL; built-in support for bind groups and compute. | For Electron builds, use wgpu-native; for browsers, rely on OffscreenCanvas with fallback to WebGL2 for basic features. |

**60 FPS + low latency guidelines**:
- Use double-buffered command encoders and pre-allocated render targets to avoid per-frame allocation.
- Employ partial canvas updates by tracking dirty regions, reducing fill rate.
- Coalesce UI overlay rendering into separate pass to keep main canvas pipeline lean.
- Run brush rendering on GPU compute when possible; otherwise, use multi-threaded CPU tiling with SIMD.

## 7. Brush Engine Architecture

### 7.1 Core Concepts

1. **Input Processor**: Converts `PointerSample` streams into normalized stroke segments, applies stabilization and prediction.
2. **Dynamics Resolver**: Calculates brush dynamics (size, opacity, scatter) from pressure, tilt, velocity, and custom curves.
3. **Emitter**: Supports multiple modes:
	 - *Stamp-based*: Repeated textured dabs.
	 - *Procedural*: Algorithmic brushes (e.g., noise, splatter) generated via shaders.
	 - *Particle*: Spawns particles with physics (gravity, attraction) for effects like spray and sparkle.
	 - *Filter pipeline*: Applies GPU filters per dab (smudge, glow) using ping-pong buffers.
4. **Compositor**: Blends stroke output onto canvas tile cache with blend modes, color space conversion, and layer masks.
5. **Caching & Replay**: Record strokes as parameterized commands for undo/redo and future playback.

### 7.2 Engine Architecture Diagram (textual)

`Pointer Input → Stabilizer → Dynamics Resolver → Brush Emitter (stamp/procedural/particle/filter) → Tile Compositor → Canvas`

### 7.3 Brush Preset JSON Schema (Draft)

```json
{
	"$schema": "https://aio-converter.dev/schemas/brush-preset.schema.json",
	"type": "object",
	"required": ["id", "name", "engine", "dynamics", "render"],
	"properties": {
		"id": { "type": "string", "pattern": "^[a-z0-9-]{4,64}$" },
		"name": { "type": "string", "minLength": 1 },
		"tags": { "type": "array", "items": { "type": "string" } },
		"engine": {
			"type": "object",
			"required": ["mode"],
			"properties": {
				"mode": { "enum": ["stamp", "procedural", "particle", "filter"] },
				"stamp": {
					"type": "object",
					"properties": {
						"texture": { "type": "string", "description": "URI to texture asset" },
						"spacing": { "type": "number", "minimum": 0.01, "maximum": 1.0 },
						"rotation": { "enum": ["fixed", "tilt", "velocity", "random"] }
					}
				},
				"procedural": {
					"type": "object",
					"properties": {
						"shader": { "type": "string" },
						"noiseSeed": { "type": "number" }
					}
				},
				"particle": {
					"type": "object",
					"properties": {
						"spawnRate": { "type": "number" },
						"lifetime": { "type": "number" },
						"forces": { "type": "array", "items": { "type": "string" } }
					}
				},
				"filter": {
					"type": "object",
					"properties": {
						"pipeline": {
							"type": "array",
							"items": {
								"type": "object",
								"required": ["id", "params"],
								"properties": {
									"id": { "type": "string" },
									"params": { "type": "object" }
								}
							}
						}
					}
				}
			}
		},
		"dynamics": {
			"type": "object",
			"properties": {
				"size": { "type": "object", "properties": { "curve": { "type": "array", "items": { "type": "number" } }, "min": { "type": "number" }, "max": { "type": "number" } } },
				"opacity": { "type": "object", "properties": { "curve": { "type": "array", "items": { "type": "number" } }, "min": { "type": "number" }, "max": { "type": "number" } } },
				"scatter": { "type": "number" },
				"smudge": { "type": "number" },
				"glow": { "type": "object", "properties": { "intensity": { "type": "number" }, "radius": { "type": "number" } } }
			}
		},
		"render": {
			"type": "object",
			"properties": {
				"blendMode": { "enum": ["normal", "multiply", "screen", "overlay", "add", "subtract"] },
				"colorJitter": { "type": "object", "properties": { "hue": { "type": "number" }, "saturation": { "type": "number" }, "value": { "type": "number" } } },
				"spacingAdaptive": { "type": "boolean" },
				"tiling": { "enum": ["wrap", "clamp"] }
			}
		},
		"metadata": {
			"type": "object",
			"properties": {
				"author": { "type": "string" },
				"version": { "type": "string" },
				"createdAt": { "type": "string", "format": "date-time" }
			}
		}
	}
}
```

### 7.4 Preset Examples

- **Designer**: Stamp mode with hard round tip, subtle texture overlay, low scatter.
- **Artist**: Particle mode adding jittered splatter and tilt-based texture rotation.
- **Pastel**: Procedural noise shader simulating pastel grain with high smudge.
- **Colorless blender**: Filter mode combining smudge and low-intensity glow to smooth colors without tint.

## 8. Stroke Pipeline Specification

### 8.1 Processing Stages

1. **Capture**: Collect `PointerSample` data with timestamp and predicted points (latency compensation ~10ms).
2. **Pre-Filter**: Apply selectable stabilization algorithms: *Off*, *Basic smoothing*, *Predictive* (Kalman + Bézier fitting with adjustable strength 0-100).
3. **Resampling**: Distance-based resample (default 0.5px) with adaptive spacing for fast strokes; maintain original path for post-editing.
4. **Dynamics Evaluation**: Use brush preset curves to compute size, opacity, scatter, texture rotation per segment.
5. **Emitter Dispatch**: Choose emitter path (stamp/procedural/particle/filter). Support asynchronous GPU dispatch with command queue per stroke.
6. **Tile Compositing**: Write to 256×256 tiles in GPU memory; mark dirty tiles for UI update.
7. **Post Processing**: Optional effects like wet-mix drying simulation, halos, or auto-normalization.
8. **Recording**: Store stroke command with compressed sample list for undo/redo and collaborative replay.

### 8.2 API Outline

```ts
interface StrokeOptions {
	presetId: string;
	stabilization: { mode: "off" | "basic" | "predictive"; strength: number };
	predictiveLookaheadMs: number;
	adaptiveSpacing: boolean;
}

interface StrokePipeline {
	beginStroke(input: StrokeOptions, pointer: PointerSample): StrokeHandle;
	updateStroke(handle: StrokeHandle, samples: PointerSample[]): void;
	endStroke(handle: StrokeHandle): Promise<StrokeRecord>;
	cancelStroke(handle: StrokeHandle): void;
}
```

## 9. Transform Tools Blueprint

### 9.1 Tool Modes

- **Free Transform**: Uniform/non-uniform scale, rotate, flip via bounding box handles; numeric input overlay for width, height, rotation.
- **Warp**: 3×3 and 4×4 mesh control points with magnet strength slider.
- **Skew/Perspective**: Constrain handles to edges; allow numeric vanishing point adjustments.
- **Smart Bounding Box**: Auto fits selection, with anchor memory per layer to preserve pivot across transforms.
- **Multi-Layer Transform**: Group layers and apply transforms; maintain layer-relative offsets.

### 9.2 UX Considerations

- HUD with quick buttons (Flip X/Y, Reset, Numeric) inspired by Procreate.
- Gizmo handles enlarge for touch input; hold modifier for precise increments.
- Provide toggle to switch between live raster preview and outline-only preview for performance (important on low-end devices).
- Support transform history nodes so undo integrates with general undo stack.

## 10. Guides & Perspective System

### 10.1 Guide Types

- **Grid**: Rectangular, isometric, triangular; adjustable spacing, rotation, opacity.
- **Perspective**: 1, 2, and 3-point vanishing setups with draggable horizon; support multi-vanishing like Clip Studio by storing multiple guide sets.
- **Symmetry**: Linear (vertical/horizontal/diagonal), radial (2-16 segments), spiral; allow per-layer enable and per-brush override.
- **Custom Rulers**: Ellipse, curve, parallel ruler; similar to Krita assistants.

### 10.2 Snapping Behavior

- Snap radius adjustable (px or physical mm). Visual indicator shows when snapping engaged (color change, magnetic line).
- Provide feathered snapping for smooth transitions (snap strength slider blending between freehand and snapped path).
- Guides stored as layer-independent objects; transform with canvas but can be locked or pinned.

### 10.3 Data Model

```ts
type GuideType = "grid" | "perspective" | "symmetry" | "custom";

interface Guide {
	id: string;
	type: GuideType;
	params: Record<string, any>;
	active: boolean;
	snapStrength: number; // 0-1
	visible: boolean;
}
```

## 11. Filter Controller API

### 11.1 Goals

- Enable granular parameter control with live feedback.
- Support presets, undo/redo, non-destructive stacks.
- Allow filters to be applied per-layer, per-selection, or as adjustment layer.

### 11.2 API Sketch

```ts
interface FilterDescriptor {
	id: string;
	name: string;
	category: "stylize" | "blur" | "color" | "distort" | "texture";
	params: FilterParamDescriptor[];
	gpuPreferred: boolean;
}

interface FilterParamDescriptor {
	id: string;
	label: string;
	type: "slider" | "angle" | "color" | "toggle" | "curve" | "vec2";
	min?: number;
	max?: number;
	default: any;
	step?: number;
}

interface FilterInstance {
	descriptorId: string;
	values: Record<string, any>;
	blendMode: string;
	opacity: number;
	enabled: boolean;
}

interface FilterController {
	apply(instance: FilterInstance, target: LayerRef): Promise<FilterHandle>;
	update(handle: FilterHandle, values: Record<string, any>): void;
	bypass(handle: FilterHandle, enabled: boolean): void;
	bake(handle: FilterHandle): Promise<void>;
	remove(handle: FilterHandle): void;
	listPresets(descriptorId: string): Promise<FilterPreset[]>;
	savePreset(descriptorId: string, preset: FilterPreset): Promise<void>;
}
```

### 11.3 Live Adjustment Workflow

1. User tweaks slider; UI dispatches `update` with throttled (120Hz) parameter updates.
2. GPU compute re-renders region asynchronously; UI shows busy indicator if >100ms.
3. User stores preset -> serialized to JSON referencing descriptor version.
4. Non-destructive stack recorded; toggling filter toggles entire compute graph node.

## 12. Prioritized MVP Backlog

| Priority | Epic | Key Deliverables | Notes |
| --- | --- | --- | --- |
| P0 | Core Stroke System | Implement stroke pipeline (Section 8) with pressure, tilt, predictive & stabilized modes; brush preset loader for Designer/Artist/Pastel/Colorless brushes. | Target 120Hz input processing; include visual stabilization indicator. |
| P0 | Transform & Guides | Free transform, rotate, scale, skew tools; grid & perspective guides with snapping; undo/redo integration. | Start with 1-2 point perspective; store guides as reusable templates. |
| P0 | Symmetry Modes | Linear + radial symmetry with live mirrored strokes; ensure transforms preserve symmetry state. | Mirror preview overlay. |
| P0 | Image Import | Drag/drop and file picker; support PSD (flatten adjustment), PNG, TIFF; maintain color profiles and layer order. | Include import diagnostics panel. |
| P0 | Filter Controller UI | Live adjustment panel with sliders, toggles, presets; integrate halftone and smudge filters non-destructively. | Use GPU pipeline; fallback CPU path. |
| P1 | GPU Filters | Implement halftone & smudge GPU kernels with tile-based compute; integrate parameter UI (intensity, radius, pattern). | Provide performance telemetry overlay. |
| P1 | Undo/Redo | Command recording for strokes, transforms, filters with memory budgeting; partial tile rollback. | Add history scrubber prototype. |
| P1 | Automation & Benchmarks | Unit tests for stroke engine math, JSON schema validation, GPU filter regression; performance benchmarks at 4K/8K canvases. | Integrate with CI (GitHub Actions + device farms later). |

## 13. Advanced Features & Polishing Roadmap

1. **Brush Expansion**: Add splatter, particle, glow presets leveraging particle emitter; include live brush preview swatches.
2. **Perspective Enhancements**: Warp transform tied to guide grid, multi-vanishing points, guide grouping for complex scenes.
3. **Filter Controller Extensions**: Add blending modes, threshold controls, histogram display, real-time previews with compare toggle.
4. **Preset Import/Export**: Support sharing brush/filter presets via JSON+binary assets; includes versioning and compatibility checks.
5. **Large Canvas Optimization**: Implement sparse tile storage, background compression, streaming saves for 8k × 8k projects.
6. **Collaboration Hooks**: Prepare data model for async collaboration (optional), using stroke record serialization.

## 14. Testing & Benchmarking Strategy

- **Unit Tests**: Validate stroke smoothing algorithms, pressure curve mappings, JSON schema compliance using snapshot comparisons.
- **Integration Tests**: Simulate multi-touch/stylus input sequences; verify symmetry and guide snapping produce expected geometry.
- **GPU Regression Tests**: Run halftone/smudge kernels against known textures, compare SSIM scores; execute on representative GPUs (Apple M-series, Adreno 660, RTX series).
- **Performance Benchmarks**: Measure frame latency at 4k and 8k canvases for strokes, transforms, filters. Target <16ms for drawing, <33ms for heavy filters.
- **UX Heuristics**: Conduct trace-based evaluations to ensure slider adjustments update within 100ms; log thermal throttling events.

## 15. Next Steps

1. Validate rendering stack assumptions with prototype spikes on each platform.
2. Finalize brush preset schema with serialization/deserialization code and sample assets.
3. Begin implementing MVP backlog items in parallel tracks (Stroke Engine, Transform/Guides, Filters UI).
