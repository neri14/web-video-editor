from webedit.connection_manager import ConnectionManager

from watchfiles import awatch

import asyncio
from webedit.filesystem import list_files

from webedit.events.file_list_event import FileListEvent


class Adapter:
    def __init__(self, connector: ConnectionManager, storage_dir: str):
        self.connector = connector
        self.storage_dir = storage_dir


    def init(self):
        asyncio.Task(self.watch_dir_task(self.storage_dir))


    async def watch_dir_task(self, dir):
        async for changes in awatch(dir, step=1000):
            print(changes)
            await self.connector.broadcast(FileListEvent(list_files(dir)))
