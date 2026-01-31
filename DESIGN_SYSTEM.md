# ENVOY AI - VISUAL DESIGN LANGUAGE

## 1. CORE PHILOSOPHY
* **Aesthetic:** "Nebula Glass". A combination of deep, matte void spaces and premium, translucent glass surfaces.
* **Inspiration:** Apple visionOS (depth, blur) mixed with a Cyberpunk/Deep Purple palette.
* **Feel:** Futuristic, calm, fluid.

## 2. COLOR PALETTE (Tailwind Config)
* **Background (The Matte Void):**
    * Primary BG: `bg-[#0f0716]` (Almost black purple)
    * Secondary BG (Sidebar): `bg-[#150a20]`
* **Glass Surface (The Liquid UI):**
    * Base: `bg-white/5` (5% opacity white)
    * Hover: `hover:bg-white/10`
    * Border: `border-white/10`
    * Blur: `backdrop-blur-xl`
* **Accents:**
    * Primary Action: `bg-[#8b5cf6]` (Violet-500) -> Hover `bg-[#7c3aed]`
    * Text: `text-slate-200` (Avoid pure white for softer contrast)

## 3. SHAPES & BORDERS
* **Radius:**
    * **Strict Rule:** No sharp corners.
    * Cards/Containers: `rounded-3xl` (24px)
    * Buttons/Inputs: `rounded-xl` (12px)
* **Borders:**
    * Never use solid, thick borders.
    * Use "1px subtle inner strokes" using `border border-white/5`.

## 4. COMPONENT PATTERNS

### The "Glass Card"
(Use this structure for all widgets)
```jsx
<div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-2xl hover:shadow-purple-500/10">
  {/* Content */}
</div>
```

### The "Glow Button"
(Use this for all action buttons)
```jsx
<button className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-2xl hover:shadow-purple-500/10">
  {/* Content */}
</button>
```

### The "Glow Input"
(Use this for all form inputs)
```jsx
<input className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-2xl hover:shadow-purple-500/10">
  {/* Content */}
</input>
```

### The "Glow Select"
(Use this for all form selects)
```jsx
<select className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-2xl hover:shadow-purple-500/10">
  {/* Content */}
</select>
```

### The "Glow Progress Bar"
(Use this for all progress bars)
```jsx
<div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-2xl hover:shadow-purple-500/10">
  {/* Content */}
</div>
```