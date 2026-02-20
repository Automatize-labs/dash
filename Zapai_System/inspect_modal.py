
import modal
import inspect

try:
    from modal.mount import Mount
    print(f"Mount class found in modal.mount: {Mount}")
    print("Methods in Mount:")
    for name, _ in inspect.getmembers(Mount):
        if not name.startswith("_"):
            print(f" - {name}")
except ImportError:
    print("Could not import modal.mount.Mount")

print("\n--- modal.Image attributes ---")
img = modal.Image.debian_slim()
for name, _ in inspect.getmembers(img):
    if "local" in name or "mount" in name or "copy" in name:
        print(f" - {name}")
