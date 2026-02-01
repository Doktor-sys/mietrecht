from locust import HttpUser, task, between
import random

class SmartLawUser(HttpUser):
    wait_time = between(1, 5)
    token = None
    user_id = None

    def on_start(self):
        """Register and login on start"""
        email = f"loadtest_{random.randint(1000, 99999)}@example.com"
        password = "password123"
        
        # Register
        self.client.post("/api/auth/register", json={
            "email": email,
            "password": password,
            "userType": "tenant"
        })

        # Login
        response = self.client.post("/api/auth/login", json={
            "email": email,
            "password": password
        })
        
        if response.status_code == 200:
            self.token = response.json()["token"]
            self.user_id = response.json()["user"]["id"]

    @task(3)
    def view_profile(self):
        if self.token:
            self.client.get("/api/users/profile", headers={
                "Authorization": f"Bearer {self.token}"
            })

    @task(2)
    def search_lawyers(self):
        if self.token:
            self.client.get("/api/lawyers?query=Mietrecht", headers={
                "Authorization": f"Bearer {self.token}"
            })

    @task(1)
    def check_notifications(self):
        if self.token:
            self.client.get("/api/notifications", headers={
                "Authorization": f"Bearer {self.token}"
            })


    @task(1)
    def chat_interaction(self):
        if self.token:
            # Simulate sending a message
            self.client.post("/api/chat/messages", json={
                "content": "Ich habe eine Frage zu meiner Miete."
            }, headers={
                "Authorization": f"Bearer {self.token}"
            })

# SLA Verification
from locust import events
import logging

logger = logging.getLogger(__name__)

@events.quitting.add_listener
def _(environment, **kw):
    if environment.stats.total.fail_ratio > 0.001:
        logging.error("Test failed: Failure ratio > 0.1%")
        environment.process_exit_code = 1
    elif environment.stats.total.get_response_time_percentile(0.95) > 500:
        logging.error("Test failed: 95th percentile response time > 500 ms")
        environment.process_exit_code = 1
    else:
        logging.info("SLA Checks Passed: Failure ratio < 0.1% and p95 latency < 500ms")
