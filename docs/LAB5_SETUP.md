# Lab 5 dataset and experiment

The source lab uses **Labeled Faces in the Wild (LFW)** with
`min_faces_per_person=70` and `resize=0.4`. It is a dataset experiment rather
than a personal image uploader.

From the repository root, after installing backend dependencies:

```sh
backend/.venv/bin/python backend/scripts/prepare_lfw.py
```

The initial download needs internet access and may take several minutes.
scikit-learn retrieves and checks the source archives. Dataset files and derived
loader caches stay under ignored `backend/.cache/lfw/`; do not commit them.
The API never downloads data on a page request. After setup, select **Check
dataset** in `/labs/5`. A missing cache leaves the run button disabled and
returns a clear dataset-not-prepared message.

## Execution and provenance

Each request fits fresh models; no fitted model or result is persisted. The
source's unstratified 80/20 split uses seed 42. Training-only PCA uses the
randomized solver, whitening, seed 42, and 150 components by default. Exploration
allows 12–300 components, bounded by training size and features. The RBF SVM
uses balanced class weights, C=1, and gamma=scale; no hyperparameter search is
implied. A separate full PCA fitted on the same training rows measures the exact
90% variance threshold, including when the selected range is too short.

The UI records settings, split sizes, library versions, dataset array/label/name
SHA-256, timings, and all held-out predictions in a downloadable JSON artifact.
First 12 eigenfaces and the last three selected components use per-component
symmetric grayscale normalization around zero; they are visualization images,
not original faces. Failure examples are programmatically selected from the
held-out predictions, with no invented examples if there are none.

On the local dataset: 1,288 faces, 50×37 pixels, 1,850 features, seven identities;
1,030 training and 258 test faces. The verified baseline retained 94.56% variance
with 150 components, needed 85 components for 90%, and obtained 84.88% held-out
accuracy (39 errors). These are observed local results, not promised targets.

One fit is allowed per backend process, with two numerical-library threads.
Requests use the existing FastAPI threadpool; this is a bounded local experiment,
not training infrastructure. A disconnected browser does not terminate active
CPU work. Multiple server workers have independent guards; validate resource
usage before deployment. No dataset or face images are uploaded to a remote API
by this implementation.

References: [scikit-learn eigenfaces example](https://scikit-learn.org/stable/auto_examples/applications/plot_face_recognition.html),
[PCA documentation](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.PCA.html).

## Demonstration page and full local copy

On `feat/lab5-demo`, `/labs/5` is the precomputed demonstration. The former
`/labs/5/demo` preview URL redirects to it. It opens the 150-component baseline
and switches among real recorded 25/75/150-component runs without contacting
FastAPI. The four views, dataset/run details and measurement downloads remain.
There is no Run experiment button and no fresh model fitting in this page.
Recorded compute timings describe the original local runs, not browser latency.

The complete live application source is preserved on GitHub in
[`full-local`](https://github.com/fyodorrrrr/optiq/tree/full-local), commit
`729d587`. To keep a separate runnable local checkout:

```sh
git clone --branch full-local https://github.com/fyodorrrrr/optiq.git optiq-full-local
```

Follow the setup instructions in that branch. Dependencies, datasets and model
weights remain ignored by Git; prepare/copy those resources separately as already
documented. The GitHub branch preserves source and setup, not the local cache.
The Lab 5 backend/service and export script remain available as trusted local
tools in the demo branch as well, but the page does not invoke them.

To deliberately regenerate the static bundle with the prepared local dataset:

```sh
backend/.venv/bin/python backend/scripts/export_lab5_demo.py
```

The script calls the existing Lab 5 service for all three actual PCA/SVM fits,
retains split/seed/library/data provenance, and records execution time and source
SHA-256. `frontend/public/demos/lab5/manifest.json` binds each saved JSON to its
SHA-256; the page checks the hash and run identity before display. Missing/corrupt
artifacts show an error with reload, never invented results. No model or dataset
archive is downloaded at runtime. This changes Lab 5 presentation only; a complete
lightweight Render backend profile is separate work and other labs are unchanged.
