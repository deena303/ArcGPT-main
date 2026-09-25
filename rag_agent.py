import json
import os
import sys
import urllib.error
import urllib.request

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
MODEL_NAME = os.environ.get("OLLAMA_MODEL", "qwen2.5-coder-7b-instruct")


def query_ollama(prompt: str) -> str:
    payload = {
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "options": {"temperature": 0.1},
    }
    request = urllib.request.Request(
        f"{OLLAMA_URL}/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data["message"]["content"]
    except (urllib.error.URLError, KeyError, TimeoutError) as error:
        return f"Local Ollama request failed: {error}"


def main() -> None:
    if "--health" in sys.argv:
        try:
            with urllib.request.urlopen(f"{OLLAMA_URL}/api/tags", timeout=3) as response:
                data = json.loads(response.read().decode("utf-8"))
                models = [item.get("name", "") for item in data.get("models", [])]
                print(json.dumps({"ollama": MODEL_NAME in models, "model": MODEL_NAME}))
                return
        except (urllib.error.URLError, TimeoutError):
            print(json.dumps({"ollama": False, "model": MODEL_NAME}))
            return
    print(query_ollama("Return only the word ready."))


if __name__ == "__main__":
    main()
