# BodyFit AI: Real-Time Body Measurement & Clothing Size Recommendation Engine

> **Strict Architectural Mandate: 100% Client-Side In-Browser Execution. Zero Backend, Zero Remote AI, Zero External APIs.**

---

## 1. Project Overview

**BodyFit AI** is a production-quality, privacy-preserving web application designed to compute real-time anthropometric body measurements and match personalized garment sizes directly within modern desktop and mobile browsers.

By leveraging browser-native WebAssembly (WASM), WebGL GPU acceleration, the HTML5 MediaDevices API, MediaPipe Tasks Vision, and OpenCV.js, the entire vision and geometric processing pipeline operates strictly locally on the user's client hardware.

### Key Capabilities
- **Real-Time 3D Landmark Tracking**: Continuous detection of all 33 body landmarks using MediaPipe Pose Landmarker.
- **Euclidean Height Calibration**: Dynamically derives metric spatial scale (`pixelsPerCm`) using the user's reported physical height with cranial vertex and sole corrections.
- **Bi-planar & Ramanujan Circumference Estimation**: Computes 3D cross-sectional circumferences (chest, waist, hips, limbs) using Ramanujan's ellipse approximation, enhanced with dual-view (front + side) sagittal depth cross-verification.
- **Real-Time Quality & Posture Analysis**: Continuously inspects lighting conditions, contrast, subject distance, A-pose arm separation, and multi-person interference via OpenCV.js.
- **Garment Size Recommendation Engine**: Maps 13 distinct anatomical body dimensions against clothing size charts (shirts, denim, trousers, outerwear) with tailoring ease allowances.
- **Local Persistence & Privacy**: All profiles, scan records, and custom brand charts are stored in browser-sandboxed IndexedDB and LocalStorage with full export and zero external telemetry.

---

## 2. Complete Application Architecture

The application is structured into decoupled, modular service layers that prevent UI thread blocking and cleanly separate computer vision, geometric modeling, sizing logic, and reactive presentation.

```
                              ┌────────────────────────────────────────┐
                              │            Webcam / Camera             │
                              │    navigator.mediaDevices.getUserMedia │
                              └───────────────────┬────────────────────┘
                                                  │ Video Stream
                                                  ▼
                        ┌──────────────────────────────────────────────────┐
                        │              HTML5 <video> Element               │
                        └─────────┬──────────────────────────────┬─────────┘
                                  │                              │
         Offscreen Canvas Frames  │                              │ Live Frames (requestAnimationFrame)
                                  ▼                              ▼
            ┌───────────────────────────┐         ┌───────────────────────────┐
            │   OpenCV.js Quality Engine│         │ MediaPipe Tasks Vision    │
            │  - cv.meanStdDev (Luma)   │         │  - 33 Pose Landmarks      │
            │  - cv.GaussianBlur/Laplace│         │  - Exponential Smoothing  │
            │  - cv.Canny & Contours    │         │  - Segmentation Masks     │
            │  - Posture & Alignment    │         │  - WebAssembly / GPU      │
            └─────────────┬─────────────┘         └─────────────┬─────────────┘
                          │                                     │
                          └─────────────────┬───────────────────┘
                                            │ Synchronized Frames & Quality Score
                                            ▼
                        ┌────────────────────────────────────────┐
                        │     Multi-Frame Aggregator Buffer      │
                        │    - 5-10 Frame Coordinate Average     │
                        │    - Spatial Variance Filtering        │
                        └───────────────────┬────────────────────┘
                                            │ Stabilized Landmark Matrix
                                            ▼
                        ┌────────────────────────────────────────┐
                        │     Pure TS Body Measurement Engine    │
                        │    - Cranial Vertex Scale Calibration  │
                        │    - Euclidean Joint Distances         │
                        │    - Ramanujan Ellipse Circumference   │
                        │    - Confidence & Uncertainty Scoring  │
                        └───────────────────┬────────────────────┘
                                            │ 13 Anatomical Metrics
                                            ▼
                        ┌────────────────────────────────────────┐
                        │     Clothing Size Matcher Engine       │
                        │    - Garment Ease Allowance Additions  │
                        │    - Multi-Dimension Tolerance Fit     │
                        │    - Alternative Fit Categorization    │
                        └───────────────────┬────────────────────┘
                                            │ Fit Recommendations
                                            ▼
                        ┌────────────────────────────────────────┐
                        │       Local Storage & Presentation     │
                        │    - React 19 UI & Tailwind CSS        │
                        │    - Client-Side IndexedDB Sandbox     │
                        │    - JSON / CSV Export Utilities       │
                        └────────────────────────────────────────┘
```

### Folder Structure
```
src/
├── components/
│   ├── body-overlay/
│   │   └── MeasurementTapeOverlay.tsx
│   ├── camera/
│   │   ├── CameraControls.tsx
│   │   ├── QualityIndicator.tsx
│   │   ├── SilhouetteOverlay.tsx
│   │   └── SkeletonCanvas.tsx
│   ├── common/
│   │   └── Navbar.tsx
│   ├── dashboard/
│   │   ├── ClothingRecommendationCard.tsx
│   │   └── CustomSizeChartModal.tsx
│   └── measurements/
│       ├── BodyVisualizer.tsx
│       ├── ConfidenceBadge.tsx
│       ├── MeasurementCard.tsx
│       └── MeasurementEditModal.tsx
├── data/
│   └── size-charts/
│       ├── generic-jackets.json
│       ├── generic-jeans.json
│       ├── generic-pants.json
│       └── generic-shirts.json
├── hooks/
│   ├── useCamera.ts
│   └── usePoseDetection.ts
├── pages/
│   ├── Camera.tsx
│   ├── History.tsx
│   ├── Home.tsx
│   ├── Profile.tsx
│   ├── Results.tsx
│   └── Settings.tsx
├── services/
│   ├── camera/
│   │   └── cameraService.ts
│   ├── mediapipe/
│   │   └── poseDetector.ts
│   ├── measurement/
│   │   ├── calibration.ts
│   │   ├── circumference.ts
│   │   ├── confidence.ts
│   │   ├── geometry.ts
│   │   └── measurementEngine.ts
│   ├── opencv/
│   │   ├── imageProcessor.ts
│   │   ├── opencvLoader.ts
│   │   └── qualityAnalyzer.ts
│   ├── sizing/
│   │   ├── garmentEase.ts
│   │   └── sizeMatcher.ts
│   └── storage/
│       ├── indexedDB.ts
│       ├── measurementStorage.ts
│       └── profileStorage.ts
├── types/
│   ├── landmark.ts
│   ├── measurement.ts
│   ├── profile.ts
│   └── sizing.ts
├── App.tsx
├── index.css
└── main.tsx
```

---

## 3. Technology Stack

### Frontend Core
- **React (v19.3.1)**: Component tree management, reactive hooks, and state isolation.
- **TypeScript (v5.7 / v7.0)**: Type safety across all anthropometric and sizing data structures.
- **Vite (v8.3.5)**: Development server and bundling pipeline.
- **Tailwind CSS (v4.3.3)**: Styling with custom glassmorphism, responsive viewport design, and dark theme palette.
- **Lucide React (v1.66.0)**: Icons for anatomical, camera, and sizing UI components.
- **Canvas Confetti**: Visual celebration on scan completion.

### Computer Vision & AI (100% Client-Side)
- **MediaPipe Tasks Vision (`@mediapipe/tasks-vision` v1.2.0)**: Google's ML framework for real-time 33-point pose landmark estimation.
- **MediaPipe Pose Landmarker float16 Models**: Preloaded locally into `public/models/pose_landmarker_full.task` (9.18 MB) and `public/models/pose_landmarker_lite.task` (5.75 MB).
- **OpenCV.js (`@techstark/opencv-js` v5.0.0)**: WebAssembly-compiled computer vision library for image luminance analysis, Laplacian variance, Canny edge detection, morphological closing, and contour boundary extraction.

### Browser APIs
- `navigator.mediaDevices.getUserMedia()`: Camera video stream acquisition.
- `HTMLCanvasElement` & Canvas 2D Context: Pixel manipulation, frame rasterization, and skeleton rendering.
- `IndexedDB API`: Persistent local database for subject profiles and historical measurement scans.
- `LocalStorage API`: Fast key-value storage for active session preferences and custom brand size charts.
- `requestAnimationFrame`: Non-blocking 60 FPS processing loops.
- `URL.createObjectURL` & `Blob`: Local client-side generation of downloadable JSON and CSV reports.

---

## 4. Feature Matrix

| Feature | Implementation | Client-Side Mechanism |
|---|---|---|
| User Profile Setup | Name, Height (100-230cm), Weight, Sizing preference | IndexedDB (`STORES.PROFILES`) |
| Camera Stream | Front & rear mobile cameras, desktop webcams | `getUserMedia()` with constraints fallback |
| Pose Detection | 33 3D skeletal landmarks | MediaPipe Pose Landmarker WASM/GPU |
| Jitter Smoothing | Exponential Moving Average (EMA, α=0.65) | Temporal smoothing buffer |
| Posture Analysis | Alignment, distance, arm separation, lighting | OpenCV.js + landmark angle geometry |
| Auto-Capture Engine | Hands-free 3-2-1 countdown & capture upon stable posture | Web Audio API beeps + temporal hold tracker |
| Frame Averaging | 5-10 valid frames averaged per capture | Multi-frame variance aggregator |
| Scale Calibration | Height-calibrated `pixelsPerCm` with head/foot offset | Anthropometric cranial vertex formula |
| Circumference Model | Ramanujan ellipse approximation with depth ratios | Dual-plane front + side cross-verification |
| Confidence System | Categorized High/Medium/Low with ±cm uncertainty | Multi-variable scoring algorithm |
| Size Recommendations | 9 garment types matched with tailoring ease | Local JSON size charts + ease tables |
| Custom Size Charts | Add brand-specific sizing thresholds | LocalStorage chart registry |
| Measurement Editing | Manual override with delta tracking | User-verified adjustments |
| History & Compare | Side-by-side scan comparison with difference deltas | IndexedDB transactional queries |
| Data Export | Export sessions as JSON or CSV | In-browser dynamic blob download |
| Privacy Controls | Complete data wiping, zero remote transmission | IndexedDB & LocalStorage purge |

---

## 5. Module Breakdown

### Module 1: Home Dashboard (`src/pages/Home.tsx`)
- Modern dashboard with application branding.
- Prominent "Start Live Measurement" call-to-action.
- Active calibrated subject chip.
- Quick statistical telemetry: saved sessions, AI confidence average, scale factor, and supported garment types.
- Summary preview of latest scan dimensions.
- Illustrated three-step methodology explanation.

### Module 2: User Profile (`src/pages/Profile.tsx`)
- Enforces strict height validation between 100 cm and 230 cm.
- Captures optional metadata (weight in kg, age, menswear/womenswear preference).
- Manages multiple profiles locally in IndexedDB with create, switch, and delete actions.

### Module 3: Real-Time Camera System (`src/services/camera/cameraService.ts`, `src/hooks/useCamera.ts`)
- Manages device enumeration and video constraints.
- Seamlessly toggles between front (`facingMode: 'user'`) and rear cameras.
- Provides graceful error handling for `NotAllowedError`, `NotFoundError`, and `NotReadableError`.
- Immediately releases camera hardware tracks when the user exits the camera view.

### Module 4: Real-Time Pose Detection (`src/services/mediapipe/poseDetector.ts`, `src/hooks/usePoseDetection.ts`)
- Initializes MediaPipe Pose Landmarker with WebAssembly assets loaded locally from `/wasm`.
- Supports runtime switching between **Full** and **Lite** models.
- Applies Exponential Moving Average (EMA) smoothing to eliminate skeletal flickering.
- Monitors live processing FPS and inference stability.

### Module 5: Live Body Positioning & Quality Analysis (`src/services/opencv/qualityAnalyzer.ts`)
- Continuously inspects:
  - Full body visibility (cranial top to ankle/heel baseline).
  - Shoulder alignment (horizontal angle < 8°).
  - Hip alignment (horizontal angle < 8.5°).
  - Camera distance (body height ratio between 60% and 94% of frame).
  - A-pose arm separation (wrists separated from hips by > 9% frame width).
  - Multi-person detection (alerts when > 1 person is in view).
- Outputs prioritized dynamic guidance messages:
  - *"Move slightly backward"*
  - *"Move closer to the camera"*
  - *"Stand straight, level your shoulders"*
  - *"Keep your arms slightly away from your body (A-pose)"*
  - *"Your feet are not visible - tilt camera down or step back"*
  - *"Lighting is too dark - turn on a light"*
  - *"Only one person should be visible"*

### Module 6: OpenCV.js Image Processing (`src/services/opencv/imageProcessor.ts`, `opencvLoader.ts`)
- Preloads `public/opencv/opencv.js` locally.
- Executes `cv.cvtColor()`, `cv.meanStdDev()`, `cv.GaussianBlur()`, `cv.Laplacian()`, `cv.Canny()`, `cv.threshold()`, `cv.morphologyEx()`, and `cv.findContours()`.
- Implements strict `.delete()` memory cleanup on every `cv.Mat` and `cv.MatVector` object to prevent WebAssembly memory leaks.
- Features a high-speed Canvas fallback for immediate feedback while OpenCV initializes.

### Module 7: Measurement Capture Buffer & Hands-Free Auto-Capture (`src/hooks/usePoseDetection.ts`, `CountdownOverlay.tsx`, `src/utils/soundEffects.ts`)
- **Hands-Free Auto-Capture**: Eliminates the need to walk back and forth to click the device. When the user sustains optimal alignment for 600ms, an audible and visual 3-2-1 countdown triggers automatically.
- **Audio Feedback**: Uses browser-native Web Audio API frequency synthesis (`playCountdownBeep()` at 580Hz-780Hz and `playCaptureSuccessChime()` in C-major chord) without requiring external audio files.
- **Posture Break Recovery**: If the user tilts, moves too close, or drops their arms during countdown, the timer safely resets without capturing corrupted frames.
- **Toggle Control**: Users can toggle between Auto-Capture and Manual Capture mode at any time.
- **Multi-Frame Sampling**: Buffers 8 valid frames, averages landmark coordinates, and calculates spatial variance.
- **Dual-Plane Protocol**: Front View followed by optional Side View for sagittal depth calibration.

### Module 8 & 9: Body Measurement & Circumference Engine (`src/services/measurement/`)
- Pure TypeScript implementation with zero UI coupling.
- Computes 13 anatomical metrics across Upper and Lower body.
- Implements Ramanujan's 1st ellipse approximation.
- Uses configurable anthropometric depth ratios or directly measured side depth.

### Module 10: Measurement Confidence System (`src/services/measurement/confidence.ts`)
- Evaluates landmark visibility, temporal frame variance, multi-view availability, segmentation presence, and lighting scores.
- Assigns High (85-100%), Medium (68-84%), or Low (<68%) confidence tiers with explicit uncertainty ranges (±1.0cm, ±2.2cm, ±4.0cm).

### Module 11: Results Dashboard (`src/pages/Results.tsx`)
- Displays Upper Body (Shoulder width, Chest, Waist, Sleeve, Shirt length, Upper arm, Neck) and Lower Body (Waist, Hip, Thigh, Knee, Inseam, Outseam, Leg opening).
- Metric (cm) / Imperial (in) toggle.
- Interactive anatomical visualizer (`BodyVisualizer.tsx`).
- Manual editing modal (`MeasurementEditModal.tsx`) with delta tracking and instant size recalculation.

### Module 12: Clothing Size Recommendation Engine (`src/services/sizing/sizeMatcher.ts`)
- Supports T-shirts, formal shirts, hoodies, jackets, sweaters, trousers, jeans, shorts, and formal pants.
- Factors in tailoring ease allowances.
- Recommends best size, provides explanation, identifies dimensional warnings, and suggests alternatives (snug, relaxed).
- Supports creating custom brand size charts.

### Module 13 & 14: History, Export & Privacy (`src/pages/History.tsx`, `Settings.tsx`)
- Local IndexedDB persistence.
- Side-by-side session comparison with numerical deltas.
- Export to JSON and CSV.
- One-click local data wipe.

---

## 6. Body Landmark Mapping

MediaPipe Pose Landmarker detects 33 3D normalized landmarks (`x, y, z ∈ [0, 1]` with visibility score `v ∈ [0, 1]`):

| ID | Landmark Name | Anatomical Significance | Application in BodyFit AI |
|---|---|---|---|
| 0 | Nose | Facial center reference | Upper cranial vertex projection anchor |
| 1-6 | Eye Inner, Center, Outer | Facial horizontal plane | Head tilt check |
| 7, 8 | Left / Right Ear | Cranial transverse line | Cranial height & cervical neck baseline |
| 9, 10 | Mouth Left / Right | Lower facial reference | Cervical proportion verification |
| **11** | **Left Shoulder** | Left acromion process | Shoulder width, chest level, arm length, torso rise |
| **12** | **Right Shoulder** | Right acromion process | Shoulder width, chest level, arm length, torso rise |
| **13** | **Left Elbow** | Left cubital joint | Sleeve length, upper arm bicep circumference |
| **14** | **Right Elbow** | Right cubital joint | Sleeve length, upper arm bicep circumference |
| **15** | **Left Wrist** | Left carpal joint | Sleeve length, A-pose separation check |
| **16** | **Right Wrist** | Right carpal joint | Sleeve length, A-pose separation check |
| 17-22 | Pinky, Index, Thumb | Distal hand extremities | Hand reach and arm extension verification |
| **23** | **Left Hip** | Left anterior superior iliac spine | Waist level, hip circumference, inseam, outseam |
| **24** | **Right Hip** | Right anterior superior iliac spine | Waist level, hip circumference, inseam, outseam |
| **25** | **Left Knee** | Left patellar joint | Thigh circumference, knee circumference, outseam |
| **26** | **Right Knee** | Right patellar joint | Thigh circumference, knee circumference, outseam |
| **27** | **Left Ankle** | Left medial/lateral malleolus | Inseam, outseam, leg opening circumference |
| **28** | **Right Ankle** | Right medial/lateral malleolus | Inseam, outseam, leg opening circumference |
| **29** | **Left Heel** | Left calcaneus bone | Ground baseline contact, outseam termination |
| **30** | **Right Heel** | Right calcaneus bone | Ground baseline contact, outseam termination |
| **31** | **Left Foot Index** | Left metatarsal/toe tip | Foot ground plane verification |
| **32** | **Right Foot Index** | Right metatarsal/toe tip | Foot ground plane verification |

---

## 7. Mathematical & Measurement Formulas

### 1. Scale Calibration Formula
Physical height $H_{\text{user}}$ (in centimeters) is used to calculate the pixel density scale factor $S_{\text{px/cm}}$:

$$S_{\text{px/cm}} = \frac{H_{\text{detected\_px}}}{H_{\text{user}}}$$

Where $H_{\text{detected\_px}}$ represents the Euclidean vertical distance between the cranial vertex $Y_{\text{vertex}}$ and the lowest visible ground foot contact $Y_{\text{sole}}$:

$$H_{\text{detected\_px}} = |Y_{\text{sole}} - Y_{\text{vertex}}|$$

#### Anthropometric Cranial Vertex Correction
Because landmark 0 is the nose and not the top of the skull, the cranial vertex is calculated by projecting above the ear midpoint:

$$Y_{\text{ear\_mid}} = \frac{Y_{\text{left\_ear}} + Y_{\text{right\_ear}}}{2}$$

$$Y_{\text{vertex}} = Y_{\text{nose}} - \max\left(D_{\text{neck\_to\_ear}} \times 0.45, \; |Y_{\text{nose}} - Y_{\text{ear\_mid}}| \times 1.25\right)$$

#### Ground Foot Base Correction
The sole baseline contact is the lowest coordinate among ankles, heels, and toes:

$$Y_{\text{sole}} = \max\left(Y_{\text{left\_ankle}}, Y_{\text{right\_ankle}}, Y_{\text{left\_heel}}, Y_{\text{right\_heel}}, Y_{\text{left\_toe}}, Y_{\text{right\_toe}}\right)$$

---

### 2. Euclidean Distance Formulation
Distance $D(P_1, P_2)$ between two points in 2D pixel space:

$$D(P_1, P_2) = \sqrt{(X_2 - X_1)^2 + (Y_2 - Y_1)^2}$$

Conversion to physical centimeters:

$$\text{Distance}_{\text{cm}} = \frac{D(P_1, P_2)}{S_{\text{px/cm}}}$$

---

### 3. Circumference Estimation via Ramanujan's Ellipse Approximation
When cross-sections are approximated as an ellipse with semi-major axis $a$ (half transverse width) and semi-minor axis $b$ (half sagittal depth):

$$C \approx \pi \left[ 3(a + b) - \sqrt{(3a + b)(a + 3b)} \right]$$

#### Sagittal Depth Determination
1. **Dual-View Capture (Front + Side)**:
   $$b = \frac{\text{Width}_{\text{side}}}{2}$$
2. **Front-View Assumption (Anthropometric Depth Ratios)**:
   $$b = a \times R_{\text{depth}}$$

Where anthropometric ratios $R_{\text{depth}}$ are calibrated as:
- $\text{Chest}: 0.72$
- $\text{Waist}: 0.74$
- $\text{Hip}: 0.78$
- $\text{Neck}: 0.88$
- $\text{Upper Arm}: 0.90$
- $\text{Thigh}: 0.86$
- $\text{Knee}: 0.92$
- $\text{Leg Opening}: 0.85$

---

### 4. Specific Dimension Calculations

#### Upper Body
- **Shoulder Width**: Distance between Left Shoulder (11) and Right Shoulder (12) with deltoid curvature allowance:
  $$\text{ShoulderWidth} = \frac{D(P_{11}, P_{12})}{S_{\text{px/cm}}} \times 1.08$$
- **Chest Circumference**: Transverse chest width across thorax at sternum level ($W_{\text{chest}} = D(P_{11}, P_{12}) \times 0.86$), then evaluated through Ramanujan's formula with chest depth ratio or side capture depth.
- **Waist Circumference**: Transverse waist width ($W_{\text{waist}} = D(P_{11}, P_{12}) \times 0.72$) evaluated through Ramanujan's formula.
- **Sleeve Length**: Segmented path from shoulder through elbow to wrist:
  $$\text{Sleeve} = \frac{D(P_{\text{shoulder}}, P_{\text{elbow}}) + D(P_{\text{elbow}}, P_{\text{wrist}})}{S_{\text{px/cm}}}$$
- **Upper Arm Circumference**: Measured at mid-bicep level ($W_{\text{arm}} = D(P_{11}, P_{13}) \times 0.32$) evaluated with ratio $0.90$.
- **Shirt Length**: Distance from cervical base / shoulder midpoint to hip level plus standard hemline drop:
  $$\text{ShirtLength} = \frac{D(P_{\text{shoulder\_mid}}, P_{\text{hip\_mid}})}{S_{\text{px/cm}}} + 12.0\,\text{cm}$$
- **Neck Circumference**: Cervical width ($W_{\text{neck}} = D(P_{11}, P_{12}) \times 0.35$) with ratio $0.88$.

#### Lower Body
- **Hip Circumference**: Transverse trochanter diameter ($W_{\text{hip}} = D(P_{23}, P_{24}) \times 1.28$) evaluated with ratio $0.78$ or side depth.
- **Thigh Circumference**: Upper thigh width below gluteal fold ($W_{\text{thigh}} = D(P_{23}, P_{25}) \times 0.38$) with ratio $0.86$.
- **Knee Circumference**: Patellar joint width ($W_{\text{knee}} = W_{\text{thigh}} \times 0.72$) with ratio $0.92$.
- **Inseam Length**: Distance from crotch base (perineum midpoint below hips) to medial ankle:
  $$\text{Inseam} = \frac{D(P_{\text{crotch}}, P_{\text{ankle}})}{S_{\text{px/cm}}}$$
- **Outseam Length**: Continuous lateral distance from waist crest through knee to heel:
  $$\text{Outseam} = \frac{D(P_{\text{hip}}, P_{\text{knee}}) + D(P_{\text{knee}}, P_{\text{heel}})}{S_{\text{px/cm}}}$$
- **Leg Opening**: Ankle circumference evaluated with ratio $0.85$.

---

## 8. Confidence Scoring Methodology

Every measurement receives a confidence level (**High**, **Medium**, or **Low**) with an explicit score ($0-100\%$) and estimated tolerance range ($\pm\,\text{cm}$):

$$\text{Confidence} = \text{Base}(60) + \Delta_{\text{vis}} + \Delta_{\text{frames}} + \Delta_{\text{var}} + \Delta_{\text{method}} + \Delta_{\text{env}}$$

### Scoring Parameters
1. **Landmark Visibility ($\Delta_{\text{vis}}$)**:
   - Average visibility $> 0.85$ and valid ratio $\ge 0.90$: $+12\%$
   - Average visibility $< 0.65$: $-18\%$
2. **Multi-Frame Sample Size ($\Delta_{\text{frames}}$)**:
   - $\ge 5$ coherent frames: $+8\%$
   - $< 3$ frames: $-10\%$
3. **Pose Stability & Variance ($\Delta_{\text{var}}$)**:
   - Frame coordinate variance $< 3.0$: $+8\%$
   - Frame coordinate variance $> 8.0$: $-15\%$
4. **Measurement Method ($\Delta_{\text{method}}$)**:
   - Dual-view cross-verified (`multi_view_aggregation`): $+15\%$
   - Direct joint skeletal geometry (`direct_geometric`): $+5\%$
   - Single-view frontal ellipse (`ramanujan_circumference`): $-6\%$
5. **Lighting & Distance Score ($\Delta_{\text{env}}$)**:
   - Lighting score $< 60$: $-10\%$
   - Distance score $< 70$: $-8\%$

### Confidence Categories
- **High ($\ge 85\%$)**: Tolerance uncertainty $\pm 1.0\,\text{cm}$.
- **Medium ($68\% - 84\%$)**: Tolerance uncertainty $\pm 2.2\,\text{cm}$.
- **Low ($< 68\%$)**: Tolerance uncertainty $\pm 4.0\,\text{cm}$.

---

## 9. Size Recommendation Methodology & Garment Ease

Garment sizes are not equivalent to bare skin measurements. Tailoring ease allowances are factored into each garment type:

| Garment Type | Chest Ease | Waist Ease | Hip Ease | Description |
|---|---|---|---|---|
| **T-Shirt** | $+6\,\text{cm}$ | $+6\,\text{cm}$ | $+4\,\text{cm}$ | Stretch knit drape allowance |
| **Button-Down Shirt** | $+8\,\text{cm}$ | $+7\,\text{cm}$ | $+6\,\text{cm}$ | Clean posture lines without pulling |
| **Hoodie** | $+12\,\text{cm}$ | $+10\,\text{cm}$ | $+8\,\text{cm}$ | Layering and fleece volume |
| **Jacket / Blazer** | $+12\,\text{cm}$ | $+10\,\text{cm}$ | $+10\,\text{cm}$ | Outerwear fit over inner garments |
| **Sweater** | $+8\,\text{cm}$ | $+8\,\text{cm}$ | $+6\,\text{cm}$ | Natural knit flexibility |
| **Trousers** | $0$ | $+2\,\text{cm}$ | $+5\,\text{cm}$ | Seated comfort & minimal waist gap |
| **Denim Jeans** | $0$ | $+1.5\,\text{cm}$ | $+3.5\,\text{cm}$ | Structured denim contour fit |
| **Shorts** | $0$ | $+3\,\text{cm}$ | $+6\,\text{cm}$ | Active leg mobility |
| **Formal Pants** | $0$ | $+2\,\text{cm}$ | $+4\,\text{cm}$ | Tailored trouser rise with drape |

### Scoring & Penalization Algorithm
Each candidate size in the chart starts at $100\%$ score:
- Over upper boundary penalty: $-4.0 \times \Delta_{\text{cm}}$
- Under lower boundary penalty (loose fit): $-2.0 \times \Delta_{\text{cm}}$
- Shoulder tightness penalty: $-3.0 \times \Delta_{\text{cm}}$
- Fit classification:
  - Score $\ge 90$: **Perfect Fit**
  - Score $75-89$: **Regular Fit**
  - Tight on critical dimensions: **Slim / Snug Fit**
  - Roomy on critical dimensions: **Relaxed Fit**

---

## 10. IndexedDB Schema

The application uses an IndexedDB database named `BodyMeasureAI_DB` (Version 1) containing three object stores:

```
Database: BodyMeasureAI_DB
├── Object Store: profiles (KeyPath: "id")
│   ├── Index: "updatedAt"
│   └── Fields:
│       ├── id: string (e.g. "prof_1730000000_abcde")
│       ├── name: string
│       ├── heightCm: number (100 - 230)
│       ├── weightKg?: number
│       ├── age?: number
│       ├── genderPreference: "menswear" | "womenswear" | "unisex"
│       ├── createdAt: ISO 8601 string
│       └── updatedAt: ISO 8601 string
│
├── Object Store: measurements (KeyPath: "id")
│   ├── Index: "profileId"
│   ├── Index: "capturedAt"
│   └── Fields:
│       ├── id: string (e.g. "rec_1730000000_xyz")
│       ├── profileId: string
│       ├── profileName: string
│       ├── heightCm: number
│       ├── weightKg?: number
│       ├── capturedAt: ISO 8601 string
│       ├── measurements: BodyMeasurements object
│       ├── recommendations: SizeRecommendation[]
│       ├── frontThumbnail?: string (Base64 JPEG DataURL)
│       ├── sideThumbnail?: string (Base64 JPEG DataURL)
│       └── manuallyEditedCount: number
│
└── Object Store: settings (KeyPath: "key")
    └── Stores local application preferences
```

---

## 11. Privacy & Security Implementation

1. **No External Network Calls**: Zero API requests, telemetry, or analytics tracking.
2. **Local Image Processing**: Camera video frames never leave GPU/RAM. Frames are processed directly via WebAssembly and Canvas buffers.
3. **Session Stream Termination**: `MediaStreamTrack.stop()` is invoked the instant the user leaves the Camera view.
4. **Data Sanitization**: Thumbnails are stored only if generated during the scan session; all stored profiles and scan history can be wiped in one click from the Settings page.

---

## 12. Performance Optimizations

1. **Local Model Preloading**: MediaPipe WASM and Float16 `.task` models are packaged in `/public` to avoid runtime CDN downloads.
2. **Throttled Image Processing**: OpenCV quality metrics (brightness, contrast, blur) are sampled every 4 frames on a downscaled $160 \times 120$ offscreen canvas to prevent CPU spikes.
3. **WebGL/GPU Inference**: MediaPipe Pose Landmarker initializes with GPU delegate, falling back automatically to CPU if WebGL is unavailable.
4. **Memory Leak Prevention**: All OpenCV `cv.Mat`, `cv.MatVector`, and temporary structuring kernels invoke `.delete()` in a `try...finally` block immediately after calculation.
5. **Separated State Architecture**: High-frequency video canvas rendering is decoupled from React's virtual DOM reconciliation.

---

## 13. Known Limitations & Technical Defensibility

1. **Clothing Tightness**: Standard computer vision cannot observe skin-level contours under baggy, oversized, or heavy winter clothing. Users should wear fitted clothing (athletic wear or swimwear) for accurate results.
2. **Camera Perspective Distortion**: Wide-angle smartphone lenses can introduce barrel distortion when placed too close. The application mitigates this by enforcing an optimal distance ratio ($60-94\%$ frame height).
3. **Monocular Depth Ambiguity**: A single frontal image provides transverse width but requires anthropometric assumptions for sagittal depth. Capturing both Front and Side views eliminates this limitation.

---

## 14. Installation & Execution Instructions

### Prerequisites
- Node.js $\ge 18.0.0$ (Tested on Node v24.16.0)
- Modern web browser with WebAssembly and WebGL support (Chrome, Edge, Safari, Firefox)

### Steps to Run
```bash
# 1. Install dependencies
npm install

# 2. Start Vite local development server
npm run dev

# 3. Open in browser
# Navigate to http://localhost:5173
```

### Building for Production
```bash
# Compile TypeScript and bundle with Vite
npm run build

# Preview production build locally
npm run preview
```
