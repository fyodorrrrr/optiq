export const sections = {
  compare: { title: 'Compare', icon: 'M3 4h7v16H3ZM14 4h7v16h-7Z', prompt: 'Which features stay recognizable after rotation or a change in scale?',
    heading: 'Keypoints locate features; descriptors describe them.',
    explanation: 'A detector finds distinctive locations. A descriptor encodes their neighborhoods for comparison with another image. SURF and SIFT use floating-point descriptors with L2 distance; ORB uses binary descriptors with Hamming distance. Keypoint and match counts alone do not measure correctness.',
    reflection: 'Compare keypoint locations, match lines, and measured run times. Which method captures useful correspondences rather than simply finding more points?' },
  surf: { title: 'SURF', icon: 'M4 12h16M12 4v16M8 8h8v8H8Z', prompt: 'What will raising the Hessian threshold do to the number of keypoints?',
    heading: 'SURF finds strong local structures.',
    explanation: 'SURF uses Hessian-based responses and integral-image approximations to find distinctive features. A higher threshold generally keeps fewer responses. Descriptors are used to compare local neighborhoods between images. The feature budget can cap the visible count, so a low threshold may produce no additional displayed points.',
    reflection: 'Compare threshold 400 with a higher value. Then enable upright SURF and inspect matches on the rotated pair: when would giving up orientation invariance be acceptable?' },
  sift: { title: 'SIFT', icon: 'M5 5h14v14H5ZM8 8h8v8H8ZM11 11h2v2h-2Z', prompt: 'How do the detected locations change when the same target is scaled?',
    heading: 'SIFT describes features across scales.',
    explanation: 'SIFT detects scale-space extrema and describes local gradient orientations. Its default descriptors contain 128 floating-point values. Compare its actual locations and correspondences with SURF and ORB on the same grayscale input; a single timing observation is not a universal speed ranking.',
    reflection: 'Try the scaled pair. Which matched points remain useful? Can a descriptor still confuse similar-looking regions?' },
  orb: { title: 'ORB', icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM8 8h8v8H8ZM12 3v5m0 8v5M3 12h5m8 0h5', prompt: 'Why does a binary descriptor need a different distance measure?',
    heading: 'ORB uses a compact binary description.',
    explanation: 'ORB combines oriented FAST keypoints and rotated BRIEF-style binary descriptors. Default descriptors use 32 bytes (256 bits). Hamming distance counts differing bits; treating those bytes as ordinary floating vectors would use the wrong notion of similarity.',
    reflection: 'Compare ORB with SIFT and SURF at the same feature budget. Inspect actual match lines before deciding whether more matches are better.' },
} as const
export type Section = keyof typeof sections

export const pythonExample = `surf = cv2.xfeatures2d.SURF_create(hessianThreshold=400,
                                    upright=False, extended=False)
kp_a, desc_a = surf.detectAndCompute(gray_a, None)
kp_b, desc_b = surf.detectAndCompute(gray_b, None)
matcher = cv2.BFMatcher(cv2.NORM_L2)  # ORB: NORM_HAMMING
pairs = matcher.knnMatch(desc_a, desc_b, k=2)
good = [pair[0] for pair in pairs if len(pair) == 2
        and pair[0].distance < ratio * pair[1].distance]
# The backend handles missing descriptors and caps work/visualization.`
