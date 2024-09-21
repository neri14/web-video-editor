import asyncio
import time

# hh:mm:ss.ssssss -> seconds
def parse_time(str):
    h,m,s = str.split(':')
    return int(h)*3600 + int(m)*60 + float(s)



class ProgressProtocol:
    def __init__(self, progress_cb, finished_cb):
        self.progress_cb = progress_cb
        self.finished_cb = finished_cb

    def connection_made(self, transport):
        self.transport = transport

    def datagram_received(self, data, addr):
        msg = data.decode()
        for line in msg.splitlines():
            x = ""
            if (line.startswith("out_time") or line.startswith("progress")):
                s = line.split("=", 2)
                if len(s) == 2:
                    if s[0] == "out_time":
                        self.progress_cb(parse_time(s[1]))
                    elif s[0] == "progress" and s[1] == "end":
                        self.finished_cb()


def progress_cb(seconds):
    print("Progress: {}".format(seconds))


def finished_cb():
    print("FINISHED")


class ProgressListener:
    def __init__(self):
        self.transport = None
        self.port = None


    def __del__(self):
        self.stop()


    async def listen(self):
        print("Starting UDP server")

        loop = asyncio.get_running_loop()
        self.transport,protocol = await loop.create_datagram_endpoint(
            lambda: ProgressProtocol(progress_cb, finished_cb),
            local_addr=('127.0.0.1', 0))

        sock = self.transport.get_extra_info('socket')
        if sock is not None:
            self.port = sock.getsockname()[1]
            print("Listening on port {}".format(self.port))

    def stop(self):
        self.transport.close()




async def main():
    listener = ProgressListener()
    await listener.listen()

    try:
        await asyncio.sleep(3600)  # Serve for 1 hour.
    finally:
        listener.stop()

asyncio.run(main())
