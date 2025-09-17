import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import f1_score
import mlflow
import mlflow.sklearn
import os

# Configuración del servidor MLflow
MLFLOW_TRACKING_URI = os.environ.get('MLFLOW_TRACKING_URI')
if not MLFLOW_TRACKING_URI:
    print("Error: MLFLOW_TRACKING_URI no está configurado.")
    exit(1)
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
mlflow.set_experiment("Deployment Risk Prediction")

def main():
    # Carga el dataset desde CSV
    dataset_path = "dataset.csv"
    if not os.path.exists(dataset_path):
        print(f"Error: No se encontró {dataset_path}")
        exit(1)

    df = pd.read_csv(dataset_path)

    # Verifica que exista la columna de target
    if "deployment_status" not in df.columns:
        print("Error: El dataset no tiene la columna 'deployment_status' (target).")
        exit(1)

    # Separar features (X) y target (y)
    X = df.drop('deployment_status', axis=1)
    y = df['deployment_status']

    # División train/test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42
    )

    with mlflow.start_run():
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)

        predictions = model.predict(X_test)
        f1 = f1_score(y_test, predictions)

        # Registrar métricas y parámetros
        mlflow.log_metric("f1_score", f1)
        mlflow.log_param("n_estimators", 100)

        # Registrar modelo en MLflow
        mlflow.sklearn.log_model(model, "risk-predictor-model")

        print(f"✅ Modelo entrenado y registrado con F1-Score: {f1:.4f}")

if __name__ == "__main__":
    main()
