import type { Operation } from './api'

export const learningContent: Record<Operation, {
  title: string; takeaway: string; caption: string; note: string
}> = {
  inspect: {
    title: 'An image is a grid of numbers.',
    takeaway: 'One location. Three color values.',
    caption: 'Each square is one pixel. OpenCV stores its blue, green, and red values, in that order.',
    note: 'Here, red has the largest value, so the highlighted pixel looks red.',
  },
  edit: {
    title: 'A small change, one pixel at a time.',
    takeaway: 'Only the selected pixel changes.',
    caption: 'Editing replaces the values at one location. The surrounding pixels stay the same.',
    note: 'A magnified view makes this tiny change easier to see.',
  },
  grayscale: {
    title: 'Keep the brightness. Let go of the color.',
    takeaway: 'Three values become one.',
    caption: 'Grayscale combines the color channels into a single brightness value for each pixel.',
    note: 'The image keeps its width and height. Different colors can become similar shades of gray.',
  },
  crop: {
    title: 'Keep a region, leave the rest.',
    takeaway: 'A smaller view of the same image.',
    caption: 'Cropping keeps the pixels inside a chosen boundary. It does not shrink the objects inside it.',
    note: 'The dashed outline marks the region that becomes the result.',
  },
  resize: {
    title: 'The whole image, on a new grid.',
    takeaway: 'More pixels does not mean more detail.',
    caption: 'Resizing changes the number of pixels while keeping the whole scene. Enlarging cannot recover missing detail.',
    note: 'This example uses nearest neighbor, which copies nearby values. Linear interpolation blends them instead.',
  },
  rotate: {
    title: 'Same pixels. A different direction.',
    takeaway: 'A quarter-turn swaps width and height.',
    caption: 'A 90° rotation rearranges the existing pixels without changing their color values.',
    note: 'A non-square image makes the dimension swap easy to spot.',
  },
}
