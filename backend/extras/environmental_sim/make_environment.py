import csv
import sys

species = sys.argv[1]
f = open('/home/john/environment/maxent_results/' + species + '/maxentResults.csv', 'rb')
reader = csv.reader(f)

envSum = []
reader.next()
for row in reader:
    if envSum == []:
        envSum = map(float, row[11:43])
    else:
        for i in range(len(row[11:43])):
            envSum[i] += float(row[11+i])

for i in range(len(envSum)):
    envSum[i] /= 10
    envSum[i] = '{:.4f}'.format(envSum[i])

print species + ': ' + ','.join(envSum)

f.close()
