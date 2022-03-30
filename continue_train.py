from imageai.Classification.Custom import ClassificationModelTrainer
import os

model_trainer = ClassificationModelTrainer()
model_trainer.setModelTypeAsResNet50()
model_trainer.setDataDirectory("architecture")
model_trainer.trainModel(num_objects=10, num_experiments=8, enhance_data=True, batch_size=8, show_network_summary=True, continue_from_model="architecture\\models\\model_ex-027_acc-0.868630.h5")