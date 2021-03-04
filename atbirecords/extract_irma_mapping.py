import json

irma_mapping = file.read(file("irma_mapping.json"))
species_id_dict = json.loads(irma_mapping)
for species in sorted(species_id_dict):
    print(species + " " + species_id_dict[species])
