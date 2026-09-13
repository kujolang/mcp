"""Generate the approved non-commercial ElevenLabs narration.

Credentials are read from ELEVENLABS_API_KEY or the existing macOS Keychain
entry kujo-videoops-elevenlabs/videoops. The credential is never persisted.
"""

from __future__ import annotations

import base64
import hashlib
import json
import os
from pathlib import Path
import subprocess
import urllib.request


ROOT = Path(__file__).resolve().parent.parent
VOICE_ID = "nPczCjzI2devNBz1zQrb"
VOICE_NAME = "Brian - Deep, Resonant and Comforting"
MODEL_ID = "eleven_multilingual_v2"
OUTPUT = ROOT / "assets" / "narration-brian.mp3"
NORMALIZED = ROOT / "assets" / "narration-brian-normalized.wav"
RECEIPT = ROOT / "assets" / "narration-brian.json"


def credential() -> str:
    configured = os.environ.get("ELEVENLABS_API_KEY")
    if configured:
        return configured
    return subprocess.check_output(
        [
            "security",
            "find-generic-password",
            "-s",
            "kujo-videoops-elevenlabs",
            "-a",
            "videoops",
            "-w",
        ],
        text=True,
    ).strip()


def request_json(path: str, key: str, payload: dict | None = None) -> dict:
    request = urllib.request.Request(
        "https://api.elevenlabs.io/v1" + path,
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={"xi-api-key": key, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        return json.load(response)


def main() -> None:
    text = (ROOT / "narration.txt").read_text().strip()
    input_hash = hashlib.sha256(text.encode()).hexdigest()
    if OUTPUT.exists() and RECEIPT.exists():
        existing = json.loads(RECEIPT.read_text())
        if existing.get("input_sha256") == input_hash:
            audio = OUTPUT.read_bytes()
            normalize(audio, existing)
            print(f"reused {OUTPUT.name} and refreshed normalized master")
            return

    key = credential()
    subscription = request_json("/user/subscription", key)
    voice = request_json(f"/voices/{VOICE_ID}", key)
    assert subscription.get("tier") == "free", "Expected the approved non-commercial free tier"
    assert voice.get("labels", {}).get("accent") == "american", "Voice must be American"
    assert subscription["character_limit"] - subscription["character_count"] >= len(text)

    payload = {
        "text": text,
        "model_id": MODEL_ID,
        "seed": 20260913,
        "voice_settings": {
            "stability": 0.55,
            "similarity_boost": 0.75,
            "style": 0.08,
            "use_speaker_boost": True,
            "speed": 1.06,
        },
    }
    result = request_json(
        f"/text-to-speech/{VOICE_ID}/with-timestamps?output_format=mp3_44100_128",
        key,
        payload,
    )
    audio = base64.b64decode(result.pop("audio_base64"))
    OUTPUT.write_bytes(audio)
    RECEIPT.write_text(
        json.dumps(
            {
                "provider": "ElevenLabs",
                "voice_id": VOICE_ID,
                "voice_name": VOICE_NAME,
                "voice_labels": voice.get("labels", {}),
                "model_id": MODEL_ID,
                "usage_tier": subscription.get("tier"),
                "input_characters": len(text),
                "input_sha256": input_hash,
                "audio_sha256": hashlib.sha256(audio).hexdigest(),
                "request": payload,
                "alignment": result.get("alignment"),
            },
            indent=2,
        )
        + "\n"
    )
    normalize(audio, json.loads(RECEIPT.read_text()))
    print(f"generated {OUTPUT.name} with {VOICE_NAME} ({len(text)} characters)")


def normalize(audio: bytes, receipt: dict) -> None:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(OUTPUT),
            "-af",
            "loudnorm=I=-16:TP=-1.5:LRA=7",
            "-ar",
            "48000",
            "-ac",
            "1",
            str(NORMALIZED),
        ],
        check=True,
    )
    receipt["normalized_audio_sha256"] = hashlib.sha256(NORMALIZED.read_bytes()).hexdigest()
    receipt["normalization"] = {"integrated_lufs": -16, "true_peak_dbfs": -1.5, "lra": 7}
    RECEIPT.write_text(json.dumps(receipt, indent=2) + "\n")


if __name__ == "__main__":
    main()
