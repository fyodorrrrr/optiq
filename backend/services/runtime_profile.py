"""Immutable process-start limits; full local behavior remains the default."""
from dataclasses import dataclass
import os


@dataclass(frozen=True)
class RuntimeProfile:
    name: str
    max_side: int
    max_pixels: int

    @property
    def render_free(self):
        return self.name == 'render-free'


def configured_profile():
    name = os.environ.get('OPTIQ_PROFILE', 'full')
    if name == 'full':
        return RuntimeProfile(name, 4096, 4_000_000)
    if name == 'render-free':
        return RuntimeProfile(name, 1024, 350_000)
    raise ValueError('OPTIQ_PROFILE must be full or render-free.')


PROFILE = configured_profile()
