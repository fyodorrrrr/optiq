from pathlib import Path
from threading import Lock
from time import perf_counter
import hashlib

import numpy as np
import sklearn
from sklearn.datasets import fetch_lfw_people
from sklearn.decomposition import PCA
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from threadpoolctl import threadpool_limits

from schemas.lab5 import DatasetInfo, Eigenface, Prediction, ReportRow, Result, Settings
from services.images import frame, ImageError

DATA_HOME = Path(__file__).resolve().parents[1] / '.cache' / 'lfw'
RUN_LOCK = Lock()


class DatasetUnavailable(Exception):
    pass


def load_dataset():
    try:
        return fetch_lfw_people(data_home=str(DATA_HOME), min_faces_per_person=70,
                                resize=.4, download_if_missing=False)
    except (OSError, ValueError) as error:
        raise DatasetUnavailable('The LFW dataset is not prepared on this server. Follow the Lab 5 dataset setup instructions, then retry.') from error


def dataset_info(data):
    samples, height, width = data.images.shape
    training = samples - int(np.ceil(samples * .2))
    return DatasetInfo(ready=True, message='LFW · minimum 70 faces per person · resize 0.4',
                       samples=samples, height=height, width=width, features=data.data.shape[1],
                       names=data.target_names.tolist(), max_components=min(300, training - 1, data.data.shape[1]))


def status():
    try:
        return dataset_info(load_dataset())
    except DatasetUnavailable as error:
        return DatasetInfo(ready=False, message=str(error))


def face_frame(values, eigenface=False):
    if eigenface:
        # A common zero-centered scale per component preserves the sign of weights.
        maximum = float(np.max(np.abs(values)))
        pixels = np.full(values.shape, 128, dtype=np.uint8) if maximum == 0 else np.rint(127.5 + values / maximum * 127.5).clip(0, 255).astype(np.uint8)
    else:
        pixels = np.rint(values * 255).clip(0, 255).astype(np.uint8)
    return frame(pixels)


def execute(settings):
    if not RUN_LOCK.acquire(blocking=False):
        raise ImageError('Another Lab 5 experiment is running. Wait for it to finish and retry.', 409)
    try:
        with threadpool_limits(limits=2):
            return fit_experiment(load_dataset(), settings)
    finally:
        RUN_LOCK.release()


def fit_experiment(data, settings):
    info = dataset_info(data)
    if settings.components > info.max_components:
        raise ImageError(f'Choose at most {info.max_components} components for this training set.', 422)
    train_indices, test_indices = train_test_split(np.arange(len(data.target)), test_size=.2, random_state=42)
    train, test = data.data[train_indices], data.data[test_indices]
    y_train, y_test = data.target[train_indices], data.target[test_indices]
    started = perf_counter()
    pca = PCA(n_components=settings.components, svd_solver='randomized', whiten=True, random_state=42)
    pca.fit(train)
    projected_train, projected_test = pca.transform(train), pca.transform(test)
    pca_seconds = perf_counter() - started
    started = perf_counter()
    classifier = SVC(kernel='rbf', class_weight='balanced', C=1.0, gamma='scale')
    classifier.fit(projected_train, y_train)
    prediction = classifier.predict(projected_test)
    classifier_seconds = perf_counter() - started
    # Full training-only spectrum ensures 90% is measured even if selected range is too short.
    started = perf_counter()
    spectrum = PCA(svd_solver='full').fit(train)
    cumulative = np.cumsum(spectrum.explained_variance_ratio_)
    components_90 = int(np.searchsorted(cumulative, .9) + 1)
    variance_seconds = perf_counter() - started
    names = data.target_names
    report = classification_report(y_test, prediction, labels=np.arange(len(names)), target_names=names, output_dict=True, zero_division=0)
    rows = [ReportRow(name=name, kind='class' if name in names else 'average', precision=row['precision'],
                      recall=row['recall'], f1=row['f1-score'], support=int(row['support']))
            for name, row in report.items() if isinstance(row, dict)]
    def eigen(index):
        return Eigenface(component=index + 1, variance=float(pca.explained_variance_ratio_[index]),
                         frame=face_frame(pca.components_[index].reshape(info.height, info.width), True))
    def example(position):
        index = int(test_indices[position])
        return Prediction(index=index, actual=str(names[y_test[position]]), predicted=str(names[prediction[position]]), frame=face_frame(data.images[index]))
    failures = np.flatnonzero(y_test != prediction)
    fingerprint = hashlib.sha256(data.data.tobytes() + data.target.tobytes() + '|'.join(names).encode()).hexdigest()
    return Result(dataset=info, parameters=settings, train_count=len(train_indices), test_count=len(test_indices),
                  train_indices=train_indices.tolist(), test_indices=test_indices.tolist(), actual=y_test.tolist(), predicted=prediction.tolist(),
                  accuracy=float(accuracy_score(y_test, prediction)), report=rows,
                  eigenfaces=[eigen(index) for index in range(12)], tail_eigenfaces=[eigen(index) for index in range(settings.components - 3, settings.components)],
                  cumulative_variance=cumulative.tolist(), selected_variance=float(pca.explained_variance_ratio_.sum()), components_90=components_90,
                  predictions=[example(index) for index in range(min(12, len(test_indices)))], failures=[example(index) for index in failures[:12]],
                  misclassified_count=len(failures), timings={'pca_seconds': pca_seconds, 'svm_fit_predict_seconds': classifier_seconds, 'full_spectrum_seconds': variance_seconds},
                  provenance={'dataset': 'LFW people', 'min_faces_per_person': 70, 'resize': .4, 'split_seed': 42, 'test_size': .2,
                              'stratified': False, 'pca_seed': 42, 'solver': 'randomized', 'whiten': True, 'svm_kernel': 'rbf',
                              'svm_class_weight': 'balanced', 'svm_C': 1.0, 'svm_gamma': 'scale', 'sklearn': sklearn.__version__,
                              'numpy': np.__version__, 'dataset_sha256': fingerprint, 'execution': 'fresh fit; dataset cache only'})
