from webedit.events.event import Event

class FileListEvent(Event):
    def __init__(self, filelist):
        self.filelist = filelist

    def get(self):
        return {
            "event": "FileListEvent",
            "files": self.filelist
        }