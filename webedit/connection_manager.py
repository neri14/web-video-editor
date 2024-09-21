from fastapi import WebSocket
from webedit.events.event import Event

class ConnectionManager:
    def __init__(self):
        self.connections: list[WebSocket] = []


    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.connections.append(websocket)


    def disconnect(self, websocket: WebSocket):
        self.connections.remove(websocket)


    async def handle_message(self, msg, websocket: WebSocket):
        pass #no client->server communication for now
        #await self.broadcast(msg)


    async def broadcast(self, event: Event):
        for conn in self.connections:
            await conn.send_json(event.get())
