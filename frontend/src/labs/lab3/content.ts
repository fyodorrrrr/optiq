export const sections = {
  compare: { title: 'Compare', icon: 'M3 4h7v16H3ZM14 4h7v16h-7Z',
    prompt: 'Which method reveals useful detail without exaggerating noise?', heading: 'Contrast changes what you can distinguish.',
    explanation: 'A histogram counts pixels at each brightness value. A narrow distribution often signals low contrast. Enhancement can make differences easier to see, but cannot recover information that was never captured. Compare every method on the same original rather than choosing the brightest-looking result.',
    reflection: 'Compare the image and histogram together. Which details became clearer, and did any smooth region become noisy? Where could this help—for example, examining a poorly lit inspection image?' },
  equalize: { title: 'Equalization', icon: 'M3 20h18M5 16v-4M10 16V5M15 16V8M20 16V3',
    prompt: 'Will redistributing brightness improve every region equally?', heading: 'One mapping for the whole image.',
    explanation: 'Global histogram equalization uses the cumulative intensity distribution to remap brightness. It can expand a narrow range of values, but the resulting histogram is not guaranteed to be flat. One global mapping can amplify noise or handle uneven lighting poorly. A constant image has no variation to expand.',
    reflection: 'Try the uneven-lighting sample. Does global equalization help both the bright and dark areas? Compare it with CLAHE.' },
  clahe: { title: 'CLAHE', icon: 'M3 3h18v18H3ZM3 9h18M3 15h18M9 3v18M15 3v18',
    prompt: 'How much local enhancement is useful before noise becomes distracting?', heading: 'Local contrast, with a limit.',
    explanation: 'CLAHE divides the image into tiles, clips their histograms to limit concentration, redistributes the excess, and interpolates between local mappings. The clip limit controls enhancement and tile counts control locality; more tiles means smaller regions. It limits amplification rather than guaranteeing a noise-free image.',
    reflection: 'Change the clip limit and tile counts on the uneven-lighting sample. Look for noise and artificial-looking local contrast before choosing settings.' },
  linear: { title: 'Linear adjust', icon: 'M3 3v18h18M6 17 18 5',
    prompt: 'What detail might disappear when values are pushed past black or white?', heading: 'Scale, shift, or stretch the range.',
    explanation: 'Manual adjustment computes alpha × intensity + beta, rounds to the nearest integer, and clips to 0–255. Alpha controls contrast and beta shifts brightness. Full-range stretching chooses the scale and offset from the observed minimum and maximum. It preserves a constant input because there is no range to stretch.',
    reflection: 'Try a large positive or negative offset. What happens at the histogram endpoints? Can reducing the offset recover details from the original input?' },
} as const

export type Section = keyof typeof sections

export const pythonExample = `if mode == "color":
    yuv = cv2.cvtColor(image, cv2.COLOR_BGR2YUV)
    channel = yuv[:, :, 0]
else:
    channel = (image if image.ndim == 2 else
               cv2.cvtColor(image, cv2.COLOR_BGR2GRAY))
equalized = cv2.equalizeHist(channel)
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
adaptive = clahe.apply(channel)
linear = np.clip(np.rint(channel.astype(np.float64) * alpha + beta),
                 0, 255).astype(np.uint8)
# Example: reconstruct the equalized color output, then count its Y values.
if mode == "color":
    yuv[:, :, 0] = equalized
    result = cv2.cvtColor(yuv, cv2.COLOR_YUV2BGR)
    measured = cv2.cvtColor(result, cv2.COLOR_BGR2YUV)[:, :, 0]
else:
    result, measured = equalized, equalized
histogram = np.bincount(measured.ravel(), minlength=256)`
