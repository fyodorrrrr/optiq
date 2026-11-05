"""Build the installed OpenCV version with SURF enabled; installation is optional."""
import argparse
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import platform
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--install", action="store_true", help="Install the built wheel into this Python environment.")
    parser.add_argument("--jobs", type=int, default=4)
    parser.add_argument("--minimal", action="store_true", help="Build only modules needed by the classical Render API.")
    args = parser.parse_args()
    if args.jobs < 1:
        parser.error("--jobs must be positive")
    version = importlib.metadata.version("opencv-contrib-python-headless")
    destination = Path(__file__).resolve().parents[1] / ".cache" / "surf-wheels"
    destination.mkdir(parents=True, exist_ok=True)
    modules = "core,imgproc,imgcodecs,features2d,flann,calib3d,calib,3d,stereo,photo,xfeatures2d,python3"
    if not args.minimal:
        modules += ",dnn,video,videoio,highgui,ml,objdetect"
    flags = " ".join([
        "-DOPENCV_ENABLE_NONFREE=ON",
        f"-DBUILD_LIST={modules}",
        "-DBUILD_TESTS=OFF", "-DBUILD_PERF_TESTS=OFF", "-DBUILD_EXAMPLES=OFF",
        "-DWITH_IPP=OFF", "-DWITH_OPENCL=OFF", "-DWITH_FFMPEG=OFF",
        "-DWITH_AVFOUNDATION=OFF", "-DWITH_OBSENSOR=OFF",
    ])
    environment = {**os.environ, "ENABLE_CONTRIB": "1", "ENABLE_HEADLESS": "1",
                   "CMAKE_ARGS": flags, "CMAKE_BUILD_PARALLEL_LEVEL": str(args.jobs)}
    archives = list((destination.parent / "surf-source").glob(f"opencv_contrib_python_headless-{version}.tar.gz"))
    source = str(archives[0]) if archives else f"opencv-contrib-python-headless=={version}"
    log = destination / "build.log"
    print(f"Building OpenCV with SURF; compiler output: {log}", flush=True)
    with log.open("w") as output:
        completed = subprocess.run([sys.executable, "-m", "pip", "wheel", "--verbose", "--no-cache-dir", "--no-deps",
                                    "--no-binary=opencv-contrib-python-headless", "--wheel-dir", str(destination), source],
                                   env=environment, stdout=output, stderr=subprocess.STDOUT)
    if completed.returncode:
        print("\n".join(log.read_text().splitlines()[-30:]), flush=True)
        raise RuntimeError(f"OpenCV build failed; inspect {log}")
    wheels = sorted(destination.glob(f"opencv_contrib_python_headless-{version}-*.whl"), key=lambda path: path.stat().st_mtime)
    if not wheels:
        raise RuntimeError("Build returned without producing the expected wheel.")
    wheel = wheels[-1]
    manifest = {"version": version, "python": platform.python_version(), "platform": platform.platform(),
                "cmake_args": flags, "wheel": wheel.name,
                "sha256": hashlib.sha256(wheel.read_bytes()).hexdigest()}
    (destination / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"SURF wheel built: {wheel}", flush=True)
    if args.install:
        subprocess.run([sys.executable, "-m", "pip", "install", "--force-reinstall", "--no-deps", str(wheel)], check=True)
        subprocess.run([sys.executable, "-c", "import cv2; cv2.xfeatures2d.SURF_create(400); print('SURF enabled:', cv2.__version__)"], check=True)


if __name__ == "__main__":
    main()
