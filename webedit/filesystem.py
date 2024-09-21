
import os

def list_files(dir):
    files = []
    for filename in os.listdir(dir):
        path = os.path.join(dir, filename)
        if os.path.isfile(path):
            stat = os.stat(path)
            file = {
                "filename": filename,
                "type": get_type(filename),
                "size": stat.st_size
            }
            files.append(file)
    return files

video_ext = [".mp4", ".mov"]
telemetry_ext = [".fit", ".gpx"]

def get_type(path):
    ext = os.path.splitext(path)[1].lower()

    if ext in video_ext:
        return "video"
    if ext in telemetry_ext:
        return "telemetry"

    return ""
