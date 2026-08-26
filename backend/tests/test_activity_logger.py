import unittest
import tempfile
import os
from core.activity_logger import ActivityLogger

class TestActivityLogger(unittest.TestCase):
    def setUp(self):
        self.fd, self.temp_db = tempfile.mkstemp(suffix='.db')
        self.logger = ActivityLogger(db_path=self.temp_db)

    def tearDown(self):
        os.close(self.fd)
        os.unlink(self.temp_db)

    def test_log_event_and_verify(self):
        # Log a few test events
        self.logger.log_event("test_module", "TEST_EVENT_1", "INFO", {"key": "value1"})
        self.logger.log_event("test_module", "TEST_EVENT_2", "WARNING", {"key": "value2"})
        self.logger.log_event("test_module", "TEST_EVENT_3", "CRITICAL", {"key": "value3"})

        # Retrieve recent events
        recent = self.logger.get_recent(10)
        self.assertEqual(len(recent), 3)
        
        # Verify hash chain integrity
        self.assertTrue(self.logger.verify_integrity())

if __name__ == "__main__":
    unittest.main()
