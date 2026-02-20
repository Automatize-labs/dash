from typing import Callable, Dict, Any, Optional
from functools import wraps

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, Callable] = {}

    def register(self, name: str, description: str):
        def decorator(func: Callable):
            @wraps(func)
            def wrapper(*args, **kwargs):
                return func(*args, **kwargs)
            
            wrapper.tool_name = name
            wrapper.tool_description = description
            self._tools[name] = wrapper
            return wrapper
        return decorator

    def get_tool(self, name: str) -> Optional[Callable]:
        return self._tools.get(name)

    def list_tools(self) -> Dict[str, str]:
        return {name: func.tool_description for name, func in self._tools.items()}

# Global registry instance
registry = ToolRegistry()
