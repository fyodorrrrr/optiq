# SURF-enabled OpenCV

Lab 4 uses actual SURF, SIFT, and ORB. The standard
`opencv-contrib-python-headless` wheel provides SIFT and ORB but disables SURF.
The UI checks capabilities and reports unavailable algorithms explicitly.
It never substitutes ORB for SURF or reports an unavailable method as complete.

## Local setup

Install the locked backend dependencies first. From `backend/`, using the
project's Python 3.12 environment, run:

```sh
.venv/bin/python scripts/build_surf.py --install
.venv/bin/python -c 'import cv2; cv2.xfeatures2d.SURF_create(400); print(cv2.__version__)'
.venv/bin/python -m unittest discover -s tests -v
```

A native C++ compiler and internet access for build dependencies are required.
On macOS, install Apple's command-line tools with `xcode-select --install`.
Compilation can take several minutes. `--jobs 2` reduces concurrent compilation
and memory use. Omit `--install` to build without replacing the installed package.
Restart FastAPI after installation; check `/api/labs/4/capabilities`.

The script builds the currently installed package version with contrib modules
and `OPENCV_ENABLE_NONFREE=ON`. Build logs, the wheel, and a manifest recording
platform, Python version, flags, and wheel SHA-256 are saved under the ignored
`backend/.cache/surf-wheels/` directory. Wheels are specific to their Python,
platform, and architecture; rebuild on the deployment target. Do not commit them.

## Scope and reproducibility

The custom 5.0.0.93 build was verified on macOS ARM64 with Python 3.12 using all
34 backend tests, including SURF descriptors, matching, and upright mode. Other
platforms still require verification. Calibration and geometry modules are
included because this OpenCV version's feature bindings depend on them.

The build includes highgui/videoio symbols for Ultralytics compatibility, but
native GUI windows and FFmpeg/AVFoundation integrations are disabled. Lab 6
captures camera frames in the browser. Revisit codecs for future video uploads.
Reinstalling `requirements-lock.txt` may restore the standard wheel; repeat the
SURF setup afterward. The package version alone does not identify its capabilities.
Do not replace the lockfile with a machine-specific wheel path.

The current feature budget limits descriptors and matching, but SURF detection
still scans the full bounded input. Inputs are limited to one million pixels
per image and a two-million-pixel match canvas. Deployment resource limits and
concurrent processing capacity require separate verification.

Build references: [OpenCV Python manual builds](https://github.com/opencv/opencv-python/blob/4.x/README.md)
and [OpenCV build configuration](https://docs.opencv.org/doc/doxygen/html/db/d05/tutorial_config_reference.html).
