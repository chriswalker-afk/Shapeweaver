import test from "node:test";
import assert from "node:assert/strict";
import {readFile,mkdtemp,mkdir,writeFile,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
import {CAMPAIGN_VIEWPORTS,VIEWPORT_NAMES,LEVEL_COUNT,REVIEW_LEVELS,browserQaOptions,captureLevel,assertBrowserCoverage} from "../tools/browser-qa-plan.mjs";

const makeRows=(names=VIEWPORT_NAMES)=>names.flatMap(viewport=>Array.from({length:LEVEL_COUNT},(_,i)=>({viewport,level:i+1,stageHeight:200})));
const makeShowcase=(names=VIEWPORT_NAMES)=>names.map(viewport=>({viewport,static:true,animated:true,pause:true,navigation:true,unobstructed:true}));
test("all four independent shards partition the original 144 cases",()=>{
 assert.deepEqual(browserQaOptions().viewports,CAMPAIGN_VIEWPORTS);
 assert.equal(browserQaOptions().screenshots,"all");
 const shards=VIEWPORT_NAMES.flatMap(n=>browserQaOptions(["--viewport",n,"--screenshots","review"]).viewports);
 assert.deepEqual(shards,CAMPAIGN_VIEWPORTS);
 assert.equal(shards.length*LEVEL_COUNT,144);
 assert.deepEqual(CAMPAIGN_VIEWPORTS,[["desktop",1366,768,false],["small-desktop",1024,600,false],["landscape-phone",844,390,true],["portrait-phone",390,844,true]]);
 for(const args of [["--viewport","bogus"],["--viewport"],["--screenshots","none"],["--screenshots","review","--screenshots","all"],["--unknown","all"]])assert.throws(()=>browserQaOptions(args));
});
test("review screenshots retain tutorials, chapter entries and finale; full mode retains every level",()=>{
 const levels=Array.from({length:36},(_,i)=>i+1);
 assert.deepEqual(levels.filter(l=>captureLevel(l,"review")),REVIEW_LEVELS);
 assert.deepEqual(levels.filter(l=>captureLevel(l,"all")),levels);
 assert.deepEqual(REVIEW_LEVELS,[1,2,3,4,5,9,13,19,25,31,36]);
 assert.throws(()=>captureLevel(0,"review"));assert.throws(()=>captureLevel(1,"none"));
});
test("coverage rejects missing, duplicated, misassigned, malformed and incomplete evidence",()=>{
 const rows=makeRows(),home=makeShowcase();
 assert.doesNotThrow(()=>assertBrowserCoverage(rows,home));
 for(const n of VIEWPORT_NAMES)assert.doesNotThrow(()=>assertBrowserCoverage(makeRows([n]),makeShowcase([n]),[n]));
 assert.throws(()=>assertBrowserCoverage(rows.slice(1),home));
 assert.throws(()=>assertBrowserCoverage([...rows.slice(1),rows[1]],home));
 assert.throws(()=>assertBrowserCoverage([{...rows[0],viewport:"unknown"},...rows.slice(1)],home));
 assert.throws(()=>assertBrowserCoverage([{...rows[0],level:37},...rows.slice(1)],home));
 assert.throws(()=>assertBrowserCoverage([{...rows[0],stageHeight:0},...rows.slice(1)],home));
 assert.throws(()=>assertBrowserCoverage(rows,home.slice(1)));
 assert.throws(()=>assertBrowserCoverage(rows,[{...home[0],animated:false},...home.slice(1)]));
 assert.throws(()=>assertBrowserCoverage(rows,[home[1],...home.slice(1)]));
 assert.throws(()=>assertBrowserCoverage(makeRows(["desktop"]),makeShowcase(["desktop"]),["small-desktop"]));
 assert.throws(()=>assertBrowserCoverage([],[],[]));
});
test("workflow matches canonical viewport matrix and retains the focused and final gates",async()=>{
 const workflow=await readFile(new URL("../.github/workflows/browser-qa.yml",import.meta.url),"utf8");
 const matrix=workflow.match(/viewport: \[([^\]]+)\]/)?.[1]?.split(",").map(x=>x.trim());
 assert.deepEqual(matrix,VIEWPORT_NAMES);
 assert.match(workflow,/fail-fast: false/);
 assert.match(workflow,/browser-smoke:\s*[^]*?needs: \[focused, campaign\]\s+if: always\(\)/);
 assert.ok(workflow.includes('test "$FOCUSED_RESULT" = success'));
 assert.ok(workflow.includes('test "$CAMPAIGN_RESULT" = success'));
 for(const script of ["production-smoke","home-polish-qa","library-qa","workshop-browser-qa","verify-browser-coverage"])assert.ok(workflow.includes("node tools/"+script+".mjs"));
});
test("report aggregation CLI requires all four successful exact-commit shards",async()=>{
 const root=await mkdtemp(join(tmpdir(),"shapeweaver-qa-"));
 const input=join(root,"input"),out=join(root,"out"),commit="a".repeat(40);
 const script=fileURLToPath(new URL("../tools/verify-browser-coverage.mjs",import.meta.url));
 const run=()=>spawnSync(process.execPath,[script,input,out],{encoding:"utf8",env:{...process.env,GITHUB_SHA:commit}});
 const dir=n=>join(input,"shapeweaver-campaign-report-"+n);
 const meta=n=>({commit,passed:true,viewports:[n],screenshots:"review",screenshotCount:24,elapsedMs:1200});
 const write=(n,file,value)=>writeFile(join(dir(n),file),JSON.stringify(value));
 try{
  for(const n of VIEWPORT_NAMES){
   await mkdir(dir(n),{recursive:true});
   await write(n,"coverage-meta.json",meta(n));
   await write(n,"layout-report.json",makeRows([n]));
   await write(n,"home-showcase-report.json",makeShowcase([n]));
  }
  const success=run();
  assert.equal(success.status,0,success.stderr);
  const summary=JSON.parse(await readFile(join(out,"coverage-summary.json"),"utf8"));
  assert.equal(summary.combinations,144);assert.equal(summary.passed,true);assert.equal(summary.shards.length,4);
  for(const bad of [{commit:"b".repeat(40)},{passed:false},{viewports:["portrait-phone"]},{screenshotCount:0}]){
   await write("desktop","coverage-meta.json",{...meta("desktop"),...bad});
   assert.notEqual(run().status,0,JSON.stringify(bad));
  }
  await write("desktop","coverage-meta.json",meta("desktop"));
  const rows=makeRows(["desktop"]);
  await write("desktop","layout-report.json",[rows[1],...rows.slice(1)]);
  assert.notEqual(run().status,0,"duplicate level");
  await write("desktop","layout-report.json",rows);
  await rm(dir("portrait-phone"),{recursive:true,force:true});
  assert.notEqual(run().status,0,"missing shard");
 }finally{await rm(root,{recursive:true,force:true});}
});
