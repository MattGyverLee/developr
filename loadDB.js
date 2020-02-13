//https://blog.grandstack.io/inferring-graphql-type-definitions-from-an-existing-neo4j-database-dadca2138b25

const neo4j = require("neo4j-driver");
const inferSchema = require("neo4j-graphql-js").inferSchema;
const dotenv = require("dotenv");

dotenv.config();

/* const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "neo4j"
  )
);

const session = driver.session(); */

var q = [];
var dom = "";
var plan = "";
var comp = "";
var planrt = "";
//Parameters
for (let index = 0; index < 2; index++) {
  switch (index) {
    case 0:
      dom = process.env.LTDOM;
      plan = process.env.LTPLAN;
      comp = process.env.LTCOMP;
      planrt = process.env.LTROOT;
      domain = process.env.LTPREFIX;
      break;

    case 1:
      dom = process.env.GCDOM;
      plan = process.env.GCPLAN;
      comp = process.env.GCCOMP;
      planrt = process.env.GCROOT;
      domain = process.env.GCPREFIX;
  }

  console.log;

  const Cypher = require("cypher-tagged-templates").default;
  const driver = neo4j.driver(process.env.NEO4J_URI || "bolt://localhost:7687", neo4j.auth.basic(process.env.NEO4J_USER || "neo4j", process.env.NEO4J_PASSWORD || "neo4j"));
  const cypher = new Cypher({driver}).query;

  //Domain
  q.push(cypher `
    CALL apoc.load.xml(${dom},'',{},true) YIELD value as DomainDetails
      MERGE (d:Domain {id: DomainDetails.id})
      SET d.label = DomainDetails.label_en,
      d.label_fr	= DomainDetails.label_fr
      RETURN count(d), ${domain}
      `);

  //Competency List
  q.push(cypher `
    CALL apoc.load.xml(${comp},'//CompetencyDetails/Competency',{},true) YIELD value as Competency
      MERGE (c:Competency {id: Competency.id}) 
      SET c.smartsheet_id = Competency.SSId,
      c.label = Competency.label, 
      c.default_weight = Competency.defaultWeight 
      MERGE (d2:Domain {id: Competency.domainId }) 
      MERGE (c)-[:HAS_PRIMARY_DOMAIN]->(d2)`);

  //Target Competency
  q.push(cypher `
    CALL apoc.load.xml(${comp},'//targetComp',{},true) YIELD value as TargetCompetency 
      MERGE (t1:TargetCompetency {id: TargetCompetency.id }) 
      SET t1.label = TargetCompetency.label_en, 
      t1.label_modified = TargetCompetency.label_en_modified, 
      t1.label_created = TargetCompetency.label_en_created, 
      t1.label_fr = TargetCompetency.label_fr, 
      t1.label_fr_modified = TargetCompetency.label_fr_modified, 
      t1.label_fr_created = TargetCompetency.label_fr_created, 
      t1.label_label_es = TargetCompetency.label_es, 
      t1.label_es_modified = TargetCompetency.label_es_modified, 
      t1.label_es_created = TargetCompetency.label_es_created
      RETURN count(t1), ${domain}
  `);

  //TargetComp Relations
  q.push(cypher `
    CALL apoc.load.xml(${comp},'//targetComp',{},true) YIELD value as TargetComp 
      MATCH (c2:Competency {smartsheet_id: TargetComp.parentSSId}), 
      (t2:TargetCompetency {id: TargetComp.id}) 
      MERGE (c2)-[:HAS_TARGET_COMPETENCY]->(t2) 
  `);

  // Assessment Criteria
  q.push(cypher `
    CALL apoc.load.xml(${comp},'//AssessCrit',{},true) YIELD value as AssessmentCriteria 
      MERGE (ac:AssessmentCriteria { id: AssessmentCriteria.id}) 
      SET ac.label = AssessmentCriteria.label_en, 
      ac.label_modified = AssessmentCriteria.label_en_modified, 
      ac.label_created = AssessmentCriteria.label_en_created, 
      ac.label_fr = AssessmentCriteria.label_fr, 
      ac.label_fr_modified = AssessmentCriteria.label_fr_modified, 
      ac.label_fr_created = AssessmentCriteria.label_fr_created, 
      ac.label_label_es = AssessmentCriteria.label_es, 
      ac.label_es_modified = AssessmentCriteria.label_es_modified, 
      ac.label_es_created = AssessmentCriteria.label_es_created 
      RETURN count(ac), ${domain}
  `);

  q.push(cypher `
    CALL apoc.load.xml(${comp},'//AssessCrit',{},true) YIELD value as AssessmentCrit 
      MATCH (c2:Competency {smartsheet_id: AssessmentCrit.parentSSId}), 
      (ac2:AssessmentCriteria {id: AssessmentCrit.id}) 
      MERGE (c2)-[:HAS_ASSESSMENT_CRITERIA]->(ac2) 
  `);

  //Short Name
  q.push(cypher `
    CALL apoc.load.xml(${comp},'//ShortName',{},true) YIELD value as ShortName 
      MERGE (sn:ShortName { id: ShortName.id}) 
      SET sn.label = ShortName.label_en, 
      sn.label_modified = ShortName.label_en_modified, 
      sn.label_created = ShortName.label_en_created, 
      sn.label_fr = ShortName.label_fr, 
      sn.label_fr_modified = ShortName.label_fr_modified, 
      sn.label_fr_created = ShortName.label_fr_created, 
      sn.label_es = ShortName.label_es, 
      sn.label_es_modified = ShortName.label_es_modified, 
      sn.label_es_created = ShortName.label_es_created 
      RETURN count(sn), ${domain}
  `);

  q.push(cypher `
    CALL apoc.load.xml(${comp},'//ShortName',{},true) YIELD value as ShortN 
      MATCH (c2:Competency {smartsheet_id: ShortN.parentSSId}), 
      (sn2:ShortName {id: ShortN.id}) 
      MERGE (c2)-[:HAS_SHORT_NAME]->(sn2) 
  `);

  // L0
  q.push(cypher `
    CALL apoc.load.xml(${comp},'//Lv0Activities',{},true) YIELD value as Lv0Act 
      MERGE (l0:Lv0Activities { id: Lv0Act.id}) 
      SET l0.label = Lv0Act.label_en, 
      l0.label_modified = Lv0Act.label_en_modified, 
      l0.label_created = Lv0Act.label_en_created, 
      l0.label_fr = Lv0Act.label_fr, 
      l0.label_fr_modified = Lv0Act.label_fr_modified, 
      l0.label_fr_created = Lv0Act.label_fr_created, 
      l0.label_es = Lv0Act.label_es, 
      l0.label_es_modified = Lv0Act.label_es_modified, 
      l0.label_es_created = Lv0Act.label_es_created 
      RETURN count(l0), ${domain}
  `);

  q.push(cypher `
    CALL apoc.load.xml(${comp},'//Lv0Activities',{},true) YIELD value as Lv0 
      MATCH (c2:Competency {smartsheet_id: Lv0.parentSSId}), 
      (l02:Lv0Activities {id: Lv0.id}) 
      MERGE (c2)-[:HAS_LV0_ACTIVITIES]->(l02) 
  `);

  // L1
  q.push(cypher `
    CALL apoc.load.xml(${comp},'//Lv1Activities',{},true) YIELD value as Lv1Act
      MERGE (l1:Lv1Activities { id: Lv1Act.id}) 
      SET l1.label = Lv1Act.label_en, 
      l1.label_modified = Lv1Act.label_en_modified, 
      l1.label_created = Lv1Act.label_en_created, 
      l1.label_fr = Lv1Act.label_fr, 
      l1.label_fr_modified = Lv1Act.label_fr_modified, 
      l1.label_fr_created = Lv1Act.label_fr_created, 
      l1.label_es = Lv1Act.label_es, 
      l1.label_es_modified = Lv1Act.label_es_modified, 
      l1.label_es_created = Lv1Act.label_es_created 
      RETURN count(l1), ${domain}
  `);

  q.push(cypher `
    CALL apoc.load.xml(${comp},'//Lv1Activities',{},true) YIELD value as Lv1 
      MATCH (c2:Competency {smartsheet_id: Lv1.parentSSId}), 
      (l12:Lv1Activities {id: Lv1.id}) 
      MERGE (c2)-[:HAS_LV1_ACTIVITIES]->(l12) 
  `);

  // L2
  q.push(cypher `
    CALL apoc.load.xml(${comp},'//Lv2Activities',{},true) YIELD value as Lv2Act 
      MERGE (l2:Lv2Activities { id: Lv2Act.id}) 
      SET l2.label = Lv2Act.label_en, 
      l2.label_modified = Lv2Act.label_en_modified, 
      l2.label_created = Lv2Act.label_en_created, 
      l2.label_fr = Lv2Act.label_fr, 
      l2.label_fr_modified = Lv2Act.label_fr_modified, 
      l2.label_fr_created = Lv2Act.label_fr_created, 
      l2.label_es = Lv2Act.label_es, 
      l2.label_es_modified = Lv2Act.label_es_modified, 
      l2.label_es_created = Lv2Act.label_es_created 
      RETURN count(l2), ${domain}
  `);

  q.push(cypher `
    CALL apoc.load.xml(${comp},'//Lv2Activities',{},true) YIELD value as Lv2 
      MATCH (c2:Competency {smartsheet_id: Lv2.parentSSId}), 
      (l22:Lv2Activities {id: Lv2.id}) 
      MERGE (c2)-[:HAS_LV2_ACTIVITIES]->(l22) 
  `);

  // L3
  q.push(cypher `
    CALL apoc.load.xml(${comp},'//Lv3Activities',{},true) YIELD value as Lv3Act 
      MERGE (l3:Lv3Activities { id: Lv3Act.id}) 
      SET l3.label = Lv3Act.label_en, 
      l3.label_modified = Lv3Act.label_en_modified, 
      l3.label_created = Lv3Act.label_en_created, 
      l3.label_fr = Lv3Act.label_fr, 
      l3.label_fr_modified = Lv3Act.label_fr_modified, 
      l3.label_fr_created = Lv3Act.label_fr_created, 
      l3.label_es = Lv3Act.label_es, 
      l3.label_es_modified = Lv3Act.label_es_modified, 
      l3.label_es_created = Lv3Act.label_es_created 
      RETURN count(l3), ${domain}
  `);

  q.push(cypher `
    CALL apoc.load.xml(${comp},'//Lv3Activities',{},true) YIELD value as Lv3 
      MATCH (c2:Competency {smartsheet_id: Lv3.parentSSId}), 
      (l32:Lv3Activities {id: Lv3.id}) 
      MERGE (c2)-[:HAS_LV3_ACTIVITIES]->(l32) 
  `);

  // L4
  q.push(cypher `
    CALL apoc.load.xml(${comp},'//Lv4Activities',{},true) YIELD value as Lv4Act 
      MERGE (l4:Lv4Activities { id: Lv4Act.id}) 
      SET l4.label = Lv4Act.label_en, 
      l4.label_modified = Lv4Act.label_en_modified, 
      l4.label_created = Lv4Act.label_en_created, 
      l4.label_fr = Lv4Act.label_fr, 
      l4.label_fr_modified = Lv4Act.label_fr_modified, 
      l4.label_fr_created = Lv4Act.label_fr_created, 
      l4.label_es = Lv4Act.label_es, 
      l4.label_es_modified = Lv4Act.label_es_modified, 
      l4.label_es_created = Lv4Act.label_es_created 
      RETURN count(l4), ${domain}
  `);

  q.push(cypher `
    CALL apoc.load.xml(${comp},'//Lv4Activities',{},true) YIELD value as Lv4 
      MATCH (c2:Competency {smartsheet_id: Lv4.parentSSId}), 
      (l42:Lv4Activities {id: Lv4.id}) 
      MERGE (c2)-[:HAS_LV4_ACTIVITIES]->(l42) 
  `);

  // L5
  q.push(cypher `
    CALL apoc.load.xml(${comp},'//Lv5Activities',{},true) YIELD value as Lv5Act 
      MERGE (l5:Lv5Activities { id: Lv5Act.id}) 
      SET l5.label = Lv5Act.label_en, 
      l5.label_modified = Lv5Act.label_en_modified, 
      l5.label_created = Lv5Act.label_en_created, 
      l5.label_fr = Lv5Act.label_fr, 
      l5.label_fr_modified = Lv5Act.label_fr_modified, 
      l5.label_fr_created = Lv5Act.label_fr_created, 
      l5.label_es = Lv5Act.label_es, 
      l5.label_es_modified = Lv5Act.label_es_modified, 
      l5.label_es_created = Lv5Act.label_es_created 
      RETURN count(l5), ${domain}
  `);

  q.push(cypher `
    CALL apoc.load.xml(${comp},'//Lv5Activities',{},true) YIELD value as Lv5 
      MATCH (c2:Competency {smartsheet_id: Lv5.parentSSId}), 
      (l52:Lv5Activities {id: Lv5.id}) 
      MERGE (c2)-[:HAS_LV5_ACTIVITIES]->(l52) 
  `);

  // Import Plan and Connecting Plan to Domain
  q.push(cypher `
    CALL apoc.load.xml(${plan},'//Plans/PlanProfile',{},true) YIELD value as Plans 
      MERGE (p:Plan {id: Plans.id}) 
      SET p.plan_class = Plans.positionClass, 
      p.label = Plans.label_en, 
      p.label_fr = Plans.label_fr 
      MERGE (d3:Domain {id: Plans.domainId }) 
      MERGE (p)-[:HAS_PRIMARY_DOMAIN]->(d3) 
  `);

  // Creates Competency Groups
  q.push(cypher `
    CALL apoc.load.xml(${plan},'//compGroup',{},true) YIELD value as CompGroup 
      CALL apoc.load.xml(${plan},'//Plans/PlanProfile',{},true) YIELD value as Plans 
      MERGE (p:Plan {id: Plans.id}) 
      MERGE (cg:CompetencyGroup {id: CompGroup.id, smartsheet_id: CompGroup.SSId }) 
      SET cg.smartsheet_id = CompGroup.SSId, 
      cg.parent_id = CompGroup.parentSSId, 
      cg.label = CompGroup.name, 
      cg.level = CompGroup.level 
      RETURN count(cg), ${domain}
      
  `);

  // Links Competency Groups
  q.push(cypher `
   CALL apoc.load.xml(${plan},'//compGroup',{},true) YIELD value as CompGroup 
     CALL apoc.load.xml(${plan},'//Plans/PlanProfile',{},true) YIELD value as Plans 
     MERGE (p:Plan {id: Plans.id}) 
     MERGE (p)-[:HAS_COMPETENCY_LIST { 
     planId: Plans.id
     }]->(g:CompetencyGroup {id: ${planrt}, smartsheet_id: ${planrt}, label: ${planrt}}) 
     SET g.planId = Plans.id 
 `);

  // Link Subgroups to Groups
  q.push(cypher `
    CALL apoc.load.xml(${plan},'//compGroup[@SSId!=""]',{},true) YIELD value as CompGroup 
      CALL apoc.load.xml(${plan},'//Plans/PlanProfile',{},true) YIELD value as Plans 
      Match (cg1:CompetencyGroup {smartsheet_id: CompGroup.SSId }), (cg2:CompetencyGroup {smartsheet_id: CompGroup.parentSSId} ) 
      WHERE NOT (cg1)-[:IN_GROUP]->(cg2)
      MERGE (cg1)-[:IN_GROUP {order: CompGroup.order, planId: Plans.id}]->(cg2) 
      return cg1, cg2
  `);
  //TODO: Make ShortName into Node

  // Links Competencies to Groups
  q.push(cypher `
    CALL apoc.load.xml(${plan},'//Competency[@SSId!=""]',{},true) YIELD value as Compet 
      CALL apoc.load.xml(${plan},'//Plans/PlanProfile',{},true) YIELD value as Plans 
      Match (co {smartsheet_id: Compet.SSId }), (c4:CompetencyGroup {smartsheet_id: Compet.parentSSId} ) 
      WHERE NOT (co)-[:IN_GROUP]->(c4) 
      MERGE (co)-[:IN_GROUP {order: Compet.order, planId: Plans.id}]->(c4) 
      return co, c4
  `);
  var dateobj = new Date();
  var myNow = dateobj.toISOString();
  ///Note, these will run twice, but it should be OK.
  q.push(cypher `
    MATCH (a)-[r]-(b)
    WHERE NOT EXISTS(r.from)
    SET r.from = ${myNow}
`);
}

console.log(q.length);

function doSafeQuery(inQuery, indexy) {
  const Cypher = require("cypher-tagged-templates").default;
  const driver = neo4j.driver(process.env.NEO4J_URI || "bolt://localhost:7687", neo4j.auth.basic(process.env.NEO4J_USER || "neo4j", process.env.NEO4J_PASSWORD || "neo4j"));
  const cypher = new Cypher({driver}).query;
  const result = inQuery[indexy].run().then(result => {
    console.log(result);
    sleep(100);
    if (indexy < inQuery.length - 1) {
      doSafeQuery(inQuery, indexy + 1);
    }
  });
}

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

doSafeQuery(q, 0);

//driver.close();
