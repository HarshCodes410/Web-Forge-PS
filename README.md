# Web-Forge-PS...
This is the solution for the given ps by the zenith for web-forge hackathon 

The objective of this problem statement is to build an end-to-end, software-based computer vision pipeline using Mask R-CNN for leaf instance segmentation in precision agriculture and plant phenotyping. Because field images suffer from overlapping leaves, partial occlusions, shadows, and cluttered soil backgrounds, the challenge is to go beyond simple color detection and separate each individual leaf. Using supervised deep learning, the system simultaneously locates every leaf and generates a distinct, pixel-level binary mask for each instance, backed by a runnable training and inference pipeline, a fine-tuned model checkpoint, quantitative validation metrics (such as mAP and IoU), and a visual segmentation demonstration.

Download the fine-tuned weights from [Release v1.0](https://github.com/HarshCodes410/Web-Forge-PS/releases/tag/v1.0):
* [`best_leaf_maskrcnn.pth` (168 MB)](https://github.com/HarshCodes410/Web-Forge-PS/releases/download/v1.0/best_leaf_maskrcnn.pth)
