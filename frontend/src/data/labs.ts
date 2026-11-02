export const labs = [
  { id: 1, title: 'Image fundamentals', description: 'Inspect pixels and color channels. Try grayscale, cropping, resizing, and rotation, then compare what changed.', icon: 'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z', preview: '/previews/lab-1.html' },
  { id: 2, title: 'Edge detection', description: 'Explore how Sobel and Canny reveal image boundaries. Compare edge maps and investigate the effect of thresholds.', icon: 'M3 20V4h7v6h5V4h6v16h-6v-6h-5v6Z' },
  { id: 3, title: 'Histograms & contrast', description: 'Investigate global equalization, CLAHE, and linear adjustment. Connect changes in image detail with intensity histograms.', icon: 'M3 21h19M5 17v-5M10 17V5M15 17V8M20 17V3' },
  { id: 4, title: 'Features & matching', description: 'Find keypoints, compare descriptors, and investigate matching across SURF, SIFT, and ORB.', icon: 'M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm12 1a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-7 11a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM8 6l8 1M7 8l3 8m7-7-5 7' },
  { id: 5, title: 'PCA & eigenfaces', description: 'Explore dimensionality reduction, eigenfaces, and explained variance. Evaluate recognition and inspect its failures.', icon: 'M3 5h7v14H3ZM14 7h7M14 12h5M14 17h3' },
  { id: 6, title: 'Object detection', description: 'Inspect labels, boxes, and confidence scores. Explore pretrained inference and the custom-dataset training workflow.', icon: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 7h10v10H7Z' },
  { id: 7, title: 'Image segmentation', description: 'Separate image regions and compare thresholding, region-based, edge-based, and semantic segmentation.', icon: 'M3 3h18v18H3ZM3 12h7V3m0 9v9m0-9h11M15 12v9' },
] satisfies { id: number; title: string; description: string; icon: string; preview?: string }[]
