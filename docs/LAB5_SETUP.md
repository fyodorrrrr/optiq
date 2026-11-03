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
