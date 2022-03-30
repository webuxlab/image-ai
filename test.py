from imageai.Classification.Custom import CustomImageClassification
import os

execution_path = os.getcwd()

prediction = CustomImageClassification()
prediction.setModelTypeAsResNet50()
prediction.setModelPath(os.path.join(execution_path, "architecture\\models\\model_ex-027_acc-0.868630.h5"))
prediction.setJsonPath(os.path.join(execution_path, "architecture\\json\\model_class.json"))
prediction.loadModel(num_objects=10)

predictions, probabilities = prediction.classifyImage(os.path.join(execution_path, "architecture\\test\\Bathroom\\Bathroom_430586414375274913.png"), result_count=5)

for eachPrediction, eachProbability in zip(predictions, probabilities):
    print(eachPrediction , " : " , eachProbability)