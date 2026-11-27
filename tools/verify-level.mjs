import {readFile,stat} from "node:fs/promises";
import {verifyWorkshopBundle} from "../workshop/replay.js";
try{
 const path=process.argv[2];if(!path)throw Error("Usage: npm run verify:level -- path/to/level.json");
 if((await stat(path)).size>2_000_000)throw Error("Replay file exceeds 2 MB");
 const result=verifyWorkshopBundle(JSON.parse(await readFile(path,"utf8")));
 console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;
}catch(e){console.error(e.message);process.exitCode=1;}
