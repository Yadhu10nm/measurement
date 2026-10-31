declare global {
  interface Window {
    cv: any
  }
}

let cvLoadPromise: Promise<any> | null = null

export function loadOpenCV(): Promise<any> {
  if (window.cv && window.cv.Mat) {
    return Promise.resolve(window.cv)
  }

  if (cvLoadPromise) {
    return cvLoadPromise
  }

  cvLoadPromise = new Promise((resolve, reject) => {
    // Check if script tag is already in DOM
    let script = document.getElementById('opencv-script') as HTMLScriptElement | null

    const handleLoaded = () => {
      if (window.cv && window.cv.Mat) {
        resolve(window.cv)
      } else if (window.cv) {
        window.cv.onRuntimeInitialized = () => {
          resolve(window.cv)
        }
      } else {
        // Poll for window.cv runtime
        let attempts = 0
        const interval = setInterval(() => {
          attempts++
          if (window.cv && window.cv.Mat) {
            clearInterval(interval)
            resolve(window.cv)
          } else if (attempts > 50) {
            clearInterval(interval)
            // Even if cv took long, we can still fall back or resolve
            resolve(window.cv)
          }
        }, 100)
      }
    }

    if (!script) {
      script = document.createElement('script')
      script.id = 'opencv-script'
      script.async = true
      script.src = '/opencv/opencv.js'
      script.onload = handleLoaded
      script.onerror = (e) => reject(new Error('Failed to load OpenCV.js: ' + e))
      document.body.appendChild(script)
    } else {
      handleLoaded()
    }
  })

  return cvLoadPromise
}

export function isOpenCVReady(): boolean {
  return !!(window.cv && window.cv.Mat)
}
