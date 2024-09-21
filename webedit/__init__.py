from fastapi import FastAPI,WebSocket,WebSocketDisconnect,File,UploadFile,status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from typing import List
import shutil
import os
from json import JSONDecodeError

from webedit.connection_manager import ConnectionManager
from webedit.adapter import Adapter
from webedit.filesystem import list_files

storage_dir = "storage"

app = FastAPI(title="WebEdit")
api = FastAPI(title="WebEdit API")

manager = ConnectionManager()
adapter = Adapter(manager, storage_dir)
adapter.init()


@api.get("/files")
def get_files():
    files = list_files(storage_dir)
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


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            try:
                msg = await websocket.receive_json()
                await manager.handle_message(msg, websocket)
            except JSONDecodeError as e:
                print("Error parsing ws json message: {}".format(e))
    except WebSocketDisconnect:
        manager.disconnect(websocket)


app.mount('/api', api)
app.mount('/', StaticFiles(directory="static", html=True), name="static")
