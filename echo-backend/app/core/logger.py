import sys
import json
from loguru import logger
from app.core.config import settings

# Add a flag to ensure logger is only setup once
_is_setup = False

def serialize(record):
    subset = {
        "timestamp": record["time"].isoformat(),
        "level": record["level"].name,
        "message": record["message"],
        "module": record["name"],
        "function": record["function"],
        "line": record["line"],
        "extra": record["extra"],
    }
    if record["exception"]:
        subset["exception"] = record["exception"]
    return json.dumps(subset)

def setup_logging():
    global _is_setup
    if _is_setup:
        return logger
        
    # Remove default handler
    logger.remove()
    
    # Standard format for logs (Console)
    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>"
    )
    
    # console handler
    logger.add(
        sys.stdout,
        format=log_format,
        level="DEBUG" if settings.DEBUG else "INFO",
        colorize=True,
        enqueue=True
    )
    
    # JSON file handler for production
    if not settings.DEBUG:
        logger.add(
            "logs/app.json.log",
            rotation="10 MB",
            retention="7 days",
            format="{extra[serialized]}",
            level="INFO",
            enqueue=True
        )
        # Middleware to inject serialized log
        logger.configure(patcher=lambda record: record["extra"].update(serialized=serialize(record)))
    
    _is_setup = True
    return logger

# Export a configured logger instance
logger = setup_logging()
