export const sections = {
  detect: { title: 'Detect', icon: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 7h10v10H7Z', prompt: 'Which detections will disappear when you raise the confidence threshold?', heading: 'Classification names an image. Detection locates objects.', explanation: 'A classifier might call an image “street.” A detector locates individual people, buses, and cars with boxes and class scores. YOLO11 predicts boxes and classes in one model pass. A confidence score is a model score, not a guarantee of correctness; missing or incorrect detections still need inspection.' },
  dataset: { title: 'Dataset', icon: 'M3 5h7l2 2h9v13H3ZM7 11h10M7 15h6', prompt: 'Would your model recognize the same object under different lighting and angles?', heading: 'Good labels and independent splits matter.', explanation: 'Collect varied images of the objects you want to detect and annotate them using an external tool. Save one normalized YOLO label file per image. Split independent scenes into training, validation, and optionally test sets. Nearby frames from one recording can leak information even when their files differ.' },
  training: { title: 'Training & evaluation', icon: 'M3 3v18h18M6 16l4-5 4 2 6-8', prompt: 'Do the measured results support using this model on new images?', heading: 'Train explicitly. Reuse the saved weights.', explanation: 'Training adjusts model weights using annotated examples. Inference reuses those weights on new inputs. Training runs locally through a command, never automatically from this page. Precision measures how many predicted objects are correct; recall measures how many labeled objects are found. mAP summarizes detection performance across classes and overlap thresholds.' },
} as const
export type Section = keyof typeof sections
export const pythonExample = `model = YOLO("yolo11n.pt")
results = model.predict(image, conf=0.25, imgsz=640, device="cpu")
# Training runs separately from the web server:
model.train(data="data.yaml", epochs=100, imgsz=640,
            batch=4, seed=42, device="cpu")
# Validate on the actual configured split, not an assumed test set.
metrics = model.val(data="data.yaml", split="val")`
