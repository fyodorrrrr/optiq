import type { Operation } from './api'

export const experiments: Record<Operation, {
  title: string; action: string; description: string; prediction: string
  heading: string; explanation: string; reflection: string; code: string
}> = {
  inspect: {
    title: 'Inspect pixels', action: 'Inspect pixel', description: 'Choose a location and look at the values inside the image array.',
    prediction: 'What values would you expect inside a bright red area?', heading: 'An image is an array of measurements.',
    explanation: 'A color image has shape (height, width, 3). OpenCV stores each pixel as blue, green, red; your browser displays red, green, blue. Coordinates start at the top-left: x moves right, y moves down. NumPy indexes the same location as image[y, x].',
    reflection: 'Inspect the red and blue areas. Which channel changes most? How could these values help a program identify a colored region?',
    code: 'height, width = image.shape[:2]\npixel = image[y, x]\n# Color pixel: [blue, green, red]\n# Grayscale pixel: one intensity value',
  },
  edit: {
    title: 'Edit a pixel', action: 'Change pixel', description: 'Change one pixel. Use the magnified views to see a change that is tiny at normal scale.',
    prediction: 'Will changing one pixel affect the dimensions or neighboring pixels?', heading: 'One assignment changes one location.',
    explanation: 'Pixel editing changes an array value without changing image size. Color images need three values; grayscale images need one intensity from 0 (black) to 255 (white). The two magnified neighborhoods show the selected pixel in the center; values beyond image edges are replicated for display only.',
    reflection: 'Compare the neighborhoods before and after. Why is a one-pixel change easier to inspect here than in the whole image?',
    code: 'result = image.copy()\nresult[y, x] = (blue, green, red)\n# For grayscale: result[y, x] = intensity',
  },
  grayscale: {
    title: 'Grayscale', action: 'Convert to grayscale', description: 'Keep brightness information while removing color channels.',
    prediction: 'Will the image dimensions change when its colors are removed?', heading: 'Same dimensions. Different information.',
    explanation: 'OpenCV converts BGR to grayscale using a weighted combination of red, green, and blue, approximately 0.299R + 0.587G + 0.114B. The result has shape (height, width), with one intensity per pixel. Width and height stay the same. An already grayscale input remains unchanged.',
    reflection: 'Find two areas that had different colors. Are they still easy to distinguish? Why might grayscale simplify an edge-detection task?',
    code: 'gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)\n# Already grayscale? Keep a copy of the original.',
  },
  crop: {
    title: 'Crop', action: 'Apply crop', description: 'Keep a rectangular region of interest, without rescaling its pixels.',
    prediction: 'Does cropping make objects smaller, or just change the image boundaries?', heading: 'Choose the region that matters.',
    explanation: 'Cropping selects rows and columns from the original array. Left and top are zero-based coordinates; width and height specify the region size. NumPy excludes the final row/column boundary. Object recognition often uses regions of interest to focus processing.',
    reflection: 'Compare the cropped region with the original. How does cropping differ from shrinking the entire image?',
    code: 'result = image[y:y + height, x:x + width].copy()',
  },
  resize: {
    title: 'Resize', action: 'Resize image', description: 'Resample the whole image into a different width and height.',
    prediction: 'Can enlarging a small image bring back details that were removed?', heading: 'New dimensions require new pixel choices.',
    explanation: 'Resizing resamples pixels into a new grid. Nearest neighbor copies nearby values, linear interpolation blends neighbors, and area interpolation is useful for shrinking. Keeping the aspect ratio avoids stretching. Unlike cropping, resizing retains the full field of view.',
    reflection: 'Compare nearest and linear interpolation at a larger size. Where do you notice blockiness or smoothing?',
    code: 'result = cv2.resize(image, (width, height),\n                    interpolation=cv2.INTER_LINEAR)\n# Also available: INTER_NEAREST, INTER_AREA',
  },
  rotate: {
    title: 'Rotate', action: 'Rotate 90° clockwise', description: 'Turn the original image one quarter-turn clockwise.',
    prediction: 'What will happen to width and height after a quarter-turn?', heading: 'The same pixels in a new arrangement.',
    explanation: 'A 90-degree rotation rearranges the pixel grid and swaps width and height without resizing. A 640 × 480 image becomes 480 × 640. Repeating this experiment gives the same result because each run starts from the original.',
    reflection: 'Try a non-square image and inspect its new shape. Why would a square image hide the dimension swap?',
    code: 'result = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)',
  },
}
