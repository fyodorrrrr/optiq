"""Download the source Lab 5 LFW subset into the project's ignored dataset cache."""
from pathlib import Path
from sklearn.datasets import fetch_lfw_people

if __name__ == '__main__':
    destination = Path(__file__).resolve().parents[1] / '.cache' / 'lfw'
    data = fetch_lfw_people(data_home=str(destination), min_faces_per_person=70, resize=.4)
    print(f'LFW ready: {data.images.shape}, {len(data.target_names)} identities; cache: {destination}')
