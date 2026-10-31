import { isOpenCVReady } from './opencvLoader'

export interface ImageQualityMetrics {
  brightness: number // 0-255 scale
  contrast: number   // Standard deviation
  noiseLevel: number // 0-100 estimate
  isBlurry: boolean
  isOptimalLighting: boolean
  brightnessStatus: 'too_dark' | 'too_bright' | 'optimal'
  contrastStatus: 'low_contrast' | 'optimal' | 'harsh'
}

export interface ContourAnalysisResult {
  hasContours: boolean
  bodyBoundingBox?: { x: number; y: number; width: number; height: number }
  contourArea: number
}

/**
 * Analyzes frame brightness and contrast using OpenCV.js with rigorous memory cleanup.
 * Falls back to fast Canvas ImageData math if OpenCV is initializing.
 */
export function analyzeFrameQuality(
  canvas: HTMLCanvasElement | ImageData
): ImageQualityMetrics {
  // If input is an HTMLCanvasElement, we can read ImageData or convert to Mat
  let imgData: ImageData
  if (canvas instanceof HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      return getFallbackQuality()
    }
    imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  } else {
    imgData = canvas
  }

  if (isOpenCVReady() && window.cv) {
    const cv = window.cv
    let src: any = null
    let gray: any = null
    let blurred: any = null
    let laplacian: any = null
    let meanMat: any = null
    let stdDevMat: any = null

    try {
      src = cv.matFromImageData(imgData)
      gray = new cv.Mat()
      blurred = new cv.Mat()
      laplacian = new cv.Mat()
      meanMat = new cv.Mat()
      stdDevMat = new cv.Mat()

      // 1. cv.cvtColor (RGBA to Gray)
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)

      // 2. cv.meanStdDev for brightness & contrast
      cv.meanStdDev(gray, meanMat, stdDevMat)
      const brightness = meanMat.data64F[0]
      const contrast = stdDevMat.data64F[0]

      // 3. Noise & blur estimation via cv.GaussianBlur + cv.Laplacian
      cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0, 0, cv.BORDER_DEFAULT)
      cv.Laplacian(blurred, laplacian, cv.CV_64F)
      
      let lapMean = new cv.Mat()
      let lapStd = new cv.Mat()
      cv.meanStdDev(laplacian, lapMean, lapStd)
      const laplaceVar = Math.pow(lapStd.data64F[0], 2)
      lapMean.delete()
      lapStd.delete()

      const isBlurry = laplaceVar < 30
      const noiseLevel = Math.min(100, Math.max(0, Math.round(contrast / 3)))

      let brightnessStatus: 'too_dark' | 'too_bright' | 'optimal' = 'optimal'
      if (brightness < 60) brightnessStatus = 'too_dark'
      else if (brightness > 200) brightnessStatus = 'too_bright'

      let contrastStatus: 'low_contrast' | 'optimal' | 'harsh' = 'optimal'
      if (contrast < 25) contrastStatus = 'low_contrast'
      else if (contrast > 85) contrastStatus = 'harsh'

      const isOptimalLighting = brightnessStatus === 'optimal' && contrastStatus !== 'low_contrast'

      return {
        brightness: Math.round(brightness),
        contrast: Math.round(contrast),
        noiseLevel,
        isBlurry,
        isOptimalLighting,
        brightnessStatus,
        contrastStatus,
      }
    } catch (err) {
      console.warn('OpenCV quality analysis error, using fallback:', err)
      return calculateCanvasQualityFallback(imgData)
    } finally {
      // Memory cleanup: Delete all OpenCV objects to avoid WebAssembly memory leaks
      if (src) src.delete()
      if (gray) gray.delete()
      if (blurred) blurred.delete()
      if (laplacian) laplacian.delete()
      if (meanMat) meanMat.delete()
      if (stdDevMat) stdDevMat.delete()
    }
  }

  // Pure Canvas fallback
  return calculateCanvasQualityFallback(imgData)
}

function calculateCanvasQualityFallback(imageData: ImageData): ImageQualityMetrics {
  const data = imageData.data
  const len = data.length
  let sumLuminance = 0
  const step = 8 // Sample every 8th pixel for speed

  let count = 0
  for (let i = 0; i < len; i += 4 * step) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    // Rec. 601 luma formula
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    sumLuminance += lum
    count++
  }

  const brightness = count > 0 ? sumLuminance / count : 120

  let sumSquares = 0
  for (let i = 0; i < len; i += 4 * step) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    sumSquares += Math.pow(lum - brightness, 2)
  }

  const contrast = count > 0 ? Math.sqrt(sumSquares / count) : 45

  let brightnessStatus: 'too_dark' | 'too_bright' | 'optimal' = 'optimal'
  if (brightness < 60) brightnessStatus = 'too_dark'
  else if (brightness > 200) brightnessStatus = 'too_bright'

  let contrastStatus: 'low_contrast' | 'optimal' | 'harsh' = 'optimal'
  if (contrast < 25) contrastStatus = 'low_contrast'
  else if (contrast > 85) contrastStatus = 'harsh'

  return {
    brightness: Math.round(brightness),
    contrast: Math.round(contrast),
    noiseLevel: 15,
    isBlurry: false,
    isOptimalLighting: brightnessStatus === 'optimal',
    brightnessStatus,
    contrastStatus,
  }
}

function getFallbackQuality(): ImageQualityMetrics {
  return {
    brightness: 128,
    contrast: 50,
    noiseLevel: 10,
    isBlurry: false,
    isOptimalLighting: true,
    brightnessStatus: 'optimal',
    contrastStatus: 'optimal',
  }
}

/**
 * Extracts person body contours using OpenCV Canny + findContours + morphologyEx
 */
export function extractBodyContour(
  sourceCanvas: HTMLCanvasElement,
  segmentationMaskCanvas?: HTMLCanvasElement
): ContourAnalysisResult {
  if (!isOpenCVReady() || !window.cv) {
    return { hasContours: false, contourArea: 0 }
  }

  const cv = window.cv
  let src: any = null
  let gray: any = null
  let blurred: any = null
  let edges: any = null
  let morphed: any = null
  let kernel: any = null
  let contours: any = null
  let hierarchy: any = null

  try {
    // If segmentation mask is provided, process that directly for crisp body silhouette
    const canvasToProcess = segmentationMaskCanvas || sourceCanvas
    const ctx = canvasToProcess.getContext('2d', { willReadFrequently: true })
    if (!ctx) return { hasContours: false, contourArea: 0 }

    const imgData = ctx.getImageData(0, 0, canvasToProcess.width, canvasToProcess.height)
    src = cv.matFromImageData(imgData)
    gray = new cv.Mat()
    blurred = new cv.Mat()
    edges = new cv.Mat()
    morphed = new cv.Mat()
    contours = new cv.MatVector()
    hierarchy = new cv.Mat()

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT)

    if (segmentationMaskCanvas) {
      // Threshold mask directly
      cv.threshold(blurred, edges, 120, 255, cv.THRESH_BINARY)
    } else {
      // cv.Canny edge detection
      cv.Canny(blurred, edges, 50, 150, 3, false)
    }

    // cv.morphologyEx to close gaps in silhouette
    kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5))
    cv.morphologyEx(edges, morphed, cv.MORPH_CLOSE, kernel)

    // cv.findContours
    cv.findContours(morphed, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

    let maxArea = 0
    let bestRect: any = null

    for (let i = 0; i < contours.size(); ++i) {
      const contour = contours.get(i)
      const area = cv.contourArea(contour)
      if (area > maxArea) {
        maxArea = area
        bestRect = cv.boundingRect(contour)
      }
      contour.delete()
    }

    if (bestRect && maxArea > 1000) {
      return {
        hasContours: true,
        bodyBoundingBox: {
          x: bestRect.x,
          y: bestRect.y,
          width: bestRect.width,
          height: bestRect.height,
        },
        contourArea: Math.round(maxArea),
      }
    }

    return { hasContours: false, contourArea: 0 }
  } catch (e) {
    console.warn('Contour extraction warning:', e)
    return { hasContours: false, contourArea: 0 }
  } finally {
    if (src) src.delete()
    if (gray) gray.delete()
    if (blurred) blurred.delete()
    if (edges) edges.delete()
    if (morphed) morphed.delete()
    if (kernel) kernel.delete()
    if (contours) contours.delete()
    if (hierarchy) hierarchy.delete()
  }
}
