# Homepage lab examples

These WebP files are saved outputs from the existing lab services, not live
student results. The homepage displays them without calling the backend.
`provenance.json` records sources, settings, and available engine/model versions.
Labs 1–3, 6, and 7 use aligned before/after assets for comparison sliders;
Labs 4–5 retain their full matching and eigenface visuals.
Lab 4 shows SIFT candidate matches; Lab 6 shows pretrained YOLO11n detection,
not custom training. Lab 7 shows watershed regions, not semantic predictions.

To regenerate from the repository root:

```sh
backend/.venv/bin/python backend/scripts/export_home_previews.py
```

Prepare the local LFW dataset and YOLO11n assets first, following the existing
Lab 5 and Lab 6 setup documentation. The exporter does not download assets.
Lab 6 uses the Ultralytics bus demonstration image; its source URL is recorded
in the provenance file. Other sources are generated Optiq samples or LFW PCA
components. Keep these captions and provenance aligned when replacing previews.
