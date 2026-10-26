# Train Coach Crowd Detection Dataset (YOLO)

## Structure
- `images/train`, `images/val`, `images/test`: source images
- `labels/train`, `labels/val`, `labels/test`: YOLO detection labels
- `data.yaml`: Ultralytics dataset configuration

## Dataset details
- Task: person detection for train/coach crowd monitoring prototype
- Class: `person` (class id `0`)
- Source images and XML annotations were supplied in two ZIP files.
- XML Pascal VOC boxes were converted to YOLO normalized `class x_center y_center width height`.
- Original resolution recorded in annotations: 640 x 480.
- Sequence-group split: frames sharing the filename prefix (before `_`) remain in the same split to reduce train/validation/test leakage.
- Annotation/image filename mismatch: `zhaji03_112` XML has no matching image; `zhaji03_116` image has no matching XML. Both unmatched files were excluded.
- This is a detection dataset, not a crowd-count regression dataset. Crowd counts can be computed by counting detected `person` boxes per frame.

## Split summary
- train: 1606 images, 8831 person boxes, 15 source sequences
- val: 260 images, 1060 person boxes, 2 source sequences
- test: 256 images, 3079 person boxes, 2 source sequences

Total: 2122 images and 12970 person boxes.
