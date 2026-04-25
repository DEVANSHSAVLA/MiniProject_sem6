import time
import threading
import json
from collections import deque

class EventBus:
    """
    A simple thread-safe Event Bus mimicking a message queue like Kafka/RabbitMQ.
    Used for asynchronous SOC telemetry, fraud alerts, and auditing.
    """
    def __init__(self, max_history=100):
        self.subscribers = []
        self.history = deque(maxlen=max_history)
        self._lock = threading.Lock()

    def publish(self, topic, payload):
        event = {
            "topic": topic,
            "timestamp": time.time(),
            "payload": payload
        }
        with self._lock:
            self.history.append(event)
            for subscriber in self.subscribers:
                subscriber(event)
        
        # Log to terminal-style output simulation
        print(f"[EVENT-BUS][{topic.upper()}] {json.dumps(payload)}")

    def subscribe(self, callback):
        with self._lock:
            self.subscribers.append(callback)

    def get_history(self, count=20):
        with self._lock:
            return list(self.history)[-count:]

# Global event bus instance
bus = EventBus()
