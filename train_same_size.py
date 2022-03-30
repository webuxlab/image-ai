from imageai.Classification.Custom import ClassificationModelTrainer
model_trainer = ClassificationModelTrainer()

model_trainer.setModelTypeAsResNet50()
model_trainer.setDataDirectory("arch")
model_trainer.trainModel(num_objects=10, num_experiments=5, enhance_data=True, batch_size=8, show_network_summary=True)