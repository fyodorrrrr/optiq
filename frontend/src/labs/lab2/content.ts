export const sections = {
  compare: { title: 'Compare', icon: 'M3 4h7v16H3ZM14 4h7v16h-7Z',
    prompt: 'Which method gives a cleaner boundary, and which shows gradual changes?',
    heading: 'Different definitions of an edge.',
    explanation: 'Sobel measures horizontal and vertical intensity changes. The combined magnitude shows gradient strength. Canny uses gradient processing, non-maximum suppression, and threshold-based edge tracking to produce a thin binary edge map. Neither result is a segmentation mask or an accuracy score.',
    reflection: 'Compare weak boundaries and noise in the two maps. Which would you choose for the important contours in this image, and why?' },
  sobel: { title: 'Sobel', icon: 'M3 20V4h7v6h5V4h6v16h-6v-6h-5v6Z',
    prompt: 'How will a larger Sobel kernel change the apparent boundary width?',
    heading: 'Two derivatives, one magnitude.',
    explanation: 'The x derivative measures changes across columns and responds to vertical boundaries; the y derivative measures changes across rows and responds to horizontal boundaries. Their Euclidean magnitude combines both directions. Larger kernels change gradient scale as well as spatial behavior.',
    reflection: 'Open the intermediate views. Do the x and y derivatives emphasize the boundaries you expected? Remember that the derivative previews show absolute values, not signed gradients.' },
  canny: { title: 'Canny', icon: 'M4 18V5h6v5h5V5h5v13h-5v-4h-5v4Z',
    prompt: 'Will higher thresholds keep more edges, or discard weaker ones?',
    heading: 'Strong edges and connected weak edges.',
    explanation: 'The upper threshold identifies strong gradient responses. Responses between the two thresholds survive when linked to strong edges through hysteresis. Higher thresholds generally retain fewer weak responses, though the exact result depends on image content. Canny output pixels are 0 or 255.',
    reflection: 'Try the noisy sample with low thresholds, then raise both thresholds. Which real contours disappear together with the noise?' },
  preprocess: { title: 'Preprocessing', icon: 'M4 4h5v5H4Zm11 0h5v5h-5ZM4 15h5v5H4Zm11 0h5v5h-5ZM12 3v18M3 12h18',
    prompt: 'Can more smoothing remove noise without also weakening useful detail?',
    heading: 'Both detectors start from the same blurred image.',
    explanation: 'Color inputs are converted to grayscale, then Gaussian blur reduces high-frequency variation. Both Sobel and Canny receive exactly the same blurred array. A 1×1 Gaussian kernel leaves pixels unchanged; larger odd kernels smooth more strongly and can remove small details.',
    reflection: 'Compare the seeded noisy sample at Gaussian sizes 1, 3, and 7. Inspect the blurred intermediate image before judging the edge maps.' },
} as const

export type Section = keyof typeof sections

export const pythonExample = `gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)  # if color
blurred = cv2.GaussianBlur(gray, (blur_kernel, blur_kernel), 0)
gx = cv2.Sobel(blurred, cv2.CV_64F, 1, 0, ksize=sobel_kernel)
gy = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=sobel_kernel)
magnitude = cv2.magnitude(gx, gy)
edges = cv2.Canny(blurred, low_threshold, high_threshold)`
