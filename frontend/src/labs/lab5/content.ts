export const sections = {
  eigenfaces: { title: 'Eigenfaces', icon: 'M4 4h6v6H4Zm10 0h6v6h-6ZM4 14h6v6H4Zm10 0h6v6h-6Z', prompt: 'What structure will remain when thousands of pixels become 150 numbers?', heading: 'A face becomes weights on shared patterns.', explanation: 'PCA subtracts the training mean and finds orthogonal directions of decreasing variance. Each direction reshapes into an eigenface. These are signed variation patterns, not photographs or identity templates. Compare broad lighting and shape patterns in early components with finer variations in later ones.' },
  variance: { title: 'Variance', icon: 'M3 3v18h18M6 17l5-7 4-3 6-2', prompt: 'Will retaining 90% of the variance guarantee 90% recognition accuracy?', heading: 'Variance and recognition answer different questions.', explanation: 'Cumulative explained variance measures how much training-data variation the retained directions represent. Removing components loses variation, including possible identity detail and noise. The full spectrum is fitted only on training faces; the recognition model separately uses your selected randomized PCA component count.' },
  recognition: { title: 'Recognition', icon: 'M4 8V4h4m8 0h4v4M4 16v4h4m8 0h4v-4M8 10h.01M16 10h.01M8 15q4 3 8 0', prompt: 'Which identities will be hardest to separate in the reduced space?', heading: 'Evaluate on faces the model did not train on.', explanation: 'A balanced RBF SVM learns from training PCA weights and predicts the held-out 20%. Precision measures how often a predicted identity is correct; recall measures how many actual examples are recovered. F1 balances the two. Whitening scales retained training components to unit sample variance; it removes their relative variance scale, but does not guarantee better classification.' },
  failures: { title: 'Failure analysis', icon: 'M12 3 2 21h20ZM12 9v5m0 3h.01', prompt: 'Could lighting or pose explain a wrong prediction? Inspect the evidence first.', heading: 'A wrong prediction is something to investigate.', explanation: 'Failures are selected programmatically where the held-out prediction differs from the actual label. Look for pose, lighting, expression, or accessories, and describe a hypothesis rather than claiming a proven cause. This closed-set experiment covers only the dataset identities and does not establish performance for unfamiliar people or real-world use.' },
} as const
export type Section = keyof typeof sections
export const pythonExample = `train_idx, test_idx = train_test_split(indices, test_size=0.2,
                                      random_state=42)
pca = PCA(n_components=150, svd_solver="randomized",
          whiten=True, random_state=42).fit(X[train_idx])
train = pca.transform(X[train_idx])
test = pca.transform(X[test_idx])
svm = SVC(kernel="rbf", class_weight="balanced", C=1, gamma="scale")
svm.fit(train, y[train_idx])
predicted = svm.predict(test)
# Full PCA on X[train_idx] separately measures the 90% threshold.`
