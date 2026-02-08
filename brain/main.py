"""
SHYRA Brain - Main Entry Point
Run this to start the brain server.
"""

import uvicorn
import logging
import sys
import os

# add parent dir to path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from brain.api import app
from brain.config import config, load_config_from_env

# set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """Start the brain server."""
    # load any env overrides
    load_config_from_env()
    
    logger.info(f"starting SHYRA brain v{config.version}")
    logger.info(f"llm provider: {config.llm.provider}")
    logger.info(f"api running on http://{config.api.host}:{config.api.port}")
    
    # create data directory if needed
    os.makedirs("data", exist_ok=True)
    
    # run the server
    uvicorn.run(
        "brain.api:app",
        host=config.api.host,
        port=config.api.port,
        reload=config.api.debug,
        log_level="info"
    )


if __name__ == "__main__":
    main()
