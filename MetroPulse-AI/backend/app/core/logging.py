"""Structured Logging configuration for MetroPulse AI Backend.
Sanitizes sensitive information (keys, passwords) and provides consistent log formats.
"""

import logging
import re
import sys
from typing import Any


SENSITIVE_PATTERNS = [
    (re.compile(r"(?i)(key|token|password|secret|authorization)=['\"]?[^'\"\s]+['\"]?"), r"\1=[REDACTED]"),
    (re.compile(r"Bearer\s+[\w\-\.]+"), "Bearer [REDACTED]"),
    (re.compile(r"eyJ[\w\-\.]+\.[\w\-\.]+\.[\w\-\.]+"), "[REDACTED_JWT]"),
]


class SanitizingFormatter(logging.Formatter):
    """Custom formatter that strips credentials and tokens from log messages."""

    def format(self, record: logging.LogRecord) -> str:
        original = super().format(record)
        sanitized = original
        for pattern, repl in SENSITIVE_PATTERNS:
            try:
                sanitized = pattern.sub(repl, sanitized)
            except Exception:
                pass
        return sanitized


def setup_logging(debug: bool = False) -> logging.Logger:
    level = logging.DEBUG if debug else logging.INFO

    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Remove existing handlers to avoid duplicates
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)

    format_str = "%(asctime)s | %(levelname)-7s | %(name)s:%(funcName)s:%(lineno)d - %(message)s"
    formatter = SanitizingFormatter(format_str, datefmt="%Y-%m-%d %H:%M:%S")
    console_handler.setFormatter(formatter)

    root_logger.addHandler(console_handler)

    # Silence chatty third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("ultralytics").setLevel(logging.WARNING)

    logger = logging.getLogger("metropulse")
    logger.setLevel(level)
    return logger


logger = setup_logging()
