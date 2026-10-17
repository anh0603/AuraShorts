"""
Background Music (BGM) provisioner and audio utilities.
Ensures high quality ambient cinematic BGM asset is automatically available on disk.
"""

from pathlib import Path
import subprocess


def ensure_bgm_cinematic(target_path: Path) -> Path:
    """
    Guarantees that a high-quality ambient cinematic BGM file exists at target_path.
    If missing, automatically synthesizes a 120s 192kbps Stereo 44.1kHz track via FFmpeg.
    """
    target_path = Path(target_path)
    if target_path.exists() and target_path.stat().st_size > 10000:
        return target_path

    target_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "anoisesrc=d=120:c=pink:r=44100:a=0.015",
        "-f", "lavfi", "-i", "sine=frequency=220:duration=120",
        "-f", "lavfi", "-i", "sine=frequency=330:duration=120",
        "-f", "lavfi", "-i", "sine=frequency=440:duration=120",
        "-filter_complex",
        "[1:a]volume=0.03,afade=t=in:ss=0:d=3,afade=t=out:st=117:d=3[s1];"
        "[2:a]volume=0.02,afade=t=in:ss=0:d=4,afade=t=out:st=116:d=4[s2];"
        "[3:a]volume=0.015,afade=t=in:ss=0:d=5,afade=t=out:st=115:d=5[s3];"
        "[0:a][s1][s2][s3]amix=inputs=4:duration=first,lowpass=f=1200,volume=1.2,aformat=channel_layouts=stereo:sample_rates=44100[aout]",
        "-map", "[aout]",
        "-c:a", "libmp3lame", "-b:a", "192k",
        str(target_path)
    ]
    subprocess.run(cmd, capture_output=True)
    return target_path
