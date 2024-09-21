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


    def join_videos(self, videos):
        #TODO join_videos(self, videos):
        pass
        # use ffprobe to read durations of input videos and sum to total_length of output_file
        # open udp port for receiving progress with params: total_length output_file
        # create a clip list txt file for ffmpeg
        # spawn ffmpeg process (with clip list txt and progress to udp://localhost:port)


    def trim_video(self, video, trim_begin, trim_end):
        #TODO trim_video(self, video, trim_begin, trim_end):
        pass
        #handling like above


    def generate(self, video, telemetry, otherparams):
        #TODO generate(self, video, telemetry, otherparams):
        pass
        #similar to above, requires videographer to implement similar progress flag to ffmpeg


    def progress_observer(self, output_file, total_length):
        #TODO progress_observer(self, output_file, total_length):
        pass
        # create progress observer
        # return port number to be used for ffmpeg
        # use self.connector.broadcast to send out event with output_file and 100*processed_length/total_length as progress
        #   so that frontend can update progress bar


    async def watch_dir_task(self, dir):
        async for changes in awatch(dir, step=1000):
            print(changes)
            await self.connector.broadcast(FileListEvent(list_files(dir)))
