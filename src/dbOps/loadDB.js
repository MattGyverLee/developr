//https://blog.grandstack.io/inferring-graphql-type-definitions-from-an-existing-neo4j-database-dadca2138b25

const neo4j = require("neo4j-driver");
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
  r = [];
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

  // Note: XML Files are in the Import Folder of Neo4j
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
      cc.label = CompGroup.shortName, 
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

  if (index == 1) {
    // ================Adding User=======================
    q.push(cypher`
      MERGE (u:User {id: "1"})
      SET u.Name = "Bob",
        u.primaryOrg = "SIL",
        u.primaryDomain = "LT",
        u.activePlan = "1"
      MERGE (pr:ProgressRoot {userId: "1"})
	  MERGE (u)-[:HAS_PROGRESS_ROOT]->(pr)
	  Return "User"
  `);

    q.push(cypher`
	// Non-LT Education
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-8957614363043716" })
		MERGE (p:Progress {competency_ref: "LT-8957614363043716"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    r.push(cypher`
	// 
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-7073395204482948" })
		MERGE (p:Progress {competency_ref: "LT-7073395204482948"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Language, Culture, and Teamwork
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-4008507892623236" })
		MERGE (p:Progress {competency_ref: "LT-4008507892623236"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    r.push(cypher`
	// 
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-1443895670269828" })
		MERGE (p:Progress {competency_ref: "LT-1443895670269828"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Participation and Advocacy
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-6387269883979652" })
		MERGE (p:Progress {competency_ref: "LT-6387269883979652"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Problem Solving
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-2243921946404740" })
		MERGE (p:Progress {competency_ref: "LT-2243921946404740"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Consulting
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-1756708078937988" })
		MERGE (p:Progress {competency_ref: "LT-1756708078937988"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Software Development
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-8633750951094148" })
		MERGE (p:Progress {competency_ref: "LT-8633750951094148"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Research and Publication
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-8969504357148548" })
		MERGE (p:Progress {competency_ref: "LT-8969504357148548"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Technology for Consulting
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-8488167129016196" })
		MERGE (p:Progress {competency_ref: "LT-8488167129016196"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Responsive Feedback
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-7104732636440452" })
		MERGE (p:Progress {competency_ref: "LT-7104732636440452"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Local Language
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-5134407799465860" })
		MERGE (p:Progress {competency_ref: "LT-5134407799465860"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Archiving & Copyright
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-4465904729778052" })
		MERGE (p:Progress {competency_ref: "LT-4465904729778052"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Digital Vitality
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-6013965486581636" })
		MERGE (p:Progress {competency_ref: "LT-6013965486581636"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Literacy Tools
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-2319658032359300" })
		MERGE (p:Progress {competency_ref: "LT-2319658032359300"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Language Programs
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-6436229566752644" })
		MERGE (p:Progress {competency_ref: "LT-6436229566752644"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Computer Hardware
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-4184429753067396" })
		MERGE (p:Progress {competency_ref: "LT-4184429753067396"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// OS Basics
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-8688029380437892" })
		MERGE (p:Progress {competency_ref: "LT-8688029380437892"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Fonts & Encoding
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-525255055828868" })
		MERGE (p:Progress {competency_ref: "LT-525255055828868"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Keyboards
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-5028854683199364" })
		MERGE (p:Progress {competency_ref: "LT-5028854683199364"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Malware
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-2777054869514116" })
		MERGE (p:Progress {competency_ref: "LT-2777054869514116"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Translation Tools
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-1651154962671492" })
		MERGE (p:Progress {competency_ref: "LT-1651154962671492"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Scripture Markup
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-6154754590041988" })
		MERGE (p:Progress {competency_ref: "LT-6154754590041988"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Lexical Tools
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-3902954776356740" })
		MERGE (p:Progress {competency_ref: "LT-3902954776356740"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Lexical Markup
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-8406554403727236" })
		MERGE (p:Progress {competency_ref: "LT-8406554403727236"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    r.push(cypher`
	// Lexical Import
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-1088205009250180" })
		MERGE (p:Progress {competency_ref: "LT-1088205009250180"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Morphological Parsing
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-5591804636620676" })
		MERGE (p:Progress {competency_ref: "LT-5591804636620676"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Phonology Tools
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-3340004822935428" })
		MERGE (p:Progress {competency_ref: "LT-3340004822935428"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Language Documentation
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-7843604450305924" })
		MERGE (p:Progress {competency_ref: "LT-7843604450305924"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Instrumental Analysis
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-2214104916092804" })
		MERGE (p:Progress {competency_ref: "LT-2214104916092804"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Data Conversion
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-6717704543463300" })
		MERGE (p:Progress {competency_ref: "LT-6717704543463300"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Formal Mentoring
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-349333195384708" })
		MERGE (p:Progress {competency_ref: "LT-349333195384708"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    r.push(cypher`
	// 
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-5947495297640324" })
		MERGE (p:Progress {competency_ref: "LT-5947495297640324"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Collaboration
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-4571457846044548" })
		MERGE (p:Progress {competency_ref: "LT-4571457846044548"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    r.push(cypher`
	// Publishing
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-67858218674052" })
		MERGE (p:Progress {competency_ref: "LT-67858218674052"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// English Language
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-630808172095364" })
		MERGE (p:Progress {competency_ref: "LT-630808172095364"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Professional Networking
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-2601133009069956" })
		MERGE (p:Progress {competency_ref: "LT-2601133009069956"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    r.push(cypher`
	// Custom Skill
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-6226301522601860" })
		MERGE (p:Progress {competency_ref: "LT-6226301522601860"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Domain specific education
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-4821595390797700" })
		MERGE (p:Progress {competency_ref: "LT-4821595390797700"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    r.push(cypher`
	// 
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-2569795577112452" })
		MERGE (p:Progress {competency_ref: "LT-2569795577112452"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Professional Representation
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-1475233102227332" })
		MERGE (p:Progress {competency_ref: "LT-1475233102227332"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Teaching Skill
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-5697357752887172" })
		MERGE (p:Progress {competency_ref: "LT-5697357752887172"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    q.push(cypher`
	// Language of Wider Communication
		MATCH (pr:ProgressRoot {userId: "1"})
		MATCH (c:Competency {id: "LT-7949157566572420" })
		MERGE (p:Progress {competency_ref: "LT-7949157566572420"})
		SET p.currentLevel = 1
		MERGE (c)<-[:COMPETENCY_PROGRESS {userId: 1}]-(p)<-[:CHILD_PROGRESS {userId: "1"}]-(pr)
	`);

    // Defining Milestones
    q.push(cypher`
      Match (ct:CompetencyCategory {id: "LT-1932629939382148"})
      Match (dc:CompetencyCategory {id: "LT-7280654496884612"})
      Match (pc:CompetencyCategory {id: "LT-6823257659729796"})
      MATCH (cc:CompetencyCategory {id: "LT-2882607985780612"})
      MATCH (prof:CompetencyCategory {id: "LT-4852932822755204"})
      MATCH (ed:CompetencyCategory {id: "LT-5978832729597828"})
      MATCH (pr:PlanRoot {id: "1"})

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

    // ================Adding Orlando ===================

    q.push(cypher`
	MATCH (pr:ProgressRoot {userId: "1"})
	MERGE (d:Domain {id: "2"})
	SET d.label = "Translation (Orlando)"
	MERGE (d)-[:IS_PRIMARY_DOMAIN_OF]->(p:PlanRoot {id: "2"})-[:HAS_PRIMARY_DOMAIN]->(d)
	SET p.label = "Translation (Orlando) Plan",
		p.plan_class = "Generic"
	MERGE (ms:Milestone {ms: "TransCons1"})<-[:HAS_MILESTONE]-(p)
	MERGE (ms)-[:HAS_SHORT_NAME]->(:ShortName {label: "Translation Consultant (1)"}) 
	MERGE (ms2:Milestone {ms: "Translator"})<-[:HAS_MILESTONE]-(p)
	MERGE (ms2)-[:HAS_SHORT_NAME]->(:ShortName {label: "Translator (1)"}) 

	//CatTrans-Exe in 2
	MERGE (p)-[:HAS_CATEGORY {order: 1, planId: "2"}]->(cat1:CompetencyCategory {id: "Trans-Exe"})-[:IS_CATEGORY_OF {order: 1, planId: "2"}]->(p)
	SET cat1.label = "Exegetical and Hermeneutical Competencies",
		cat1.color = "blue"
	MERGE (cat1)-[:HAS_SHORT_NAME]->(sn1:ShortName {id : "sn1"})
	SET sn1.label = "Exegetical and Hermeneutical Competencies"
	MERGE (cat1)-[:HAS_TARGET_COMPETENCY]->(tc1:TargetCompetency {id : "tc1"})
	SET tc1.label = "It is important that a consultant demonstrates : exegetical skills (OT and or NT) the ability to make use of commentaries and translation helps, exegetical reasoning, including taking into account the context in order to get at the meaning of the source text, the ability to detect exegetical and logical fallacies, and to detect and interpret ambiguities in the text"

	//Grp	Trans-Exe-Exe in Trans-Exe
	MERGE (cat1)-[:HAS_GROUP {order: 2, planId: "2"}]->(grp1:CompetencyGroup {id: "Trans-Exe-Exe"})-[:IS_IN_GROUP {order: 2, planId: "2"}]->(cat1)
	SET grp1.label = "A) Exegesis & Hermeneutics"
	MERGE (grp1)-[:HAS_SHORT_NAME]->(sn2:ShortName {id : "sn2"})
	SET sn2.label = "A) Exegesis & Hermeneutics"

	//Comp		Trans-GUID1 in Trans-Exe-Exe
	MERGE (grp1)-[:GROUP_HAS_COMPETENCIES_OF {order: 3, planId: "2"}]->(cmp1:Competency {id: "Trans-GUID1"})-[:IS_IN_GROUP {order: 3, planId: "2"}]->(grp1)
	SET cmp1.label = "Identify exegetical problems",
		cmp1.default_weight = 1.0
	MERGE (cmp1)-[:HAS_SHORT_NAME]->(sn3:ShortName {id : "sn3"})
	SET sn3.label = "Identify exegetical problems"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp1)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp1)-[:HAS_TARGET_COMPETENCY]->(tc2:TargetCompetency {id : "tc2"})
	SET tc2.label = "Identify a potential problem in exegesis, think about alternative solutions, and evaluate those solutions based on sound reasoning."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID1"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp1)
	Merge (cmp1)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp1)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID2 in Trans-Exe-Exe
	MERGE (grp1)-[:GROUP_HAS_COMPETENCIES_OF {order: 4, planId: "2"}]->(cmp2:Competency {id: "Trans-GUID2"})-[:IS_IN_GROUP {order: 4, planId: "2"}]->(grp1)
	SET cmp2.label = "Hermeneutical awareness",
		cmp2.default_weight = 1.0
	MERGE (cmp2)-[:HAS_SHORT_NAME]->(sn4:ShortName {id : "sn4"})
	SET sn4.label = "Hermeneutical awareness"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp2)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp2)-[:HAS_TARGET_COMPETENCY]->(tc3:TargetCompetency {id : "tc3"})
	SET tc3.label = "Demonstrate the awareness that exegesis is a hermeneutical activity that is partly based on the theological, social, and cultural assumptions of the interpreter."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID2"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp2)
	Merge (cmp2)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp2)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Grp	Trans-Exe-Bible in Trans-Exe
	MERGE (cat1)-[:HAS_GROUP {order: 5, planId: "2"}]->(grp2:CompetencyGroup {id: "Trans-Exe-Bible"})-[:IS_IN_GROUP {order: 5, planId: "2"}]->(cat1)
	SET grp2.label = "B) Bible "
	MERGE (grp2)-[:HAS_SHORT_NAME]->(sn5:ShortName {id : "sn5"})
	SET sn5.label = "B) Bible "

	//Comp		Trans-GUID3 in Trans-Exe-Bible
	MERGE (grp2)-[:GROUP_HAS_COMPETENCIES_OF {order: 6, planId: "2"}]->(cmp3:Competency {id: "Trans-GUID3"})-[:IS_IN_GROUP {order: 6, planId: "2"}]->(grp2)
	SET cmp3.label = "Bible background",
		cmp3.default_weight = 1.0
	MERGE (cmp3)-[:HAS_SHORT_NAME]->(sn6:ShortName {id : "sn6"})
	SET sn6.label = "Bible background"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp3)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp3)-[:HAS_TARGET_COMPETENCY]->(tc4:TargetCompetency {id : "tc4"})
	SET tc4.label = "Demonstrate overall knowledge of the Bible, e.g. the geographical, cultural, social, historical and theological background and its relevance for translation. "
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID3"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp3)
	Merge (cmp3)-[:TARGET_VALUE_IS {planId: "2", min: 3}]->(ms)
	Merge (cmp3)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms2)

	//Comp		Trans-GUID4 in Trans-Exe-Bible
	MERGE (grp2)-[:GROUP_HAS_COMPETENCIES_OF {order: 7, planId: "2"}]->(cmp4:Competency {id: "Trans-GUID4"})-[:IS_IN_GROUP {order: 7, planId: "2"}]->(grp2)
	SET cmp4.label = "Biblical key terms",
		cmp4.default_weight = 1.0
	MERGE (cmp4)-[:HAS_SHORT_NAME]->(sn7:ShortName {id : "sn7"})
	SET sn7.label = "Biblical key terms"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp4)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp4)-[:HAS_TARGET_COMPETENCY]->(tc5:TargetCompetency {id : "tc5"})
	SET tc5.label = "Demonstrate a good understanding of the meanings of Biblical key terms/concepts."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID4"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp4)
	Merge (cmp4)-[:TARGET_VALUE_IS {planId: "2", min: 3}]->(ms)
	Merge (cmp4)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms2)

	//Comp		Trans-GUID5 in Trans-Exe-Bible
	MERGE (grp2)-[:GROUP_HAS_COMPETENCIES_OF {order: 8, planId: "2"}]->(cmp5:Competency {id: "Trans-GUID5"})-[:IS_IN_GROUP {order: 8, planId: "2"}]->(grp2)
	SET cmp5.label = "Intertextuality",
		cmp5.default_weight = 1.0
	MERGE (cmp5)-[:HAS_SHORT_NAME]->(sn8:ShortName {id : "sn8"})
	SET sn8.label = "Intertextuality"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp5)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp5)-[:HAS_TARGET_COMPETENCY]->(tc6:TargetCompetency {id : "tc6"})
	SET tc6.label = "Demonstrate a good understanding of intertextuality issues related to translation. "
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID5"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp5)
	Merge (cmp5)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp5)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Grp	Trans-Exe-BibLang in Trans-Exe
	MERGE (cat1)-[:HAS_GROUP {order: 9, planId: "2"}]->(grp3:CompetencyGroup {id: "Trans-Exe-BibLang"})-[:IS_IN_GROUP {order: 9, planId: "2"}]->(cat1)
	SET grp3.label = "C) Biblical languages"
	MERGE (grp3)-[:HAS_SHORT_NAME]->(sn9:ShortName {id : "sn9"})
	SET sn9.label = "C) Biblical languages"

	//Comp		Trans-GUID6 in Trans-Exe-BibLang
	MERGE (grp3)-[:GROUP_HAS_COMPETENCIES_OF {order: 10, planId: "2"}]->(cmp6:Competency {id: "Trans-GUID6"})-[:IS_IN_GROUP {order: 10, planId: "2"}]->(grp3)
	SET cmp6.label = "Biblical languages",
		cmp6.default_weight = 1.0
	MERGE (cmp6)-[:HAS_SHORT_NAME]->(sn10:ShortName {id : "sn10"})
	SET sn10.label = "Biblical languages"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp6)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp6)-[:HAS_TARGET_COMPETENCY]->(tc7:TargetCompetency {id : "tc7"})
	SET tc7.label = "Explain how the structure and properties of the Biblical languages (word order, use of articles, discourse structures, etc.) affect existing translations (which in turn affect the translation team). "
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID6"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp6)
	Merge (cmp6)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp6)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	RETURN cat1
`);

    q.push(cypher`
	MATCH (p:PlanRoot {id: "2"})
	MATCH (d:Domain {id: "2"})
	MATCH (pr:ProgressRoot {userId: "1"})
	MATCH (ms:Milestone {ms: "TransCons1"})
	MATCH (ms2:Milestone {ms: "Translator"})

	//CatTrans-Ling in 2
	MERGE (p)-[:HAS_CATEGORY {order: 11, planId: "2"}]->(cat2:CompetencyCategory {id: "Trans-Ling"})-[:IS_CATEGORY_OF {order: 11, planId: "2"}]->(p)
	SET cat2.label = "Linguistic Competencies",
		cat2.color = "red"
	MERGE (cat2)-[:HAS_SHORT_NAME]->(sn11:ShortName {id : "sn11"})
	SET sn11.label = "Linguistic Competencies"

	//Grp	Trans-Ling-Exp in Trans-Ling
	MERGE (cat2)-[:HAS_GROUP {order: 12, planId: "2"}]->(grp4:CompetencyGroup {id: "Trans-Ling-Exp"})-[:IS_IN_GROUP {order: 12, planId: "2"}]->(cat2)
	SET grp4.label = "A) Personal experience"
	MERGE (grp4)-[:HAS_SHORT_NAME]->(sn12:ShortName {id : "sn12"})
	SET sn12.label = "A) Personal experience"

	//Comp		Trans-GUID7 in Trans-Ling-Exp
	MERGE (grp4)-[:GROUP_HAS_COMPETENCIES_OF {order: 13, planId: "2"}]->(cmp7:Competency {id: "Trans-GUID7"})-[:IS_IN_GROUP {order: 13, planId: "2"}]->(grp4)
	SET cmp7.label = "Experience in foreign language",
		cmp7.default_weight = 1.0
	MERGE (cmp7)-[:HAS_SHORT_NAME]->(sn13:ShortName {id : "sn13"})
	SET sn13.label = "Experience in foreign language"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp7)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp7)-[:HAS_TARGET_COMPETENCY]->(tc8:TargetCompetency {id : "tc8"})
	SET tc8.label = "Converse in at least one language outside the language family of their native language. Has a personal experiential appreciation for the effect the difficulties of learning and processing a radically different language may have on the translation process. "
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID7"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp7)
	Merge (cmp7)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp7)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Grp	Trans-Ling-Typ in Trans-Ling
	MERGE (cat2)-[:HAS_GROUP {order: 14, planId: "2"}]->(grp5:CompetencyGroup {id: "Trans-Ling-Typ"})-[:IS_IN_GROUP {order: 14, planId: "2"}]->(cat2)
	SET grp5.label = "B) Language typology "
	MERGE (grp5)-[:HAS_SHORT_NAME]->(sn14:ShortName {id : "sn14"})
	SET sn14.label = "B) Language typology "

	//Comp		Trans-GUID8 in Trans-Ling-Typ
	MERGE (grp5)-[:GROUP_HAS_COMPETENCIES_OF {order: 15, planId: "2"}]->(cmp8:Competency {id: "Trans-GUID8"})-[:IS_IN_GROUP {order: 15, planId: "2"}]->(grp5)
	SET cmp8.label = "Language typology ",
		cmp8.default_weight = 1.0
	MERGE (cmp8)-[:HAS_SHORT_NAME]->(sn15:ShortName {id : "sn15"})
	SET sn15.label = "Language typology "
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp8)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp8)-[:HAS_TARGET_COMPETENCY]->(tc9:TargetCompetency {id : "tc9"})
	SET tc9.label = "Demonstrate an understanding of language typology and basic grammatical structures of the minority language(s) and LWC(s) and how this may affect translation."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID8"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp8)
	Merge (cmp8)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp8)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Grp	Trans-Ling-Disc in Trans-Ling
	MERGE (cat2)-[:HAS_GROUP {order: 16, planId: "2"}]->(grp6:CompetencyGroup {id: "Trans-Ling-Disc"})-[:IS_IN_GROUP {order: 16, planId: "2"}]->(cat2)
	SET grp6.label = "C) Discourse"
	MERGE (grp6)-[:HAS_SHORT_NAME]->(sn16:ShortName {id : "sn16"})
	SET sn16.label = "C) Discourse"

	//Comp		Trans-GUID9 in Trans-Ling-Disc
	MERGE (grp6)-[:GROUP_HAS_COMPETENCIES_OF {order: 17, planId: "2"}]->(cmp9:Competency {id: "Trans-GUID9"})-[:IS_IN_GROUP {order: 17, planId: "2"}]->(grp6)
	SET cmp9.label = "Discourse structures",
		cmp9.default_weight = 1.0
	MERGE (cmp9)-[:HAS_SHORT_NAME]->(sn17:ShortName {id : "sn17"})
	SET sn17.label = "Discourse structures"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp9)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp9)-[:HAS_TARGET_COMPETENCY]->(tc10:TargetCompetency {id : "tc10"})
	SET tc10.label = "Understand the basic discourse structures and features in a variety of genres in the source text (LWC, Hebrew or Greek) and in the receptor language and their impact on exegesis and translation."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID9"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp9)
	Merge (cmp9)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp9)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID10 in Trans-Ling-Disc
	MERGE (grp6)-[:GROUP_HAS_COMPETENCIES_OF {order: 18, planId: "2"}]->(cmp10:Competency {id: "Trans-GUID10"})-[:IS_IN_GROUP {order: 18, planId: "2"}]->(grp6)
	SET cmp10.label = "Discourse mismatch",
		cmp10.default_weight = 1.0
	MERGE (cmp10)-[:HAS_SHORT_NAME]->(sn18:ShortName {id : "sn18"})
	SET sn18.label = "Discourse mismatch"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp10)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp10)-[:HAS_TARGET_COMPETENCY]->(tc11:TargetCompetency {id : "tc11"})
	SET tc11.label = "Demonstrate a good understanding of areas of potential discourse mismatch between the Biblical, source and target languages."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID10"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp10)
	Merge (cmp10)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp10)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Grp	Trans-Ling-Socio in Trans-Ling
	MERGE (cat2)-[:HAS_GROUP {order: 19, planId: "2"}]->(grp7:CompetencyGroup {id: "Trans-Ling-Socio"})-[:IS_IN_GROUP {order: 19, planId: "2"}]->(cat2)
	SET grp7.label = "D) Sociolinguistics"
	MERGE (grp7)-[:HAS_SHORT_NAME]->(sn19:ShortName {id : "sn19"})
	SET sn19.label = "D) Sociolinguistics"

	//Comp		Trans-GUID11 in Trans-Ling-Socio
	MERGE (grp7)-[:GROUP_HAS_COMPETENCIES_OF {order: 20, planId: "2"}]->(cmp11:Competency {id: "Trans-GUID11"})-[:IS_IN_GROUP {order: 20, planId: "2"}]->(grp7)
	SET cmp11.label = "Sociolinguistics and pragmatics ",
		cmp11.default_weight = 1.0
	MERGE (cmp11)-[:HAS_SHORT_NAME]->(sn20:ShortName {id : "sn20"})
	SET sn20.label = "Sociolinguistics and pragmatics "
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp11)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp11)-[:HAS_TARGET_COMPETENCY]->(tc12:TargetCompetency {id : "tc12"})
	SET tc12.label = "Demonstrate a good understanding of the linguistic-pragmatic and sociolinguistic aspects of languages (e.g. language style, register, various pragmatic-linguistic functions of language, politeness, inferences, linguistic variation, multilingualism, language attitudes etc.) and their impact upon the translation."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID11"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp11)
	Merge (cmp11)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp11)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID12 in Trans-Ling-Socio
	MERGE (grp7)-[:GROUP_HAS_COMPETENCIES_OF {order: 21, planId: "2"}]->(cmp12:Competency {id: "Trans-GUID12"})-[:IS_IN_GROUP {order: 21, planId: "2"}]->(grp7)
	SET cmp12.label = "Sociolinguistics and pragmatics ",
		cmp12.default_weight = 1.0
	MERGE (cmp12)-[:HAS_SHORT_NAME]->(sn21:ShortName {id : "sn21"})
	SET sn21.label = "Sociolinguistics and pragmatics "
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp12)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp12)-[:HAS_TARGET_COMPETENCY]->(tc13:TargetCompetency {id : "tc13"})
	SET tc13.label = "Demonstrate an understanding of the impact of the sociolinguistic context (e.g. impact of gender, dialect, register, voice quality) on the acceptability of written and audio Scripture."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID12"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp12)
	Merge (cmp12)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp12)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	RETURN cat2
`);

    q.push(cypher`
	MATCH (p:PlanRoot {id: "2"})
	MATCH (d:Domain {id: "2"})
	MATCH (pr:ProgressRoot {userId: "1"})
	MATCH (ms:Milestone {ms: "TransCons1"})
	MATCH (ms2:Milestone {ms: "Translator"})

	//CatTrans-Proc in 2
	MERGE (p)-[:HAS_CATEGORY {order: 22, planId: "2"}]->(cat3:CompetencyCategory {id: "Trans-Proc"})-[:IS_CATEGORY_OF {order: 22, planId: "2"}]->(p)
	SET cat3.label = "Translation Competencies",
		cat3.color = "green"
	MERGE (cat3)-[:HAS_SHORT_NAME]->(sn22:ShortName {id : "sn22"})
	SET sn22.label = "Translation Competencies"
	MERGE (cat3)-[:HAS_TARGET_COMPETENCY]->(tc14:TargetCompetency {id : "tc14"})
	SET tc14.label = "It is fundamental that a translation consultant demonstrates critical thinking skills and a clear understanding of best practices in translation in general and Bible translation in particular (including drafting, checking procedures, exegetical checks, comprehension checks, naturalness checks, and acceptability checks). "

	//Grp	Trans-Proc-Problems in Trans-Proc
	MERGE (cat3)-[:HAS_GROUP {order: 23, planId: "2"}]->(grp8:CompetencyGroup {id: "Trans-Proc-Problems"})-[:IS_IN_GROUP {order: 23, planId: "2"}]->(cat3)
	SET grp8.label = "A) Deal with translation problems"
	MERGE (grp8)-[:HAS_SHORT_NAME]->(sn23:ShortName {id : "sn23"})
	SET sn23.label = "A) Deal with translation problems"

	//Comp		Trans-GUID13 in Trans-Proc-Problems
	MERGE (grp8)-[:GROUP_HAS_COMPETENCIES_OF {order: 24, planId: "2"}]->(cmp13:Competency {id: "Trans-GUID13"})-[:IS_IN_GROUP {order: 24, planId: "2"}]->(grp8)
	SET cmp13.label = "Identify potential problems",
		cmp13.default_weight = 1.0
	MERGE (cmp13)-[:HAS_SHORT_NAME]->(sn24:ShortName {id : "sn24"})
	SET sn24.label = "Identify potential problems"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp13)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp13)-[:HAS_TARGET_COMPETENCY]->(tc15:TargetCompetency {id : "tc15"})
	SET tc15.label = "Identify a (potential) problem in translation, think about alternative solutions, and evaluate those solutions based on sound reasoning."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID13"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp13)
	Merge (cmp13)-[:TARGET_VALUE_IS {planId: "2", min: 3}]->(ms)
	Merge (cmp13)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms2)

	//Comp		Trans-GUID14 in Trans-Proc-Problems
	MERGE (grp8)-[:GROUP_HAS_COMPETENCIES_OF {order: 25, planId: "2"}]->(cmp14:Competency {id: "Trans-GUID14"})-[:IS_IN_GROUP {order: 25, planId: "2"}]->(grp8)
	SET cmp14.label = "Evaluate problems",
		cmp14.default_weight = 1.0
	MERGE (cmp14)-[:HAS_SHORT_NAME]->(sn25:ShortName {id : "sn25"})
	SET sn25.label = "Evaluate problems"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp14)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp14)-[:HAS_TARGET_COMPETENCY]->(tc16:TargetCompetency {id : "tc16"})
	SET tc16.label = "Evaluate whether a potential problem of a translation is a real problem based on clear, systematic thinking."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID14"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp14)
	Merge (cmp14)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp14)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID15 in Trans-Proc-Problems
	MERGE (grp8)-[:GROUP_HAS_COMPETENCIES_OF {order: 26, planId: "2"}]->(cmp15:Competency {id: "Trans-GUID15"})-[:IS_IN_GROUP {order: 26, planId: "2"}]->(grp8)
	SET cmp15.label = "Solve problems",
		cmp15.default_weight = 1.0
	MERGE (cmp15)-[:HAS_SHORT_NAME]->(sn26:ShortName {id : "sn26"})
	SET sn26.label = "Solve problems"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp15)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp15)-[:HAS_TARGET_COMPETENCY]->(tc17:TargetCompetency {id : "tc17"})
	SET tc17.label = "Demonstrate a good understanding of frequently occurring translation problems (related to participant reference, foreign concepts, metaphors, rhetorical questions, lexical choices, culture and worldview interference, implicit information, key terms etc.) and of ways to solve these problems."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID15"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp15)
	Merge (cmp15)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp15)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID16 in Trans-Proc-Problems
	MERGE (grp8)-[:GROUP_HAS_COMPETENCIES_OF {order: 28, planId: "2"}]->(cmp16:Competency {id: "Trans-GUID16"})-[:IS_IN_GROUP {order: 28, planId: "2"}]->(grp8)
	SET cmp16.label = "Theological awareness",
		cmp16.default_weight = 1.0
	MERGE (cmp16)-[:HAS_SHORT_NAME]->(sn27:ShortName {id : "sn27"})
	SET sn27.label = "Theological awareness"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp16)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp16)-[:HAS_TARGET_COMPETENCY]->(tc18:TargetCompetency {id : "tc18"})
	SET tc18.label = "Detect theological bias in translations and to help translation teams to remove those biases from the translation. "
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID16"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp16)
	Merge (cmp16)-[:TARGET_VALUE_IS {planId: "2", min: 3}]->(ms)
	Merge (cmp16)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms2)

	//Grp	Trans-Proc-Teams in Trans-Proc
	MERGE (cat3)-[:HAS_GROUP {order: 29, planId: "2"}]->(grp9:CompetencyGroup {id: "Trans-Proc-Teams"})-[:IS_IN_GROUP {order: 29, planId: "2"}]->(cat3)
	SET grp9.label = "B) Work with translation team"
	MERGE (grp9)-[:HAS_SHORT_NAME]->(sn28:ShortName {id : "sn28"})
	SET sn28.label = "B) Work with translation team"

	//Comp		Trans-GUID17 in Trans-Proc-Teams
	MERGE (grp9)-[:GROUP_HAS_COMPETENCIES_OF {order: 30, planId: "2"}]->(cmp17:Competency {id: "Trans-GUID17"})-[:IS_IN_GROUP {order: 30, planId: "2"}]->(grp9)
	SET cmp17.label = "Translation roles",
		cmp17.default_weight = 1.0
	MERGE (cmp17)-[:HAS_SHORT_NAME]->(sn29:ShortName {id : "sn29"})
	SET sn29.label = "Translation roles"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp17)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp17)-[:HAS_TARGET_COMPETENCY]->(tc19:TargetCompetency {id : "tc19"})
	SET tc19.label = "Explain the different roles and responsibilities of translators, translation facilitators, translation consultants. "
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID17"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp17)
	Merge (cmp17)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp17)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID18 in Trans-Proc-Teams
	MERGE (grp9)-[:GROUP_HAS_COMPETENCIES_OF {order: 31, planId: "2"}]->(cmp18:Competency {id: "Trans-GUID18"})-[:IS_IN_GROUP {order: 31, planId: "2"}]->(grp9)
	SET cmp18.label = "Prepare for consultant check",
		cmp18.default_weight = 1.0
	MERGE (cmp18)-[:HAS_SHORT_NAME]->(sn30:ShortName {id : "sn30"})
	SET sn30.label = "Prepare for consultant check"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp18)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp18)-[:HAS_TARGET_COMPETENCY]->(tc20:TargetCompetency {id : "tc20"})
	SET tc20.label = "Prepare for a consultant check, analyze written back translations, write clear and concise exegetical notes for translation teams, to actually do a face-to-face consultant check as well as remote check, and to follow up on the consultant check."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID18"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp18)
	Merge (cmp18)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp18)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID19 in Trans-Proc-Teams
	MERGE (grp9)-[:GROUP_HAS_COMPETENCIES_OF {order: 32, planId: "2"}]->(cmp19:Competency {id: "Trans-GUID19"})-[:IS_IN_GROUP {order: 32, planId: "2"}]->(grp9)
	SET cmp19.label = "Train translation team",
		cmp19.default_weight = 1.0
	MERGE (cmp19)-[:HAS_SHORT_NAME]->(sn31:ShortName {id : "sn31"})
	SET sn31.label = "Train translation team"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp19)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp19)-[:HAS_TARGET_COMPETENCY]->(tc21:TargetCompetency {id : "tc21"})
	SET tc21.label = "Guide and assist the translation team in drafting a section of Scripture. This includes, but is not limited to, exegesis, internalization, drafting, oral drafting, and quality assessment of the draft in relation to the source text and project goals. "
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID19"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp19)
	Merge (cmp19)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp19)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID20 in Trans-Proc-Teams
	MERGE (grp9)-[:GROUP_HAS_COMPETENCIES_OF {order: 33, planId: "2"}]->(cmp20:Competency {id: "Trans-GUID20"})-[:IS_IN_GROUP {order: 33, planId: "2"}]->(grp9)
	SET cmp20.label = "Translation styles",
		cmp20.default_weight = 1.0
	MERGE (cmp20)-[:HAS_SHORT_NAME]->(sn32:ShortName {id : "sn32"})
	SET sn32.label = "Translation styles"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp20)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp20)-[:HAS_TARGET_COMPETENCY]->(tc22:TargetCompetency {id : "tc22"})
	SET tc22.label = "Demonstrate a good understanding of different translation styles appropriate for different audiences and of the sociolinguistic factors that play a role in regard to making decisions related to translation style."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID20"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp20)
	Merge (cmp20)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp20)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID21 in Trans-Proc-Teams
	MERGE (grp9)-[:GROUP_HAS_COMPETENCIES_OF {order: 34, planId: "2"}]->(cmp21:Competency {id: "Trans-GUID21"})-[:IS_IN_GROUP {order: 34, planId: "2"}]->(grp9)
	SET cmp21.label = "Biblical genres",
		cmp21.default_weight = 1.0
	MERGE (cmp21)-[:HAS_SHORT_NAME]->(sn33:ShortName {id : "sn33"})
	SET sn33.label = "Biblical genres"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp21)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp21)-[:HAS_TARGET_COMPETENCY]->(tc23:TargetCompetency {id : "tc23"})
	SET tc23.label = "Explain the differences to the translation team between different genres in the Bible (narrative, poetic, epistolary, prophetic) and the implications for translation."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID21"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp21)
	Merge (cmp21)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp21)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID22 in Trans-Proc-Teams
	MERGE (grp9)-[:GROUP_HAS_COMPETENCIES_OF {order: 35, planId: "2"}]->(cmp22:Competency {id: "Trans-GUID22"})-[:IS_IN_GROUP {order: 35, planId: "2"}]->(grp9)
	SET cmp22.label = "Back translations",
		cmp22.default_weight = 1.0
	MERGE (cmp22)-[:HAS_SHORT_NAME]->(sn34:ShortName {id : "sn34"})
	SET sn34.label = "Back translations"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp22)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp22)-[:HAS_TARGET_COMPETENCY]->(tc24:TargetCompetency {id : "tc24"})
	SET tc24.label = "Train the translation team in how to elicit or produce back translations and then verify them."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID22"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp22)
	Merge (cmp22)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp22)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID23 in Trans-Proc-Teams
	MERGE (grp9)-[:GROUP_HAS_COMPETENCIES_OF {order: 36, planId: "2"}]->(cmp23:Competency {id: "Trans-GUID23"})-[:IS_IN_GROUP {order: 36, planId: "2"}]->(grp9)
	SET cmp23.label = "Comprehension check",
		cmp23.default_weight = 1.0
	MERGE (cmp23)-[:HAS_SHORT_NAME]->(sn35:ShortName {id : "sn35"})
	SET sn35.label = "Comprehension check"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp23)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp23)-[:HAS_TARGET_COMPETENCY]->(tc25:TargetCompetency {id : "tc25"})
	SET tc25.label = "Model, mentor and conduct good comprehension checks (including issues of naturalness and acceptability) with native speakers of the receptor language. "
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID23"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp23)
	Merge (cmp23)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp23)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Grp	Trans-Proc-xText in Trans-Proc
	MERGE (cat3)-[:HAS_GROUP {order: 37, planId: "2"}]->(grp10:CompetencyGroup {id: "Trans-Proc-xText"})-[:IS_IN_GROUP {order: 37, planId: "2"}]->(cat3)
	SET grp10.label = "C) Extra textual considerations"
	MERGE (grp10)-[:HAS_SHORT_NAME]->(sn36:ShortName {id : "sn36"})
	SET sn36.label = "C) Extra textual considerations"

	//Comp		Trans-GUID24 in Trans-Proc-xText
	MERGE (grp10)-[:GROUP_HAS_COMPETENCIES_OF {order: 38, planId: "2"}]->(cmp24:Competency {id: "Trans-GUID24"})-[:IS_IN_GROUP {order: 38, planId: "2"}]->(grp10)
	SET cmp24.label = "Impact of performance on meaning",
		cmp24.default_weight = 1.0
	MERGE (cmp24)-[:HAS_SHORT_NAME]->(sn37:ShortName {id : "sn37"})
	SET sn37.label = "Impact of performance on meaning"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp24)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp24)-[:HAS_TARGET_COMPETENCY]->(tc26:TargetCompetency {id : "tc26"})
	SET tc26.label = "Demonstrate an understanding of the impact of performance upon the meaning of the text/audio. Demonstrate familiarity with different theories of communication, the role of the communicator, the role of the audience, and the impact upon meaning. "
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID24"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp24)
	Merge (cmp24)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp24)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID25 in Trans-Proc-xText
	MERGE (grp10)-[:GROUP_HAS_COMPETENCIES_OF {order: 39, planId: "2"}]->(cmp25:Competency {id: "Trans-GUID25"})-[:IS_IN_GROUP {order: 39, planId: "2"}]->(grp10)
	SET cmp25.label = "Adaptation to audio",
		cmp25.default_weight = 1.0
	MERGE (cmp25)-[:HAS_SHORT_NAME]->(sn38:ShortName {id : "sn38"})
	SET sn38.label = "Adaptation to audio"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp25)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp25)-[:HAS_TARGET_COMPETENCY]->(tc27:TargetCompetency {id : "tc27"})
	SET tc27.label = "Demonstrate an understanding of the issues associated with adapting written text to audio and recorded audio to text and the ability to help a team think through the issues and choose appropriate translation solutions."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID25"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp25)
	Merge (cmp25)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp25)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID26 in Trans-Proc-xText
	MERGE (grp10)-[:GROUP_HAS_COMPETENCIES_OF {order: 40, planId: "2"}]->(cmp26:Competency {id: "Trans-GUID26"})-[:IS_IN_GROUP {order: 40, planId: "2"}]->(grp10)
	SET cmp26.label = "Paratextual materials",
		cmp26.default_weight = 1.0
	MERGE (cmp26)-[:HAS_SHORT_NAME]->(sn39:ShortName {id : "sn39"})
	SET sn39.label = "Paratextual materials"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp26)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp26)-[:HAS_TARGET_COMPETENCY]->(tc28:TargetCompetency {id : "tc28"})
	SET tc28.label = "Demonstrate a clear understanding of the use of paratextual materials (e.g. footnotes, pictures, headings, introduction) and their impact upon the meaning of Scripture (e.g. written, audio) and their impact upon people's engagement with Scripture (e.g. written, audio). The ability to assess the impact of paratextual materials and advise the team on making appropriate decisions about paratextual material."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID26"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp26)
	Merge (cmp26)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp26)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	RETURN cat3
`);

    q.push(cypher`
	MATCH (p:PlanRoot {id: "2"})
	MATCH (d:Domain {id: "2"})
	MATCH (pr:ProgressRoot {userId: "1"})
	MATCH (ms:Milestone {ms: "TransCons1"})
	MATCH (ms2:Milestone {ms: "Translator"})

	//CatTrans-Lang in 2
	MERGE (p)-[:HAS_CATEGORY {order: 41, planId: "2"}]->(cat4:CompetencyCategory {id: "Trans-Lang"})-[:IS_CATEGORY_OF {order: 41, planId: "2"}]->(p)
	SET cat4.label = "Language and Culture",
		cat4.color = "orange"
	MERGE (cat4)-[:HAS_SHORT_NAME]->(sn40:ShortName {id : "sn40"})
	SET sn40.label = "Language and Culture"
	MERGE (cat4)-[:HAS_TARGET_COMPETENCY]->(tc29:TargetCompetency {id : "tc29"})
	SET tc29.label = "Technical competencies are normally performed in multi-language, multicultural environments. Good communication through language, together with an appropriate cultural mindset and basic anthropological skills becomes increasingly important as a person's technical competencies and range of responsibilities increase. LWC=Language of wider communication used in the area where the consultant primarily works (some consultants may require proficiency in more than one); L1=first language; L2=second language (at a degree of proficiency sufficient for normal work activities)."

	//Grp	Trans-Lang-Commun in Trans-Lang
	MERGE (cat4)-[:HAS_GROUP {order: 42, planId: "2"}]->(grp11:CompetencyGroup {id: "Trans-Lang-Commun"})-[:IS_IN_GROUP {order: 42, planId: "2"}]->(cat4)
	SET grp11.label = "A) Communicate using LWC"
	MERGE (grp11)-[:HAS_SHORT_NAME]->(sn41:ShortName {id : "sn41"})
	SET sn41.label = "A) Communicate using LWC"

	//Comp		Trans-GUID27 in Trans-Lang-Commun
	MERGE (grp11)-[:GROUP_HAS_COMPETENCIES_OF {order: 43, planId: "2"}]->(cmp27:Competency {id: "Trans-GUID27"})-[:IS_IN_GROUP {order: 43, planId: "2"}]->(grp11)
	SET cmp27.label = "Communicate in LWC",
		cmp27.default_weight = 1.0
	MERGE (cmp27)-[:HAS_SHORT_NAME]->(sn42:ShortName {id : "sn42"})
	SET sn42.label = "Communicate in LWC"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp27)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp27)-[:HAS_TARGET_COMPETENCY]->(tc30:TargetCompetency {id : "tc30"})
	SET tc30.label = "Listen and communicate well in the LWC with people from a variety of language communities."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID27"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp27)
	Merge (cmp27)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp27)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID28 in Trans-Lang-Commun
	MERGE (grp11)-[:GROUP_HAS_COMPETENCIES_OF {order: 44, planId: "2"}]->(cmp28:Competency {id: "Trans-GUID28"})-[:IS_IN_GROUP {order: 44, planId: "2"}]->(grp11)
	SET cmp28.label = "Choose LWC",
		cmp28.default_weight = 1.0
	MERGE (cmp28)-[:HAS_SHORT_NAME]->(sn43:ShortName {id : "sn43"})
	SET sn43.label = "Choose LWC"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp28)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp28)-[:HAS_TARGET_COMPETENCY]->(tc31:TargetCompetency {id : "tc31"})
	SET tc31.label = "Choose the most appropriate language(s) from their repertoire for each context and be aware of the social implications of their language choice."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID28"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp28)
	Merge (cmp28)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp28)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID29 in Trans-Lang-Commun
	MERGE (grp11)-[:GROUP_HAS_COMPETENCIES_OF {order: 45, planId: "2"}]->(cmp29:Competency {id: "Trans-GUID29"})-[:IS_IN_GROUP {order: 45, planId: "2"}]->(grp11)
	SET cmp29.label = "Instruct in LWC",
		cmp29.default_weight = 1.0
	MERGE (cmp29)-[:HAS_SHORT_NAME]->(sn44:ShortName {id : "sn44"})
	SET sn44.label = "Instruct in LWC"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp29)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp29)-[:HAS_TARGET_COMPETENCY]->(tc32:TargetCompetency {id : "tc32"})
	SET tc32.label = "Use the LWC to design and lead instruction in multicultural contexts."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID29"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp29)
	Merge (cmp29)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp29)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID30 in Trans-Lang-Commun
	MERGE (grp11)-[:GROUP_HAS_COMPETENCIES_OF {order: 46, planId: "2"}]->(cmp30:Competency {id: "Trans-GUID30"})-[:IS_IN_GROUP {order: 46, planId: "2"}]->(grp11)
	SET cmp30.label = "Mentor in LWC",
		cmp30.default_weight = 1.0
	MERGE (cmp30)-[:HAS_SHORT_NAME]->(sn45:ShortName {id : "sn45"})
	SET sn45.label = "Mentor in LWC"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp30)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp30)-[:HAS_TARGET_COMPETENCY]->(tc33:TargetCompetency {id : "tc33"})
	SET tc33.label = "Coach and mentor others through the LWC."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID30"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp30)
	Merge (cmp30)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp30)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID31 in Trans-Lang-Commun
	MERGE (grp11)-[:GROUP_HAS_COMPETENCIES_OF {order: 47, planId: "2"}]->(cmp31:Competency {id: "Trans-GUID31"})-[:IS_IN_GROUP {order: 47, planId: "2"}]->(grp11)
	SET cmp31.label = "Present in LWC",
		cmp31.default_weight = 1.0
	MERGE (cmp31)-[:HAS_SHORT_NAME]->(sn46:ShortName {id : "sn46"})
	SET sn46.label = "Present in LWC"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp31)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp31)-[:HAS_TARGET_COMPETENCY]->(tc34:TargetCompetency {id : "tc34"})
	SET tc34.label = "Prepare proposals, reports, and presentations in the LWC."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID31"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp31)
	Merge (cmp31)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp31)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID32 in Trans-Lang-Commun
	MERGE (grp11)-[:GROUP_HAS_COMPETENCIES_OF {order: 48, planId: "2"}]->(cmp32:Competency {id: "Trans-GUID32"})-[:IS_IN_GROUP {order: 48, planId: "2"}]->(grp11)
	SET cmp32.label = "Assess in LWC",
		cmp32.default_weight = 1.0
	MERGE (cmp32)-[:HAS_SHORT_NAME]->(sn47:ShortName {id : "sn47"})
	SET sn47.label = "Assess in LWC"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp32)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp32)-[:HAS_TARGET_COMPETENCY]->(tc35:TargetCompetency {id : "tc35"})
	SET tc35.label = "Assess and evaluate fairly the work of individuals and project teams in the LWC."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID32"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp32)
	Merge (cmp32)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp32)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Grp	Trans-Lang-Creative in Trans-Lang
	MERGE (cat4)-[:HAS_GROUP {order: 49, planId: "2"}]->(grp12:CompetencyGroup {id: "Trans-Lang-Creative"})-[:IS_IN_GROUP {order: 49, planId: "2"}]->(cat4)
	SET grp12.label = "B) Creative use of LWC"
	MERGE (grp12)-[:HAS_SHORT_NAME]->(sn48:ShortName {id : "sn48"})
	SET sn48.label = "B) Creative use of LWC"

	//Comp		Trans-GUID33 in Trans-Lang-Creative
	MERGE (grp12)-[:GROUP_HAS_COMPETENCIES_OF {order: 50, planId: "2"}]->(cmp33:Competency {id: "Trans-GUID33"})-[:IS_IN_GROUP {order: 50, planId: "2"}]->(grp12)
	SET cmp33.label = "Create materials in LWC",
		cmp33.default_weight = 1.0
	MERGE (cmp33)-[:HAS_SHORT_NAME]->(sn49:ShortName {id : "sn49"})
	SET sn49.label = "Create materials in LWC"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp33)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp33)-[:HAS_TARGET_COMPETENCY]->(tc36:TargetCompetency {id : "tc36"})
	SET tc36.label = "Develop or adapt materials for instructional use and for publication in the LWC."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID33"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp33)
	Merge (cmp33)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms)
	Merge (cmp33)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID34 in Trans-Lang-Creative
	MERGE (grp12)-[:GROUP_HAS_COMPETENCIES_OF {order: 51, planId: "2"}]->(cmp34:Competency {id: "Trans-GUID34"})-[:IS_IN_GROUP {order: 51, planId: "2"}]->(grp12)
	SET cmp34.label = "Participate in community in LWC",
		cmp34.default_weight = 1.0
	MERGE (cmp34)-[:HAS_SHORT_NAME]->(sn50:ShortName {id : "sn50"})
	SET sn50.label = "Participate in community in LWC"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp34)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp34)-[:HAS_TARGET_COMPETENCY]->(tc37:TargetCompetency {id : "tc37"})
	SET tc37.label = "Contribute to a community of practice [CoP] through the LWC."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID34"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp34)
	Merge (cmp34)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms)
	Merge (cmp34)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID35 in Trans-Lang-Creative
	MERGE (grp12)-[:GROUP_HAS_COMPETENCIES_OF {order: 52, planId: "2"}]->(cmp35:Competency {id: "Trans-GUID35"})-[:IS_IN_GROUP {order: 52, planId: "2"}]->(grp12)
	SET cmp35.label = "Research in LWC",
		cmp35.default_weight = 1.0
	MERGE (cmp35)-[:HAS_SHORT_NAME]->(sn51:ShortName {id : "sn51"})
	SET sn51.label = "Research in LWC"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp35)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp35)-[:HAS_TARGET_COMPETENCY]->(tc38:TargetCompetency {id : "tc38"})
	SET tc38.label = "Perform research which involves reading published technical materials in his/her specialty through the LWC."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID35"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp35)
	Merge (cmp35)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms)
	Merge (cmp35)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID36 in Trans-Lang-Creative
	MERGE (grp12)-[:GROUP_HAS_COMPETENCIES_OF {order: 53, planId: "2"}]->(cmp36:Competency {id: "Trans-GUID36"})-[:IS_IN_GROUP {order: 53, planId: "2"}]->(grp12)
	SET cmp36.label = "Write in LWC for L2 speakers",
		cmp36.default_weight = 1.0
	MERGE (cmp36)-[:HAS_SHORT_NAME]->(sn52:ShortName {id : "sn52"})
	SET sn52.label = "Write in LWC for L2 speakers"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp36)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp36)-[:HAS_TARGET_COMPETENCY]->(tc39:TargetCompetency {id : "tc39"})
	SET tc39.label = "Write in the LWC so that L2 readers can understand easily."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID36"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp36)
	Merge (cmp36)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp36)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Grp	Trans-Lang-CrossCulture in Trans-Lang
	MERGE (cat4)-[:HAS_GROUP {order: 54, planId: "2"}]->(grp13:CompetencyGroup {id: "Trans-Lang-CrossCulture"})-[:IS_IN_GROUP {order: 54, planId: "2"}]->(cat4)
	SET grp13.label = "C) Cross-cultural Research"
	MERGE (grp13)-[:HAS_SHORT_NAME]->(sn53:ShortName {id : "sn53"})
	SET sn53.label = "C) Cross-cultural Research"

	//Comp		Trans-GUID37 in Trans-Lang-CrossCulture
	MERGE (grp13)-[:GROUP_HAS_COMPETENCIES_OF {order: 55, planId: "2"}]->(cmp37:Competency {id: "Trans-GUID37"})-[:IS_IN_GROUP {order: 55, planId: "2"}]->(grp13)
	SET cmp37.label = "Cross-cultural research: execute",
		cmp37.default_weight = 1.0
	MERGE (cmp37)-[:HAS_SHORT_NAME]->(sn54:ShortName {id : "sn54"})
	SET sn54.label = "Cross-cultural research: execute"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp37)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp37)-[:HAS_TARGET_COMPETENCY]->(tc40:TargetCompetency {id : "tc40"})
	SET tc40.label = "Choose and apply appropriate research skills to better understand cross-cultural experiences and situations."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID37"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp37)
	Merge (cmp37)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp37)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID38 in Trans-Lang-CrossCulture
	MERGE (grp13)-[:GROUP_HAS_COMPETENCIES_OF {order: 56, planId: "2"}]->(cmp38:Competency {id: "Trans-GUID38"})-[:IS_IN_GROUP {order: 56, planId: "2"}]->(grp13)
	SET cmp38.label = "Cross-cultural research: analyze",
		cmp38.default_weight = 1.0
	MERGE (cmp38)-[:HAS_SHORT_NAME]->(sn55:ShortName {id : "sn55"})
	SET sn55.label = "Cross-cultural research: analyze"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp38)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp38)-[:HAS_TARGET_COMPETENCY]->(tc41:TargetCompetency {id : "tc41"})
	SET tc41.label = "Find implications of results and share them with others."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID38"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp38)
	Merge (cmp38)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp38)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID39 in Trans-Lang-CrossCulture
	MERGE (grp13)-[:GROUP_HAS_COMPETENCIES_OF {order: 57, planId: "2"}]->(cmp39:Competency {id: "Trans-GUID39"})-[:IS_IN_GROUP {order: 57, planId: "2"}]->(grp13)
	SET cmp39.label = "Cross-cultural research: apply",
		cmp39.default_weight = 1.0
	MERGE (cmp39)-[:HAS_SHORT_NAME]->(sn56:ShortName {id : "sn56"})
	SET sn56.label = "Cross-cultural research: apply"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp39)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp39)-[:HAS_TARGET_COMPETENCY]->(tc42:TargetCompetency {id : "tc42"})
	SET tc42.label = "Use research findings to improve consulting strategies and practices."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID39"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp39)
	Merge (cmp39)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp39)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID40 in Trans-Lang-CrossCulture
	MERGE (grp13)-[:GROUP_HAS_COMPETENCIES_OF {order: 58, planId: "2"}]->(cmp40:Competency {id: "Trans-GUID40"})-[:IS_IN_GROUP {order: 58, planId: "2"}]->(grp13)
	SET cmp40.label = "Cross-cultural research: document",
		cmp40.default_weight = 1.0
	MERGE (cmp40)-[:HAS_SHORT_NAME]->(sn57:ShortName {id : "sn57"})
	SET sn57.label = "Cross-cultural research: document"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp40)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp40)-[:HAS_TARGET_COMPETENCY]->(tc43:TargetCompetency {id : "tc43"})
	SET tc43.label = "Document research findings so they can be shared in the organization and beyond."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID40"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp40)
	Merge (cmp40)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms)
	Merge (cmp40)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID41 in Trans-Lang-CrossCulture
	MERGE (grp13)-[:GROUP_HAS_COMPETENCIES_OF {order: 59, planId: "2"}]->(cmp41:Competency {id: "Trans-GUID41"})-[:IS_IN_GROUP {order: 59, planId: "2"}]->(grp13)
	SET cmp41.label = "Cross-cultural research: train",
		cmp41.default_weight = 1.0
	MERGE (cmp41)-[:HAS_SHORT_NAME]->(sn58:ShortName {id : "sn58"})
	SET sn58.label = "Cross-cultural research: train"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp41)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp41)-[:HAS_TARGET_COMPETENCY]->(tc44:TargetCompetency {id : "tc44"})
	SET tc44.label = "Help others to be reflexive and to apply basic anthropological skills."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID41"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp41)
	Merge (cmp41)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp41)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	RETURN cat4
`);

    q.push(cypher`
	MATCH (p:PlanRoot {id: "2"})
	MATCH (d:Domain {id: "2"})
	MATCH (pr:ProgressRoot {userId: "1"})
	MATCH (ms:Milestone {ms: "TransCons1"})
	MATCH (ms2:Milestone {ms: "Translator"})

	//CatTrans-Culture in 2
	MERGE (p)-[:HAS_CATEGORY {order: 60, planId: "2"}]->(cat5:CompetencyCategory {id: "Trans-Culture"})-[:IS_CATEGORY_OF {order: 60, planId: "2"}]->(p)
	SET cat5.label = "Working in a Multicultural Environment",
		cat5.color = "violet"
	MERGE (cat5)-[:HAS_SHORT_NAME]->(sn59:ShortName {id : "sn59"})
	SET sn59.label = "Working in a Multicultural Environment"
	MERGE (cat5)-[:HAS_TARGET_COMPETENCY]->(tc45:TargetCompetency {id : "tc45"})
	SET tc45.label = "Consulting effectively in a multicultural environment involves understanding the cultural values of each person and the dynamics of communication in a group or team situation. It requires being able to adapt one's own communication style, and to give and receive feedback in a manner that befits the group dynamics."

	//Grp	Trans-Culture-Work in Trans-Culture
	MERGE (cat5)-[:HAS_GROUP {order: 61, planId: "2"}]->(grp14:CompetencyGroup {id: "Trans-Culture-Work"})-[:IS_IN_GROUP {order: 61, planId: "2"}]->(cat5)
	SET grp14.label = "A) Work with others cross-culturally"
	MERGE (grp14)-[:HAS_SHORT_NAME]->(sn60:ShortName {id : "sn60"})
	SET sn60.label = "A) Work with others cross-culturally"

	//Comp		Trans-GUID42 in Trans-Culture-Work
	MERGE (grp14)-[:GROUP_HAS_COMPETENCIES_OF {order: 62, planId: "2"}]->(cmp42:Competency {id: "Trans-GUID42"})-[:IS_IN_GROUP {order: 62, planId: "2"}]->(grp14)
	SET cmp42.label = "Understand patterns of communication",
		cmp42.default_weight = 1.0
	MERGE (cmp42)-[:HAS_SHORT_NAME]->(sn61:ShortName {id : "sn61"})
	SET sn61.label = "Understand patterns of communication"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp42)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp42)-[:HAS_TARGET_COMPETENCY]->(tc46:TargetCompetency {id : "tc46"})
	SET tc46.label = "Identify and understand different patterns of communication."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID42"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp42)
	Merge (cmp42)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp42)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID43 in Trans-Culture-Work
	MERGE (grp14)-[:GROUP_HAS_COMPETENCIES_OF {order: 63, planId: "2"}]->(cmp43:Competency {id: "Trans-GUID43"})-[:IS_IN_GROUP {order: 63, planId: "2"}]->(grp14)
	SET cmp43.label = "Relate in different communication styles",
		cmp43.default_weight = 1.0
	MERGE (cmp43)-[:HAS_SHORT_NAME]->(sn62:ShortName {id : "sn62"})
	SET sn62.label = "Relate in different communication styles"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp43)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp43)-[:HAS_TARGET_COMPETENCY]->(tc47:TargetCompetency {id : "tc47"})
	SET tc47.label = "Communicate and relate effectively with people of different communication styles, being aware of the impact of body language."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID43"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp43)
	Merge (cmp43)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp43)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID44 in Trans-Culture-Work
	MERGE (grp14)-[:GROUP_HAS_COMPETENCIES_OF {order: 64, planId: "2"}]->(cmp44:Competency {id: "Trans-GUID44"})-[:IS_IN_GROUP {order: 64, planId: "2"}]->(grp14)
	SET cmp44.label = "Complete team assignments",
		cmp44.default_weight = 1.0
	MERGE (cmp44)-[:HAS_SHORT_NAME]->(sn63:ShortName {id : "sn63"})
	SET sn63.label = "Complete team assignments"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp44)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp44)-[:HAS_TARGET_COMPETENCY]->(tc48:TargetCompetency {id : "tc48"})
	SET tc48.label = "Complete team assignments acceptably where applicable. "
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID44"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp44)
	Merge (cmp44)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp44)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID45 in Trans-Culture-Work
	MERGE (grp14)-[:GROUP_HAS_COMPETENCIES_OF {order: 65, planId: "2"}]->(cmp45:Competency {id: "Trans-GUID45"})-[:IS_IN_GROUP {order: 65, planId: "2"}]->(grp14)
	SET cmp45.label = "Account for cultural backgrounds",
		cmp45.default_weight = 1.0
	MERGE (cmp45)-[:HAS_SHORT_NAME]->(sn64:ShortName {id : "sn64"})
	SET sn64.label = "Account for cultural backgrounds"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp45)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp45)-[:HAS_TARGET_COMPETENCY]->(tc49:TargetCompetency {id : "tc49"})
	SET tc49.label = "Account for people's different cultural backgrounds and facilitate positive group dynamics and patterns of working that allow people to contribute more effectively."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID45"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp45)
	Merge (cmp45)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp45)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID46 in Trans-Culture-Work
	MERGE (grp14)-[:GROUP_HAS_COMPETENCIES_OF {order: 66, planId: "2"}]->(cmp46:Competency {id: "Trans-GUID46"})-[:IS_IN_GROUP {order: 66, planId: "2"}]->(grp14)
	SET cmp46.label = "Adapt to leadership styles",
		cmp46.default_weight = 1.0
	MERGE (cmp46)-[:HAS_SHORT_NAME]->(sn65:ShortName {id : "sn65"})
	SET sn65.label = "Adapt to leadership styles"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp46)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp46)-[:HAS_TARGET_COMPETENCY]->(tc50:TargetCompetency {id : "tc50"})
	SET tc50.label = "Identify, understand and adapt to a variety of cross-cultural leadership styles."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID46"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp46)
	Merge (cmp46)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp46)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID47 in Trans-Culture-Work
	MERGE (grp14)-[:GROUP_HAS_COMPETENCIES_OF {order: 67, planId: "2"}]->(cmp47:Competency {id: "Trans-GUID47"})-[:IS_IN_GROUP {order: 67, planId: "2"}]->(grp14)
	SET cmp47.label = "Participate in decision making",
		cmp47.default_weight = 1.0
	MERGE (cmp47)-[:HAS_SHORT_NAME]->(sn66:ShortName {id : "sn66"})
	SET sn66.label = "Participate in decision making"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp47)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp47)-[:HAS_TARGET_COMPETENCY]->(tc51:TargetCompetency {id : "tc51"})
	SET tc51.label = "Participate effectively in decision-making processes."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID47"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp47)
	Merge (cmp47)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp47)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID48 in Trans-Culture-Work
	MERGE (grp14)-[:GROUP_HAS_COMPETENCIES_OF {order: 68, planId: "2"}]->(cmp48:Competency {id: "Trans-GUID48"})-[:IS_IN_GROUP {order: 68, planId: "2"}]->(grp14)
	SET cmp48.label = "Communicate and participate effectively in cross-cultural mentoring, training, and project team activities, guiding translation teams to find translation problems and to solve them rather than solving the problems for them.",
		cmp48.default_weight = 1.0
	MERGE (cmp48)-[:HAS_SHORT_NAME]->(sn67:ShortName {id : "sn67"})
	SET sn67.label = "Communicate and participate effectively in cross-cultural mentoring, training, and project team activities, guiding translation teams to find translation problems and to solve them rather than solving the problems for them."
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp48)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp48)-[:HAS_TARGET_COMPETENCY]->(tc52:TargetCompetency {id : "tc52"})
	SET tc52.label = "Explain how the various cultural structures and social processes may present both opportunities and challenges in leadership, decision making and relationships when working with a multicultural group or team."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID48"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp48)
	Merge (cmp48)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp48)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Grp	Trans-Culture-Lead in Trans-Culture
	MERGE (cat5)-[:HAS_GROUP {order: 69, planId: "2"}]->(grp15:CompetencyGroup {id: "Trans-Culture-Lead"})-[:IS_IN_GROUP {order: 69, planId: "2"}]->(cat5)
	SET grp15.label = "B) Take a lead cross-culturally"
	MERGE (grp15)-[:HAS_SHORT_NAME]->(sn68:ShortName {id : "sn68"})
	SET sn68.label = "B) Take a lead cross-culturally"

	//Comp		Trans-GUID49 in Trans-Culture-Lead
	MERGE (grp15)-[:GROUP_HAS_COMPETENCIES_OF {order: 70, planId: "2"}]->(cmp49:Competency {id: "Trans-GUID49"})-[:IS_IN_GROUP {order: 70, planId: "2"}]->(grp15)
	SET cmp49.label = "Train cross-culturally",
		cmp49.default_weight = 1.0
	MERGE (cmp49)-[:HAS_SHORT_NAME]->(sn69:ShortName {id : "sn69"})
	SET sn69.label = "Train cross-culturally"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp49)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp49)-[:HAS_TARGET_COMPETENCY]->(tc53:TargetCompetency {id : "tc53"})
	SET tc53.label = "Communicate and participate effectively in cross-cultural mentoring, training, and project team activities, guiding translation teams to find translation problems and to solve them rather than solving the problems for them."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID49"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp49)
	Merge (cmp49)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp49)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID50 in Trans-Culture-Lead
	MERGE (grp15)-[:GROUP_HAS_COMPETENCIES_OF {order: 71, planId: "2"}]->(cmp50:Competency {id: "Trans-GUID50"})-[:IS_IN_GROUP {order: 71, planId: "2"}]->(grp15)
	SET cmp50.label = "Mentor peers cross-culturally",
		cmp50.default_weight = 1.0
	MERGE (cmp50)-[:HAS_SHORT_NAME]->(sn70:ShortName {id : "sn70"})
	SET sn70.label = "Mentor peers cross-culturally"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp50)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp50)-[:HAS_TARGET_COMPETENCY]->(tc54:TargetCompetency {id : "tc54"})
	SET tc54.label = "Coach and mentor peers in culturally sensitive ways."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID50"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp50)
	Merge (cmp50)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp50)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID51 in Trans-Culture-Lead
	MERGE (grp15)-[:GROUP_HAS_COMPETENCIES_OF {order: 72, planId: "2"}]->(cmp51:Competency {id: "Trans-GUID51"})-[:IS_IN_GROUP {order: 72, planId: "2"}]->(grp15)
	SET cmp51.label = "Assess cross-culturally",
		cmp51.default_weight = 1.0
	MERGE (cmp51)-[:HAS_SHORT_NAME]->(sn71:ShortName {id : "sn71"})
	SET sn71.label = "Assess cross-culturally"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp51)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp51)-[:HAS_TARGET_COMPETENCY]->(tc55:TargetCompetency {id : "tc55"})
	SET tc55.label = "Assess and evaluate the work of individuals in a multicultural environment, and communicate that assessment in a culturally appropriate way: knowing when to be flexible and when to insist that a certain interpretation or rendering is not acceptable; clearly explaining why a certain interpretation or rendering is not acceptable."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID51"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp51)
	Merge (cmp51)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp51)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	RETURN cat5
`);

    q.push(cypher`
	MATCH (p:PlanRoot {id: "2"})
	MATCH (d:Domain {id: "2"})
	MATCH (pr:ProgressRoot {userId: "1"})
	MATCH (ms:Milestone {ms: "TransCons1"})
	MATCH (ms2:Milestone {ms: "Translator"})

	//CatTrans-Mentor in 2
	MERGE (p)-[:HAS_CATEGORY {order: 73, planId: "2"}]->(cat6:CompetencyCategory {id: "Trans-Mentor"})-[:IS_CATEGORY_OF {order: 73, planId: "2"}]->(p)
	SET cat6.label = "Mentoring ",
		cat6.color = "brown"
	MERGE (cat6)-[:HAS_SHORT_NAME]->(sn72:ShortName {id : "sn72"})
	SET sn72.label = "Mentoring "
	MERGE (cat6)-[:HAS_TARGET_COMPETENCY]->(tc56:TargetCompetency {id : "tc56"})
	SET tc56.label = "Mentoring occurs informally when an individual is accompanied for a while by a friend or colleague more experienced in the field who offers guidance and advice. Mentoring formally is an organized and structured process with defined roles and responsibilities for guiding people in their professional development. There is an agreement that establishes the goals of the mentoring, means of evaluation and report of progress, and how the mentoring will finish. Formal mentoring seeks to ensure that everyone in an organization who needs mentoring receives it. (Some of these competencies overlap with interpersonal skills, but they are listed here because they are especially important for mentors.)"

	//Grp	Trans-Mentor-Knowledge in Trans-Mentor
	MERGE (cat6)-[:HAS_GROUP {order: 74, planId: "2"}]->(grp16:CompetencyGroup {id: "Trans-Mentor-Knowledge"})-[:IS_IN_GROUP {order: 74, planId: "2"}]->(cat6)
	SET grp16.label = "A) Knowledge"
	MERGE (grp16)-[:HAS_SHORT_NAME]->(sn73:ShortName {id : "sn73"})
	SET sn73.label = "A) Knowledge"

	//Comp		Trans-GUID52 in Trans-Mentor-Knowledge
	MERGE (grp16)-[:GROUP_HAS_COMPETENCIES_OF {order: 75, planId: "2"}]->(cmp52:Competency {id: "Trans-GUID52"})-[:IS_IN_GROUP {order: 75, planId: "2"}]->(grp16)
	SET cmp52.label = "Mentoring and Coaching",
		cmp52.default_weight = 1.0
	MERGE (cmp52)-[:HAS_SHORT_NAME]->(sn74:ShortName {id : "sn74"})
	SET sn74.label = "Mentoring and Coaching"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp52)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp52)-[:HAS_TARGET_COMPETENCY]->(tc57:TargetCompetency {id : "tc57"})
	SET tc57.label = "Describe how formal mentoring is different from informal mentoring and coaching/facilitation."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID52"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp52)
	Merge (cmp52)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp52)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID53 in Trans-Mentor-Knowledge
	MERGE (grp16)-[:GROUP_HAS_COMPETENCIES_OF {order: 76, planId: "2"}]->(cmp53:Competency {id: "Trans-GUID53"})-[:IS_IN_GROUP {order: 76, planId: "2"}]->(grp16)
	SET cmp53.label = "Mentor and Mentoree in Formal Mentoring",
		cmp53.default_weight = 1.0
	MERGE (cmp53)-[:HAS_SHORT_NAME]->(sn75:ShortName {id : "sn75"})
	SET sn75.label = "Mentor and Mentoree in Formal Mentoring"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp53)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp53)-[:HAS_TARGET_COMPETENCY]->(tc58:TargetCompetency {id : "tc58"})
	SET tc58.label = "Understand and be able to explain the purpose and expectations of formal mentoring, and the roles of the mentor and mentoree."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID53"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp53)
	Merge (cmp53)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp53)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID54 in Trans-Mentor-Knowledge
	MERGE (grp16)-[:GROUP_HAS_COMPETENCIES_OF {order: 77, planId: "2"}]->(cmp54:Competency {id: "Trans-GUID54"})-[:IS_IN_GROUP {order: 77, planId: "2"}]->(grp16)
	SET cmp54.label = "Administrative expectations",
		cmp54.default_weight = 1.0
	MERGE (cmp54)-[:HAS_SHORT_NAME]->(sn76:ShortName {id : "sn76"})
	SET sn76.label = "Administrative expectations"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp54)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp54)-[:HAS_TARGET_COMPETENCY]->(tc59:TargetCompetency {id : "tc59"})
	SET tc59.label = "Know the administrative tasks expected by the mentoree's organization."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID54"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp54)
	Merge (cmp54)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp54)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Grp	Trans-Mentor-Skills in Trans-Mentor
	MERGE (cat6)-[:HAS_GROUP {order: 78, planId: "2"}]->(grp17:CompetencyGroup {id: "Trans-Mentor-Skills"})-[:IS_IN_GROUP {order: 78, planId: "2"}]->(cat6)
	SET grp17.label = "B) Skills"
	MERGE (grp17)-[:HAS_SHORT_NAME]->(sn77:ShortName {id : "sn77"})
	SET sn77.label = "B) Skills"

	//Comp		Trans-GUID55 in Trans-Mentor-Skills
	MERGE (grp17)-[:GROUP_HAS_COMPETENCIES_OF {order: 79, planId: "2"}]->(cmp55:Competency {id: "Trans-GUID55"})-[:IS_IN_GROUP {order: 79, planId: "2"}]->(grp17)
	SET cmp55.label = "Expectations for relationship",
		cmp55.default_weight = 1.0
	MERGE (cmp55)-[:HAS_SHORT_NAME]->(sn78:ShortName {id : "sn78"})
	SET sn78.label = "Expectations for relationship"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp55)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp55)-[:HAS_TARGET_COMPETENCY]->(tc60:TargetCompetency {id : "tc60"})
	SET tc60.label = "Set and follow protocols and expectations for the relationship (how goals are going to be achieved, how to handle disagreements, how to track progress, etc.)."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID55"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp55)
	Merge (cmp55)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp55)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID56 in Trans-Mentor-Skills
	MERGE (grp17)-[:GROUP_HAS_COMPETENCIES_OF {order: 80, planId: "2"}]->(cmp56:Competency {id: "Trans-GUID56"})-[:IS_IN_GROUP {order: 80, planId: "2"}]->(grp17)
	SET cmp56.label = "Reciprocal relationship",
		cmp56.default_weight = 1.0
	MERGE (cmp56)-[:HAS_SHORT_NAME]->(sn79:ShortName {id : "sn79"})
	SET sn79.label = "Reciprocal relationship"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp56)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp56)-[:HAS_TARGET_COMPETENCY]->(tc61:TargetCompetency {id : "tc61"})
	SET tc61.label = "Develop a reciprocal relationship through sharing experiences, exploring expectations, and clarifying the roles of mentor and mentoree."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID56"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp56)
	Merge (cmp56)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp56)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID57 in Trans-Mentor-Skills
	MERGE (grp17)-[:GROUP_HAS_COMPETENCIES_OF {order: 81, planId: "2"}]->(cmp57:Competency {id: "Trans-GUID57"})-[:IS_IN_GROUP {order: 81, planId: "2"}]->(grp17)
	SET cmp57.label = "Mutual learning",
		cmp57.default_weight = 1.0
	MERGE (cmp57)-[:HAS_SHORT_NAME]->(sn80:ShortName {id : "sn80"})
	SET sn80.label = "Mutual learning"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp57)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp57)-[:HAS_TARGET_COMPETENCY]->(tc62:TargetCompetency {id : "tc62"})
	SET tc62.label = "Encourage a relationship of mutual learning between mentor and mentoree (with an attitude of 'Let us learn together')."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID57"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp57)
	Merge (cmp57)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp57)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID58 in Trans-Mentor-Skills
	MERGE (grp17)-[:GROUP_HAS_COMPETENCIES_OF {order: 82, planId: "2"}]->(cmp58:Competency {id: "Trans-GUID58"})-[:IS_IN_GROUP {order: 82, planId: "2"}]->(grp17)
	SET cmp58.label = "Listen to enourage growth",
		cmp58.default_weight = 1.0
	MERGE (cmp58)-[:HAS_SHORT_NAME]->(sn81:ShortName {id : "sn81"})
	SET sn81.label = "Listen to enourage growth"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp58)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp58)-[:HAS_TARGET_COMPETENCY]->(tc63:TargetCompetency {id : "tc63"})
	SET tc63.label = "Listen actively and use encouragement to facilitate growth."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID58"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp58)
	Merge (cmp58)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp58)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID59 in Trans-Mentor-Skills
	MERGE (grp17)-[:GROUP_HAS_COMPETENCIES_OF {order: 83, planId: "2"}]->(cmp59:Competency {id: "Trans-GUID59"})-[:IS_IN_GROUP {order: 83, planId: "2"}]->(grp17)
	SET cmp59.label = "Goals for continuous improvement",
		cmp59.default_weight = 1.0
	MERGE (cmp59)-[:HAS_SHORT_NAME]->(sn82:ShortName {id : "sn82"})
	SET sn82.label = "Goals for continuous improvement"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp59)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp59)-[:HAS_TARGET_COMPETENCY]->(tc64:TargetCompetency {id : "tc64"})
	SET tc64.label = "Provide guidance in reflecting upon and interpreting experiences and performance in order to develop goals in a plan for continuous improvement."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID59"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp59)
	Merge (cmp59)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp59)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID60 in Trans-Mentor-Skills
	MERGE (grp17)-[:GROUP_HAS_COMPETENCIES_OF {order: 84, planId: "2"}]->(cmp60:Competency {id: "Trans-GUID60"})-[:IS_IN_GROUP {order: 84, planId: "2"}]->(grp17)
	SET cmp60.label = "Recognize goals met",
		cmp60.default_weight = 1.0
	MERGE (cmp60)-[:HAS_SHORT_NAME]->(sn83:ShortName {id : "sn83"})
	SET sn83.label = "Recognize goals met"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp60)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp60)-[:HAS_TARGET_COMPETENCY]->(tc65:TargetCompetency {id : "tc65"})
	SET tc65.label = "Set clear goals for the mentoree to achieve, recognize and articulate when goals are met. "
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID60"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp60)
	Merge (cmp60)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp60)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID61 in Trans-Mentor-Skills
	MERGE (grp17)-[:GROUP_HAS_COMPETENCIES_OF {order: 85, planId: "2"}]->(cmp61:Competency {id: "Trans-GUID61"})-[:IS_IN_GROUP {order: 85, planId: "2"}]->(grp17)
	SET cmp61.label = "Transfer competencies",
		cmp61.default_weight = 1.0
	MERGE (cmp61)-[:HAS_SHORT_NAME]->(sn84:ShortName {id : "sn84"})
	SET sn84.label = "Transfer competencies"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp61)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp61)-[:HAS_TARGET_COMPETENCY]->(tc66:TargetCompetency {id : "tc66"})
	SET tc66.label = "Use knowledge and experience in a particular domain to help the mentoree acquire and apply new knowledge, skills and attitudes, a. by explaining, modeling, giving effective examples b. by drawing out the mentoree's thoughts in culturally appropriate ways (e.g open questions, polite commands, sharing stories with each other, saying ' I wonder what the best way would be to...')."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID61"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp61)
	Merge (cmp61)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp61)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID62 in Trans-Mentor-Skills
	MERGE (grp17)-[:GROUP_HAS_COMPETENCIES_OF {order: 86, planId: "2"}]->(cmp62:Competency {id: "Trans-GUID62"})-[:IS_IN_GROUP {order: 86, planId: "2"}]->(grp17)
	SET cmp62.label = "Provide feedback",
		cmp62.default_weight = 1.0
	MERGE (cmp62)-[:HAS_SHORT_NAME]->(sn85:ShortName {id : "sn85"})
	SET sn85.label = "Provide feedback"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp62)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp62)-[:HAS_TARGET_COMPETENCY]->(tc67:TargetCompetency {id : "tc67"})
	SET tc67.label = "Give and receive sincere feedback about the mentoree's performance, behavior and development with care and compassion in a culturally appropriate way, (identifying both positive growth and areas still needing improvement)."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID62"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp62)
	Merge (cmp62)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp62)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID63 in Trans-Mentor-Skills
	MERGE (grp17)-[:GROUP_HAS_COMPETENCIES_OF {order: 87, planId: "2"}]->(cmp63:Competency {id: "Trans-GUID63"})-[:IS_IN_GROUP {order: 87, planId: "2"}]->(grp17)
	SET cmp63.label = "Create safe space",
		cmp63.default_weight = 1.0
	MERGE (cmp63)-[:HAS_SHORT_NAME]->(sn86:ShortName {id : "sn86"})
	SET sn86.label = "Create safe space"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp63)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp63)-[:HAS_TARGET_COMPETENCY]->(tc68:TargetCompetency {id : "tc68"})
	SET tc68.label = "Create a safe space for the mentoree to excel, shine and build confidence. "
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID63"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp63)
	Merge (cmp63)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp63)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID64 in Trans-Mentor-Skills
	MERGE (grp17)-[:GROUP_HAS_COMPETENCIES_OF {order: 88, planId: "2"}]->(cmp64:Competency {id: "Trans-GUID64"})-[:IS_IN_GROUP {order: 88, planId: "2"}]->(grp17)
	SET cmp64.label = "Advocate on behalf of mentoree",
		cmp64.default_weight = 1.0
	MERGE (cmp64)-[:HAS_SHORT_NAME]->(sn87:ShortName {id : "sn87"})
	SET sn87.label = "Advocate on behalf of mentoree"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp64)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp64)-[:HAS_TARGET_COMPETENCY]->(tc69:TargetCompetency {id : "tc69"})
	SET tc69.label = "Advocate on behalf of one's mentorees so they have opportunities to get experiences necessary for their growth."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID64"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp64)
	Merge (cmp64)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp64)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID65 in Trans-Mentor-Skills
	MERGE (grp17)-[:GROUP_HAS_COMPETENCIES_OF {order: 89, planId: "2"}]->(cmp65:Competency {id: "Trans-GUID65"})-[:IS_IN_GROUP {order: 89, planId: "2"}]->(grp17)
	SET cmp65.label = "Maintain confidentiality",
		cmp65.default_weight = 1.0
	MERGE (cmp65)-[:HAS_SHORT_NAME]->(sn88:ShortName {id : "sn88"})
	SET sn88.label = "Maintain confidentiality"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp65)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp65)-[:HAS_TARGET_COMPETENCY]->(tc70:TargetCompetency {id : "tc70"})
	SET tc70.label = "Maintain confidentiality when sharing experiences, discussing issues and solving problems."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID65"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp65)
	Merge (cmp65)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp65)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Grp	Trans-Mentor-Attitudes in Trans-Mentor
	MERGE (cat6)-[:HAS_GROUP {order: 90, planId: "2"}]->(grp18:CompetencyGroup {id: "Trans-Mentor-Attitudes"})-[:IS_IN_GROUP {order: 90, planId: "2"}]->(cat6)
	SET grp18.label = "C) Attitudes "
	MERGE (grp18)-[:HAS_SHORT_NAME]->(sn89:ShortName {id : "sn89"})
	SET sn89.label = "C) Attitudes "

	//Comp		Trans-GUID66 in Trans-Mentor-Attitudes
	MERGE (grp18)-[:GROUP_HAS_COMPETENCIES_OF {order: 91, planId: "2"}]->(cmp66:Competency {id: "Trans-GUID66"})-[:IS_IN_GROUP {order: 91, planId: "2"}]->(grp18)
	SET cmp66.label = "Respect",
		cmp66.default_weight = 1.0
	MERGE (cmp66)-[:HAS_SHORT_NAME]->(sn90:ShortName {id : "sn90"})
	SET sn90.label = "Respect"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp66)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp66)-[:HAS_TARGET_COMPETENCY]->(tc71:TargetCompetency {id : "tc71"})
	SET tc71.label = "Respects and values other people's opinions, knowledge, and experience."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID66"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp66)
	Merge (cmp66)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp66)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID67 in Trans-Mentor-Attitudes
	MERGE (grp18)-[:GROUP_HAS_COMPETENCIES_OF {order: 92, planId: "2"}]->(cmp67:Competency {id: "Trans-GUID67"})-[:IS_IN_GROUP {order: 92, planId: "2"}]->(grp18)
	SET cmp67.label = "Humility",
		cmp67.default_weight = 1.0
	MERGE (cmp67)-[:HAS_SHORT_NAME]->(sn91:ShortName {id : "sn91"})
	SET sn91.label = "Humility"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp67)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp67)-[:HAS_TARGET_COMPETENCY]->(tc72:TargetCompetency {id : "tc72"})
	SET tc72.label = "Is realistically self-aware and humble."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID67"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp67)
	Merge (cmp67)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp67)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID68 in Trans-Mentor-Attitudes
	MERGE (grp18)-[:GROUP_HAS_COMPETENCIES_OF {order: 93, planId: "2"}]->(cmp68:Competency {id: "Trans-GUID68"})-[:IS_IN_GROUP {order: 93, planId: "2"}]->(grp18)
	SET cmp68.label = "Rejoice with others",
		cmp68.default_weight = 1.0
	MERGE (cmp68)-[:HAS_SHORT_NAME]->(sn92:ShortName {id : "sn92"})
	SET sn92.label = "Rejoice with others"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp68)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp68)-[:HAS_TARGET_COMPETENCY]->(tc73:TargetCompetency {id : "tc73"})
	SET tc73.label = "Delights in other people's success."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID68"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp68)
	Merge (cmp68)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp68)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID69 in Trans-Mentor-Attitudes
	MERGE (grp18)-[:GROUP_HAS_COMPETENCIES_OF {order: 94, planId: "2"}]->(cmp69:Competency {id: "Trans-GUID69"})-[:IS_IN_GROUP {order: 94, planId: "2"}]->(grp18)
	SET cmp69.label = "Open",
		cmp69.default_weight = 1.0
	MERGE (cmp69)-[:HAS_SHORT_NAME]->(sn93:ShortName {id : "sn93"})
	SET sn93.label = "Open"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp69)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp69)-[:HAS_TARGET_COMPETENCY]->(tc74:TargetCompetency {id : "tc74"})
	SET tc74.label = "Is willing to be open about one's own successes and failures (wise and appropriate self-disclosure)."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID69"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp69)
	Merge (cmp69)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp69)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID70 in Trans-Mentor-Attitudes
	MERGE (grp18)-[:GROUP_HAS_COMPETENCIES_OF {order: 95, planId: "2"}]->(cmp70:Competency {id: "Trans-GUID70"})-[:IS_IN_GROUP {order: 95, planId: "2"}]->(grp18)
	SET cmp70.label = "Self-aware",
		cmp70.default_weight = 1.0
	MERGE (cmp70)-[:HAS_SHORT_NAME]->(sn94:ShortName {id : "sn94"})
	SET sn94.label = "Self-aware"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp70)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp70)-[:HAS_TARGET_COMPETENCY]->(tc75:TargetCompetency {id : "tc75"})
	SET tc75.label = "Understands the limitations of one's own experiences and perspective, and minimize any negative impact on the mentoree."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID70"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp70)
	Merge (cmp70)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp70)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID71 in Trans-Mentor-Attitudes
	MERGE (grp18)-[:GROUP_HAS_COMPETENCIES_OF {order: 96, planId: "2"}]->(cmp71:Competency {id: "Trans-GUID71"})-[:IS_IN_GROUP {order: 96, planId: "2"}]->(grp18)
	SET cmp71.label = "Expect mentoree to mentor othesr",
		cmp71.default_weight = 1.0
	MERGE (cmp71)-[:HAS_SHORT_NAME]->(sn95:ShortName {id : "sn95"})
	SET sn95.label = "Expect mentoree to mentor othesr"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp71)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp71)-[:HAS_TARGET_COMPETENCY]->(tc76:TargetCompetency {id : "tc76"})
	SET tc76.label = "Expects that the mentoree develops to mentor others."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID71"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp71)
	Merge (cmp71)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp71)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	RETURN cat6
`);

    q.push(cypher`
	MATCH (p:PlanRoot {id: "2"})
	MATCH (d:Domain {id: "2"})
	MATCH (pr:ProgressRoot {userId: "1"})
	MATCH (ms:Milestone {ms: "TransCons1"})
	MATCH (ms2:Milestone {ms: "Translator"})

	//CatTrans-Cons in 2
	MERGE (p)-[:HAS_CATEGORY {order: 97, planId: "2"}]->(cat7:CompetencyCategory {id: "Trans-Cons"})-[:IS_CATEGORY_OF {order: 97, planId: "2"}]->(p)
	SET cat7.label = "Consulting Process Skills ",
		cat7.color = "teal"
	MERGE (cat7)-[:HAS_SHORT_NAME]->(sn96:ShortName {id : "sn96"})
	SET sn96.label = "Consulting Process Skills "
	MERGE (cat7)-[:HAS_TARGET_COMPETENCY]->(tc77:TargetCompetency {id : "tc77"})
	SET tc77.label = "For consultants to use their expertise to effect change requires understanding the emotional and personal dimensions involved, and needs just as much attention as the content. Skills include establishing the relationship, defining the assignment, understanding and dealing with resistance, organizing a process of discovery, providing feedback, managing meetings for action, and implementation"

	//Grp	Trans-Cons-Gen in Trans-Cons
	MERGE (cat7)-[:HAS_GROUP {order: 98, planId: "2"}]->(grp19:CompetencyGroup {id: "Trans-Cons-Gen"})-[:IS_IN_GROUP {order: 98, planId: "2"}]->(cat7)
	SET grp19.label = "A) General"
	MERGE (grp19)-[:HAS_SHORT_NAME]->(sn97:ShortName {id : "sn97"})
	SET sn97.label = "A) General"

	//Comp		Trans-GUID72 in Trans-Cons-Gen
	MERGE (grp19)-[:GROUP_HAS_COMPETENCIES_OF {order: 99, planId: "2"}]->(cmp72:Competency {id: "Trans-GUID72"})-[:IS_IN_GROUP {order: 99, planId: "2"}]->(grp19)
	SET cmp72.label = "Establish collaborative relationships",
		cmp72.default_weight = 1.0
	MERGE (cmp72)-[:HAS_SHORT_NAME]->(sn98:ShortName {id : "sn98"})
	SET sn98.label = "Establish collaborative relationships"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp72)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp72)-[:HAS_TARGET_COMPETENCY]->(tc78:TargetCompetency {id : "tc78"})
	SET tc78.label = "Establish collaborative relationships with individual clients and within an organization."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID72"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp72)
	Merge (cmp72)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp72)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID73 in Trans-Cons-Gen
	MERGE (grp19)-[:GROUP_HAS_COMPETENCIES_OF {order: 100, planId: "2"}]->(cmp73:Competency {id: "Trans-GUID73"})-[:IS_IN_GROUP {order: 100, planId: "2"}]->(grp19)
	SET cmp73.label = "Represent organization with diplomacy",
		cmp73.default_weight = 1.0
	MERGE (cmp73)-[:HAS_SHORT_NAME]->(sn99:ShortName {id : "sn99"})
	SET sn99.label = "Represent organization with diplomacy"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp73)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp73)-[:HAS_TARGET_COMPETENCY]->(tc79:TargetCompetency {id : "tc79"})
	SET tc79.label = "Represent their organization with diplomacy in intra- and inter-organizational projects/consulting processes."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID73"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp73)
	Merge (cmp73)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp73)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID74 in Trans-Cons-Gen
	MERGE (grp19)-[:GROUP_HAS_COMPETENCIES_OF {order: 101, planId: "2"}]->(cmp74:Competency {id: "Trans-GUID74"})-[:IS_IN_GROUP {order: 101, planId: "2"}]->(grp19)
	SET cmp74.label = " Articulate different stages of the consulting process",
		cmp74.default_weight = 1.0
	MERGE (cmp74)-[:HAS_SHORT_NAME]->(sn100:ShortName {id : "sn100"})
	SET sn100.label = " Articulate different stages of the consulting process"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp74)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp74)-[:HAS_TARGET_COMPETENCY]->(tc80:TargetCompetency {id : "tc80"})
	SET tc80.label = "Articulate an understanding of different stages/facets of the consulting process, including contracting (defining the assignment and clarifying roles), discovery, feedback, engagement/implementation, and evaluation."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID74"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp74)
	Merge (cmp74)-[:TARGET_VALUE_IS {planId: "2", min: 3}]->(ms)
	Merge (cmp74)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms2)

	//Grp	Trans-Cons-Cont in Trans-Cons
	MERGE (cat7)-[:HAS_GROUP {order: 102, planId: "2"}]->(grp20:CompetencyGroup {id: "Trans-Cons-Cont"})-[:IS_IN_GROUP {order: 102, planId: "2"}]->(cat7)
	SET grp20.label = "B) Contracting"
	MERGE (grp20)-[:HAS_SHORT_NAME]->(sn101:ShortName {id : "sn101"})
	SET sn101.label = "B) Contracting"

	//Comp		Trans-GUID75 in Trans-Cons-Cont
	MERGE (grp20)-[:GROUP_HAS_COMPETENCIES_OF {order: 103, planId: "2"}]->(cmp75:Competency {id: "Trans-GUID75"})-[:IS_IN_GROUP {order: 103, planId: "2"}]->(grp20)
	SET cmp75.label = "Define expectations",
		cmp75.default_weight = 1.0
	MERGE (cmp75)-[:HAS_SHORT_NAME]->(sn102:ShortName {id : "sn102"})
	SET sn102.label = "Define expectations"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp75)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp75)-[:HAS_TARGET_COMPETENCY]->(tc81:TargetCompetency {id : "tc81"})
	SET tc81.label = "Define what is expected of the consultation process, what the boundaries are, what support the consultant requires, and what and when the consultant and consultee are expected to deliver."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID75"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp75)
	Merge (cmp75)-[:TARGET_VALUE_IS {planId: "2", min: 3}]->(ms)
	Merge (cmp75)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms2)

	//Comp		Trans-GUID76 in Trans-Cons-Cont
	MERGE (grp20)-[:GROUP_HAS_COMPETENCIES_OF {order: 104, planId: "2"}]->(cmp76:Competency {id: "Trans-GUID76"})-[:IS_IN_GROUP {order: 104, planId: "2"}]->(grp20)
	SET cmp76.label = "Listen to needs of team",
		cmp76.default_weight = 1.0
	MERGE (cmp76)-[:HAS_SHORT_NAME]->(sn103:ShortName {id : "sn103"})
	SET sn103.label = "Listen to needs of team"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp76)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp76)-[:HAS_TARGET_COMPETENCY]->(tc82:TargetCompetency {id : "tc82"})
	SET tc82.label = "Listen to and understand the needs that the client/team/organization expresses. Understands the interplay between Budget, Time, Scope, project goals, and their impact on Quality and can successfully shape and navigate these things to meet desired parameters."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID76"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp76)
	Merge (cmp76)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp76)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Grp	Trans-Cons-Disc in Trans-Cons
	MERGE (cat7)-[:HAS_GROUP {order: 105, planId: "2"}]->(grp21:CompetencyGroup {id: "Trans-Cons-Disc"})-[:IS_IN_GROUP {order: 105, planId: "2"}]->(cat7)
	SET grp21.label = "C) Discovery and feedback"
	MERGE (grp21)-[:HAS_SHORT_NAME]->(sn104:ShortName {id : "sn104"})
	SET sn104.label = "C) Discovery and feedback"

	//Comp		Trans-GUID77 in Trans-Cons-Disc
	MERGE (grp21)-[:GROUP_HAS_COMPETENCIES_OF {order: 106, planId: "2"}]->(cmp77:Competency {id: "Trans-GUID77"})-[:IS_IN_GROUP {order: 106, planId: "2"}]->(grp21)
	SET cmp77.label = "Guide team through consultant process",
		cmp77.default_weight = 1.0
	MERGE (cmp77)-[:HAS_SHORT_NAME]->(sn105:ShortName {id : "sn105"})
	SET sn105.label = "Guide team through consultant process"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp77)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp77)-[:HAS_TARGET_COMPETENCY]->(tc83:TargetCompetency {id : "tc83"})
	SET tc83.label = "Organize a process of discovery, data collection, and dialogue that will help analyze the expressed needs/problems. (Is able to guide the team through a consulting session, including preparation and follow-up)."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID77"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp77)
	Merge (cmp77)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp77)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID78 in Trans-Cons-Disc
	MERGE (grp21)-[:GROUP_HAS_COMPETENCIES_OF {order: 107, planId: "2"}]->(cmp78:Competency {id: "Trans-GUID78"})-[:IS_IN_GROUP {order: 107, planId: "2"}]->(grp21)
	SET cmp78.label = "Provide feedback",
		cmp78.default_weight = 1.0
	MERGE (cmp78)-[:HAS_SHORT_NAME]->(sn106:ShortName {id : "sn106"})
	SET sn106.label = "Provide feedback"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp78)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp78)-[:HAS_TARGET_COMPETENCY]->(tc84:TargetCompetency {id : "tc84"})
	SET tc84.label = "Provide feedback and recommendations from the discovery process in a way that maximizes client commitment and engagement (write a consultant report)."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID78"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp78)
	Merge (cmp78)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp78)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID79 in Trans-Cons-Disc
	MERGE (grp21)-[:GROUP_HAS_COMPETENCIES_OF {order: 108, planId: "2"}]->(cmp79:Competency {id: "Trans-GUID79"})-[:IS_IN_GROUP {order: 108, planId: "2"}]->(grp21)
	SET cmp79.label = "Deal with resistance to change",
		cmp79.default_weight = 1.0
	MERGE (cmp79)-[:HAS_SHORT_NAME]->(sn107:ShortName {id : "sn107"})
	SET sn107.label = "Deal with resistance to change"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp79)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp79)-[:HAS_TARGET_COMPETENCY]->(tc85:TargetCompetency {id : "tc85"})
	SET tc85.label = "Understand the process of change (including cultural, emotional, and personal factors) and deal with resistance to it from within the organization."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID79"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp79)
	Merge (cmp79)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp79)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Grp	Trans-Cons-Eval in Trans-Cons
	MERGE (cat7)-[:HAS_GROUP {order: 109, planId: "2"}]->(grp22:CompetencyGroup {id: "Trans-Cons-Eval"})-[:IS_IN_GROUP {order: 109, planId: "2"}]->(cat7)
	SET grp22.label = "D) Implementation and evaluation"
	MERGE (grp22)-[:HAS_SHORT_NAME]->(sn108:ShortName {id : "sn108"})
	SET sn108.label = "D) Implementation and evaluation"

	//Comp		Trans-GUID80 in Trans-Cons-Eval
	MERGE (grp22)-[:GROUP_HAS_COMPETENCIES_OF {order: 110, planId: "2"}]->(cmp80:Competency {id: "Trans-GUID80"})-[:IS_IN_GROUP {order: 110, planId: "2"}]->(grp22)
	SET cmp80.label = "Define specific assignments",
		cmp80.default_weight = 1.0
	MERGE (cmp80)-[:HAS_SHORT_NAME]->(sn109:ShortName {id : "sn109"})
	SET sn109.label = "Define specific assignments"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp80)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp80)-[:HAS_TARGET_COMPETENCY]->(tc86:TargetCompetency {id : "tc86"})
	SET tc86.label = "Manage meetings which will lead to a plan of action, clearly defining specific assignments needed to implement change."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID80"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp80)
	Merge (cmp80)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp80)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID81 in Trans-Cons-Eval
	MERGE (grp22)-[:GROUP_HAS_COMPETENCIES_OF {order: 111, planId: "2"}]->(cmp81:Competency {id: "Trans-GUID81"})-[:IS_IN_GROUP {order: 111, planId: "2"}]->(grp22)
	SET cmp81.label = "Monitor progress",
		cmp81.default_weight = 1.0
	MERGE (cmp81)-[:HAS_SHORT_NAME]->(sn110:ShortName {id : "sn110"})
	SET sn110.label = "Monitor progress"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp81)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp81)-[:HAS_TARGET_COMPETENCY]->(tc87:TargetCompetency {id : "tc87"})
	SET tc87.label = "Monitor progress during the implementation."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID81"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp81)
	Merge (cmp81)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp81)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID82 in Trans-Cons-Eval
	MERGE (grp22)-[:GROUP_HAS_COMPETENCIES_OF {order: 112, planId: "2"}]->(cmp82:Competency {id: "Trans-GUID82"})-[:IS_IN_GROUP {order: 112, planId: "2"}]->(grp22)
	SET cmp82.label = "Equip the team",
		cmp82.default_weight = 1.0
	MERGE (cmp82)-[:HAS_SHORT_NAME]->(sn111:ShortName {id : "sn111"})
	SET sn111.label = "Equip the team"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp82)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp82)-[:HAS_TARGET_COMPETENCY]->(tc88:TargetCompetency {id : "tc88"})
	SET tc88.label = "Work towards a situation where the organization/client is equipped to carry forward the project independent of the consultant."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID82"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp82)
	Merge (cmp82)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp82)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID83 in Trans-Cons-Eval
	MERGE (grp22)-[:GROUP_HAS_COMPETENCIES_OF {order: 113, planId: "2"}]->(cmp83:Competency {id: "Trans-GUID83"})-[:IS_IN_GROUP {order: 113, planId: "2"}]->(grp22)
	SET cmp83.label = "Final evaluation",
		cmp83.default_weight = 1.0
	MERGE (cmp83)-[:HAS_SHORT_NAME]->(sn112:ShortName {id : "sn112"})
	SET sn112.label = "Final evaluation"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp83)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp83)-[:HAS_TARGET_COMPETENCY]->(tc89:TargetCompetency {id : "tc89"})
	SET tc89.label = "Provide an evaluation of the process/results before withdrawal (including oral feedback and written reports, as appropriate)."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID83"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp83)
	Merge (cmp83)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp83)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	RETURN cat7
`);

    q.push(cypher`
	MATCH (p:PlanRoot {id: "2"})
	MATCH (d:Domain {id: "2"})
	MATCH (pr:ProgressRoot {userId: "1"})
	MATCH (ms:Milestone {ms: "TransCons1"})
	MATCH (ms2:Milestone {ms: "Translator"})

	//CatTrans-Tech in 2
	MERGE (p)-[:HAS_CATEGORY {order: 114, planId: "2"}]->(cat8:CompetencyCategory {id: "Trans-Tech"})-[:IS_CATEGORY_OF {order: 114, planId: "2"}]->(p)
	SET cat8.label = "Technology for Consulting ",
		cat8.color = "yellow"
	MERGE (cat8)-[:HAS_SHORT_NAME]->(sn113:ShortName {id : "sn113"})
	SET sn113.label = "Technology for Consulting "
	MERGE (cat8)-[:HAS_TARGET_COMPETENCY]->(tc90:TargetCompetency {id : "tc90"})
	SET tc90.label = "The widespread and growing use of technology means that consultants need to be able to perform from memory the basic, routine, and typical Technology for Consulting tasks, using current Best Practice techniques and tools."

	//Grp	Trans-Tech-Soft in Trans-Tech
	MERGE (cat8)-[:HAS_GROUP {order: 115, planId: "2"}]->(grp23:CompetencyGroup {id: "Trans-Tech-Soft"})-[:IS_IN_GROUP {order: 115, planId: "2"}]->(cat8)
	SET grp23.label = "A) Translation software"
	MERGE (grp23)-[:HAS_SHORT_NAME]->(sn114:ShortName {id : "sn114"})
	SET sn114.label = "A) Translation software"

	//Comp		Trans-GUID84 in Trans-Tech-Soft
	MERGE (grp23)-[:GROUP_HAS_COMPETENCIES_OF {order: 116, planId: "2"}]->(cmp84:Competency {id: "Trans-GUID84"})-[:IS_IN_GROUP {order: 116, planId: "2"}]->(grp23)
	SET cmp84.label = "Use relevant translation software",
		cmp84.default_weight = 1.0
	MERGE (cmp84)-[:HAS_SHORT_NAME]->(sn115:ShortName {id : "sn115"})
	SET sn115.label = "Use relevant translation software"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp84)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp84)-[:HAS_TARGET_COMPETENCY]->(tc91:TargetCompetency {id : "tc91"})
	SET tc91.label = "Demonstrate the ability to use relevant software (e.g. Paratext, Logos, Render, OneStory Editor, HearThis, Transcriber) well (research an exegetical issue, prepare exegetical notes, resolve notes, perform various kinds of checks)."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID84"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp84)
	Merge (cmp84)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp84)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID85 in Trans-Tech-Soft
	MERGE (grp23)-[:GROUP_HAS_COMPETENCIES_OF {order: 117, planId: "2"}]->(cmp85:Competency {id: "Trans-GUID85"})-[:IS_IN_GROUP {order: 117, planId: "2"}]->(grp23)
	SET cmp85.label = "Help team with first aid on software",
		cmp85.default_weight = 1.0
	MERGE (cmp85)-[:HAS_SHORT_NAME]->(sn116:ShortName {id : "sn116"})
	SET sn116.label = "Help team with first aid on software"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp85)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp85)-[:HAS_TARGET_COMPETENCY]->(tc92:TargetCompetency {id : "tc92"})
	SET tc92.label = "Demonstrate the ability to help translation teams ('first aid'), when they run into a problem with their equipment and software (e.g. reinstalling the relevant software)."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID85"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp85)
	Merge (cmp85)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp85)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Grp	Trans-Tech-Gen in Trans-Tech
	MERGE (cat8)-[:HAS_GROUP {order: 118, planId: "2"}]->(grp24:CompetencyGroup {id: "Trans-Tech-Gen"})-[:IS_IN_GROUP {order: 118, planId: "2"}]->(cat8)
	SET grp24.label = "B) General"
	MERGE (grp24)-[:HAS_SHORT_NAME]->(sn117:ShortName {id : "sn117"})
	SET sn117.label = "B) General"

	//Comp		Trans-GUID86 in Trans-Tech-Gen
	MERGE (grp24)-[:GROUP_HAS_COMPETENCIES_OF {order: 119, planId: "2"}]->(cmp86:Competency {id: "Trans-GUID86"})-[:IS_IN_GROUP {order: 119, planId: "2"}]->(grp24)
	SET cmp86.label = "Maintain technological devices",
		cmp86.default_weight = 1.0
	MERGE (cmp86)-[:HAS_SHORT_NAME]->(sn118:ShortName {id : "sn118"})
	SET sn118.label = "Maintain technological devices"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp86)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp86)-[:HAS_TARGET_COMPETENCY]->(tc93:TargetCompetency {id : "tc93"})
	SET tc93.label = "Responsibly maintain digital devices."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID86"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp86)
	Merge (cmp86)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp86)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID87 in Trans-Tech-Gen
	MERGE (grp24)-[:GROUP_HAS_COMPETENCIES_OF {order: 120, planId: "2"}]->(cmp87:Competency {id: "Trans-GUID87"})-[:IS_IN_GROUP {order: 120, planId: "2"}]->(grp24)
	SET cmp87.label = "Safeguard data",
		cmp87.default_weight = 1.0
	MERGE (cmp87)-[:HAS_SHORT_NAME]->(sn119:ShortName {id : "sn119"})
	SET sn119.label = "Safeguard data"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp87)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp87)-[:HAS_TARGET_COMPETENCY]->(tc94:TargetCompetency {id : "tc94"})
	SET tc94.label = "Keep data safe and well-organized."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID87"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp87)
	Merge (cmp87)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp87)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID88 in Trans-Tech-Gen
	MERGE (grp24)-[:GROUP_HAS_COMPETENCIES_OF {order: 121, planId: "2"}]->(cmp88:Competency {id: "Trans-GUID88"})-[:IS_IN_GROUP {order: 121, planId: "2"}]->(grp24)
	SET cmp88.label = "Digital communication",
		cmp88.default_weight = 1.0
	MERGE (cmp88)-[:HAS_SHORT_NAME]->(sn120:ShortName {id : "sn120"})
	SET sn120.label = "Digital communication"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp88)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp88)-[:HAS_TARGET_COMPETENCY]->(tc95:TargetCompetency {id : "tc95"})
	SET tc95.label = "Use various devices and digital tools to communicate with others."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID88"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp88)
	Merge (cmp88)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp88)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID89 in Trans-Tech-Gen
	MERGE (grp24)-[:GROUP_HAS_COMPETENCIES_OF {order: 122, planId: "2"}]->(cmp89:Competency {id: "Trans-GUID89"})-[:IS_IN_GROUP {order: 122, planId: "2"}]->(grp24)
	SET cmp89.label = "Written communication",
		cmp89.default_weight = 1.0
	MERGE (cmp89)-[:HAS_SHORT_NAME]->(sn121:ShortName {id : "sn121"})
	SET sn121.label = "Written communication"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp89)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp89)-[:HAS_TARGET_COMPETENCY]->(tc96:TargetCompetency {id : "tc96"})
	SET tc96.label = "Use best practices for email and other written communication with others."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID89"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp89)
	Merge (cmp89)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp89)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID90 in Trans-Tech-Gen
	MERGE (grp24)-[:GROUP_HAS_COMPETENCIES_OF {order: 123, planId: "2"}]->(cmp90:Competency {id: "Trans-GUID90"})-[:IS_IN_GROUP {order: 123, planId: "2"}]->(grp24)
	SET cmp90.label = "Collaboration tools",
		cmp90.default_weight = 1.0
	MERGE (cmp90)-[:HAS_SHORT_NAME]->(sn122:ShortName {id : "sn122"})
	SET sn122.label = "Collaboration tools"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp90)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp90)-[:HAS_TARGET_COMPETENCY]->(tc97:TargetCompetency {id : "tc97"})
	SET tc97.label = "Use collaboration tools (e.g. file sharing, track changes, Google, etc.)."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID90"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp90)
	Merge (cmp90)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp90)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID91 in Trans-Tech-Gen
	MERGE (grp24)-[:GROUP_HAS_COMPETENCIES_OF {order: 124, planId: "2"}]->(cmp91:Competency {id: "Trans-GUID91"})-[:IS_IN_GROUP {order: 124, planId: "2"}]->(grp24)
	SET cmp91.label = "Internet",
		cmp91.default_weight = 1.0
	MERGE (cmp91)-[:HAS_SHORT_NAME]->(sn123:ShortName {id : "sn123"})
	SET sn123.label = "Internet"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp91)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp91)-[:HAS_TARGET_COMPETENCY]->(tc98:TargetCompetency {id : "tc98"})
	SET tc98.label = "Use the internet to find reliable information in the field and share information appropriately."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID91"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp91)
	Merge (cmp91)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp91)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	RETURN cat8
`);

    q.push(cypher`
	MATCH (p:PlanRoot {id: "2"})
	MATCH (d:Domain {id: "2"})
	MATCH (pr:ProgressRoot {userId: "1"})
	MATCH (ms:Milestone {ms: "TransCons1"})
	MATCH (ms2:Milestone {ms: "Translator"})

	//CatTrans-Prog in 2
	MERGE (p)-[:HAS_CATEGORY {order: 125, planId: "2"}]->(cat9:CompetencyCategory {id: "Trans-Prog"})-[:IS_CATEGORY_OF {order: 125, planId: "2"}]->(p)
	SET cat9.label = "Language Programs ",
		cat9.color = "fuscia"
	MERGE (cat9)-[:HAS_SHORT_NAME]->(sn124:ShortName {id : "sn124"})
	SET sn124.label = "Language Programs "
	MERGE (cat9)-[:HAS_TARGET_COMPETENCY]->(tc99:TargetCompetency {id : "tc99"})
	SET tc99.label = "Consultants need an understanding of the overall goals and objectives of translation projects, the various stages of translation projects, the need for strategic planning, and the need for involving stakeholders from the very beginning for the sake of acceptability. They need to be aware of how the project contributes to a vision of transforming societies holistically through their languages."

	//Grp	Trans-Prog-Gen in Trans-Prog
	MERGE (cat9)-[:HAS_GROUP {order: 126, planId: "2"}]->(grp25:CompetencyGroup {id: "Trans-Prog-Gen"})-[:IS_IN_GROUP {order: 126, planId: "2"}]->(cat9)
	SET grp25.label = "A) General elements of program design"
	MERGE (grp25)-[:HAS_SHORT_NAME]->(sn125:ShortName {id : "sn125"})
	SET sn125.label = "A) General elements of program design"

	//Comp		Trans-GUID92 in Trans-Prog-Gen
	MERGE (grp25)-[:GROUP_HAS_COMPETENCIES_OF {order: 127, planId: "2"}]->(cmp92:Competency {id: "Trans-GUID92"})-[:IS_IN_GROUP {order: 127, planId: "2"}]->(grp25)
	SET cmp92.label = "Planning process",
		cmp92.default_weight = 1.0
	MERGE (cmp92)-[:HAS_SHORT_NAME]->(sn126:ShortName {id : "sn126"})
	SET sn126.label = "Planning process"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp92)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp92)-[:HAS_TARGET_COMPETENCY]->(tc100:TargetCompetency {id : "tc100"})
	SET tc100.label = "Articulate the elements of the planning process."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID92"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp92)
	Merge (cmp92)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms)
	Merge (cmp92)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID93 in Trans-Prog-Gen
	MERGE (grp25)-[:GROUP_HAS_COMPETENCIES_OF {order: 128, planId: "2"}]->(cmp93:Competency {id: "Trans-GUID93"})-[:IS_IN_GROUP {order: 128, planId: "2"}]->(grp25)
	SET cmp93.label = "Project funding proposal",
		cmp93.default_weight = 1.0
	MERGE (cmp93)-[:HAS_SHORT_NAME]->(sn127:ShortName {id : "sn127"})
	SET sn127.label = "Project funding proposal"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp93)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp93)-[:HAS_TARGET_COMPETENCY]->(tc101:TargetCompetency {id : "tc101"})
	SET tc101.label = "Articulate the key elements of a project funding proposal."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID93"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp93)
	Merge (cmp93)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms)
	Merge (cmp93)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID94 in Trans-Prog-Gen
	MERGE (grp25)-[:GROUP_HAS_COMPETENCIES_OF {order: 129, planId: "2"}]->(cmp94:Competency {id: "Trans-GUID94"})-[:IS_IN_GROUP {order: 129, planId: "2"}]->(grp25)
	SET cmp94.label = "Authorisations required",
		cmp94.default_weight = 1.0
	MERGE (cmp94)-[:HAS_SHORT_NAME]->(sn128:ShortName {id : "sn128"})
	SET sn128.label = "Authorisations required"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp94)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp94)-[:HAS_TARGET_COMPETENCY]->(tc102:TargetCompetency {id : "tc102"})
	SET tc102.label = "Explain the checks and sign-offs required at different stages of a language program."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID94"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp94)
	Merge (cmp94)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms)
	Merge (cmp94)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID95 in Trans-Prog-Gen
	MERGE (grp25)-[:GROUP_HAS_COMPETENCIES_OF {order: 130, planId: "2"}]->(cmp95:Competency {id: "Trans-GUID95"})-[:IS_IN_GROUP {order: 130, planId: "2"}]->(grp25)
	SET cmp95.label = "Sociolingiustic relevance",
		cmp95.default_weight = 1.0
	MERGE (cmp95)-[:HAS_SHORT_NAME]->(sn129:ShortName {id : "sn129"})
	SET sn129.label = "Sociolingiustic relevance"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp95)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp95)-[:HAS_TARGET_COMPETENCY]->(tc103:TargetCompetency {id : "tc103"})
	SET tc103.label = "Explain the relevance of basic concepts of sociolinguistics, such as variation, identity, multilingualism, attitudes, vitality, etc. to language program design."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID95"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp95)
	Merge (cmp95)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp95)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID96 in Trans-Prog-Gen
	MERGE (grp25)-[:GROUP_HAS_COMPETENCIES_OF {order: 131, planId: "2"}]->(cmp96:Competency {id: "Trans-GUID96"})-[:IS_IN_GROUP {order: 131, planId: "2"}]->(grp25)
	SET cmp96.label = "Intellectual property",
		cmp96.default_weight = 1.0
	MERGE (cmp96)-[:HAS_SHORT_NAME]->(sn130:ShortName {id : "sn130"})
	SET sn130.label = "Intellectual property"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp96)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp96)-[:HAS_TARGET_COMPETENCY]->(tc104:TargetCompetency {id : "tc104"})
	SET tc104.label = "Demonstrate appropriate handling of Intellectual Property issues."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID96"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp96)
	Merge (cmp96)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms)
	Merge (cmp96)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID97 in Trans-Prog-Gen
	MERGE (grp25)-[:GROUP_HAS_COMPETENCIES_OF {order: 132, planId: "2"}]->(cmp97:Competency {id: "Trans-GUID97"})-[:IS_IN_GROUP {order: 132, planId: "2"}]->(grp25)
	SET cmp97.label = "Working in partnership",
		cmp97.default_weight = 1.0
	MERGE (cmp97)-[:HAS_SHORT_NAME]->(sn131:ShortName {id : "sn131"})
	SET sn131.label = "Working in partnership"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp97)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp97)-[:HAS_TARGET_COMPETENCY]->(tc105:TargetCompetency {id : "tc105"})
	SET tc105.label = "Demonstrate understanding of, and positive attitudes towards, working through partnerships and teams to accomplish all language development strategic goals."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID97"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp97)
	Merge (cmp97)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp97)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID98 in Trans-Prog-Gen
	MERGE (grp25)-[:GROUP_HAS_COMPETENCIES_OF {order: 133, planId: "2"}]->(cmp98:Competency {id: "Trans-GUID98"})-[:IS_IN_GROUP {order: 133, planId: "2"}]->(grp25)
	SET cmp98.label = "Participatory methods",
		cmp98.default_weight = 1.0
	MERGE (cmp98)-[:HAS_SHORT_NAME]->(sn132:ShortName {id : "sn132"})
	SET sn132.label = "Participatory methods"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp98)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp98)-[:HAS_TARGET_COMPETENCY]->(tc106:TargetCompetency {id : "tc106"})
	SET tc106.label = "Demonstrate an ability to use participatory methods when working with a language community to promote acceptance."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID98"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp98)
	Merge (cmp98)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp98)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID99 in Trans-Prog-Gen
	MERGE (grp25)-[:GROUP_HAS_COMPETENCIES_OF {order: 134, planId: "2"}]->(cmp99:Competency {id: "Trans-GUID99"})-[:IS_IN_GROUP {order: 134, planId: "2"}]->(grp25)
	SET cmp99.label = "Best practices for desigining project",
		cmp99.default_weight = 1.0
	MERGE (cmp99)-[:HAS_SHORT_NAME]->(sn133:ShortName {id : "sn133"})
	SET sn133.label = "Best practices for desigining project"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp99)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp99)-[:HAS_TARGET_COMPETENCY]->(tc107:TargetCompetency {id : "tc107"})
	SET tc107.label = "Explain general principles, approaches and best practices for designing and developing language programs. Understands the interplay between Budget, Time, Scope, project goals, and their impact on Quality and can successfully shape and navigate these things to meet desired parameters."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID99"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp99)
	Merge (cmp99)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp99)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Grp	Trans-Prog-Role in Trans-Prog
	MERGE (cat9)-[:HAS_GROUP {order: 135, planId: "2"}]->(grp26:CompetencyGroup {id: "Trans-Prog-Role"})-[:IS_IN_GROUP {order: 135, planId: "2"}]->(cat9)
	SET grp26.label = "B) Roles of consultants within a BT/SE program"
	MERGE (grp26)-[:HAS_SHORT_NAME]->(sn134:ShortName {id : "sn134"})
	SET sn134.label = "B) Roles of consultants within a BT/SE program"

	//Comp		Trans-GUID100 in Trans-Prog-Role
	MERGE (grp26)-[:GROUP_HAS_COMPETENCIES_OF {order: 136, planId: "2"}]->(cmp100:Competency {id: "Trans-GUID100"})-[:IS_IN_GROUP {order: 136, planId: "2"}]->(grp26)
	SET cmp100.label = "Interdisciplinary approach",
		cmp100.default_weight = 1.0
	MERGE (cmp100)-[:HAS_SHORT_NAME]->(sn135:ShortName {id : "sn135"})
	SET sn135.label = "Interdisciplinary approach"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp100)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp100)-[:HAS_TARGET_COMPETENCY]->(tc108:TargetCompetency {id : "tc108"})
	SET tc108.label = "Articulate the roles of the different academic domains in a language program."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID100"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp100)
	Merge (cmp100)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp100)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID101 in Trans-Prog-Role
	MERGE (grp26)-[:GROUP_HAS_COMPETENCIES_OF {order: 137, planId: "2"}]->(cmp101:Competency {id: "Trans-GUID101"})-[:IS_IN_GROUP {order: 137, planId: "2"}]->(grp26)
	SET cmp101.label = "Scripture Engagement principles",
		cmp101.default_weight = 1.0
	MERGE (cmp101)-[:HAS_SHORT_NAME]->(sn136:ShortName {id : "sn136"})
	SET sn136.label = "Scripture Engagement principles"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp101)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp101)-[:HAS_TARGET_COMPETENCY]->(tc109:TargetCompetency {id : "tc109"})
	SET tc109.label = "Articulate the basic principles and conditions for effective Scripture Engagement."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID101"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp101)
	Merge (cmp101)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp101)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID102 in Trans-Prog-Role
	MERGE (grp26)-[:GROUP_HAS_COMPETENCIES_OF {order: 138, planId: "2"}]->(cmp102:Competency {id: "Trans-GUID102"})-[:IS_IN_GROUP {order: 138, planId: "2"}]->(grp26)
	SET cmp102.label = "Multilingualism Urbanisation & Scripture Engagement (MUSE)",
		cmp102.default_weight = 1.0
	MERGE (cmp102)-[:HAS_SHORT_NAME]->(sn137:ShortName {id : "sn137"})
	SET sn137.label = "Multilingualism Urbanisation & Scripture Engagement (MUSE)"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp102)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp102)-[:HAS_TARGET_COMPETENCY]->(tc110:TargetCompetency {id : "tc110"})
	SET tc110.label = "Articulate the relevance of multilingualism, urbanization and migration to a BT/SE program."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID102"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp102)
	Merge (cmp102)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp102)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID103 in Trans-Prog-Role
	MERGE (grp26)-[:GROUP_HAS_COMPETENCIES_OF {order: 139, planId: "2"}]->(cmp103:Competency {id: "Trans-GUID103"})-[:IS_IN_GROUP {order: 139, planId: "2"}]->(grp26)
	SET cmp103.label = "Church mission & community engagement",
		cmp103.default_weight = 1.0
	MERGE (cmp103)-[:HAS_SHORT_NAME]->(sn138:ShortName {id : "sn138"})
	SET sn138.label = "Church mission & community engagement"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp103)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp103)-[:HAS_TARGET_COMPETENCY]->(tc111:TargetCompetency {id : "tc111"})
	SET tc111.label = "Articulate and appreciate the role of the church and missions in a BT/SE program: how the community will engage with the Scriptures and the implications that has for how Scripture is translated."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID103"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp103)
	Merge (cmp103)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp103)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID104 in Trans-Prog-Role
	MERGE (grp26)-[:GROUP_HAS_COMPETENCIES_OF {order: 140, planId: "2"}]->(cmp104:Competency {id: "Trans-GUID104"})-[:IS_IN_GROUP {order: 140, planId: "2"}]->(grp26)
	SET cmp104.label = "SE approaches",
		cmp104.default_weight = 1.0
	MERGE (cmp104)-[:HAS_SHORT_NAME]->(sn139:ShortName {id : "sn139"})
	SET sn139.label = "SE approaches"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp104)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp104)-[:HAS_TARGET_COMPETENCY]->(tc112:TargetCompetency {id : "tc112"})
	SET tc112.label = "Is familiar with a variety of SE approaches (e.g. private reading, public reading, Storying Fellowship Groups, Listening Groups, apps). Demonstrate a good understanding of the most relevant developments and approaches in Scripture Engagement. "
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID104"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp104)
	Merge (cmp104)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp104)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	RETURN cat9
`);

    q.push(cypher`
	MATCH (p:PlanRoot {id: "2"})
	MATCH (d:Domain {id: "2"})
	MATCH (pr:ProgressRoot {userId: "1"})
	MATCH (ms:Milestone {ms: "TransCons1"})
	MATCH (ms2:Milestone {ms: "Translator"})

	//CatTrans-Interp in 2
	MERGE (p)-[:HAS_CATEGORY {order: 141, planId: "2"}]->(cat10:CompetencyCategory {id: "Trans-Interp"})-[:IS_CATEGORY_OF {order: 141, planId: "2"}]->(p)
	SET cat10.label = "Interpersonal Skills ",
		cat10.color = "cyan"
	MERGE (cat10)-[:HAS_SHORT_NAME]->(sn140:ShortName {id : "sn140"})
	SET sn140.label = "Interpersonal Skills "
	MERGE (cat10)-[:HAS_TARGET_COMPETENCY]->(tc113:TargetCompetency {id : "tc113"})
	SET tc113.label = "Interpersonal skills are crucial for successfully developing good relationships for collaboration, solving problems and strengthening practices. These skills are linked to a person's personality, and as such are not as easily learned as other competencies. So they are worded here in terms of descriptions of attitudes and behavior demonstrated over time."

	//Grp	Trans-Interp-Hol in Trans-Interp
	MERGE (cat10)-[:HAS_GROUP {order: 142, planId: "2"}]->(grp27:CompetencyGroup {id: "Trans-Interp-Hol"})-[:IS_IN_GROUP {order: 142, planId: "2"}]->(cat10)
	SET grp27.label = "A) Holistic personal growth"
	MERGE (grp27)-[:HAS_SHORT_NAME]->(sn141:ShortName {id : "sn141"})
	SET sn141.label = "A) Holistic personal growth"

	//Comp		Trans-GUID105 in Trans-Interp-Hol
	MERGE (grp27)-[:GROUP_HAS_COMPETENCIES_OF {order: 143, planId: "2"}]->(cmp105:Competency {id: "Trans-GUID105"})-[:IS_IN_GROUP {order: 143, planId: "2"}]->(grp27)
	SET cmp105.label = "Cuture-Savvy",
		cmp105.default_weight = 1.0
	MERGE (cmp105)-[:HAS_SHORT_NAME]->(sn142:ShortName {id : "sn142"})
	SET sn142.label = "Cuture-Savvy"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp105)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp105)-[:HAS_TARGET_COMPETENCY]->(tc114:TargetCompetency {id : "tc114"})
	SET tc114.label = "Is able to explain how one's own cultural background and personality impacts one's thinking, values and behavior and how one relates to others."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID105"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp105)
	Merge (cmp105)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp105)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID106 in Trans-Interp-Hol
	MERGE (grp27)-[:GROUP_HAS_COMPETENCIES_OF {order: 144, planId: "2"}]->(cmp106:Competency {id: "Trans-GUID106"})-[:IS_IN_GROUP {order: 144, planId: "2"}]->(grp27)
	SET cmp106.label = "Self-Aware",
		cmp106.default_weight = 1.0
	MERGE (cmp106)-[:HAS_SHORT_NAME]->(sn143:ShortName {id : "sn143"})
	SET sn143.label = "Self-Aware"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp106)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp106)-[:HAS_TARGET_COMPETENCY]->(tc115:TargetCompetency {id : "tc115"})
	SET tc115.label = "Being aware of one's own personality and cultural background, is able to take responsible courses of action in cross-cultural situations."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID106"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp106)
	Merge (cmp106)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp106)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID107 in Trans-Interp-Hol
	MERGE (grp27)-[:GROUP_HAS_COMPETENCIES_OF {order: 145, planId: "2"}]->(cmp107:Competency {id: "Trans-GUID107"})-[:IS_IN_GROUP {order: 145, planId: "2"}]->(grp27)
	SET cmp107.label = "Tolerance",
		cmp107.default_weight = 1.0
	MERGE (cmp107)-[:HAS_SHORT_NAME]->(sn144:ShortName {id : "sn144"})
	SET sn144.label = "Tolerance"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp107)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp107)-[:HAS_TARGET_COMPETENCY]->(tc116:TargetCompetency {id : "tc116"})
	SET tc116.label = "Tolerantly considers other views/perspectives."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID107"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp107)
	Merge (cmp107)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp107)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID108 in Trans-Interp-Hol
	MERGE (grp27)-[:GROUP_HAS_COMPETENCIES_OF {order: 146, planId: "2"}]->(cmp108:Competency {id: "Trans-GUID108"})-[:IS_IN_GROUP {order: 146, planId: "2"}]->(grp27)
	SET cmp108.label = "Responsible",
		cmp108.default_weight = 1.0
	MERGE (cmp108)-[:HAS_SHORT_NAME]->(sn145:ShortName {id : "sn145"})
	SET sn145.label = "Responsible"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp108)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp108)-[:HAS_TARGET_COMPETENCY]->(tc117:TargetCompetency {id : "tc117"})
	SET tc117.label = "Is willing to take responsibility for negative patterns that affect one's interactions in community."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID108"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp108)
	Merge (cmp108)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp108)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID109 in Trans-Interp-Hol
	MERGE (grp27)-[:GROUP_HAS_COMPETENCIES_OF {order: 147, planId: "2"}]->(cmp109:Competency {id: "Trans-GUID109"})-[:IS_IN_GROUP {order: 147, planId: "2"}]->(grp27)
	SET cmp109.label = "Initiative",
		cmp109.default_weight = 1.0
	MERGE (cmp109)-[:HAS_SHORT_NAME]->(sn146:ShortName {id : "sn146"})
	SET sn146.label = "Initiative"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp109)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp109)-[:HAS_TARGET_COMPETENCY]->(tc118:TargetCompetency {id : "tc118"})
	SET tc118.label = "Takes initiative."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID109"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp109)
	Merge (cmp109)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp109)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID110 in Trans-Interp-Hol
	MERGE (grp27)-[:GROUP_HAS_COMPETENCIES_OF {order: 148, planId: "2"}]->(cmp110:Competency {id: "Trans-GUID110"})-[:IS_IN_GROUP {order: 148, planId: "2"}]->(grp27)
	SET cmp110.label = "Self-Controlled",
		cmp110.default_weight = 1.0
	MERGE (cmp110)-[:HAS_SHORT_NAME]->(sn147:ShortName {id : "sn147"})
	SET sn147.label = "Self-Controlled"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp110)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp110)-[:HAS_TARGET_COMPETENCY]->(tc119:TargetCompetency {id : "tc119"})
	SET tc119.label = "Is intentional about dealing with one's own inner dynamics appropriately as one becomes aware of them."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID110"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp110)
	Merge (cmp110)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp110)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID111 in Trans-Interp-Hol
	MERGE (grp27)-[:GROUP_HAS_COMPETENCIES_OF {order: 149, planId: "2"}]->(cmp111:Competency {id: "Trans-GUID111"})-[:IS_IN_GROUP {order: 149, planId: "2"}]->(grp27)
	SET cmp111.label = "Balance",
		cmp111.default_weight = 1.0
	MERGE (cmp111)-[:HAS_SHORT_NAME]->(sn148:ShortName {id : "sn148"})
	SET sn148.label = "Balance"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp111)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp111)-[:HAS_TARGET_COMPETENCY]->(tc120:TargetCompetency {id : "tc120"})
	SET tc120.label = "Balances workload in a healthy way."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID111"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp111)
	Merge (cmp111)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp111)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID112 in Trans-Interp-Hol
	MERGE (grp27)-[:GROUP_HAS_COMPETENCIES_OF {order: 150, planId: "2"}]->(cmp112:Competency {id: "Trans-GUID112"})-[:IS_IN_GROUP {order: 150, planId: "2"}]->(grp27)
	SET cmp112.label = "Dependability",
		cmp112.default_weight = 1.0
	MERGE (cmp112)-[:HAS_SHORT_NAME]->(sn149:ShortName {id : "sn149"})
	SET sn149.label = "Dependability"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp112)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp112)-[:HAS_TARGET_COMPETENCY]->(tc121:TargetCompetency {id : "tc121"})
	SET tc121.label = "Fulfills obligations/achieves agreed upon goals consistently."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID112"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp112)
	Merge (cmp112)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp112)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID113 in Trans-Interp-Hol
	MERGE (grp27)-[:GROUP_HAS_COMPETENCIES_OF {order: 151, planId: "2"}]->(cmp113:Competency {id: "Trans-GUID113"})-[:IS_IN_GROUP {order: 151, planId: "2"}]->(grp27)
	SET cmp113.label = "Attitude",
		cmp113.default_weight = 1.0
	MERGE (cmp113)-[:HAS_SHORT_NAME]->(sn150:ShortName {id : "sn150"})
	SET sn150.label = "Attitude"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp113)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp113)-[:HAS_TARGET_COMPETENCY]->(tc122:TargetCompetency {id : "tc122"})
	SET tc122.label = "Demonstrates a positive attitude in all circumstances."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID113"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp113)
	Merge (cmp113)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp113)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Grp	Trans-Interp-Rel in Trans-Interp
	MERGE (cat10)-[:HAS_GROUP {order: 152, planId: "2"}]->(grp28:CompetencyGroup {id: "Trans-Interp-Rel"})-[:IS_IN_GROUP {order: 152, planId: "2"}]->(cat10)
	SET grp28.label = "B) Interpersonal relationships"
	MERGE (grp28)-[:HAS_SHORT_NAME]->(sn151:ShortName {id : "sn151"})
	SET sn151.label = "B) Interpersonal relationships"

	//Comp		Trans-GUID114 in Trans-Interp-Rel
	MERGE (grp28)-[:GROUP_HAS_COMPETENCIES_OF {order: 153, planId: "2"}]->(cmp114:Competency {id: "Trans-GUID114"})-[:IS_IN_GROUP {order: 153, planId: "2"}]->(grp28)
	SET cmp114.label = "Easy-Going",
		cmp114.default_weight = 1.0
	MERGE (cmp114)-[:HAS_SHORT_NAME]->(sn152:ShortName {id : "sn152"})
	SET sn152.label = "Easy-Going"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp114)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp114)-[:HAS_TARGET_COMPETENCY]->(tc123:TargetCompetency {id : "tc123"})
	SET tc123.label = "Takes responsibility for negative patterns, does not easily take offense."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID114"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp114)
	Merge (cmp114)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp114)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID115 in Trans-Interp-Rel
	MERGE (grp28)-[:GROUP_HAS_COMPETENCIES_OF {order: 154, planId: "2"}]->(cmp115:Competency {id: "Trans-GUID115"})-[:IS_IN_GROUP {order: 154, planId: "2"}]->(grp28)
	SET cmp115.label = "Non-work Relationships",
		cmp115.default_weight = 1.0
	MERGE (cmp115)-[:HAS_SHORT_NAME]->(sn153:ShortName {id : "sn153"})
	SET sn153.label = "Non-work Relationships"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp115)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp115)-[:HAS_TARGET_COMPETENCY]->(tc124:TargetCompetency {id : "tc124"})
	SET tc124.label = "Builds personal relationships that extend beyond work situations."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID115"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp115)
	Merge (cmp115)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp115)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID116 in Trans-Interp-Rel
	MERGE (grp28)-[:GROUP_HAS_COMPETENCIES_OF {order: 155, planId: "2"}]->(cmp116:Competency {id: "Trans-GUID116"})-[:IS_IN_GROUP {order: 155, planId: "2"}]->(grp28)
	SET cmp116.label = "Caring",
		cmp116.default_weight = 1.0
	MERGE (cmp116)-[:HAS_SHORT_NAME]->(sn154:ShortName {id : "sn154"})
	SET sn154.label = "Caring"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp116)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp116)-[:HAS_TARGET_COMPETENCY]->(tc125:TargetCompetency {id : "tc125"})
	SET tc125.label = "Shows genuine interest in the work of others."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID116"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp116)
	Merge (cmp116)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp116)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID117 in Trans-Interp-Rel
	MERGE (grp28)-[:GROUP_HAS_COMPETENCIES_OF {order: 156, planId: "2"}]->(cmp117:Competency {id: "Trans-GUID117"})-[:IS_IN_GROUP {order: 156, planId: "2"}]->(grp28)
	SET cmp117.label = "Critcism",
		cmp117.default_weight = 1.0
	MERGE (cmp117)-[:HAS_SHORT_NAME]->(sn155:ShortName {id : "sn155"})
	SET sn155.label = "Critcism"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp117)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp117)-[:HAS_TARGET_COMPETENCY]->(tc126:TargetCompetency {id : "tc126"})
	SET tc126.label = "Expresses and receives criticism in constructive ways."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID117"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp117)
	Merge (cmp117)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp117)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID118 in Trans-Interp-Rel
	MERGE (grp28)-[:GROUP_HAS_COMPETENCIES_OF {order: 157, planId: "2"}]->(cmp118:Competency {id: "Trans-GUID118"})-[:IS_IN_GROUP {order: 157, planId: "2"}]->(grp28)
	SET cmp118.label = "Listener",
		cmp118.default_weight = 1.0
	MERGE (cmp118)-[:HAS_SHORT_NAME]->(sn156:ShortName {id : "sn156"})
	SET sn156.label = "Listener"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp118)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp118)-[:HAS_TARGET_COMPETENCY]->(tc127:TargetCompetency {id : "tc127"})
	SET tc127.label = "Listens to the ideas of others and learns from them."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID118"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp118)
	Merge (cmp118)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp118)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Grp	Trans-Interp-Situ in Trans-Interp
	MERGE (cat10)-[:HAS_GROUP {order: 158, planId: "2"}]->(grp29:CompetencyGroup {id: "Trans-Interp-Situ"})-[:IS_IN_GROUP {order: 158, planId: "2"}]->(cat10)
	SET grp29.label = "C) Skills in consulting situation"
	MERGE (grp29)-[:HAS_SHORT_NAME]->(sn157:ShortName {id : "sn157"})
	SET sn157.label = "C) Skills in consulting situation"

	//Comp		Trans-GUID119 in Trans-Interp-Situ
	MERGE (grp29)-[:GROUP_HAS_COMPETENCIES_OF {order: 159, planId: "2"}]->(cmp119:Competency {id: "Trans-GUID119"})-[:IS_IN_GROUP {order: 159, planId: "2"}]->(grp29)
	SET cmp119.label = "Respect",
		cmp119.default_weight = 1.0
	MERGE (cmp119)-[:HAS_SHORT_NAME]->(sn158:ShortName {id : "sn158"})
	SET sn158.label = "Respect"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp119)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp119)-[:HAS_TARGET_COMPETENCY]->(tc128:TargetCompetency {id : "tc128"})
	SET tc128.label = "Shows respect for the person consulted: that s/he is a learner but also an expert in his/her own domain."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID119"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp119)
	Merge (cmp119)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp119)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID120 in Trans-Interp-Situ
	MERGE (grp29)-[:GROUP_HAS_COMPETENCIES_OF {order: 160, planId: "2"}]->(cmp120:Competency {id: "Trans-GUID120"})-[:IS_IN_GROUP {order: 160, planId: "2"}]->(grp29)
	SET cmp120.label = "Listener",
		cmp120.default_weight = 1.0
	MERGE (cmp120)-[:HAS_SHORT_NAME]->(sn159:ShortName {id : "sn159"})
	SET sn159.label = "Listener"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp120)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp120)-[:HAS_TARGET_COMPETENCY]->(tc129:TargetCompetency {id : "tc129"})
	SET tc129.label = "Listens attentively to understand what others need and want."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID120"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp120)
	Merge (cmp120)-[:TARGET_VALUE_IS {planId: "2", min: 3}]->(ms)
	Merge (cmp120)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms2)

	//Comp		Trans-GUID121 in Trans-Interp-Situ
	MERGE (grp29)-[:GROUP_HAS_COMPETENCIES_OF {order: 161, planId: "2"}]->(cmp121:Competency {id: "Trans-GUID121"})-[:IS_IN_GROUP {order: 161, planId: "2"}]->(grp29)
	SET cmp121.label = "Questions",
		cmp121.default_weight = 1.0
	MERGE (cmp121)-[:HAS_SHORT_NAME]->(sn160:ShortName {id : "sn160"})
	SET sn160.label = "Questions"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp121)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp121)-[:HAS_TARGET_COMPETENCY]->(tc130:TargetCompetency {id : "tc130"})
	SET tc130.label = "Formulates insightful questions."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID121"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp121)
	Merge (cmp121)-[:TARGET_VALUE_IS {planId: "2", min: 3}]->(ms)
	Merge (cmp121)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms2)

	//Comp		Trans-GUID122 in Trans-Interp-Situ
	MERGE (grp29)-[:GROUP_HAS_COMPETENCIES_OF {order: 162, planId: "2"}]->(cmp122:Competency {id: "Trans-GUID122"})-[:IS_IN_GROUP {order: 162, planId: "2"}]->(grp29)
	SET cmp122.label = "Responsive",
		cmp122.default_weight = 1.0
	MERGE (cmp122)-[:HAS_SHORT_NAME]->(sn161:ShortName {id : "sn161"})
	SET sn161.label = "Responsive"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp122)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp122)-[:HAS_TARGET_COMPETENCY]->(tc131:TargetCompetency {id : "tc131"})
	SET tc131.label = "Responds to comments initiated by others."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID122"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp122)
	Merge (cmp122)-[:TARGET_VALUE_IS {planId: "2", min: 3}]->(ms)
	Merge (cmp122)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms2)

	//Comp		Trans-GUID123 in Trans-Interp-Situ
	MERGE (grp29)-[:GROUP_HAS_COMPETENCIES_OF {order: 163, planId: "2"}]->(cmp123:Competency {id: "Trans-GUID123"})-[:IS_IN_GROUP {order: 163, planId: "2"}]->(grp29)
	SET cmp123.label = "Advice",
		cmp123.default_weight = 1.0
	MERGE (cmp123)-[:HAS_SHORT_NAME]->(sn162:ShortName {id : "sn162"})
	SET sn162.label = "Advice"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp123)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp123)-[:HAS_TARGET_COMPETENCY]->(tc132:TargetCompetency {id : "tc132"})
	SET tc132.label = "Gives advice in a way that is appropriate and persuasive."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID123"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp123)
	Merge (cmp123)-[:TARGET_VALUE_IS {planId: "2", min: 3}]->(ms)
	Merge (cmp123)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms2)

	//Comp		Trans-GUID124 in Trans-Interp-Situ
	MERGE (grp29)-[:GROUP_HAS_COMPETENCIES_OF {order: 164, planId: "2"}]->(cmp124:Competency {id: "Trans-GUID124"})-[:IS_IN_GROUP {order: 164, planId: "2"}]->(grp29)
	SET cmp124.label = "Appreciative",
		cmp124.default_weight = 1.0
	MERGE (cmp124)-[:HAS_SHORT_NAME]->(sn163:ShortName {id : "sn163"})
	SET sn163.label = "Appreciative"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp124)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp124)-[:HAS_TARGET_COMPETENCY]->(tc133:TargetCompetency {id : "tc133"})
	SET tc133.label = "Expresses appreciation and affirmation for good work and goals met, and so motivates those being consulted."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID124"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp124)
	Merge (cmp124)-[:TARGET_VALUE_IS {planId: "2", min: 3}]->(ms)
	Merge (cmp124)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms2)

	//Comp		Trans-GUID125 in Trans-Interp-Situ
	MERGE (grp29)-[:GROUP_HAS_COMPETENCIES_OF {order: 165, planId: "2"}]->(cmp125:Competency {id: "Trans-GUID125"})-[:IS_IN_GROUP {order: 165, planId: "2"}]->(grp29)
	SET cmp125.label = "Peace-Maker",
		cmp125.default_weight = 1.0
	MERGE (cmp125)-[:HAS_SHORT_NAME]->(sn164:ShortName {id : "sn164"})
	SET sn164.label = "Peace-Maker"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp125)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp125)-[:HAS_TARGET_COMPETENCY]->(tc134:TargetCompetency {id : "tc134"})
	SET tc134.label = "Seeks to defuse tension and promote positive relationships in culturally appropriate ways."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID125"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp125)
	Merge (cmp125)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms)
	Merge (cmp125)-[:TARGET_VALUE_IS {planId: "2", min: 1}]->(ms2)

	//Comp		Trans-GUID126 in Trans-Interp-Situ
	MERGE (grp29)-[:GROUP_HAS_COMPETENCIES_OF {order: 166, planId: "2"}]->(cmp126:Competency {id: "Trans-GUID126"})-[:IS_IN_GROUP {order: 166, planId: "2"}]->(grp29)
	SET cmp126.label = "Growth Despite Conflict",
		cmp126.default_weight = 1.0
	MERGE (cmp126)-[:HAS_SHORT_NAME]->(sn165:ShortName {id : "sn165"})
	SET sn165.label = "Growth Despite Conflict"
	MERGE (d)-[:PRIMARY_DOMAIN_OF]->(cmp126)-[:HAS_PRIMARY_DOMAIN]->(d)
	MERGE (cmp126)-[:HAS_TARGET_COMPETENCY]->(tc135:TargetCompetency {id : "tc135"})
	SET tc135.label = "Resolves conflicts in a way that results in strengthened, positive relationships. (for example with regard to the question of how to translate a certain Biblical key term), or when there is a conflict between the translation team and the translation consultant."
	Merge (pr)-[:CHILD_PROGRESS]->(:Progress {currentLevel: 2, competency_ref: "Trans-GUID126"})-[:COMPETENCY_PROGRESS {userId: "1"}]-(cmp126)
	Merge (cmp126)-[:TARGET_VALUE_IS {planId: "2", min: 3}]->(ms)
	Merge (cmp126)-[:TARGET_VALUE_IS {planId: "2", min: 2}]->(ms2)

	RETURN cat10
`);

    // ===========Last Things================
    var dateobj = new Date();
    var myNow = dateobj.toISOString();
    q.push(cypher`
    MATCH (a)-[r]-(b)
    WHERE NOT EXISTS(r.startDate)
    SET r.startDate = ${myNow}
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
