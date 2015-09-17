import os
import json

results = {}

os.system('gcc -g -o ssi_bov2asc libfdr/fields.c ssi_bov2asc.c')
os.system('./ssi_bov2asc matrix > sim.asc')
sim_data = map(str.strip, open('sim.asc').readlines())

species_list = map(str.strip, open('species_list').readlines())

for sim_row, sp_name in zip(sim_data[2:], species_list):
    results[sp_name] = {}
    sims = map(int, sim_row.split())
    for sim, sp in zip(sims, species_list):
        results[sp_name][sp] = sim

print json.dumps(results)
