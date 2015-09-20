# Relationship between U'Rich and QGRS motifs in the Polyadenylation Complex
# Project goals

1. Build a database of all human polyA sites along with QGRS and U'Rich motifs within 200 bases downstream of the site.  PolyA sites will be organized by gene, not by mRNA - since a given polyA site might be affiliated with multiple mRNA (alternative splicing).
  - For each QGRS and U'Rich motif, the associated mRNA (s) will be listed - along with its conservation (mouse) using the predictor algorithms for QGRS and Ming's U'Rich calculation for U'Rich.  
  - Ontology data for the associated genese will also be stored in this database, for convenience and display purposes.  Future work may use this as well for clustering (out of scope for this current project though)
  - The data will be filterable by U'Rich properties (conservation. strength, distance from PolyA), QGRS properties (conservation, GScore, tetrad)
2. We will present through an interactive graph the relationship between strength of U'Rich and strength fo QGRS, based on filtering parameters
3. We will present through an interactive graph the distribution of highly conserved QGRS, and the distribution of highly conserved U'Rich

## Support Pre-Requisites
- Given chromosome position, find all genese and mRNA that contain it:
  - if gene:  return position relative to start of gene
  - if mRNA:
      - if exon data, {position (relative to start), region}
      - if intron, simply return intron

- ~~Given an mRNA position:~~
  - ~~Return chromosome position~~

- Given a gene position:
  - Return chromosome position

##Strategy
1. Create a PolyA array in the gene collection for each gene.  Use the same ID for polyA as in the BED file for unique identification purposes
2. During mRNA motif identifcation (g4 and urich seeding scripts), if motifs are within 200nt downstream of a polyA site, then attach an array to the motif.  Each element in the array identifies a unique PolyY 
**note, this means all the g4 and urich seeding scripts have polyA sites as a dependency**
3. For each PolyA, find all QGRS and U'Rich sequences downstream by looking at each mRNA corresponding to the gene. 
For each motif, record the mRNA accession number, the region it is found within the mRNA, and the nt distance from the polyA (locus distance)
Also record conservation (QGRS and U'Rich from Ming's work).

4. Compile this in to an Extended 3'UTR Database
   - Filter by U'Rich conservation (specific comparison species, any comparison species)
   - Filter by U'Rich strength
   - Filter by U'Rich location
   - Filter by GScore
   - Filter by QGRS-H
   - Filter by tetrad

## Notes 
   - the "Downstream" notation for region is useless now - in the mRNA.  Scripts will need to be altered to only look for QGRS that have polyA entries.
   - the U'Rich seed script needs to use the polyA array in gene to determine which sequence slices to analyze, not simply 200 bp downstream of end of mRNA.