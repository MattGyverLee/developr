
# Python 3.7
import csv
o = open("./Cypher.txt", "w")
with open('./Trans2.tsv') as tsvfile:
    reader = csv.DictReader(tsvfile, dialect='excel-tab')
    currentCat = ""
    currentGrp = ""
    currentPlanRoot = "2"
    currentplanId = "2"
    catIndex = 0
    tcIndex = 0
    cmpIndex = 0
    grpIndex = 0
    snIndex = 0
    # Return pr, ms, d, cat1, grp1, cmp1, cmp2
    o.write('q.push(cypher`\n')
    o.write('\tMATCH (pr:ProgressRoot {userId: "1"})\n')
    o.write('\tMERGE (d:Domain {id: "'+currentplanId+'"})\n')
    o.write('\tSET d.label = "Translation (Orlando)"\n')
    o.write(
        '\tMERGE (d)-[:IS_PRIMARY_DOMAIN_OF]->(p:PlanRoot {id: "'+currentPlanRoot+'"})-[:HAS_PRIMARY_DOMAIN]->(d)\n')
    o.write('\tSET p.label = "Translation (Orlando) Plan",\n')
    o.write('\t\tp.plan_class = "Generic"\n')
    o.write(
        '\tMERGE (ms:Milestone {ms: "TransCons1"})<-[:HAS_MILESTONE]-(p)\n')
    o.write(
        '\tMERGE (ms)-[:HAS_SHORT_NAME]->(:ShortName {label: "Translation Consultant (1)"}) \n')
    o.write(
        '\tMERGE (ms2:Milestone {ms: "Translator"})<-[:HAS_MILESTONE]-(p)\n')
    o.write(
        '\tMERGE (ms2)-[:HAS_SHORT_NAME]->(:ShortName {label: "Translator (1)"}) \n')
    o.write('\n')

    for row in reader:
        if row['Type'] == 'Cat':
            currentCat = row['ID']
            catIndex = catIndex + 1
            if catIndex != 1:
                o.write('\tRETURN cat' + str(catIndex-1)+"\n")
                o.write('`)\n')
                o.write('\n')
                o.write('\n')
                o.write('q.push(cypher`\n')
                o.write('\tMATCH (p:PlanRoot {id: "'+currentplanId+'"})\n')
                o.write('\tMATCH (d:Domain {id: "'+currentplanId+'"})\n')
                o.write('\tMATCH (pr:ProgressRoot {userId: "1"})\n')
                o.write('\tMATCH (ms:Milestone {ms: "TransCons1"})\n')
                o.write('\tMATCH (ms2:Milestone {ms: "Translator"})\n')
                o.write('\n')
            o.write("\t//Cat" + row['ID']+" in "+currentPlanRoot+"\n")
            o.write("\tMERGE (p)-[:HAS_CATEGORY {order: " + row['Order'] + ', planId: "' + currentplanId + '"}]->(cat' + str(catIndex) +
                    ':CompetencyCategory {id: "' + currentCat+'"})-[:IS_CATEGORY_OF {order: ' + row['Order'] + ', planId: "' + currentplanId + '"}]->(p)\n')
            if row['Competency']:
                o.write('\tSET cat' + str(catIndex) +
                        '.label = "' + row['Competency']+'",\n')
                o.write('\t\tcat' + str(catIndex) +
                        '.color = "' + row['Color']+'"\n')
                snIndex = snIndex + 1
                o.write("\tMERGE (cat" + str(catIndex) + ")-[:HAS_SHORT_NAME]->(sn" + str(snIndex) +
                        ':ShortName {id : "sn' + str(snIndex) +
                        '"})\n')
                o.write("\tSET sn" + str(snIndex) +
                        '.label = "' + row['Competency']+'"\n')
            if row['Description']:
                tcIndex = tcIndex + 1
                o.write("\tMERGE (cat" + str(catIndex) + ")-[:HAS_TARGET_COMPETENCY]->(tc" + str(tcIndex) +
                        ':TargetCompetency {id : "tc' + str(tcIndex) +
                        '"})\n')
                o.write("\tSET tc" + str(tcIndex) +
                        '.label = "' + row['Description']+'"\n')
            o.write('\n')
        if row["Type"] == "Grp":
            currentGrp = row['ID']

            grpIndex = grpIndex + 1

            o.write("\t//Grp" + "\t"+row['ID']+" in "+currentCat+"\n")
            o.write("\tMERGE (cat" + str(catIndex) + ")-[:HAS_GROUP {order: " + row['Order'] + ', planId: "' + currentplanId + '"}]->(grp' + str(grpIndex) +
                    ':CompetencyGroup {id: "' + row['ID']+'"})-[:IS_IN_GROUP {order: ' + row['Order'] + ', planId: "' + currentplanId + '"}]->(cat' + str(catIndex) + ")\n")
            if row['Competency']:
                o.write("\tSET grp" + str(grpIndex) +
                        '.label = "' + row['Competency']+'"\n')
                snIndex = snIndex + 1
                o.write("\tMERGE (grp" + str(grpIndex) + ")-[:HAS_SHORT_NAME]->(sn" + str(snIndex) +
                        ':ShortName {id : "sn' + str(snIndex) +
                        '"})\n')
                o.write("\tSET sn" + str(snIndex) +
                        '.label = "' + row['Competency']+'"\n')
            if row['Description']:
                tcIndex = tcIndex + 1
                o.write("\tMERGE (grp" + str(grpIndex) + ")-[:HAS_TARGET_COMPETENCY]->(tc" + str(tcIndex) +
                        ':TargetCompetency {id : "tc' + str(tcIndex) +
                        '"})\n')
                o.write("\tSET tc" + str(tcIndex) +
                        '.label = "' + row['Description']+'"\n')
            o.write('\n')
        if row["Type"] == "Cmp":
            cmpIndex = cmpIndex + 1
            o.write("\t//Comp" + "\t\t" +
                    row['ID']+str(cmpIndex)+" in "+currentGrp+"\n")

            o.write("\tMERGE (grp" + str(grpIndex) + ")-[:GROUP_HAS_COMPETENCIES_OF {order: " + row['Order'] + ', planId: "' + currentplanId + '"}]->(cmp' + str(cmpIndex) +
                    ':Competency {id: "' + row['ID']+str(cmpIndex)+'"})-[:IS_IN_GROUP {order: ' + row['Order'] + ', planId: "' + currentplanId + '"}]->(grp' + str(grpIndex) + ")\n")
            if row['Competency']:
                o.write("\tSET cmp" + str(cmpIndex) +
                        '.label = "' + row['Competency']+'",\n')
                o.write("\t\tcmp" + str(cmpIndex) +
                        '.default_weight = 1.0\n')
                snIndex = snIndex + 1
                o.write("\tMERGE (cmp" + str(cmpIndex) + ")-[:HAS_SHORT_NAME]->(sn" + str(snIndex) +
                        ':ShortName {id : "sn' + str(snIndex) +
                        '"})\n')
                o.write("\tSET sn" + str(snIndex) +
                        '.label = "' + row['Competency']+'"\n')
                o.write("\tMERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp" + str(cmpIndex) +
                        ")-[:HAS_PRIMARY_DOMAIN]->(d)\n")
            if row['Description']:
                tcIndex = tcIndex + 1
                o.write("\tMERGE (cmp" + str(cmpIndex) + ")-[:HAS_TARGET_COMPETENCY]->(tc" + str(tcIndex) +
                        ':TargetCompetency {id : "tc' + str(tcIndex) +
                        '"})\n')
                o.write("\tSET tc" + str(tcIndex) +
                        '.label = "' + row['Description']+'"\n')
            o.write('\tMerge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "' +
                    row['ID']+str(cmpIndex)+'"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp' + str(cmpIndex) + ')\n')
            o.write('\tMerge (cmp' + str(cmpIndex) +
                    ')-[:TARGET_VALUE_IS {planId: "2", min: ' + row['Cons1 min']+'}]->(ms)\n')
            o.write('\tMerge (cmp' + str(cmpIndex) +
                    ')-[:TARGET_VALUE_IS {planId: "2", min: ' + row['Trans Min']+'}]->(ms2)\n')
            o.write('\n')
o.write('\tRETURN cat' + str(catIndex)+"\n")
o.write('`)\n')
o.close()
