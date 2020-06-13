import sys
import subprocess
import os
import re
import csv

spring_flowers = [
    "Amelanchier_arborea",
    "Amelanchier_laevis",
    "Anemone_acutiloba",
    "Antennaria_neglecta",
    "Antennaria_plantaginifolia",
    "Antennaria_solitaria",
    "Arabidopsis_thaliana",
    "Arisaema_quinatum",
    "Aronia_arbutifolia",
    "Aronia_melanocarpa",
    "Barbarea_verna",
    "Barbarea_vulgaris",
    "Cardamine_pensylvanica",
    "Carex_nigromarginata",
    "Claytonia_caroliniana",
    "Delphinium_tricorne",
    "Epigaea_repens",
    "Euphorbia_commutata",
    "Geum_donianum",
    "Halesia_tetraptera",
    "Narcissus_poeticus",
    "Nuttallanthus_canadensis",
    "Obolaria_virginica",
    "Ornithogalum_umbellatum",
    "Phacelia_fimbriata",
    "Potentilla_indica",
    "Potentilla_simplex",
    "Rhododendron_periclymenoides",
    "Rumex_hastatulus",
    "Salix_humilis",
    "Stellaria_media",
    "Thlaspi_arvense",
    "Trillium_catesbaei",
    "Tussilago_farfara",
    "Uvularia_sessilifolia",
    "Vaccinium_pallidum",
    "Veronica_hederifolia",
    "Viburnum_dentatum",
    "Viola_bicolor",
    "Viola_hastata",
    "Viola_hirsutula",
    "Viola_labradorica",
    "Viola_primulifolia",
    "Viola_pubescens",
    "Viola_tripartita",
    "Viola_walteri"
]


def generate_groups():
    file_dir = 'ATBI_files'
    onlyfiles = [f for f in os.listdir(
        file_dir) if os.path.isfile(os.path.join(file_dir, f))]
    goodspecies = [f.replace('.csv', '') for f in onlyfiles if f.replace(
        '.csv', '') in spring_flowers]
    grpname = 'grp_spring_flowers'
    grpfile = open('{}/{}.csv'.format(file_dir, grpname), 'w')
    print('genus_speciesmaxent,genus_speciesirma,grsm_speciesid,commonname,taxagroup,subjectcategory,lon,lat', file=grpfile)
    recordcount = 0
    for specie in goodspecies:
        specie_file = '{}/{}.csv'.format(file_dir, specie)
        with open(specie_file, 'r') as file_contents:
            i = 0
            for line in file_contents:
                if i == 0:
                    i += 1
                    continue
                linecontents = line.rstrip().split(',')
                lon = linecontents[1]
                lat = linecontents[2]
                print('{},{},{}'.format(grpname, lon, lat), file=grpfile)
                i += 1
                recordcount += 1
            # 1756 <- this is the id of Amelanchier_arborea taken from ATBI_counts.txt
    subprocess.call(['sed', '-i', '$ a\\{},{},{}'.format(grpname, recordcount, 1756), 'ATBI_counts.txt'])
    subprocess.call(['sed', '-i', '$ a\\{} {}'.format(grpname, 1756), 'ATBI_ids.txt'])


if __name__ == "__main__":
    generate_groups()
