import json

f = open('environment.txt', 'r')

speciesList = {}
similarities = {}
lines = f.readlines()
for line in lines:
    species, env = list(map(str.strip, line.split(':')))
    env = env.split(',')
    speciesList[species] = env

for species in speciesList:
    similarities[species] = {}
    for compSpecies in speciesList:
        summation = 0.0
        for i in range(len(speciesList[species])):
            summation += abs(float(speciesList[species][i]) - float(speciesList[compSpecies][i]))

        similarities[species][compSpecies] = '{:.4f}'.format(summation)

print(json.dumps(similarities))
