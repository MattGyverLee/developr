//https://blog.grandstack.io/inferring-graphql-type-definitions-from-an-existing-neo4j-database-dadca2138b25

const neo4j = require("neo4j-driver").v1;
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

var q = [],
  p = [];
var dom = "";
var plan = "";
var comp = "";
var planrt = "";
var domNum = "";
var planNum = "";
//Parameters
for (let index = 0; index < 2; index++) {
  switch (index) {
    case 0:
      dom = process.env.LTDOM;
      plan = process.env.LTPLAN;
      comp = process.env.LTCOMP;
      planrt = process.env.LTROOT;
      domain = process.env.LTPREFIX;
      domNum = process.env.LTDOMNUM;
      planNum = process.env.LTPLANNUM;
      break;

    case 1:
      dom = process.env.GCDOM;
      plan = process.env.GCPLAN;
      comp = process.env.GCCOMP;
      planrt = process.env.GCROOT;
      domain = process.env.GCPREFIX;
      domNum = process.env.GCDOMNUM;
      planNum = process.env.GCPLANNUM;
  }

  console.log;

  const Cypher = require("cypher-tagged-templates").default;
  const driver = neo4j.driver(
    process.env.NEO4J_URI || "bolt://localhost:7687",
    neo4j.auth.basic(
      process.env.NEO4J_USER || "neo4j",
      process.env.NEO4J_PASSWORD || "neo4j"
    )
  );
  const cypher = new Cypher({ driver }).query;

  //Clear Database, only runs first time.
  if (index == 0) {
    q.push(cypher`
      MATCH (n) DETACH DELETE n
    `);
    // TODO: Make this Reserve
  }
  //Domain
  q.push(cypher`
    CALL apoc.load.xml(${dom},'',{},true) YIELD value as DomainDetails
      MERGE (d:Domain {id: DomainDetails.id})
      SET d.label = DomainDetails.label_en,
      d.label_fr	= DomainDetails.label_fr
      RETURN count(d), ${domain}, "Domain"
      `);

  // Create Plan
  q.push(cypher`
    CALL apoc.load.xml(${plan},'//Plans/PlanProfile',{},true) YIELD value as Plans 
      MERGE (p:PlanRoot {id: ${planrt}}) 
      SET p.plan_class = Plans.positionClass, 
      p.label = Plans.label_en, 
      p.label_fr = Plans.label_fr 
      return count(p), "Create Plan"
  `);

  // AddsCompetency Structure
  q.push(cypher`
  CALL apoc.load.xml(${plan},'//Competency',{},true) YIELD value as Compet 
    MERGE (cc:Competency {id: Compet.id}) 
    SET cc.parent_id = Compet.parentSSId, 
    cc.smartsheet_id = Compet.SSId 
    RETURN count(cc), ${domain}, "Add Compet Structure"
  `);

  //Competency Details
  q.push(cypher`
    CALL apoc.load.xml(${comp},'//CompetencyDetails/Competency',{},true) YIELD value as Competency
      CALL apoc.load.xml(${dom},'',{},true) YIELD value as DomainDetails
      MATCH (d:Domain {id: DomainDetails.id})
      MERGE (c:Competency {id: Competency.id}) 
      SET c.default_weight = Competency.defaultWeight,
      c.default_expiration = Competency.defaultExpiration,
      c.label = Competency.label
      MERGE (c)-[:HAS_PRIMARY_DOMAIN]->(d)
      MERGE (d)-[:PRIMARY_DOMAIN_OF]->(c)
      return count(c), "Competency Details"
`);

  // Import Plan and Connect Plan to Domain
  q.push(cypher`
  CALL apoc.load.xml(${plan},'//Plans/PlanProfile',{},true) YIELD value as Plans 
      MATCH (p:PlanRoot {id: ${planrt}}) 
      MERGE (d3:Domain {id: Plans.domainId }) 
      MERGE (p)-[r:HAS_PRIMARY_DOMAIN]->(d3) 
      return count(r), "Connect Plan to Domain"
  `);

  // Creates Competency Categories
  q.push(cypher`
    CALL apoc.load.xml(${plan},'//compGroup[@level="1"]',{},true) YIELD value as CompGroup 
      MERGE (cc:CompetencyCategory {id: CompGroup.id, smartsheet_id: CompGroup.SSId }) 
      SET cc.smartsheet_id = CompGroup.SSId, 
      cc.parent_id = CompGroup.parentSSId, 
      cc.label = CompGroup.name, 
      cc.level = CompGroup.level,
      cc.color = CompGroup.color 
      RETURN count(cc), ${domain}, "Create Categories"
      
  `);
  // Creates Competency Subgroups
  q.push(cypher`
    CALL apoc.load.xml(${plan},'//compGroup[@level!="1"]',{},true) YIELD value as CompGroup 
      MERGE (cg:CompetencyGroup {id: CompGroup.id, smartsheet_id: CompGroup.SSId }) 
      SET cg.smartsheet_id = CompGroup.SSId, 
      cg.parent_id = CompGroup.parentSSId, 
      cg.label = CompGroup.name, 
      cg.level = CompGroup.level 
      RETURN count(cg), ${domain}, "Create other Subgroups"
  `);

  // Link PlanRoots to Categories
  q.push(cypher`
  CALL apoc.load.xml(${plan},'//compGroup[@level="1"]',{},true) YIELD value as CompGroup 
    CALL apoc.load.xml(${plan},'//Plans/PlanProfile',{},true) YIELD value as Plans
    Match (p:PlanRoot {id: ${planrt}}), (cg1:CompetencyCategory {level: "1", smartsheet_id: CompGroup.SSId}) 
    WHERE NOT (p)-[:HAS_CATEGORY]->(cg1)
    MERGE (p)-[:HAS_CATEGORY {order: CompGroup.order, planId: Plans.id}]->(cg1) 
    MERGE (cg1)-[:IS_CATEGORY_OF {order: CompGroup.order, planId: Plans.id}]->(p) 
    RETURN count(cg1), ${domain}, "Link Planroot to Cats"
  `);

  // Link Categories directly to Competencies
  q.push(cypher`
  CALL apoc.load.xml(${plan},'//Competency',{},true) YIELD value as Compet 
    CALL apoc.load.xml(${plan},'//Plans/PlanProfile',{},true) YIELD value as Plans
    Match (co:Competency {smartsheet_id: Compet.SSId }), (c4:CompetencyCategory {smartsheet_id: Compet.parentSSId} ) 
      WHERE NOT (co)-[:IN_GROUP]->(c4) 
      SET co.parent_id = Compet.parentSSId
      MERGE (co)-[r:IS_IN_GROUP {order: Compet.order, planId: Plans.id}]->(c4) 
      MERGE (c4)-[:CATEGORY_HAS_COMPETENCIES_OF {order: Compet.order, planId: Plans.id}]->(co) 
      return count(r), ${domain}, "Link Categories to Competencies" 
  `);

  // Link Category to SubGroups
  q.push(cypher`
    CALL apoc.load.xml(${plan},'//compGroup',{},true) YIELD value as CompGroup 
      CALL apoc.load.xml(${plan},'//Plans/PlanProfile',{},true) YIELD value as Plans 
      Match (cg1:CompetencyGroup {smartsheet_id: CompGroup.SSId }), (cg2:CompetencyCategory {smartsheet_id: CompGroup.parentSSId} ) 
      WHERE NOT (cg1)-[:IN_GROUP]->(cg2)
      MERGE (cg2)-[r:HAS_GROUP {order: CompGroup.order, planId: Plans.id}]->(cg1)
      MERGE (cg1)-[:IS_IN_GROUP {order: CompGroup.order, planId: Plans.id}]->(cg2)
      return count(r), ${domain}, "Link Categories to Subgroups"
  `);

  // Link Subgroups to SubGroups
  q.push(cypher`
  CALL apoc.load.xml(${plan},'//compGroup',{},true) YIELD value as CompGroup 
    CALL apoc.load.xml(${plan},'//Plans/PlanProfile',{},true) YIELD value as Plans 
    Match (cg1:CompetencyGroup {smartsheet_id: CompGroup.SSId }), (cg2:CompetencyGroup {smartsheet_id: CompGroup.parentSSId} ) 
    WHERE NOT (cg1)-[:IS_IN_GROUP]->(cg2)
    MERGE (cg2)-[r:HAS_GROUP {order: CompGroup.order, planId: Plans.id}]->(cg1)
    MERGE (cg1)-[:IS_IN_GROUP {order: CompGroup.order, planId: Plans.id}]->(cg2)
    return count(r), ${domain}, "Link SubGroups to Subgroups"
`);

  // Links Competencies to Groups
  q.push(cypher`
    CALL apoc.load.xml(${plan},'//Competency',{},true) YIELD value as Compet 
      CALL apoc.load.xml(${plan},'//Plans/PlanProfile',{},true) YIELD value as Plans 
      Match (co:Competency {smartsheet_id: Compet.SSId }), (c4:CompetencyGroup {smartsheet_id: Compet.parentSSId} ) 
      WHERE NOT (co)-[:IN_GROUP]->(c4) 
      SET co.parent_id = Compet.parentSSId
      MERGE (co)-[r:IS_IN_GROUP {order: Compet.order, planId: Plans.id}]->(c4) 
      MERGE (c4)-[:GROUP_HAS_COMPETENCIES_OF {order: Compet.order, planId: Plans.id}]->(co) 
      return count(r), ${domain}, "Link Competencies to Subgroups"
  `);

  //Target Competency
  q.push(cypher`
    CALL apoc.load.xml(${comp},'//targetComp',{},true) YIELD value as TargetCompetency 
      MERGE (t1:TargetCompetency {id: TargetCompetency.id }) 
      SET t1.label = replace(TargetCompetency.label_en,"\n               "," "), 
      t1.label_modified = TargetCompetency.label_en_modified, 
      t1.label_created = TargetCompetency.label_en_created, 
      t1.label_fr = replace(TargetCompetency.label_fr,"\n               "," "), 
      t1.label_fr_modified = TargetCompetency.label_fr_modified, 
      t1.label_fr_created = TargetCompetency.label_fr_created, 
      t1.label_label_es = replace(TargetCompetency.label_es,"\n               "," "), 
      t1.label_es_modified = TargetCompetency.label_es_modified, 
      t1.label_es_created = TargetCompetency.label_es_created
      RETURN count(t1), ${domain}
  `);

  //TargetComp Relations
  q.push(cypher`
    CALL apoc.load.xml(${comp},'//targetComp',{},true) YIELD value as TargetComp 
      MATCH (c2:Competency {smartsheet_id: TargetComp.parentSSId}), 
      (t2:TargetCompetency {id: TargetComp.id}) 
      MERGE (c2)-[:HAS_TARGET_COMPETENCY]->(t2) 
  `);

  // Assessment Criteria
  q.push(cypher`
    CALL apoc.load.xml(${comp},'//AssessCrit',{},true) YIELD value as AssessmentCriteria 
      MERGE (ac:AssessmentCriteria { id: AssessmentCriteria.id}) 
      SET ac.label = replace(AssessmentCriteria.label_en,"\n               "," "), 
      ac.label_modified = AssessmentCriteria.label_en_modified, 
      ac.label_created = AssessmentCriteria.label_en_created, 
      ac.label_fr = replace(AssessmentCriteria.label_fr,"\n               "," "),  
      ac.label_fr_modified = AssessmentCriteria.label_fr_modified, 
      ac.label_fr_created = AssessmentCriteria.label_fr_created, 
      ac.label_label_es = replace(AssessmentCriteria.label_es,"\n               "," "), 
      ac.label_es_modified = AssessmentCriteria.label_es_modified, 
      ac.label_es_created = AssessmentCriteria.label_es_created 
      RETURN count(ac), ${domain}
  `);

  q.push(cypher`
    CALL apoc.load.xml(${comp},'//AssessCrit',{},true) YIELD value as AssessmentCrit 
      MATCH (c2:Competency {smartsheet_id: AssessmentCrit.parentSSId}), 
      (ac2:AssessmentCriteria {id: AssessmentCrit.id}) 
      MERGE (c2)-[:HAS_ASSESSMENT_CRITERIA]->(ac2) 
  `);

  //Short Name
  q.push(cypher`
    CALL apoc.load.xml(${comp},'//ShortName',{},true) YIELD value as ShortName 
      MERGE (sn:ShortName { id: ShortName.id}) 
      SET sn.label = replace(ShortName.label_en,"\n               "," "), 
      sn.label_modified = ShortName.label_en_modified, 
      sn.label_created = ShortName.label_en_created, 
      sn.label_fr = replace(ShortName.label_fr,"\n               "," "), 
      sn.label_fr_modified = ShortName.label_fr_modified, 
      sn.label_fr_created = ShortName.label_fr_created, 
      sn.label_es = replace(ShortName.label_es,"\n               "," "),  
      sn.label_es_modified = ShortName.label_es_modified, 
      sn.label_es_created = ShortName.label_es_created 
      RETURN count(sn), ${domain}
  `);

  q.push(cypher`
    CALL apoc.load.xml(${comp},'//ShortName',{},true) YIELD value as ShortN 
      MATCH (c2:Competency {smartsheet_id: ShortN.parentSSId}), 
      (sn2:ShortName {id: ShortN.id}) 
      MERGE (c2)-[:HAS_SHORT_NAME]->(sn2) 
  `);

  // L0
  q.push(cypher`
    CALL apoc.load.xml(${comp},'//Lv0Activities',{},true) YIELD value as Lv0Act 
      MERGE (l0:Lv0Activities { id: Lv0Act.id}) 
      SET l0.label = replace(Lv0Act.label_en,"\n               "," "),  
      l0.label_modified = Lv0Act.label_en_modified, 
      l0.label_created = Lv0Act.label_en_created, 
      l0.label_fr = replace(Lv0Act.label_fr,"\n               "," "),  
      l0.label_fr_modified = Lv0Act.label_fr_modified, 
      l0.label_fr_created = Lv0Act.label_fr_created, 
      l0.label_es = replace(Lv0Act.label_es,"\n               "," "),  
      l0.label_es_modified = Lv0Act.label_es_modified, 
      l0.label_es_created = Lv0Act.label_es_created 
      RETURN count(l0), ${domain}
  `);

  q.push(cypher`
    CALL apoc.load.xml(${comp},'//Lv0Activities',{},true) YIELD value as Lv0 
      MATCH (c2:Competency {smartsheet_id: Lv0.parentSSId}), 
      (l02:Lv0Activities {id: Lv0.id}) 
      MERGE (c2)-[:HAS_LV0_ACTIVITIES]->(l02) 
  `);

  // L1
  q.push(cypher`
    CALL apoc.load.xml(${comp},'//Lv1Activities',{},true) YIELD value as Lv1Act
      MERGE (l1:Lv1Activities { id: Lv1Act.id}) 
      SET l1.label = Lv1Act.label_en, 
      l1.label_modified = replace(Lv1Act.label_en,"\n              "," "),  
      l1.label_created = Lv1Act.label_en_created, 
      l1.label_fr = replace(Lv1Act.label_fr,"\n              "," "), 
      l1.label_fr_modified = Lv1Act.label_fr_modified, 
      l1.label_fr_created = Lv1Act.label_fr_created, 
      l1.label_es = replace(Lv1Act.label_es,"\n              "," "),  
      l1.label_es_modified = Lv1Act.label_es_modified, 
      l1.label_es_created = Lv1Act.label_es_created 
      RETURN count(l1), ${domain}
  `);

  q.push(cypher`
    CALL apoc.load.xml(${comp},'//Lv1Activities',{},true) YIELD value as Lv1 
      MATCH (c2:Competency {smartsheet_id: Lv1.parentSSId}), 
      (l12:Lv1Activities {id: Lv1.id}) 
      MERGE (c2)-[:HAS_LV1_ACTIVITIES]->(l12) 
  `);

  // L2
  q.push(cypher`
    CALL apoc.load.xml(${comp},'//Lv2Activities',{},true) YIELD value as Lv2Act 
      MERGE (l2:Lv2Activities { id: Lv2Act.id}) 
      SET l2.label = replace(Lv2Act.label_en,"\n               "," "),  
      l2.label_modified = Lv2Act.label_en_modified, 
      l2.label_created = Lv2Act.label_en_created, 
      l2.label_fr = replace(Lv2Act.label_fr,"\n               "," "), 
      l2.label_fr_modified = Lv2Act.label_fr_modified, 
      l2.label_fr_created = Lv2Act.label_fr_created, 
      l2.label_es = replace(Lv2Act.label_es,"\n               "," "),   
      l2.label_es_modified = Lv2Act.label_es_modified, 
      l2.label_es_created = Lv2Act.label_es_created 
      RETURN count(l2), ${domain}
  `);

  q.push(cypher`
    CALL apoc.load.xml(${comp},'//Lv2Activities',{},true) YIELD value as Lv2 
      MATCH (c2:Competency {smartsheet_id: Lv2.parentSSId}), 
      (l22:Lv2Activities {id: Lv2.id}) 
      MERGE (c2)-[:HAS_LV2_ACTIVITIES]->(l22) 
  `);

  // L3
  q.push(cypher`
    CALL apoc.load.xml(${comp},'//Lv3Activities',{},true) YIELD value as Lv3Act 
      MERGE (l3:Lv3Activities { id: Lv3Act.id}) 
      SET l3.label = replace(Lv3Act.label_en,"\n               "," "),  
      l3.label_modified = Lv3Act.label_en_modified, 
      l3.label_created = Lv3Act.label_en_created, 
      l3.label_fr = replace(Lv3Act.label_fr,"\n               "," "),  
      l3.label_fr_modified = Lv3Act.label_fr_modified, 
      l3.label_fr_created = Lv3Act.label_fr_created, 
      l3.label_es = replace(Lv3Act.label_es,"\n               "," "),   
      l3.label_es_modified = Lv3Act.label_es_modified, 
      l3.label_es_created = Lv3Act.label_es_created 
      RETURN count(l3), ${domain}
  `);

  q.push(cypher`
    CALL apoc.load.xml(${comp},'//Lv3Activities',{},true) YIELD value as Lv3 
      MATCH (c2:Competency {smartsheet_id: Lv3.parentSSId}), 
      (l32:Lv3Activities {id: Lv3.id}) 
      MERGE (c2)-[:HAS_LV3_ACTIVITIES]->(l32) 
  `);

  // L4
  q.push(cypher`
    CALL apoc.load.xml(${comp},'//Lv4Activities',{},true) YIELD value as Lv4Act 
      MERGE (l4:Lv4Activities { id: Lv4Act.id}) 
      SET l4.label = replace(Lv4Act.label_en,"\n               "," "),  
      l4.label_modified = Lv4Act.label_en_modified, 
      l4.label_created = Lv4Act.label_en_created, 
      l4.label_fr = replace(Lv4Act.label_fr,"\n               "," "),  
      l4.label_fr_modified = Lv4Act.label_fr_modified, 
      l4.label_fr_created = Lv4Act.label_fr_created, 
      l4.label_es = replace(Lv4Act.label_es,"\n               "," "),  
      l4.label_es_modified = Lv4Act.label_es_modified, 
      l4.label_es_created = Lv4Act.label_es_created 
      RETURN count(l4), ${domain}
  `);

  q.push(cypher`
    CALL apoc.load.xml(${comp},'//Lv4Activities',{},true) YIELD value as Lv4 
      MATCH (c2:Competency {smartsheet_id: Lv4.parentSSId}), 
      (l42:Lv4Activities {id: Lv4.id}) 
      MERGE (c2)-[:HAS_LV4_ACTIVITIES]->(l42) 
  `);

  // L5
  q.push(cypher`
    CALL apoc.load.xml(${comp},'//Lv5Activities',{},true) YIELD value as Lv5Act 
      MERGE (l5:Lv5Activities { id: Lv5Act.id}) 
      SET l5.label = replace(Lv5Act.label_en,"\n               "," "),  
      l5.label_modified = Lv5Act.label_en_modified, 
      l5.label_created = Lv5Act.label_en_created, 
      l5.label_fr = replace(Lv5Act.label_fr,"\n               "," "),  
      l5.label_fr_modified = Lv5Act.label_fr_modified, 
      l5.label_fr_created = Lv5Act.label_fr_created, 
      l5.label_es = replace(Lv5Act.label_es,"\n               "," "),  
      l5.label_es_modified = Lv5Act.label_es_modified, 
      l5.label_es_created = Lv5Act.label_es_created 
      RETURN count(l5), ${domain}
  `);

  q.push(cypher`
  CALL apoc.load.xml(${comp},'//Lv5Activities',{},true) YIELD value as Lv5 
    MATCH (c2:Competency {smartsheet_id: Lv5.parentSSId}), 
    (l52:Lv5Activities {id: Lv5.id}) 
    MERGE (c2)-[:HAS_LV5_ACTIVITIES]->(l52) 
`);

  var dateobj = new Date();
  var myNow = dateobj.toISOString();
  ///Note, these will run twice, but it should be OK.
  q.push(cypher`
    MATCH (a)-[r]-(b)
    WHERE NOT EXISTS(r.startDate)
    SET r.startDate = ${myNow}
`);
  if (index == 1) {
    // ================Adding User=======================
    q.push(cypher`
      MERGE (u:User {id: "1"})
      SET u.Name = "Matthew",
        u.primaryOrg = "SIL",
        u.primaryDomain = "LT",
        u.activePlan = "1"
      MERGE (pr:ProgressRoot {userId: "1"})
      MERGE (u)-[:HAS_PROGRESS_ROOT]->(pr)
  `);
    q.push(cypher`
      MATCH (pr:ProgressRoot {userId: "1"})
      MATCH (ckb:Competency {id: "LT-5028854683199364" })
      MERGE (pkb:Progress {competency_ref: "LT-5028854683199364"})
      SET pkb.currentLevel = 3
      MERGE (ckb)<-[:COMPETENCY_PROGRESS {userId: "1"}]-(pkb)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
    `);
    q.push(cypher`
      MATCH (pr:ProgressRoot {userId: "1"})
      MATCH (ccomp:Competency {id: "LT-4184429753067396" })
      MERGE (pcomp:Progress {competency_ref: "LT-4184429753067396"})
      SET pcomp.currentLevel = 4
      MERGE (ccomp)<-[:COMPETENCY_PROGRESS {userId: "1"}]-(pcomp)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
      `);
    q.push(cypher`
      MATCH (pr:ProgressRoot {userId: "1"})
      MATCH (cfon:Competency {id: "LT-525255055828868" })
      MERGE (pfon:Progress {competency_ref: "LT-525255055828868"})
      SET pfon.currentLevel = 4
      MERGE (cfon)<-[:COMPETENCY_PROGRESS {userId: "1"}]-(pfon)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
      `);
    q.push(cypher`
      MATCH (pr:ProgressRoot {userId: "1"})
      MATCH (cmal:Competency {id: "LT-2777054869514116" })
      MERGE (pmal:Progress {competency_ref: "LT-2777054869514116"})
      SET pmal.currentLevel = 3
      MERGE (cmal)<-[:COMPETENCY_PROGRESS {userId: "1"}]-(pmal)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
      `);
    q.push(cypher`
      MATCH (pr:ProgressRoot {userId: "1"})
      MATCH (cos:Competency {id: "LT-8688029380437892" })
      MERGE (pos:Progress {competency_ref: "LT-8688029380437892"})
      SET pos.currentLevel = 4
      MERGE (cos)<-[:COMPETENCY_PROGRESS {userId: "1"}]-(pos)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
      `);
    q.push(cypher`
      MATCH (pr:ProgressRoot {userId: "1"})
      MATCH (clang:Competency {id: "LT-6436229566752644" })
      MERGE (plang:Progress {competency_ref: "LT-6436229566752644"})
      SET plang.currentLevel = 4
      MERGE (clang)<-[:COMPETENCY_PROGRESS {userId: "1"}]-(plang)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
    `);
    q.push(cypher`
      MATCH (pr:ProgressRoot {userId: "1"})
      MATCH (clwc:Competency {id: "LT-7949157566572420" })
      MERGE (plwc:Progress {competency_ref: "LT-7949157566572420"})
      SET plwc.currentLevel = 4
      MERGE (clwc)<-[:COMPETENCY_PROGRESS {userId: "1"}]-(plwc)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
    `);

    // Defining Milestones
    q.push(cypher`
      Match (ct:CompetencyCategory {id: "LT-1932629939382148"})
      Match (dc:CompetencyCategory {id: "LT-7280654496884612"})
      Match (pc:CompetencyCategory {id: "LT-6823257659729796"})
      MATCH (cc:CompetencyCategory {id: "LT-2882607985780612"})
      MATCH (prof:CompetencyCategory {id: "LT-4852932822755204"})
      MATCH (ed:CompetencyCategory {id: "LT-5978832729597828"})
      MATCH (pr:PlanRoot {id: "1-root"})

      MERGE (m1:Milestone {ms: "LTSpec1"})<-[:HAS_MILESTONE]-(pr)
      MERGE (m1)-[:HAS_SHORT_NAME]-(:ShortName {label: "Language Technology Specialist (Level 1)"})
      MERGE (m2:Milestone {ms: "LTSpec2"})<-[:HAS_MILESTONE]-(pr)
      MERGE (m2)-[:HAS_SHORT_NAME]-(:ShortName {label: "Language Technology Specialist (Level 2)"})
      MERGE (m3:Milestone {ms: "LTCons1"})<-[:HAS_MILESTONE]-(pr)
      MERGE (m3)-[:HAS_SHORT_NAME]-(:ShortName {label: "Language Technology Consultant (Level 1)"})
      MERGE (m4:Milestone {ms: "LTCons2"})<-[:HAS_MILESTONE]-(pr)
      MERGE (m4)-[:HAS_SHORT_NAME]-(:ShortName {label: "Language Technology Consultant (Level 2)"})
      MERGE (m5:Milestone {ms: "LTCons3"})<-[:HAS_MILESTONE]-(pr)
      MERGE (m5)-[:HAS_SHORT_NAME]-(:ShortName {label: "Senior Consultant"})

      // Core Tech
      
      Merge (m1)<-[:TARGET_VALUE_IS {min: 3, planId: "1"}]-(ct)
      Merge (m2)<-[:TARGET_VALUE_IS {min: 6, planId: "1"}]-(ct)
      Merge (m3)<-[:TARGET_VALUE_IS {min: 9, planId: "1"}]-(ct)
      Merge (m4)<-[:TARGET_VALUE_IS {min: 12, planId: "1"}]-(ct)
      Merge (m5)<-[:TARGET_VALUE_IS {min: 14, planId: "1"}]-(ct)

      // Domain Comp
     
      Merge (m1)<-[:TARGET_VALUE_IS {min: 3, planId: "1"}]-(dc)
      Merge (m2)<-[:TARGET_VALUE_IS {min: 5, planId: "1"}]-(dc)
      Merge (m3)<-[:TARGET_VALUE_IS {min: 10, planId: "1"}]-(dc)
      Merge (m4)<-[:TARGET_VALUE_IS {min: 20, planId: "1"}]-(dc)
      Merge (m5)<-[:TARGET_VALUE_IS {min: 40, planId: "1"}]-(dc)

      // Practical Comp
      
      Merge (m1)<-[:TARGET_VALUE_IS {min: 2, planId: "1"}]-(pc)
      Merge (m2)<-[:TARGET_VALUE_IS {min: 5, planId: "1"}]-(pc)
      Merge (m3)<-[:TARGET_VALUE_IS {min: 8, planId: "1"}]-(pc)
      Merge (m4)<-[:TARGET_VALUE_IS {min: 11, planId: "1"}]-(pc)
      Merge (m5)<-[:TARGET_VALUE_IS {min: 14, planId: "1"}]-(pc)

      // Consultant Comp
     
      Merge (m1)<-[:TARGET_VALUE_IS {min: 1, planId: "1"}]-(cc)
      Merge (m2)<-[:TARGET_VALUE_IS {min: 2, planId: "1"}]-(cc)
      Merge (m3)<-[:TARGET_VALUE_IS {min: 3, planId: "1"}]-(cc)
      Merge (m4)<-[:TARGET_VALUE_IS {min: 5, planId: "1"}]-(cc)
      Merge (m5)<-[:TARGET_VALUE_IS {min: 10, planId: "1"}]-(cc)

      // Professional Comp
      
      Merge (m1)<-[:TARGET_VALUE_IS {min: 1, planId: "1"}]-(prof)
      Merge (m2)<-[:TARGET_VALUE_IS {min: 2, planId: "1"}]-(prof)
      Merge (m3)<-[:TARGET_VALUE_IS {min: 4, planId: "1"}]-(prof)
      Merge (m4)<-[:TARGET_VALUE_IS {min: 5, planId: "1"}]-(prof)
      Merge (m5)<-[:TARGET_VALUE_IS {min: 6, planId: "1"}]-(prof)

      //Education
      
      Merge (m1)<-[:TARGET_VALUE_IS {min: 0, planId: "1"}]-(ed)
      Merge (m2)<-[:TARGET_VALUE_IS {min: 0, planId: "1"}]-(ed)
      Merge (m3)<-[:TARGET_VALUE_IS {min: 1, planId: "1"}]-(ed)
      Merge (m4)<-[:TARGET_VALUE_IS {min: 1, planId: "1"}]-(ed)
      Merge (m5)<-[:TARGET_VALUE_IS {min: 2, planId: "1"}]-(ed)

      return "Added Ltmins"
    `);
  }
}

console.log(q.length);

function doSafeQuery(inQuery, indexy) {
  const Cypher = require("cypher-tagged-templates").default;
  const driver = neo4j.driver(
    process.env.NEO4J_URI || "bolt://localhost:7687",
    neo4j.auth.basic(
      process.env.NEO4J_USER || "neo4j",
      process.env.NEO4J_PASSWORD || "neo4j"
    )
  );
  const cypher = new Cypher({ driver }).query;
  const result = inQuery[indexy].run().then(result => {
    console.log(result);
    //sleep(100);
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

//.then(console.log("Database updated, Connection Closed"));

//driver.close();
