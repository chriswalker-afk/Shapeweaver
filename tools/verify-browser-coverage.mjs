import {readFile,readdir,mkdir,writeFile} from "node:fs/promises";
import {join} from "node:path";
import assert from "node:assert/strict";
import {VIEWPORT_NAMES,LEVEL_COUNT,assertBrowserCoverage} from "./browser-qa-plan.mjs";

const input=process.argv[2]??"browser-qa/shard-reports",out=process.argv[3]??"browser-qa/summary";
const commit=process.env.GITHUB_SHA??null;
const read=async(dir,file)=>JSON.parse(await readFile(join(dir,file),"utf8"));
const entries=await readdir(input,{withFileTypes:true});
assert.deepEqual(entries.map(e=>e.name).sort(),VIEWPORT_NAMES.map(n=>"shapeweaver-campaign-report-"+n).sort(),"Missing or unexpected shard artifact");
assert.ok(entries.every(e=>e.isDirectory()),"Invalid shard artifact directory");
const rows=[],showcase=[],shards=[];
for(const name of VIEWPORT_NAMES){
 const dir=join(input,"shapeweaver-campaign-report-"+name);
 const [meta,layout,home]=await Promise.all([read(dir,"coverage-meta.json"),read(dir,"layout-report.json"),read(dir,"home-showcase-report.json")]);
 assert.equal(meta.passed,true,name+" did not complete successfully");
 assert.deepEqual(meta.viewports,[name],name+" incorrect shard assignment");
 assert.equal(meta.commit,commit,name+" wrong commit");
 assert.ok(["review","all"].includes(meta.screenshots),name+" unknown screenshot mode");
 assert.ok(Number.isFinite(meta.elapsedMs)&&meta.elapsedMs>=0,name+" invalid timing");
 assert.ok(Number.isInteger(meta.screenshotCount)&&meta.screenshotCount>0,name+" missing screenshot evidence");
 assertBrowserCoverage(layout,home,[name]);
 rows.push(...layout);showcase.push(...home);shards.push(meta);
}
assertBrowserCoverage(rows,showcase);
await mkdir(out,{recursive:true});
await Promise.all([
 writeFile(join(out,"layout-report.json"),JSON.stringify(rows,null,2)),
 writeFile(join(out,"home-showcase-report.json"),JSON.stringify(showcase,null,2)),
 writeFile(join(out,"coverage-summary.json"),JSON.stringify({commit,passed:true,combinations:rows.length,expected:LEVEL_COUNT*VIEWPORT_NAMES.length,shards},null,2))
]);
console.log("BROWSER COVERAGE: "+rows.length+"/"+(LEVEL_COUNT*VIEWPORT_NAMES.length)+" unique level/viewport combinations; all four showcase reports verified.");
