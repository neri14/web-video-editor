from fastapi import FastAPI,File,UploadFile,status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from typing import List
import shutil
import os

storage_dir = "storage"

app = FastAPI(title="WebEdit")
api = FastAPI(title="WebEdit API")

@api.get("/files")
def get_files():
    files = []

    for filename in os.listdir(storage_dir):
        path = os.path.join(storage_dir, filename)
        if os.path.isfile(path):
            stat = os.stat(path)
            file = {
                "filename": filename,
                "size": stat.st_size
            }
            files.append(file)

    return JSONResponse({"files": files}, status_code=status.HTTP_200_OK)


@api.delete("/files/{filename}")
def delete_file(filename: str):
    path = os.path.join(storage_dir, filename)
    if os.path.isfile(path):
        os.remove(path)
        return JSONResponse({"status": "deleted"}, status_code=status.HTTP_200_OK)
    return JSONResponse({"status": "not found"}, status_code=status.HTTP_404_NOT_FOUND)


@api.put("/files")
def upload(file: UploadFile = File(...)):
    try:
        with open(os.path.join(storage_dir, file.filename), 'wb') as f:
            shutil.copyfileobj(file.file, f)
    except Exception:
        return JSONResponse({"status": "unexpected error uploading file"}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        file.file.close()

    return JSONResponse({"status": f"uploaded file {file.filename}"}, status_code=status.HTTP_201_CREATED)


app.mount('/api', api)
app.mount('/', StaticFiles(directory="static", html=True), name="static")
